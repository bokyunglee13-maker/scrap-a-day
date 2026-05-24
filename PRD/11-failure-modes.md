# 11. 실패 시나리오 (Failure Mode Design)

> 모든 Phase에서 참조. 화면 구현 시 해당 화면의 실패 정책 표를 반드시 확인.

---

## 9.1 핵심 원칙

1. **비파괴 우선**: 의심스러우면 덮어쓰지 말 것. 백업 후 작업.
2. **사용자 알림 필수**: silent failure 금지. 토스트/배너로 항상 알림.
3. **복구 경로 제공**: 에러 화면은 항상 "어떻게 복구하나" 안내 포함.
4. **부분 성공도 성공**: 백업 100장 중 99장이라도 다운로드 가능하게.

---

## 9.2 화면별 실패 정책

### 9.2.1 메인 화면 (월간 캘린더 로드)

| 실패 케이스 | 처리 |
|---|---|
| IndexedDB 초기화 실패 | 에러 화면 + "백업 복원" 버튼 + 새로고침 안내 |
| 특정 우표 Blob 손상 | 그 우표만 깨진 우표 placeholder (다른 우표 정상 표시) |
| 월 데이터 쿼리 실패 | 빈 캘린더 + "다시 시도" 버튼 + 에러 로그 |

### 9.2.2 등록 화면 (사진 → 크롭 → 저장)

| 실패 케이스 | 처리 |
|---|---|
| 사진 파일 크기 초과 (>20MB) | 사전 검증 + 안내 "더 작은 사진을 선택해주세요" |
| 사진 포맷 미지원 (HEIC 등) | 사전 검증 + 안내 + JPEG/PNG 변환 권장 |
| 크롭 중 메모리 부족 | 사진 자동 다운스케일 (장변 2048px) 후 재시도 |
| 저장 실패 (DB 에러) | 폼 데이터 유지 + 토스트 "저장 실패. 다시 시도해주세요" + 재시도 버튼 |
| 같은 날짜 동시 등록 (다른 탭) | unique 충돌 감지 + "이미 등록된 날짜입니다. 새로고침해주세요" |

### 9.2.3 상세 화면 (수정/삭제)

| 실패 케이스 | 처리 |
|---|---|
| 수정 저장 실패 | 원본 데이터 유지 + 변경사항 폼에 남김 + 재시도 |
| 삭제 실패 | 토스트 "삭제 실패" + 다시 시도. 휴지통 이동도 안 됐으면 데이터 유지 |
| 크롭 재조정 중 사진 소실 | 원본 Blob 재로드 시도. 실패 시 "원본 사진을 찾을 수 없어요" |

### 9.2.4 백업 화면

| 실패 케이스 | 처리 |
|---|---|
| JSON 생성 중 실패 | 부분 JSON이라도 다운로드 + "일부 항목 누락" 경고 |
| ZIP 생성 중 메모리 부족 | 월별로 분할 ZIP 제공 (`scrap-a-day-2026-05.zip` 등) |
| 다운로드 차단 (브라우저) | "팝업 차단 해제 후 다시 시도" 안내 |

### 9.2.5 휴지통

| 실패 케이스 | 처리 |
|---|---|
| 복원 시 같은 날짜에 새 우표 존재 | "이미 등록된 날짜입니다. 새 우표를 삭제 후 복원하세요" |
| 영구 삭제 실패 | 토스트 알림 + 다음 자동 정리 때 재시도 |

---

## 9.3 글로벌 에러 처리

### 9.3.1 ErrorBoundary
- 모든 페이지를 React ErrorBoundary로 감쌈
- 에러 발생 시: "예상치 못한 문제가 발생했어요" + "홈으로" + "에러 로그 보기" 버튼
- 에러는 자동으로 로컬 로그에 기록 (12-observability.md 참조)

### 9.3.2 미처리 Promise 거부
- `window.onunhandledrejection` 핸들러로 잡아서 로그
- 사용자에게는 토스트로 알림 (단, 폭주 방지 위해 5초 throttle)

### 9.3.3 비파괴 처리 규칙
- 어떤 작업이든 실패하면 **기존 데이터는 변경되지 않은 상태로 남아야 함**
- 수정 작업은 트랜잭션 내에서만, 실패 시 자동 롤백
- 삭제는 휴지통 경유 (영구 삭제는 사용자 명시적 요청만)

---

## 9.4 런타임 에러 처리 표준

### 9.4.1 IndexedDB 작업 표준

모든 DB 작업은 다음 패턴:

```typescript
export async function createStamp(data: StampInput): Promise<Result<Stamp>> {
  try {
    // 1. unique 검증
    const existing = await db.stamps
      .where('date').equals(data.date)
      .and(s => s.deletedAt === null)
      .first();

    if (existing) {
      return { ok: false, error: 'DUPLICATE_DATE' };
    }

    // 2. 트랜잭션 내 저장
    const stamp = await db.transaction('rw', db.stamps, async () => {
      const newStamp = { ...data, id: crypto.randomUUID(), /*...*/ };
      await db.stamps.add(newStamp);
      return newStamp;
    });

    return { ok: true, value: stamp };
  } catch (e) {
    // 3. 에러 로그
    await logError('createStamp', e, { date: data.date });
    return { ok: false, error: 'DB_ERROR' };
  }
}
```

### 9.4.2 Blob 검증

사진 렌더 전에 항상:

```typescript
async function renderStamp(stamp: Stamp) {
  if (!stamp.photoBlob || stamp.photoBlob.size === 0) {
    return <BrokenStampPlaceholder date={stamp.date} />;
  }
  // ...
}
```

### 9.4.3 화면 LoadState 표준

각 페이지는 다음 상태를 명시적으로 처리:

```typescript
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success', data: T }
  | { status: 'empty' }
  | { status: 'error', message: string, recovery?: () => void };
```

---

## 9.5 모바일 특유 실패 모드

상세는 `PRD/15-mobile-first.md` §15.5. 요약:

| 실패 케이스 | 처리 / 완화 |
|---|---|
| **iOS Safari ITP 7일 IndexedDB 자동 삭제** 🚨 | PWA 설치 권유 (Phase 5) + 자동 백업 알림 + v1.1 클라우드 백업 |
| iOS 사진 EXIF orientation 회전 | `react-easy-crop` 자동 처리 — Phase 3 검증 시 확인 |
| 구형 단말 메모리 부족 (사진 OOM) | 장변 2048px 자동 다운스케일 (§9.2.2와 동일 정책) |
| 모바일 Safari Blob URL leak | `useEffect cleanup`에서 `URL.revokeObjectURL` (이미 stamp 컴포넌트 적용) |
| PWA 미설치 사용자 | 안내 배너 (메인 상단, 1회 dismiss 기억) — Phase 5 |

iOS ITP는 **데이터 손실** 위험으로 §9.1 "비파괴 우선" 원칙의 가장 큰 위협. v1.1 클라우드 백업이 최우선 (PRD §14).
