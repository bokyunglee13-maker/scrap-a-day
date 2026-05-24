# 08. PWA 설정

> 주 사용: **Phase 5** (마무리)

---

## manifest.json

- **name**: "Scrap a Day"
- **short_name**: "Scrap a Day"
- **theme_color**: `#ffffff`
- **background_color**: `#ffffff`
- **display**: `standalone`
- **start_url**: `/`
- **icons**: 192x192, 512x512 (우표 모양 임시 아이콘)

위치: `public/manifest.json`

---

## 서비스 워커

- **정적 자산 캐싱**: Next.js 빌드 산출물 (JS, CSS, 폰트)
- **오프라인 작동**: 이미 등록한 우표 보기/수정 가능
- **새 우표 등록**: 오프라인 시 IndexedDB에 저장 (네트워크 불필요)

라이브러리: `@serwist/next`

---

## 아이콘

MVP 단계에서는 임시 아이콘:
- 우표 모양 단순 SVG로 생성
- 192x192, 512x512 두 사이즈
- 흰 배경 + 미니멀 톱니 + 중앙에 작은 글자 "S"

위치: `public/icons/icon-192.png`, `public/icons/icon-512.png`

추후 정식 아이콘은 v1.1에서.

---

## 메타 태그

`app/layout.tsx`:

```tsx
export const metadata = {
  title: 'Scrap a Day',
  description: '우표 한 장으로 하루를 기록하는 미니멀 다이어리',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scrap a Day',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};
```

---

## 동작 확인

- HTTPS 필수 (localhost는 예외)
- 모바일 Safari: "홈 화면에 추가" 정상 동작
- 모바일 Chrome: "앱 설치" 프롬프트 표시
- 데스크탑 Chrome/Edge: 주소창에 설치 아이콘 표시
