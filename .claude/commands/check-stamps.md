---
description: 우표 3종 스타일이 동일한 인터페이스와 시트 통일성을 유지하는지 검증합니다.
---

# /check-stamps

우표 컴포넌트 일관성 검증을 시작합니다.

## 자동 진행 절차

### 1. 컴포넌트 파일 식별

다음 파일들을 읽으세요:
- `components/stamp/Stamp.tsx`
- `components/stamp/StampClassic.tsx`
- `components/stamp/StampMinimal.tsx`
- `components/stamp/StampPolaroid.tsx`
- `components/stamp/EmptyStamp.tsx`
- `components/stamp/PerforationMask.tsx`
- `lib/perforation.ts`

존재하지 않는 파일이 있으면 "Phase 1이 아직 진행 중인 것 같습니다" 보고.

### 2. PRD 기준 로드

`PRD/03-stamp-design.md`를 읽어 검증 기준 확인.

### 3. 검증 항목 실행

각 항목을 코드와 대조하여 검증:

#### 3.1 Props 인터페이스 통일성

3종 스타일 컴포넌트가 모두 동일한 props 받는가:

```typescript
interface StampProps {
  stamp: Stamp;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDate?: boolean;
  showMood?: boolean;
  onClick?: () => void;
}
```

#### 3.2 종횡비 일치

3종 모두 외곽 컨테이너 종횡비가 **3:4**인가? (예: `aspect-[3/4]`, `w-X h-(X*4/3)` 등)

#### 3.3 크기 매핑 일치

`size` prop이 4가지 모두에서 동일한 픽셀 크기로 매핑되는가:

```typescript
const stampSizes = {
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-48',
  xl: 'w-72',
};
```

#### 3.4 날짜 위치 규칙

- 클래식: **우측 하단**
- 미니멀: **좌측 상단** (흰 칩 위)
- 폴라로이드: **좌측 상단** (흰 칩 위)
- 빈 우표: **중앙** (회색, opacity 0.5)

#### 3.5 톱니 사용 규칙

- 클래식: 큰 톱니 (반경 ~3.5)
- 미니멀: 작은 톱니 (반경 ~2)
- 폴라로이드: **톱니 없음** (직사각형)
- 빈 우표: **항상 미니멀 톱니** (스타일 무관)

#### 3.6 PerforationMask 재사용

각 스타일 컴포넌트가 톱니 SVG를 중복 작성하지 않고 `PerforationMask`를 사용하는가? `lib/perforation.ts`의 헬퍼를 사용하는가?

#### 3.7 감정 표시 조건

감정 점이 다음 모두 true일 때만 표시되는가:
- `showMood !== false`
- `stamp.mood !== null`
- `stamp.moodVisible === true`

#### 3.8 색상 토큰 사용

- 감정 색: `mood.joy`, `mood.calm` 등 Tailwind 토큰
- 우표 색: `stamp.paper`, `stamp.ink`
- 하드코딩된 hex 값 (`#FAC775` 등) 직접 사용 X (단, `tailwind.config.ts`는 예외)

### 4. 리포트

```markdown
# 우표 일관성 검증 리포트

## 인터페이스 통일성
- [✅/❌] Props 시그니처 일치
- [✅/❌] 종횡비 3:4
- [✅/❌] size 매핑 일치

## 스타일별 규칙 준수
- 클래식: [✅/❌] 큰 톱니, 우측 하단 날짜
- 미니멀: [✅/❌] 작은 톱니, 좌측 상단 날짜
- 폴라로이드: [✅/❌] 톱니 없음, 좌측 상단 날짜
- 빈 우표: [✅/❌] 미니멀 톱니 고정

## 코드 품질
- [✅/❌] PerforationMask 재사용
- [✅/❌] 감정 표시 조건 정확
- [✅/❌] Tailwind 토큰 사용

## 발견 사항
[실패 항목별로 파일:줄 + 수정 제안]

## 권장 후속
[실패 시 stamp-designer 에이전트에게 위임]
```

### 5. 후속 조치

실패 항목 발견 시:
- 사용자에게 "stamp-designer 에이전트에게 수정 위임할까요?" 질문
- 동의 시 위임

## 사용 시점

- Phase 1 완료 직전
- 우표 컴포넌트 수정 후
- "왜 클래식만 어색해 보이지?" 같은 의문 들 때
- 정기적 (예: 매주 한 번)
