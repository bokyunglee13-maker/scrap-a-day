# PRD 인덱스 — Scrap a Day

> 이 파일은 PRD의 **라우터**입니다. 전체 PRD를 한꺼번에 읽지 마세요.
> 작업 Phase에 맞는 파일만 로드하세요.

---

## 📁 파일 구조

| 파일 | 내용 | 줄 수 |
|---|---|---|
| `00-index.md` | 이 파일 (라우터) | ~80 |
| `01-overview.md` | 제품 개요, 핵심 가치, Non-goals | ~50 |
| `02-tech-stack.md` | 기술 스택, 주요 라이브러리, 폰트 | ~50 |
| `03-stamp-design.md` | 우표 디자인 시스템 (3종 스타일, 감정, 빈 우표) | ~100 |
| `04-main-board.md` | 메인 화면 — 월간 우표 보드 | ~50 |
| `05-stamp-editor.md` | 등록 화면 — 사진 + 크롭 + 메타데이터 | ~80 |
| `06-stamp-detail.md` | 상세 화면 + 수정/삭제 정책 | ~80 |
| `07-trash-backup.md` | 휴지통, 백업, 월말 회고 | ~60 |
| `08-pwa.md` | PWA 설정 | ~30 |
| `09-data-model.md` | IndexedDB 스키마 (Dexie) | ~70 |
| `10-hook-messages.md` | 후킹 문구 사전 + 시스템 메시지 | ~50 |
| `11-failure-modes.md` | 실패 시나리오 + 복구 정책 | ~120 |
| `12-observability.md` | 관측 (에러 로그, 사용 측정, ADR) | ~80 |
| `13-non-functional.md` | 비기능 요구사항 (성능, 접근성, 브라우저) | ~30 |
| `14-roadmap.md` | 향후 로드맵 + 성공 지표 | ~40 |

---

## 🎯 Phase별 필독 매핑

각 Phase 시작 시 **반드시 읽을 것** + **참조용** + **무시할 것**:

### Phase 1: 셋업 + 디자인 시스템 + 우표 컴포넌트

**필독**:
- `01-overview.md` (핵심 가치)
- `02-tech-stack.md`
- `03-stamp-design.md` (전체)
- `13-non-functional.md` (접근성, 브라우저)

**참조용**:
- `11-failure-modes.md` §1 (핵심 원칙만)
- `12-observability.md` §10.2 (ErrorBoundary 기반 구축)

**무시**: 04~10, 14 (다음 Phase에서)

---

### Phase 2: IndexedDB + 메인 캘린더

**필독**:
- `01-overview.md`
- `04-main-board.md`
- `09-data-model.md` (전체)
- `10-hook-messages.md` (빈 우표 안내 문구)

**참조용**:
- `11-failure-modes.md` §9.2.1 (메인 화면 실패 정책)
- `12-observability.md` (errors, usage 테이블 구현)
- `03-stamp-design.md` §4.4 (빈 우표 디자인), §4.5 (오늘 강조)

**무시**: 05~08, 14

---

### Phase 3: 등록 + 크롭

**필독**:
- `01-overview.md`
- `05-stamp-editor.md`
- `10-hook-messages.md` (placeholder)
- `03-stamp-design.md` §4.3 (감정 표시)

**참조용**:
- `11-failure-modes.md` §9.2.2 (등록 화면 실패 정책 — 중요!)
- `09-data-model.md` (Stamp 인터페이스)

**🚨 절대 위반 금지**: `06-stamp-detail.md` §3.4 (사진 변경 금지 정책)

**무시**: 04, 06, 07, 08, 14

---

### Phase 4: 상세 + 수정/삭제

**필독**:
- `01-overview.md`
- `06-stamp-detail.md` (전체)
- `09-data-model.md` (수정/삭제 시 데이터 흐름)

**참조용**:
- `11-failure-modes.md` §9.2.3 (상세 화면 실패 정책)
- `03-stamp-design.md` §4.3 (감정 표시 토글)

**무시**: 04, 05, 07, 08, 13, 14

---

### Phase 5: 휴지통 + 백업 + PWA + 회고

**필독**:
- `01-overview.md`
- `07-trash-backup.md`
- `08-pwa.md`
- `12-observability.md` (관측 UI 노출)
- `14-roadmap.md` (Phase 종료 후 검증)

**참조용**:
- `11-failure-modes.md` §9.2.4, §9.2.5 (백업/휴지통 실패)
- `09-data-model.md` (자동 정리 규칙)

**무시**: 04, 05, 06

---

## 🔍 작업 진행 시 체크리스트

1. **Phase 시작 전**: 위 매핑에서 "필독" 파일만 로드
2. **작업 중**: "참조용" 파일은 필요할 때만 추가 로드
3. **무시할 것**: 절대 미리 로드하지 말 것 (컨텍스트 낭비)
4. **Phase 종료 후**: `prd-guardian` 에이전트로 PRD 일치성 검증

---

## ⚠️ 핵심 정책 요약 (모든 Phase에서 의식)

이 5개는 `01-overview.md`에 자세히 있지만, 모든 작업 시 의식해야 함:

1. **사진은 못 바꾼다** — 자기검열 방지
2. **빈 우표도 우표다** — 시트 통일성
3. **부담 없는 일기** — 메모 100자, 하루 1장
4. **사진이 주인공** — 우표 테두리는 액자
5. **데이터는 사용자의 것** — 로컬 저장, 백업 우선, 비파괴

이 5개와 충돌하는 결정이 보이면 **반드시 사용자에게 확인 후 진행**.
