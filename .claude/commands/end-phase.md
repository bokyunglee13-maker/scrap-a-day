---
description: Phase N을 종료합니다. PRD 검증, 체크리스트 확인, 커밋 메시지 초안을 생성합니다.
argument-hint: <phase-number>
---

# /end-phase $ARGUMENTS

Phase $ARGUMENTS 종료 절차를 시작합니다.

## 자동 진행 절차

### 1. ROADMAP 체크리스트 확인

`ROADMAP.md`의 Phase $ARGUMENTS 섹션을 읽고, 모든 체크박스가 완료됐는지 확인:

- ✅ 완료된 항목 카운트
- ❌ 미완료 항목 목록

미완료 항목이 있으면 사용자에게:
"미완료 항목 N개가 있습니다. 이대로 종료할까요, 아니면 마저 완성할까요?"

### 2. prd-guardian 검증

`/check-prd Phase $ARGUMENTS` 와 동일한 검증 실행:
- Phase $ARGUMENTS에서 변경된 모든 파일 대상
- 위반 / 경고 / 개선 제안 카테고리별 정리

위반(🚨)이 있으면 종료 보류. 사용자에게 수정 위임 여부 질문.

### 3. Phase별 추가 검증

| Phase | 추가 검증 |
|---|---|
| 1 | `/check-stamps` 실행 (우표 일관성) |
| 2 | DB 스키마가 PRD 09-data-model.md와 일치 |
| 3 | 사진 변경 금지 정책 위반 없음 (특히 중요) |
| 4 | 수정/삭제 정책 표가 코드에 모두 반영 |
| 5 | ADR 최소 4개 작성 여부, PWA manifest 점검 |

### 4. 빌드 / 타입 체크

- `npm run build` (Next.js 빌드)
- `npx tsc --noEmit` (타입 에러 체크)
- 에러 있으면 종료 보류

### 5. 모바일 확인 요청

특히 Phase 1, 2, 3, 5는 사용자에게 모바일 확인 권장:
- "Vercel 배포본을 모바일에서 확인하셨나요? 캘린더가 화면에 잘 맞나요?"

### 6. 커밋 메시지 초안 생성

다음 형식으로:

```
feat(phase-$ARGUMENTS): <한 줄 요약>

주요 변경:
- <bullet 1>
- <bullet 2>
- <bullet 3>

체크리스트:
- [x] ROADMAP Phase $ARGUMENTS 모든 항목 완료
- [x] PRD 일치성 검증 통과
- [x] 빌드 / 타입 체크 통과
- [x] 모바일 확인 (사용자 확인 완료)

Refs:
- PRD/<관련 파일들>
```

### 7. 다음 Phase 안내

```markdown
# Phase $ARGUMENTS 종료 완료

## 검증 결과
- ROADMAP: [X]/[Y] 완료
- prd-guardian: [위반 / 경고 / 개선 제안 수]
- 빌드: ✅
- 타입 체크: ✅

## 커밋 메시지 초안
[위 형식]

## 다음 단계
Phase [N+1] 또는 [v1.1 검토 / MVP 완료 사용 검증 시작]

`/start-phase [N+1]` 로 시작할까요?
```

## 사용 예시

```
/end-phase 1
/end-phase 3
/end-phase 5
```

## 호출 시점

- 한 Phase의 모든 작업이 완료됐다고 판단될 때
- 커밋 전 (마지막 게이트)
- 다음 Phase로 넘어가기 전

## 주의

- 검증 실패 시 강제 통과 안 함
- 사용자가 명시적으로 "그래도 진행해" 해야만 통과
- 미완료/위반 사항은 다음 Phase로 절대 미루지 않음 (기술 부채 누적 방지)
