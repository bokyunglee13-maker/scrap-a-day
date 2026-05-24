---
description: 특정 기능 또는 변경사항이 PRD와 일치하는지 검증합니다. prd-guardian 에이전트를 호출합니다.
argument-hint: <feature-or-file-description>
---

# /check-prd $ARGUMENTS

PRD 일치성 검증을 시작합니다.

## 자동 진행 절차

### 1. 검증 대상 식별

$ARGUMENTS에서 무엇을 검증할지 파악:
- 기능 이름인 경우 (예: "사진 등록 플로우") → 관련 파일들 자동 탐색
- 파일 경로인 경우 (예: `app/new/page.tsx`) → 해당 파일 + 의존 파일
- "Phase N" 인 경우 → 해당 Phase에서 변경된 모든 파일
- "최근 변경" 인 경우 → git status 또는 최근 수정 파일 (Bash 도구 필요 시 메인이 보조)

### 2. prd-guardian 에이전트 호출

다음 정보를 prd-guardian에게 전달:
- 검증 대상 파일 목록
- 컨텍스트 (어떤 Phase, 무슨 기능)
- 사용자의 검증 요청 의도 (있다면)

### 3. 리포트 정리

prd-guardian이 반환한 리포트를 그대로 사용자에게 보여주되, 다음을 추가:

- **즉시 조치 필요 (🚨)**: 어떤 에이전트에게 수정 위임할지 제안
  - 비주얼 위반 → `stamp-designer`
  - 데이터 위반 → `db-architect`
  - UI/플로우 위반 → `ui-builder`

- **검토 필요 (🟡)**: 사용자에게 정책 재확인 요청
  - "이 경고가 의도된 것인가요? 아니면 수정할까요?"

### 4. 후속 작업 제안

사용자가 위반 사항 수정을 원하면, 적절한 에이전트에게 작업 위임 (메인 에이전트가 직접 수행 X, 위임).

## 사용 예시

```
/check-prd 사진 등록 플로우
/check-prd app/stamp/[date]/page.tsx
/check-prd Phase 3
/check-prd 최근 변경
```

## 호출 시점 권장

- 각 Phase 끝나기 직전 (Phase 완료 게이트)
- 큰 기능 구현 완료 후
- 커밋 전
- 코드 리뷰 셀프 체크
- "이거 PRD에 맞나?" 의문 들 때
