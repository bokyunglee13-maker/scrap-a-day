# 12. 관측 (Observability)

> 주 사용: **Phase 1** (ErrorBoundary 기반), **Phase 2** (DB 테이블), **Phase 5** (관측 UI)

MVP에서도 최소 관측은 둔다. 외부 서비스 사용 없이 로컬만으로.
"왜 사용자(=본인)가 막혔는가"를 알 수 있어야 v1.1 의사결정이 가능하다.

---

## 10.1 관측 원칙

1. **로컬 only**: 외부 분석 서비스 (GA, Sentry 등) 사용 안 함
2. **사용자 투명성**: 모든 로그/통계는 설정에서 사용자가 볼 수 있음
3. **삭제 권리**: 사용자가 언제든 로그 전체 삭제 가능
4. **최소 수집**: 디버깅과 사용 검증에 꼭 필요한 것만

---

## 10.2 에러 로그

### 데이터 스키마

```typescript
interface ErrorLog {
  id: string;                    // UUID
  timestamp: Date;
  source: string;                // 예: "createStamp", "renderCalendar"
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}
```

### 저장 정책
- IndexedDB의 `errors` 테이블
- 최대 500개 유지 (오래된 것부터 자동 삭제)
- 사진 Blob, 메모 내용 등 사용자 컨텐츠는 컨텍스트에 **절대 포함 X**

### `logError` 헬퍼

```typescript
// lib/errors.ts

export async function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    source,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: sanitize(context), // 사용자 콘텐츠 제거
  };
  await db.errors.add(entry);
  console.error(`[${source}]`, error, context);
}

function sanitize(ctx?: Record<string, unknown>) {
  if (!ctx) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v instanceof Blob) continue;          // Blob 제외
    if (typeof v === 'string' && v.length > 100) continue; // 긴 텍스트 제외
    safe[k] = v;
  }
  return safe;
}
```

### 노출 UI
- 설정 → "에러 로그 보기" (`/settings/errors`)
- 시간순 정렬, 30일 이전은 자동 정리
- "전체 삭제" 버튼

---

## 10.3 사용 측정

### 데이터 스키마

```typescript
interface UsageDay {
  date: string;                  // 'YYYY-MM-DD'
  visitedAt: Date;               // 첫 방문 시각
  registeredStamps: number;      // 그날 등록한 우표 수
  failedAttempts: number;        // 그날 실패한 등록 시도
}
```

### 측정 항목

| 항목 | 용도 |
|---|---|
| **방문일 수** (월별) | "이번 달 24일 중 18일 사용" — 사용 습관 검증 |
| **등록 성공률** | "20번 시도 / 19번 성공" — UX 마찰 감지 |
| **빈 칸 연속 일수** | 후킹 문구 강화 ("오랜만이에요" 등) |
| **최근 7일 활동** | 사용자에게 동기부여 ("이번 주 5일 기록 중") |

### `recordDailyVisit` 헬퍼

```typescript
// lib/usage.ts

export async function recordDailyVisit() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const existing = await db.usage.where('date').equals(today).first();
  if (!existing) {
    await db.usage.add({
      date: today,
      visitedAt: new Date(),
      registeredStamps: 0,
      failedAttempts: 0,
    });
  }
}

export async function incrementRegistered(date: string) { /* ... */ }
export async function incrementFailed(date: string) { /* ... */ }
```

### 노출 UI
- 설정 → "내 사용 통계" (`/settings/usage`)
- 월말 회고 화면에도 일부 표시 (07-trash-backup.md §월말 회고)

---

## 10.4 결정 기록 (ADR — Architecture Decision Records)

`docs/decisions/` 디렉토리에 주요 결정 기록.

### 디렉토리 구조

```
docs/decisions/
├── 0001-no-photo-replacement.md     # 왜 사진 변경 막았는가
├── 0002-trash-30-days.md             # 왜 휴지통 30일인가
├── 0003-monday-week-start.md         # 왜 월요일 시작인가
├── 0004-local-only-storage.md        # 왜 클라우드 안 쓰는가
└── 0005-stamp-style-per-stamp.md     # 왜 우표마다 스타일 자유 선택인가
```

### ADR 포맷

```markdown
# 0001. 사진 변경 금지

**날짜**: 2026-05-24
**상태**: 채택 (Accepted)
**관련 PRD**: 06-stamp-detail.md §3.4

## 컨텍스트
사용자가 등록한 사진을 나중에 다른 사진으로 바꿀 수 있게 할지 결정 필요.

## 결정
사진은 한 번 등록하면 바꿀 수 없다. 변경하려면 삭제 후 재등록만 가능.
크롭, 메모, 감정, 스타일은 자유롭게 수정 가능.

## 이유
1. 자기검열 방지 — 그날의 진짜 사진을 미래의 내가 덮어쓰지 않게
2. 기록의 무게감 — 사진은 "사실", 메모/감정은 "해석"
3. 일기로서의 정체성

## 결과
- 상세 화면에 "사진 변경" 버튼 없음
- 사용자 요청 시 "삭제 후 재등록" 안내

## 대안
- 모두 수정 가능: 인스타그램 같은 가벼움. but 자기검열 위험
- 모두 수정 불가: 너무 경직. 메모 오타도 못 고침
- (선택) 사진+크롭만 잠금, 나머지 자유: 균형 잡힌 선택
```

향후 "왜 이렇게 했었지?" 흔들릴 때 참조점.

### MVP에서 작성할 ADR

**Phase 5 종료 시점에 최소 4개 작성**:
1. `0001-no-photo-replacement.md`
2. `0002-trash-30-days.md`
3. `0003-monday-week-start.md`
4. `0004-local-only-storage.md`

---

## 10.5 외부 분석 금지 (명시)

MVP에서 **사용 안 함**:
- Google Analytics
- Sentry
- Mixpanel
- Hotjar
- 기타 모든 외부 SaaS 분석/로깅

v1.1에서 사용자 명시 동의 후 옵션 검토.
