---
description: 변경된 UI 파일이 모바일 우선 정책(PRD §15)에 부합하는지 자가 점검합니다.
argument-hint: <optional file or directory>
---

# /check-mobile $ARGUMENTS

PRD §15 (Mobile-First 정책)에 따라 UI 코드를 점검합니다. `$ARGUMENTS`가 비어있으면 `app/` 및 `components/` 전체를 대상으로 합니다.

## 검사 항목

### 1. 터치 타겟 사이즈 (PRD §15.2.1)

위반 신호:
- `<button>` / `<a>` 에 `text-xs` + 작은 padding (`p-0`, `p-1`)만 적용 — hit area < 44px 우려
- 클릭 가능 아이콘이 `size-4` 단독 (16px) — 부모 패딩 없으면 작음

검색:
```bash
grep -rEn "onClick|<button|<Link" components/ app/ --include="*.tsx" --include="*.ts"
```

각 매치에서 최소 hit area가 44px 이상인지 (수치적으로 또는 부모 패딩 합산으로) 확인.

### 2. input/textarea 줌 방지 (PRD §15.2.3)

위반 신호:
- input/textarea에 `text-xs` 또는 `text-sm` 적용 → iOS 자동 줌인
- 명시적 `font-size: 16px` (= `text-base`) 미만

검색:
```bash
grep -rEn "<input|<textarea|<Textarea|<Input" components/ app/ --include="*.tsx"
```

각 매치에서 적용 폰트 사이즈가 16px(`text-base`) 이상인지 확인. 미만이면 권고.

### 3. Safe-area 사용 (PRD §15.3)

위반 신호:
- 하단 고정(fixed bottom) 액션 요소가 있는데 `env(safe-area-inset-bottom)` 미사용
- `app/layout.tsx`에 viewport metadata `viewport-fit=cover` 누락

검색:
```bash
grep -rEn "fixed (bottom|inset-x|inset)" components/ app/ --include="*.tsx"
grep -rEn "safe-area-inset|env\(safe-area" .
grep -rEn "viewport-fit" app/
```

### 4. 키보드 가림 처리

위반 신호:
- input/textarea에 focus 핸들러 없음 + 화면 하단에 위치 → 키보드 가림 가능

검색:
```bash
grep -rEn "scrollIntoView" components/ app/
```

(필수 아님 — 화면 상단에 form이 있다면 불필요. 위치 기반 판단.)

### 5. 길게 누르기 / 더블탭 의존 (금지)

위반 신호:
- `onTouchStart` 길이 측정, `setTimeout`으로 long-press 구현
- 더블탭만 받는 액션 (단탭 대체 없음)

검색:
```bash
grep -rEn "onTouchStart|onTouchEnd|touchstart|touchend|longPress|long-press" components/ app/
```

### 6. PWA 메타 / manifest 점검 (Phase 5)

- `app/layout.tsx`의 metadata에 `manifest` 지정 여부
- `public/manifest.json` 존재 여부
- 아이콘 (192×192, 512×512) 존재 여부

Phase 5 이전엔 미존재 OK — 정보 제공만.

### 7. Blob URL 정리 (PRD §15.5.4)

위반 신호:
- `URL.createObjectURL` 호출 있는데 `URL.revokeObjectURL` 없음

검색:
```bash
grep -rEn "URL\.createObjectURL" components/ app/ hooks/
grep -rEn "URL\.revokeObjectURL" components/ app/ hooks/
```

createObjectURL 호출 수와 revokeObjectURL 호출 수가 비슷한지 확인. 차이 크면 leak 의심.

## 출력 형식

```markdown
# 모바일 우선 검증 리포트 (PRD §15)

**대상**: $ARGUMENTS or 전체 UI
**검증 일시**: <date>

## 🚨 위반

### M1. [파일:라인] - [패턴]
- 위반 정책: PRD §15.X.X
- 발견 코드: `...`
- 제안: ...

## 🟡 경고
...

## 🟢 권장
...

## 결론

위반 N건, 경고 M건, 권장 K건.
모바일 차단 위반(M1, M2...) 해결되어야 모바일 우선 정책 통과.
```

## 호출 시점

- UI 작업이 끝나고 커밋 전
- 새 화면 추가 시
- Phase 종료 시 `/end-phase`의 일부로 자동 호출 권장

## 사용 예시

```
/check-mobile
/check-mobile components/calendar/
/check-mobile app/new/page.tsx
```

## 절대 하지 말 것

- 코드 직접 수정 (이 커맨드는 read-only 점검)
- 위반 없을 때 거짓 양성 만들기 (정직성)
- PRD §15 외 자신의 판단으로 점검 (정책 출처 명시 필수)
