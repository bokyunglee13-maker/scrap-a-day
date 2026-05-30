# 02. 기술 스택

> 주 사용: **Phase 1** (셋업 시)

---

## 프론트엔드

- **프레임워크**: Next.js 16+ (App Router) — AGENTS.md의 deprecation 경고 참조
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS v4 (`@tailwindcss/postcss`, **CSS-first config**)
- **UI 컴포넌트**: shadcn/ui (v4 호환 버전)
- **PWA**: `@serwist/next` (또는 `next-pwa`)

> ⚠️ Tailwind v4는 `tailwind.config.ts`를 쓰지 않습니다. 컬러/폰트 토큰은 `app/globals.css`의 `@theme` 블록에 정의합니다 (아래 §컬러 토큰 참고).

---

## 데이터

- **로컬 저장**: IndexedDB (Dexie.js)
- **사진 저장 형식**: Blob (Base64 아님 — 용량 효율)
- **로그인**: 없음
- **백엔드**: 없음 (MVP)

---

## 주요 라이브러리

| 용도 | 라이브러리 |
|---|---|
| 로컬 DB | `dexie` |
| 이미지 크롭 | `react-easy-crop` |
| PNG 내보내기 | `html-to-image` |
| ZIP 생성 | `jszip` |
| 날짜 처리 | `date-fns` |
| 아이콘 | `lucide-react` |
| PWA | `@serwist/next` |

---

## 폰트

- **단일 폰트**: **Paperlogy** (코오롱인더스트리, 무료, self-hosted via `next/font/local`). weight 3종 (400/500/700) 로드.

> 📌 **이력 (2026-05-30 정리)**: 초기에는 한국어(Paperlogy) + 영어 serif(Crimson Pro) + 손글씨(Caveat) 3종으로 설계했으나, 사용자가 앱 전체 단일 폰트 일관성을 선호해 Paperlogy로 통합. `globals.css`의 `@theme`에서 `--font-serif`와 `--font-handwriting`도 Paperlogy로 alias되어 기존 `font-serif` / `font-handwriting` 클래스가 모두 Paperlogy로 렌더됨. Google Fonts import는 제거되어 첫 페인트 ~150-200KB 절약.

`next/font/local`로 로드. `app/layout.tsx`에서 `--font-paperlogy` CSS 변수로 노출.

---

## 배포

- **호스팅**: Vercel
- **저장소**: GitHub Public (`scrap-a-day`)
- **도메인**: `scrap-a-day.vercel.app` (커스텀 도메인은 추후)

---

## 컬러 토큰 (Tailwind v4 CSS-first)

Tailwind v4는 `tailwind.config.ts`가 없습니다. `app/globals.css` 상단에 `@theme` 블록으로 정의:

```css
@import "tailwindcss";

@theme {
  /* 감정 5색 */
  --color-mood-joy: #FAC775;      /* 기쁨 */
  --color-mood-calm: #C0DD97;     /* 평온 */
  --color-mood-serene: #B5D4F4;   /* 차분 */
  --color-mood-blue: #CECBF6;     /* 우울 */
  --color-mood-flutter: #F4C0D1;  /* 설렘 */

  /* 우표 컬러 */
  --color-stamp-paper: #FBEAF0;   /* 우표 배경 */
  --color-stamp-ink: #4B1528;     /* 클래식 잉크 */

  /* 폰트 — Paperlogy 단일. font-serif/font-handwriting 기존 클래스도 같은 폰트로 alias. */
  --font-sans: var(--font-paperlogy), sans-serif;
  --font-serif: var(--font-paperlogy), sans-serif;
  --font-handwriting: var(--font-paperlogy), sans-serif;
}
```

### 사용 예
- Tailwind 클래스 자동 생성: `bg-mood-joy`, `text-stamp-ink`, `border-mood-flutter`, `font-handwriting` 등
- 임의 CSS에서도: `color: var(--color-mood-joy)`
- next/font가 `<html>`에 주입한 `--font-paperlogy` 등 변수를 그대로 참조 (`app/layout.tsx`에서 `next/font/local` 등록)
