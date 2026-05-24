---
description: Phase N을 시작합니다. 필요한 PRD 파일만 자동으로 로드하고 작업 체크리스트를 제시합니다.
argument-hint: <phase-number>
---

# /start-phase $ARGUMENTS

Phase $ARGUMENTS 작업을 시작합니다.

## 자동 진행 절차

### 1. PRD 인덱스 확인
다음 파일을 먼저 읽으세요:
- `PRD/00-index.md`

### 2. Phase별 필독 파일 로드

`PRD/00-index.md`의 "Phase별 필독 매핑" 섹션에서 Phase $ARGUMENTS에 해당하는 파일을 찾아 로드하세요.

**중요**: "무시" 표시된 파일은 절대 로드하지 마세요. 컨텍스트 절약이 핵심입니다.

### 3. ROADMAP 체크리스트 확인

`ROADMAP.md`에서 Phase $ARGUMENTS 섹션을 찾아 체크리스트를 표시하세요.

### 4. 작업 위임 판단

CLAUDE.md §4의 "작업 위임 정책"을 참고하여, 이 Phase의 작업이 어떤 서브에이전트에게 위임될지 판단:

- 우표 비주얼 작업 → `stamp-designer`
- DB/CRUD 작업 → `db-architect`
- 페이지/폼/라우팅 작업 → `ui-builder`

여러 에이전트가 필요한 경우, 작업 순서를 제안하세요.

### 5. 사용자에게 보고

다음 형식으로 정리하세요:

```markdown
# Phase $ARGUMENTS 시작 준비 완료

## 로드된 PRD 파일
- [파일1] - [한 줄 요약]
- [파일2] - [한 줄 요약]

## 무시한 PRD 파일 (Phase별 매핑에 따라)
- [파일들]

## ROADMAP 체크리스트 ([Phase $ARGUMENTS])
- [ ] 작업 1
- [ ] 작업 2
- ...

## 작업 위임 계획
1. [에이전트] → [작업]
2. [에이전트] → [작업]

## 시작할 첫 작업 제안
[가장 먼저 할 일과 이유]

진행할까요?
```

### 6. 대기

사용자가 "응" 또는 "시작해줘" 응답하면 진행. 다른 응답이면 조정.

## 사용 예시

```
/start-phase 1
/start-phase 3
```
