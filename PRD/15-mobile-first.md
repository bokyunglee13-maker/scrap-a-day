# 15. Mobile-First 정책

> 주 사용: **모든 Phase**. 6대 핵심 원칙 중 6번째 (CLAUDE.md §2 / PRD §01).
>
> **핵심 가정**: 이 앱의 주 사용 환경은 모바일(휴대폰)이다. 데스크탑은 보조.
> 모든 화면/플로우는 모바일 우선으로 설계하고, 데스크탑은 디그레이드한다.

---

## 15.1 사용 환경 가정

| 항목 | 가정 |
|---|---|
| 주 기기 | 모바일 (iOS Safari ≥ 16, Android Chrome ≥ 110) |
| 보조 기기 | 데스크탑 (Chrome, Safari, Firefox 최신 2버전) |
| 평균 세션 | 30초~2분 (우표 1장 등록 또는 캘린더 훑기) |
| 통신 | 느릴 수 있음 (지하철, 산책 중) — 오프라인 동작 보장 |
| 한 손 사용 | 엄지 도달 영역 우선 (하단 액션) |
| 가로/세로 | 세로 메인. 가로는 깨지지 않게만. |

---

## 15.2 인터랙션 표준

### 15.2.1 터치 타겟

- **최소 44 × 44 CSS px** (Apple HIG / WCAG 2.5.5 권장)
- 인접 타겟 간 최소 8px 여백
- 캘린더 셀은 자체적으로 60px+ (md 사이즈 우표 = w-20 ≈ 80px)
- 작은 아이콘 버튼은 `p-2` 이상으로 hit-area 확장

### 15.2.2 제스처

- ✅ 탭 (모든 액션)
- ✅ 좌우 스와이프 (월 이동 — v1.1, 어려우면 보류)
- ❌ 길게 누르기 — iOS 컨텍스트 메뉴와 충돌 → 사용 금지
- ❌ 더블탭 줌 차단 — `touch-action: manipulation`로 응답성 ↑

### 15.2.3 키보드 (input/textarea)

- **자동 줌 방지**: input의 `font-size ≥ 16px` (iOS Safari가 16px 미만이면 강제 줌인)
- 포커스 시 키보드가 입력 영역 가리지 않게: `element.scrollIntoView({ block: 'center', behavior: 'smooth' })`
- 메모 textarea: 모바일 키보드 위에 글자 수 카운터 (`23/100`) 항상 보이게
- 키보드 dismiss 액션: 외부 탭 시 blur (`tabindex={-1}` 빈 div 또는 form submit)

### 15.2.4 가로/세로 모드

- **세로 메인**. 모든 디자인은 세로 우선.
- **가로 모드 정책**: 깨지지 않으면 OK. 정렬 깨짐만 막을 것.
  - 캘린더는 동일 7열 유지 (셀 크기 자동 조정)
  - 등록 화면은 크롭 영역 + 메타데이터를 좌우 2열로 자연 재배치 (선택)
- 화면 회전 잠금 X — 사용자 선택권

---

## 15.3 안전 영역 (Safe Area / Notch)

iOS 노치 + 홈 인디케이터, Android 가장자리 제스처 회피:

```css
/* app/globals.css 또는 컴포넌트 */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

- `app/layout.tsx` body에 최소 `pb-[env(safe-area-inset-bottom)]` 적용
- 하단 고정 액션 바가 생기면 (Phase 3 등록 저장 버튼 등) safe-area-inset-bottom 만큼 추가 padding
- `viewport-fit=cover` (next/font 또는 `app/layout.tsx`의 viewport metadata)

---

## 15.4 성능 기준 (모바일)

| 지표 | 목표 | 측정 |
|---|---|---|
| 메인 첫 페인트 (FCP) | 1.5초 이내 (4G) | Lighthouse |
| LCP | 2.5초 이내 | Lighthouse / CrUX |
| INP | 200ms 이내 | Lighthouse |
| CLS | 0.1 이내 | Lighthouse |
| 한 달 우표 30개 로드 | 2초 이내 | 수동 |
| 사진 크롭 인터랙션 | 60fps | DevTools Performance |

PRD §13(비기능)의 일반 성능 목표가 있고, §15는 **모바일 기준으로 더 엄격**한 값. 충돌 시 §15가 우선.

---

## 15.5 모바일 특유 실패 모드

### 15.5.1 🚨 iOS Safari IndexedDB 7일 자동 삭제 (ITP)

**문제 (가장 중요)**:
iOS Safari는 사용자가 **7일 이상 사이트를 미방문**하면 IndexedDB를 통째로 삭제한다 (Apple Intelligent Tracking Prevention, 2020+). 매일 쓰는 일기 앱이지만 휴가 / 출장 / 병원 / 사정 등으로 7일+ 안 쓰면 **모든 우표 데이터 손실**.

**완화 (우선순위 순)**:

1. **PWA 설치 적극 권유** (Phase 5):
   - 홈 화면에 추가하면 ITP 정리 대상에서 **제외됨** (Apple 공식 동작)
   - 첫 방문 시 + 일정 사용 후 안내 배너 노출
   - 메시지: `"홈 화면에 추가하면 데이터가 더 안전해요"` (10-hook-messages.md 후속 추가)

2. **자동 백업 알림** (Phase 5):
   - 3~5일에 한 번 토스트 / 카드: `"백업해두면 안심이에요"`
   - 마지막 백업이 N일 이전이면 메인 상단에 배지

3. **로컬 백업 1탭 가이드** (Phase 5):
   - 설정 → 백업에서 JSON + ZIP을 한 번에 받기
   - "다운로드" 한 번으로 끝

4. **장기 (v1.1+)** — **클라우드 백업 1순위**:
   - 옵션 로그인 후 사용자 명시 동의 시 클라우드 백업
   - MVP 외 범위. PRD §14 로드맵 1순위로 기록.

### 15.5.2 iOS 사진 EXIF orientation

- iPhone 사진은 EXIF orientation으로만 회전 표시. canvas 그릴 때 회전 적용 필요.
- `react-easy-crop`은 자동 처리 — 정상 방향 표시 확인 (Phase 3 검증 시).

### 15.5.3 메모리 부족 (구형 단말)

- 사진 크롭 중 OOM 위험 → 장변 2048px로 자동 다운스케일 (PRD §11 §9.2.2)
- Blob URL은 사용 후 `URL.revokeObjectURL` 필수 (이미 stamp 컴포넌트 적용됨)

### 15.5.4 모바일 Safari `URL.createObjectURL` 라이프사이클

- Blob URL은 페이지 라이프사이클에 묶임. SPA 라우팅 시 페이지 unmount → revoke
- 우표 컴포넌트 `useEffect cleanup`에 이미 반영

### 15.5.5 PWA 미설치 사용자

- "홈 화면에 추가" 안내 배너 (메인 상단, 1회 노출 후 dismiss 기억)
- iOS Safari: 공유 메뉴 → "홈 화면에 추가"
- Android Chrome: 자동 install prompt + 수동 메뉴

---

## 15.6 모바일 디버깅 / 검증

- **Chrome DevTools** 모바일 에뮬레이션 (iPhone 14, Galaxy S20)
- **실제 단말 테스트**: 매 Phase 종료 시 (사용자 본인 폰)
- **Lighthouse 모바일** 점수 90+ 목표 (Phase 5)
- **`/check-mobile` 슬래시 커맨드**로 자가 점검 (터치 타겟, font-size, safe-area 사용 등)

---

## 15.7 다른 원칙과 충돌 시

`CLAUDE.md §2` / `PRD §01`의 5대 원칙 + 6번째 (모바일 우선) 간 충돌이 보이면 사용자 확인.

특히 다음은 자동 판단 가능:
- **모바일 vs 데스크탑 UX**: 모바일 우선. 데스크탑은 디그레이드.
- **모바일 vs 신규 기능**: 모바일에서 안 되면 기능 자체 보류.
- **모바일 성능 vs 기능 풍부함**: 성능 우선. 무거우면 제거.

---

## 15.8 체크리스트 (모든 UI Phase에서)

- [ ] 모든 클릭 가능 요소 ≥ 44×44 px
- [ ] input/textarea `font-size ≥ 16px`
- [ ] 키보드 가림 처리 (`scrollIntoView`)
- [ ] safe-area-inset 적용 (하단 고정 액션 있을 때)
- [ ] 가로 모드에서 깨지지 않음
- [ ] 길게 누르기 / 더블탭 줌 의존 없음
- [ ] Blob URL `revokeObjectURL` 정리
- [ ] PWA 미설치 안내 배너 노출 정책 (Phase 5)
- [ ] 마지막 백업 N일 이전 배지 (Phase 5)
- [ ] 실제 단말 1회 이상 테스트

`/check-mobile` 커맨드로 자동화 가능한 부분 검증.
