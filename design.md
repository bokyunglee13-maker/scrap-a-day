# design.md — Scrap a Day 디자인 시스템 (현재 상태)

> **단일 소스 of truth** — 새 컴포넌트를 만들거나 기존 컴포넌트를 손볼 때 가장 먼저 보는 문서.
> PRD/02-tech-stack.md, PRD/03-stamp-design.md, PRD/15-mobile-first.md를 통합/요약 + UI 패턴 결정을 더한 cheat sheet.
> 마지막 업데이트: **2026-05-30** (Phase 6 마감 + 폰트 통일 + 라벨 타이포 통일 후)

---

## 1. 색상 (Tailwind v4 `@theme` 토큰)

`app/globals.css`에 정의. `tailwind.config.ts` 사용하지 않음.

### 1.1 감정 5색

| 토큰 | hex | Tailwind 클래스 | 의미 |
|---|---|---|---|
| `--color-mood-joy` | `#FAC775` | `bg-mood-joy` `text-mood-joy` | 기쁨 (살구) |
| `--color-mood-calm` | `#C0DD97` | `bg-mood-calm` | 평온 (연두) |
| `--color-mood-serene` | `#B5D4F4` | `bg-mood-serene` | 차분 (하늘) |
| `--color-mood-blue` | `#CECBF6` | `bg-mood-blue` | 우울 (라벤더) |
| `--color-mood-flutter` | `#F4C0D1` | `bg-mood-flutter` | 설렘 (핑크) |

감정 dot은 우표 우측 하단에 표시 (3종 스타일 통일). `moodVisible === false`면 그리드에서 dot 숨김, 상세 화면에선 항상 표시.

### 1.2 우표 컬러

| 토큰 | hex | 용도 |
|---|---|---|
| `--color-stamp-paper` | `#FBEAF0` | 배경 (전체 앱), 우표 paper |
| `--color-stamp-ink` | `#4B1528` | 텍스트 (메인), 클래식 우표 잉크 |

### 1.3 opacity 활용 패턴

stamp-ink는 거의 항상 opacity와 함께:

| 클래스 | 용도 |
|---|---|
| `text-stamp-ink` | 본문 (가장 진함) |
| `text-stamp-ink/80` | 메모 본문 |
| `text-stamp-ink/70` | 보조 텍스트 |
| `text-stamp-ink/60` | **라벨** (h2 등) ← 표준 |
| `text-stamp-ink/55` | 약한 보조 |
| `text-stamp-ink/50` | 메타 텍스트 |
| `text-stamp-ink/40` | 빈 상태 / 비활성 |
| `text-stamp-ink/35` | 푸터 / 시그니처 |

---

## 2. 폰트

### 2.1 단일 폰트 정책

**Paperlogy** (코오롱인더스트리, 무료, `next/font/local` self-host) — 앱 전역 단일 폰트.

```ts
// app/layout.tsx
const paperlogy = localFont({
  variable: "--font-paperlogy",
  display: "swap",
  src: [
    { path: ".../Paperlogy-4Regular.ttf", weight: "400" },
    { path: ".../Paperlogy-5Medium.ttf", weight: "500" },
    { path: ".../Paperlogy-7Bold.ttf", weight: "700" },
  ],
});
```

### 2.2 font-* 클래스 alias

`globals.css`의 `@theme`에서 모든 font-family를 Paperlogy로 alias:

```css
--font-sans: var(--font-paperlogy), sans-serif;
--font-serif: var(--font-paperlogy), sans-serif;
--font-handwriting: var(--font-paperlogy), sans-serif;
```

→ 기존에 `font-serif`나 `font-handwriting` 클래스를 쓴 컴포넌트도 모두 Paperlogy로 렌더됨.
→ Crimson Pro, Caveat import는 제거됨 (첫 페인트 ~150-200KB 절약).

### 2.3 타이포 스케일

| 사이즈 | px | 용도 |
|---|---|---|
| `text-xs` | 12px | 메타 (footer, "JPEG · PNG · WEBP · 최대 20MB" 등) |
| `text-sm` | 14px | **라벨, 칩, 본문 보조** (← 표준) |
| `text-base` | 16px | **본문, input** (← iOS 줌 방지 최저 한계) |
| `text-lg` | 18px | h1 (모바일), 강조 본문 |
| `text-xl` ~ `text-3xl` | 20~30px | 데스크탑 h1, 큰 우표 캡션 |

### 2.4 라벨 패턴 (통일 규칙)

폼/상세 페이지의 섹션 라벨 (`h2`/`p`/`span`):

```tsx
className="text-sm font-medium text-stamp-ink/60"
```

→ 모든 라벨 (스타일/감정/함께한 사람/메모/이메일/동기화/기간 등) 통일.

> ⚠️ **금지**: `text-xs uppercase tracking-wide text-stamp-ink/50` (한국어에 uppercase 무효, tracking-wide가 syllable 사이 공백 어색하게 만듦). 모든 위치에서 제거됨 (2026-05-30).

---

## 3. 우표 디자인 시스템

### 3.1 3종 스타일 + 빈 우표

| 컴포넌트 | 특징 | 날짜 위치 | 정체성 |
|---|---|---|---|
| `StampClassic` | 큰 톱니, 진한 보더, serif 워드마크 | 하단 좌측 (잉크 칩) | 우표스러움 |
| `StampMinimal` | 작은 톱니, 미세한 라인 | 상단 좌측 (흰 칩) | 모던 / 사진 우선 |
| `StampPolaroid` | 톱니 X, 흰 프레임, 캡션 (lg/xl만) | 상단 좌측 (흰 칩) | 즉석 사진 |
| `EmptyStamp` | **항상 미니멀 톱니** (사용자 스타일 무관) | 중앙 (회색 숫자) | 빈 칸도 우표 |

→ 모두 동일 외곽 크기 (`aspect-[3/4]`) + 동일 SIZE_CLASS.

### 3.2 size 시스템

```ts
const SIZE_CLASS: Record<StampSize, string> = {
  sm: 'w-12',    // 48px  — 작은 미리보기
  md: 'w-20',    // 80px  — 중간 미리보기
  lg: 'w-48',    // 192px — 상세 화면
  xl: 'w-72',    // 288px — 등록 미리보기 (큰 단말)
  full: 'w-full', // 부모 너비 — 캘린더 셀, 검색 그리드, 다운로드
};
```

### 3.3 size별 날짜 라벨 (2026-05-30 조정)

`size='full'`은 컨테이너에 따라 ~45px (모바일) ~ ~92px (다운로드)까지 변동.
모바일에서 라벨이 사진을 가리던 문제 해결:

| size | Classic | Minimal | Polaroid |
|---|---|---|---|
| `sm` | text-[10px] | text-[9px] | text-[9px] |
| `md` | text-sm | text-xs | text-xs |
| **`full`** | **text-[9px]** | **text-[9px]** | **text-[9px]** |
| `lg` | text-2xl | text-base | text-base |
| `xl` | text-3xl | text-xl | text-xl |

→ size='full' chip padding은 Minimal/Polaroid `px-1`로 통일 (이전 `px-1.5`).

### 3.4 톱니 (Perforation)

`lib/perforation.ts`의 `getPerforationTeeth()` — 칠한 SVG circle 방식 (CSS mask가 작은 크기에서 사라지는 문제 회피). 모든 우표 viewBox는 `90×120` (3:4 정수 친화).

| 스타일 | 톱니 종류 |
|---|---|
| Classic | classic (큰 톱니) |
| Minimal | minimal (작은 톱니) |
| EmptyStamp | minimal (사용자 스타일 무관) |
| Polaroid | 없음 (직사각형) |

### 3.5 특별한 날 (SpecialDayBadge)

`lib/specialDays.ts` 기반. 우표 + 빈 우표 모두에 표시 (다가오는 날 인지). `size === 'sm'|'md'|'full'`은 `compact` variant, 나머지는 `full`.

---

## 4. 모바일 우선 (PRD §15 핵심)

### 4.1 터치 타겟 ≥ 44px

| 클래스 | 용도 |
|---|---|
| `size-11` = 44px×44px | 버튼 정사각형 (back, 설정 아이콘) |
| `h-11` | 가로형 버튼 (가장 작은 허용) |
| `h-12` | 메인 액션 (등록, 로그인, 저장) |
| `h-14` | 가장 큰 액션 (등록 시작 시 "카메라로 찍기") |

### 4.2 input 폰트 ≥ 16px

iOS Safari 자동 줌 방지 (16px 미만 시 강제 zoom-in). 모든 `<input>`, `<textarea>`, `<Button>` 본문은 `text-base` 이상.

### 4.3 safe-area

`app/layout.tsx`:
```tsx
viewportFit: "cover",
// body
style={{
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
}}
```

### 4.4 줌 방지

```ts
maximumScale: 1,
userScalable: false,
```

→ 단, 등록 페이지의 cropper는 pinch가 동작해야 하므로 react-easy-crop이 자체 처리.

### 4.5 iOS ITP 7일 대응 (3단)

1. **InstallBanner** — PWA 설치 권유 (1회 dismiss 영속화)
2. **BackupNag** — 마지막 백업이 stale/never일 때 메인 상단
3. **Phase 6 클라우드 sync** — 로그인 시 데이터 영구 보존

---

## 5. UI 패턴

### 5.1 헤더 (페이지 상단)

모든 서브 페이지 헤더는 동일한 모양:

```tsx
<header className="flex items-center gap-2">
  <Link
    href="/settings"  // 또는 "/"
    aria-label="..."
    className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <ChevronLeft className="size-5" />
  </Link>
  <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
    페이지 제목
  </h1>
</header>
```

→ `font-serif` 클래스 유지 (Paperlogy로 alias됨, 시각 차이 X). 모든 페이지 일관성.

### 5.2 카드 (정보 박스)

```tsx
<div className="rounded-md border border-stamp-ink/10 bg-white/40 p-4">
  ...
</div>
```

### 5.3 다이얼로그

shadcn `<Dialog>`. 데이터 손실 가능성 있는 모든 작업 (등록 취소, 영구 삭제, 로그아웃 등)은 다이얼로그로 한 단계 더.

### 5.4 토스트 (sonner)

- 성공: `toast.success('우표를 붙였어요')` — 2-4초
- 경고: `toast.warning('일부 항목 실패 · 올림 3 · 받음 1 · 실패 2')`
- 에러: `toast.error('잠시 후 다시 시도해주세요')`
- 로딩: `toast.loading('첫 동기화 중…', { id: 'first-sync-loading' })` → `toast.dismiss(id)` + `toast.success(...)`
- 액션: `{ action: { label: '공유하기', onClick: () => ... } }`

### 5.5 빈 상태

```tsx
<p className="font-sans text-sm text-stamp-ink/50">
  아직 함께한 사람이 기록되지 않았어요
</p>
```

→ 항상 친근한 톤. "데이터 없음" 같은 시스템 언어 X.

---

## 6. 책임 분리 (디렉토리 ↔ 역할)

| 위치 | 역할 |
|---|---|
| `components/stamp/*` | 우표 시각 컴포넌트만. DB 의존 X, 라우팅 X. |
| `components/calendar/*` | 캘린더 그리드 (MonthBoard, DayCell, MonthHeader). |
| `components/editor/*` | 등록/수정 폼 (PhotoCropper, MemoInput, MoodPicker, ...). |
| `components/share/*` | PNG 내보내기 (ExportStamp, ExportMonth, MonthExportLayout). |
| `components/pwa/*` | iOS ITP 완화 UI (InstallBanner, BackupNag). |
| `components/retrospect/*` | 월말 회고. |
| `components/ui/*` | shadcn primitives. |
| `lib/db.ts`, `lib/stamps.ts`, ... | DB 책임만. Result<T> 반환. |
| `lib/sync.ts`, `lib/photoStorage.ts`, `lib/supabase.ts` | Phase 6 sync 레이어. |
| `lib/hooks.ts`, `lib/specialDays.ts`, `lib/retrospect.ts` | 순수 함수 (IO X). |
| `hooks/*.ts` | React hooks (useStamps, useUser, useAutoSync, ...). |
| `app/**/page.tsx` | 라우팅 + 페이지 조립. 비즈니스 로직 최소. |

---

## 7. 데이터 흐름 결정

### 7.1 Result<T> 패턴

모든 CRUD는 throw 없이 `{ok: true, value} | {ok: false, error}` 반환. UI는 `if (result.ok)`로 분기.

### 7.2 비파괴 (절대 규칙)

- 삭제는 항상 `deletedAt` 토글 (휴지통). 영구 삭제는 30일 후 자동 또는 사용자 명시.
- 사진 교체 코드 X (PRD §06 §3.4, ADR 0001).
- sync 충돌 시 LWW이지만 트랜잭션은 항상 atomic.

### 7.3 Local-first (Phase 6)

- 모든 UI write → IndexedDB 먼저
- `useAutoSync` hook이 Dexie hook 감지 → 2초 debounce → Supabase로 push
- pull은 mount 시 + reconnection 시 + manual 시
- 로그아웃 사용자는 sync 완전 no-op

---

## 8. 알아둘 (자주 까먹는 것)

- **IndexedDB 컴포넌트는 `'use client'` 필수**
- **`useLiveQuery`는 외부 async 함수 await 시 추적 안 됨** — 페이지 내부에서 인라인 Dexie 읽기 필수 (search page, MonthExportLayout 제외)
- **`size='full'` 컨테이너에서 `items-center` 금지** — flex column에서 w-full 자식이 0으로 collapse. 기본 `align-items: stretch` 사용
- **모바일 input `font-size ≥ 16px`** — `text-base`로 충족
- **월요일 시작** — `date-fns` `{ weekStartsOn: 1 }`
- **미래 날짜 등록 X** — 셀 탭 시 "내일을 기다려요" 토스트만

---

## 9. 변경 이력 (디자인 결정)

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-30 | 라벨 통일 `text-xs uppercase tracking-wide /50` → `text-sm font-medium /60` | 한국어 uppercase 무효, syllable 간 awkward spacing. 검색 페이지 + 8개 위치 모두 통일 |
| 2026-05-30 | `size='full'` 우표 날짜 11~12px → 9px | 모바일에서 사진을 가림. 다운로드 이미지 기준에 맞춰 축소 |
| 2026-05-30 | MonthExportLayout 헤더 44px → 36px | 그리드(콘텐츠)가 시각적 주인공 되도록 |
| 2026-05-30 | Crimson Pro / Caveat → Paperlogy로 alias | 사용자 단일 폰트 선호 + ~150-200KB 절약 |
| 2026-05-30 | "오늘은 어떤 하루였나요?" + 줄바꿈 + 진한 mood-joy | 자동 wrap이 syllable 단위로 어색했음 |
| 2026-05-30 | ExportMonth 다운로드 + 공유 분리 | 갤러리 저장 옵션 부재 호소 |
| 2026-05-30 | ExportMonth MonthExportLayout useLiveQuery 제거 | 비동기 로드 → toPng 빈 셀 버그 |

---

*컴포넌트 만들기 전에 §1, §2, §4, §5를 먼저 보세요. 새 결정이 생기면 §9에 기록하세요.*
