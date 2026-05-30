# PRD 인덱스 — Scrap a Day

> 이 파일은 PRD의 **라우터**입니다. 전체 PRD를 한꺼번에 읽지 마세요.
> 작업 Phase에 맞는 파일만 로드하세요.

> 📌 **PRD 외 핵심 문서** (루트):
> - `../CLAUDE.md` — 프로젝트 메인 라우터
> - `../memory.md` — 세션 메모리 (현재 진행 상태, 결정 이력, TIL)
> - `../design.md` — 디자인 시스템 통합 cheat sheet (색상/타이포/우표 size)
> - `../ROADMAP.md` — 전체 작업 분해 (Phase별 체크리스트)
> - `../docs/decisions/` — ADR 0001~0006

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
| `15-mobile-first.md` | **모바일 우선 정책** (6번째 원칙). 터치 타겟, 키보드, safe-area, iOS ITP 7일 대응 | ~150 |

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
- `15-mobile-first.md` (6번째 원칙 — 항상 의식)

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
- `15-mobile-first.md` (6번째 원칙 — 캘린더 터치 타겟·가로 모드)

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
- `15-mobile-first.md` §15.2 (키보드/터치/줌 방지 — 등록 폼에서 필수)

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
- `15-mobile-first.md` (6번째 원칙 — 다이얼로그·키보드)

**무시**: 04, 05, 07, 08, 13, 14

---

### Phase 5: 휴지통 + 백업 + PWA + 회고

**필독**:
- `01-overview.md`
- `07-trash-backup.md`
- `08-pwa.md`
- `12-observability.md` (관측 UI 노출)
- `14-roadmap.md` (Phase 종료 후 검증)
- `15-mobile-first.md` §15.5 (**iOS ITP 7일 삭제 대응 — PWA 설치 배너·자동 백업 알림 구현**)

**참조용**:
- `11-failure-modes.md` §9.2.4, §9.2.5 (백업/휴지통 실패)
- `09-data-model.md` (자동 정리 규칙)

**무시**: 04, 05, 06

---

### Phase 6: Supabase 클라우드 sync + Magic Link 인증

**필독**:
- `01-overview.md` (특히 §Non-goals — ADR 0006으로 "클라우드 서비스가 아니다" 변경된 부분)
- `../docs/decisions/0006-cloud-sync.md` (ADR — LWW, RLS, anon key 정책)
- `../docs/decisions/0004-local-only-storage.md` (부분 Superseded 표기 확인)

**참조용**:
- `02-tech-stack.md` (Supabase 클라이언트 추가)
- `09-data-model.md` (IndexedDB 스키마는 그대로, Supabase 테이블은 `docs/supabase-schema.sql`)
- `../docs/supabase-setup.md` (사용자 1회성 셋업 가이드)
- `15-mobile-first.md` §15.5 (Phase 6이 iOS ITP의 근본적 완화)

**Phase 6 구현 영역** (`memory.md` §1 참조):
- `lib/supabase.ts` — PKCE flow client 싱글톤
- `lib/sync.ts` — stamps + settings 양방향 sync (LWW, watermark)
- `lib/photoStorage.ts` — Storage 업/다운로드
- `hooks/useUser.ts`, `hooks/useAutoSync.ts` — auth 상태 + 자동 sync
- `app/auth/login`, `app/auth/callback`, `app/settings/account` — 인증 UI

**🚨 절대 규칙**:
- `service_role` 키 절대 frontend 노출 X (anon key만, RLS 보호)
- 모든 CRUD가 여전히 IndexedDB 먼저 (local-first 유지)
- 로그아웃 사용자는 sync 완전 no-op (네트워크 호출 0)

**무시**: 04, 05 (UI 변경 없음 — sync는 배경 작업)

---

## 🔍 작업 진행 시 체크리스트

1. **Phase 시작 전**: 위 매핑에서 "필독" 파일만 로드
2. **작업 중**: "참조용" 파일은 필요할 때만 추가 로드
3. **무시할 것**: 절대 미리 로드하지 말 것 (컨텍스트 낭비)
4. **Phase 종료 후**: `prd-guardian` 에이전트로 PRD 일치성 검증

---

## ⚠️ 핵심 정책 요약 (모든 Phase에서 의식)

이 6개는 `01-overview.md`에 자세히 있지만, 모든 작업 시 의식해야 함:

1. **사진은 못 바꾼다** — 자기검열 방지
2. **빈 우표도 우표다** — 시트 통일성
3. **부담 없는 일기** — 메모 100자, 하루 1장
4. **사진이 주인공** — 우표 테두리는 액자
5. **데이터는 사용자의 것** — 로컬 저장, 백업 우선, 비파괴
6. **모바일 우선** — 주 사용 환경이 모바일. 데스크탑은 디그레이드. (상세: `15-mobile-first.md`)

이 6개와 충돌하는 결정이 보이면 **반드시 사용자에게 확인 후 진행**.
