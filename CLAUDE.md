# CLAUDE.md — Scrap a Day (v3)

> 클로드 코드가 이 프로젝트에서 일관되게 작업하기 위한 **라우터** 문서.
> 이 파일 자체는 얇게 유지합니다. 상세는 다른 파일에 분리되어 있습니다.

---

## 🚦 새 세션 시작 시 절차 (필수)

1. 이 파일(`CLAUDE.md`) 전체를 빠르게 훑기
2. **`PRD/00-index.md`** 읽기 — PRD 라우터
3. 작업이 어느 Phase인지 판단 (§3 참조)
4. 해당 Phase의 필독 PRD 파일만 로드 (`PRD/00-index.md`의 매핑 표)
5. 작업 위임 정책 확인 (§4) — 서브에이전트 사용 여부
6. 작업 시작

> ⚠️ **PRD 전체를 매번 읽지 마세요.** Phase별로 필요한 섹션만 읽으세요.

---

## 📁 프로젝트 문서 구조

```
프로젝트 루트/
├── CLAUDE.md              ← 이 파일 (얇은 라우터)
├── ROADMAP.md             ← Phase별 작업 체크리스트
├── PRD/                   ← 분할된 상세 명세 (14개 파일)
│   ├── 00-index.md        ← PRD 라우터
│   ├── 01-overview.md     ← 핵심 가치 (항상 읽음)
│   ├── 02-tech-stack.md
│   ├── 03-stamp-design.md
│   ├── ... (04~14)
├── .claude/
│   ├── agents/            ← 4개 서브에이전트
│   │   ├── stamp-designer.md
│   │   ├── db-architect.md
│   │   ├── ui-builder.md
│   │   └── prd-guardian.md
│   └── commands/          ← 4개 슬래시 커맨드
│       ├── start-phase.md
│       ├── check-prd.md
│       ├── check-stamps.md
│       └── end-phase.md
└── docs/
    └── decisions/         ← ADR 디렉토리 (Phase 5에서 작성)
```

---

## 1. 프로젝트 한 줄

**Scrap a Day** — 우표 한 장으로 하루를 기록하는 미니멀 비주얼 다이어리.

상세는 `PRD/01-overview.md` 참조.

---

## 2. 핵심 설계 원칙 (의사결정 시 항상 우선)

이 5개와 충돌하는 결정이 보이면 **반드시 사용자에게 확인**:

1. **사진은 못 바꾼다** — 자기검열 방지
2. **빈 우표도 우표다** — 시트 통일성
3. **부담 없는 일기** — 메모 100자, 하루 1장
4. **사진이 주인공** — 우표 테두리는 액자
5. **데이터는 사용자의 것** — 로컬 저장, 백업 우선, 비파괴

---

## 3. Phase 식별

작업 의뢰가 어느 Phase인지 빠르게 판단:

| 의뢰 키워드 | Phase |
|---|---|
| "셋업", "프로젝트 초기화", "우표 컴포넌트", "디자인 시스템", "ErrorBoundary" | **Phase 1** |
| "Dexie", "IndexedDB", "캘린더 보드", "월 이동", "errors/usage 테이블" | **Phase 2** |
| "사진 등록", "크롭", "메모 입력", "감정 선택" | **Phase 3** |
| "상세 화면", "수정", "삭제", "이미지 저장", "휴지통 정책" | **Phase 4** |
| "휴지통 화면", "백업", "JSON", "ZIP", "PWA 설정", "회고", "관측 UI", "ADR" | **Phase 5** |

애매하면 사용자에게 "Phase 몇번 작업인가요?" 질문.

Phase 시작은 **`/start-phase <N>` 슬래시 커맨드 사용 권장** — 자동으로 필요 문서 로드.

---

## 4. 작업 위임 정책

이 프로젝트는 **단일 에이전트가 모든 걸 처리하지 않습니다**. 작업 종류별로 위임:

### 4.1 서브에이전트 (`.claude/agents/`)

| 에이전트 | 담당 | 호출 시점 |
|---|---|---|
| `stamp-designer` | 우표 SVG 컴포넌트 3종 + PerforationMask | 우표 시각 디자인/수정 |
| `db-architect` | Dexie 스키마, CRUD, 트랜잭션, 백업 | DB 관련 모든 작업 |
| `ui-builder` | 페이지 조립, 폼, 다이얼로그, 라우팅 | 화면 구성 |
| `prd-guardian` | 코드가 PRD와 일치하는지 검증 (읽기 전용) | Phase 종료 시, 커밋 전 |

각 에이전트의 상세 정의는 `.claude/agents/<name>.md` 참조.

### 4.2 슬래시 커맨드 (`.claude/commands/`)

| 커맨드 | 동작 |
|---|---|
| `/start-phase <N>` | Phase 시작. 필요 PRD만 로드 + 체크리스트 표시 |
| `/check-prd <feature>` | 특정 기능이 PRD와 일치하는지 검증 (prd-guardian 호출) |
| `/check-stamps` | 우표 3종이 동일 인터페이스인지 검증 |
| `/end-phase <N>` | Phase 종료. 검증 + 커밋 메시지 초안 |

### 4.3 위임 vs 직접 처리 판단

- **위임**: 한 영역에 집중된 큰 작업 (예: 우표 SVG 전체, DB 스키마 전체)
- **직접 처리**: 여러 영역 통합 (예: 페이지에 우표 + DB 호출 연결), 짧은 수정, 디버깅

판단 어려우면 사용자에게 "○○ 에이전트에게 맡길까요?" 질문.

### 4.4 `.claude/` 미설정 환경에서

이 프로젝트 폴더가 다른 환경에 옮겨졌거나 `.claude/`가 없는 경우, 위 정책은 **멘탈 모델**로만 사용. 즉, 단일 컨텍스트에서 작업하되 위 표의 책임 구분을 코드 구조에 반영:
- `components/stamp/` → 우표 비주얼만
- `lib/db.ts`, `lib/stamps.ts` 등 → DB 책임만
- `app/**/page.tsx`, `components/calendar/`, `components/editor/` → UI 조립

---

## 5. 코딩 규칙

### 5.1 일반
- **TypeScript strict mode**. `any` 금지 (필요 시 `unknown` 후 narrowing)
- **함수 컴포넌트만**. 클래스 컴포넌트 금지.
- **named export** 선호. default export는 page 컴포넌트만.
- **파일명**: `PascalCase.tsx` (컴포넌트), `camelCase.ts` (유틸/훅)

### 5.2 React / Next.js
- **Server Components 우선**. 상호작용 필요할 때만 `'use client'`
- IndexedDB 접근 컴포넌트는 `'use client'` 필수
- 데이터 페칭은 hooks로 추상화 (`useStamps`, `useStamp`)

### 5.3 Tailwind
- arbitrary values 남용 금지. 토큰 우선.
- 긴 className은 `cn()` 헬퍼로 분리.
- 다크모드는 MVP에서 제외. v1.1.

### 5.4 한국어
- 사용자 노출 텍스트는 한국어 (`PRD/10-hook-messages.md`의 문구만 사용)
- 변수명/함수명은 영어
- 주석은 한/영 일관되게

### 5.5 접근성
- 모든 버튼/링크에 의미 있는 라벨
- 우표 이미지 alt 텍스트: `"5월 24일 우표"` + 메모 있으면 첨부
- 키보드 네비게이션 항상 작동

---

## 6. 🚨 절대 규칙 (위반 시 즉시 중단)

### 6.1 사진 변경 금지
- 상세 화면에 "사진 변경" 버튼 X
- 사진 교체 코드 X
- 변경은 삭제 후 재등록만
- 상세: `PRD/06-stamp-detail.md` §3.4
- 자동 차단: `prd-guardian`

### 6.2 외부 분석/추적 금지 (MVP)
- Google Analytics, Sentry, Mixpanel 등 X
- 외부 서버로 사용자 데이터 전송 X
- 상세: `PRD/12-observability.md` §10.5

### 6.3 미래 날짜 등록 금지
- 등록 화면에서 미래 날짜 선택 차단
- 미래 셀 탭 시 "내일을 기다려요"만

### 6.4 외부 폰트/이미지 CDN 의존 최소화
- 폰트는 next/font로 self-host
- 외부 CDN 이미지 X (사용자 사진 외)
- PWA 오프라인 작동 보장

### 6.5 비파괴 처리
- 의심스러우면 덮어쓰지 말 것
- 삭제는 휴지통 경유
- 트랜잭션 실패 시 자동 롤백
- 상세: `PRD/11-failure-modes.md` §9.3.3

---

## 7. 자주 까먹는 것들

### 7.1 IndexedDB는 클라이언트만
- `'use client'` 빼먹지 말기
- SSR 시 db 접근 X

### 7.2 우표 통일성
- 3종 스타일 모두 동일한 외곽 크기, 종횡비
- `/check-stamps` 커맨드로 정기 검증

### 7.3 빈 우표는 항상 미니멀 톱니
- 사용자가 어떤 스타일을 선택했든 무관

### 7.4 감정 표시 ON/OFF
- 우표 그리드: `moodVisible === false`이면 점 안 그림
- 상세 화면: 감정 데이터는 항상 표시 (본인은 볼 수 있게)

### 7.5 월요일 시작
- `date-fns`의 `startOfWeek(date, { weekStartsOn: 1 })`

### 7.6 미래 날짜
- 등록 불가
- 셀 탭 시 "내일을 기다려요"
- 시각: `opacity: 0.3`

---

## 8. 트러블슈팅 (개발 시)

### 8.1 IndexedDB에 Blob 저장 안 됨
- Safari 일부 버전 이슈. Dexie 최신 사용
- 폴백 base64 가능하지만 용량 ↑

### 8.2 PWA 설치 안 됨
- HTTPS 필수 (localhost 예외)
- manifest.json 경로/필드 확인
- 서비스 워커 등록 확인

### 8.3 우표 PNG 내보내기 흐릿함
- `html-to-image`의 `pixelRatio: 2~3`
- SVG 마스크가 PNG 변환 시 깨지면 `<canvas>` 직접 검토

### 8.4 크롭 라이브러리 모바일 터치 이슈
- `react-easy-crop` 모바일 OK
- 문제 시 `react-image-crop`으로 교체

---

## 9. 외부 참고

- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com
- Dexie.js: https://dexie.org
- react-easy-crop: https://github.com/ValentinH/react-easy-crop
- @serwist/next: https://serwist.pages.dev

---

## 10. 변경 이력

- **v1.0**: 초기 MVP 명세
- **v2.0**: 하네스 진단 R3/R4 반영 (실패·관측 표준)
- **v3.0**:
  - PRD 단일 파일 → 14개로 분할 (`PRD/` 디렉토리)
  - CLAUDE.md를 얇은 라우터로 재구성 (470줄 → ~200줄)
  - 서브에이전트 4종 도입 (`.claude/agents/`)
  - 슬래시 커맨드 4종 도입 (`.claude/commands/`)
  - Phase별 필독 파일 매핑 (PRD/00-index.md)
  - `ROADMAP.md` 변경 없음 (Phase 작업 순서는 그대로)

---

*다음 세션을 시작할 때, 가장 먼저 `PRD/00-index.md`를 읽으세요.*
