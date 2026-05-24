# 02. 기술 스택

> 주 사용: **Phase 1** (셋업 시)

---

## 프론트엔드

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **PWA**: `@serwist/next` (또는 `next-pwa`)

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

- **한국어**: Pretendard Variable (sans-serif)
- **영어 날짜/숫자**: Crimson Pro (serif)
- **손글씨 캡션 (폴라로이드)**: Caveat (영문) + 나눔손글씨 (한글, 선택)

`next/font`로 로드. `app/layout.tsx`에서 CSS 변수로 노출.

---

## 배포

- **호스팅**: Vercel
- **저장소**: GitHub Public (`scrap-a-day`)
- **도메인**: `scrap-a-day.vercel.app` (커스텀 도메인은 추후)

---

## 컬러 토큰 (Tailwind 확장)

`tailwind.config.ts`에 추가:

```typescript
theme: {
  extend: {
    colors: {
      mood: {
        joy: '#FAC775',      // 기쁨
        calm: '#C0DD97',     // 평온
        serene: '#B5D4F4',   // 차분
        blue: '#CECBF6',     // 우울
        flutter: '#F4C0D1',  // 설렘
      },
      stamp: {
        paper: '#FBEAF0',    // 우표 배경
        ink: '#4B1528',      // 클래식 잉크
      },
    },
    fontFamily: {
      sans: ['var(--font-pretendard)', 'sans-serif'],
      serif: ['var(--font-crimson)', 'serif'],
      handwriting: ['var(--font-caveat)', 'cursive'],
    },
  },
}
```
