# ROADMAP.md — Scrap a Day 작업 분해

> MVP를 5단계로 나눠서 만듭니다. 각 Phase 끝나면 동작하는 무언가가 있어야 합니다 (점진적 통합).

---

## 📍 작업 원칙

1. **각 Phase는 독립적으로 동작 가능**해야 함 (다음 단계로 못 넘어가도 뭔가는 보임)
2. **시각화 먼저, 데이터 나중**: Phase 1에서 우표 보고 "오 예쁘다" 되어야 동기 유지
3. **MVP = Phase 1~5**. 그 다음은 v1.1로 미룸
4. **각 Phase 끝나면 커밋**. 작은 단위로 자주 커밋

---

## Phase 1: 프로젝트 셋업 + 우표 컴포넌트 (정적)

> **목표**: 데이터 없이도 우표 디자인이 화면에 보이게. "이쁘다"가 되면 성공.

### 1.1 프로젝트 초기화
- [ ] `npx create-next-app@latest scrap-a-day` (TypeScript, Tailwind, App Router)
- [ ] GitHub 리포 생성 (Public, `scrap-a-day`)
- [ ] 초기 커밋 + push
- [ ] Vercel 연결 (자동 배포)
- [ ] 다음 문서들 리포에 추가 (구조 유지):
  - `CLAUDE.md`, `ROADMAP.md`
  - `PRD/` 디렉토리 (15개 파일)
  - `.claude/agents/` (4개 에이전트)
  - `.claude/commands/` (4개 슬래시 커맨드)
  - `docs/decisions/` (빈 디렉토리, Phase 5에서 채움)

### 1.2 의존성 설치
- [ ] `dexie` `react-easy-crop` `html-to-image` `jszip` `date-fns` `lucide-react`
- [ ] shadcn/ui 초기화: `npx shadcn@latest init`
- [ ] 필요한 shadcn 컴포넌트 추가: Button, Dialog, Toast, Select, Textarea
- [ ] PWA: `@serwist/next` 설치

### 1.3 디자인 시스템
- [ ] `app/globals.css`의 `@theme` 블록에 컬러 토큰 추가 (감정 5색, 우표 컬러) — Tailwind v4 CSS-first
- [ ] `app/layout.tsx`에 next/font로 폰트 로드 (Paperlogy via local, Crimson Pro, Caveat)
- [ ] `globals.css`에 베이스 스타일

### 1.4 우표 컴포넌트 (정적 데이터로)
- [ ] `types/index.ts` - 타입 정의
- [ ] `lib/perforation.ts` - 톱니 좌표 생성 유틸
- [ ] `components/stamp/PerforationMask.tsx` - 톱니 SVG 마스크
- [ ] `components/stamp/StampClassic.tsx`
- [ ] `components/stamp/StampMinimal.tsx`
- [ ] `components/stamp/StampPolaroid.tsx`
- [ ] `components/stamp/EmptyStamp.tsx`
- [ ] `components/stamp/Stamp.tsx` - 스타일 분기 라우터

### 1.5 데모 페이지
- [ ] `app/demo/page.tsx` - 3가지 스타일 + 빈 우표를 정적 데이터로 표시
- [ ] 다양한 크기(sm/md/lg)로 렌더링해서 확인
- [ ] **이 시점에 배포해서 모바일에서 확인** ← 중요

### 1.6 글로벌 에러 처리 기반
- [ ] `components/ErrorBoundary.tsx` - React ErrorBoundary 컴포넌트
- [ ] `app/layout.tsx`에 ErrorBoundary 적용
- [ ] `lib/errors.ts` - `logError()` 함수 (DB는 Phase 2에서 추가, 일단 console만)
- [ ] `window.onunhandledrejection` 핸들러

**✅ Phase 1 완료 기준**: `/demo` 페이지에서 3개 스타일 우표와 빈 우표가 깔끔하게 보임. 모바일에서도. ErrorBoundary로 일부러 에러 일으켜도 앱이 죽지 않음.

---

## Phase 2: IndexedDB + 메인 캘린더

> **목표**: 데이터를 저장/조회할 수 있고, 메인 화면에 월간 캘린더가 표시됨. (등록은 다음 단계)

### 2.1 IndexedDB 셋업
- [ ] `lib/db.ts` - Dexie 인스턴스 + 스키마 (stamps, settings, **errors, usage** 모두 포함)
- [ ] `lib/stamps.ts` - CRUD 함수 (create, getByDate, getByMonth, update, softDelete) — `Result<T>` 타입 반환
- [ ] `lib/errors.ts` - Phase 1 console 로깅을 DB 저장으로 업그레이드
- [ ] `lib/usage.ts` - `recordDailyVisit()`, 통계 조회 함수
- [ ] `lib/seed.ts` (개발용) - 더미 데이터 생성 함수

### 2.2 React Hooks
- [ ] `hooks/useStamps.ts` - 특정 월의 우표 목록 조회 (live query)
- [ ] `hooks/useStamp.ts` - 특정 날짜 우표 1개
- [ ] `hooks/useCurrentMonth.ts` - 현재 보는 월 상태 관리

### 2.3 캘린더 컴포넌트
- [ ] `components/calendar/MonthHeader.tsx` - 월/년 + 좌우 화살표
- [ ] `components/calendar/DayCell.tsx` - 셀 1개 (날짜 + 우표/빈우표 + 오늘 강조)
- [ ] `components/calendar/MonthBoard.tsx` - 7×N 그리드 (월요일 시작)

### 2.4 메인 페이지
- [ ] `app/page.tsx` - 메인 (월간 보드)
- [ ] 좌우 화살표로 월 이동
- [ ] 모바일에서 좌우 스와이프 (선택, 어려우면 v1.1로)
- [ ] 더미 데이터로 우표 표시 확인

### 2.5 후킹 문구 로직
- [ ] `lib/hooks.ts` - 상황별 문구 선택 함수
- [ ] 빈 우표에 상황별 placeholder 표시

**✅ Phase 2 완료 기준**: 메인 화면에 한 달이 보이고, 좌우로 월 이동되고, 더미 우표가 캘린더에 박혀있음.

---

## Phase 3: 등록 플로우 (크롭 포함)

> **목표**: 실제로 사진을 올려서 우표를 만들 수 있음. MVP의 심장.

### 3.1 라우팅
- [ ] `app/new/page.tsx` - 등록 페이지 (쿼리: `?date=YYYY-MM-DD`)
- [ ] 메인의 빈 우표 탭 → `/new?date=...`로 이동

### 3.2 사진 선택
- [ ] `<input type="file" accept="image/*">` 기본 또는 커스텀 버튼
- [ ] 모바일에서 카메라 직접 호출도 가능 (`capture="environment"`)

### 3.3 크롭 인터랙션
- [ ] `components/editor/PhotoCropper.tsx`
- [ ] react-easy-crop 통합
- [ ] 정사각형 (1:1) 크롭 영역
- [ ] 드래그 / 핀치 줌
- [ ] "확인" 버튼 → 크롭 데이터 저장

### 3.4 메타데이터 입력
- [ ] `components/editor/MemoInput.tsx` - 100자 제한 + 카운터 (`23/100`)
- [ ] `components/editor/MoodPicker.tsx` - 5색 동그라미 + 미선택 가능
- [ ] `components/editor/StylePicker.tsx` - 클래식/미니멀/폴라로이드
- [ ] 감정 표시 ON/OFF 토글

### 3.5 미리보기
- [ ] 메타데이터 입력 화면에서 실시간 우표 미리보기
- [ ] "이렇게 붙여질 거예요" 느낌

### 3.6 저장
- [ ] "우표 붙이기" 버튼 → `createStamp` 호출 → 메인으로 복귀
- [ ] 토스트: "우표를 붙였어요"
- [ ] 같은 날짜 이미 등록되어 있으면 에러 메시지

**✅ Phase 3 완료 기준**: 휴대폰에서 실제 사진 골라서 우표 만들고, 캘린더에 박히는 것까지 확인.

---

## Phase 4: 상세 화면 + 수정 + 삭제

> **목표**: 만든 우표를 다시 보고, 수정하고, 삭제할 수 있음.

### 4.1 상세 페이지
- [ ] `app/stamp/[date]/page.tsx`
- [ ] 큰 우표 표시 (lg size)
- [ ] 날짜, 메모, 감정 정보 표시
- [ ] 액션 버튼들

### 4.2 수정 액션
- [ ] **메모 수정**: 인라인 또는 다이얼로그
- [ ] **감정 변경**: 5색 picker 다이얼로그
- [ ] **감정 표시 ON/OFF**: 토글
- [ ] **스타일 변경**: 3개 옵션 picker
- [ ] **크롭 다시**: 원본 photoBlob으로 cropper 다시 띄움

### 4.3 사진 변경 시도 처리
- [ ] 상세 화면에 "사진 변경" 버튼 **없음**
- [ ] 만약 사용자가 길게 누르기 등으로 시도하면 안내 토스트: "사진은 바꿀 수 없어요. 새로 등록하려면 우표를 삭제해주세요."

### 4.4 삭제 (휴지통 이동)
- [ ] 삭제 버튼 → 확인 다이얼로그: "이 우표를 휴지통으로 옮길까요?"
- [ ] 확인 시 `softDelete` (`deletedAt = new Date()`)
- [ ] 토스트: "휴지통으로 옮겼어요" + "되돌리기" 버튼 (5초)

### 4.5 이미지 저장 (우표 1장)
- [ ] `components/share/ExportStamp.tsx`
- [ ] html-to-image로 PNG 변환
- [ ] 다운로드 트리거
- [ ] 모바일 Web Share API로 시스템 공유시트 호출 (가능한 경우)

**✅ Phase 4 완료 기준**: 우표 1개의 전체 라이프사이클(등록 → 보기 → 수정 → 삭제 → 이미지 저장)이 작동.

---

## Phase 5: 휴지통 + 백업 + 회고 + PWA

> **목표**: MVP 완성. 본인이 매일 쓸 수 있는 상태.

### 5.1 설정 페이지
- [ ] `app/settings/page.tsx`
- [ ] 메뉴: 휴지통, 백업, 정보

### 5.2 휴지통
- [ ] `app/settings/trash/page.tsx`
- [ ] 삭제된 우표 목록 (`deletedAt IS NOT NULL`)
- [ ] 각 항목: 복원 / 영구삭제 버튼
- [ ] 상단에 "30일 후 자동 삭제" 안내
- [ ] "휴지통 비우기" 버튼 + 확인 다이얼로그
- [ ] `lib/trash.ts` - 앱 로드 시 30일 지난 것 자동 영구삭제

### 5.3 백업
- [ ] `lib/backup.ts`
- [ ] **JSON 내보내기**: 메타데이터 → `scrap-a-day-2026-05-24.json` 다운로드
- [ ] **사진 ZIP**: JSZip으로 묶기 → 다운로드
- [ ] 진행 상태 표시 (사진 많을 때 시간 걸림)

### 5.4 월말 회고 (간단)
- [ ] 메인 화면 하단 또는 별도 카드
- [ ] 채운 날 수 (`17/31일`)
- [ ] 감정 분포 (작은 가로 막대)
- [ ] "가장 많은 감정: 평온"

### 5.5 한 달 시트 PNG 내보내기
- [ ] `components/share/ExportMonth.tsx`
- [ ] 메인 화면의 캘린더를 PNG로 변환
- [ ] 메인 상단에 "내보내기" 아이콘 버튼

### 5.6 PWA 마무리
- [ ] `public/manifest.json`
- [ ] 임시 아이콘 (192x192, 512x512) - 우표 모양 단순 SVG로 생성
- [ ] `@serwist/next` 설정 - 정적 자산 캐싱
- [ ] HTTPS에서 "홈 화면에 추가" 동작 확인

### 5.7 빈 상태 화면들
- [ ] 첫 진입 (캘린더 전부 빈 칸): "첫 우표를 붙여볼까요?" 안내
- [ ] 휴지통 비어있음: "휴지통이 비어있어요"
- [ ] 미래 날짜 탭: "내일을 기다려요" 토스트

### 5.8 관측 UI (PRD §10)
- [ ] 설정 → "에러 로그 보기" 페이지 (`app/settings/errors/page.tsx`)
- [ ] 설정 → "내 사용 통계" 페이지 (`app/settings/usage/page.tsx`)
- [ ] 월말 회고 화면에 사용 통계 일부 노출 (방문일 수, 등록 성공률)
- [ ] 로그/통계 "전체 삭제" 버튼

### 5.9 ADR 문서화 (PRD §10.4)
- [ ] `docs/decisions/` 디렉토리 생성
- [ ] 최소 4개 ADR 작성:
  - `0001-no-photo-replacement.md`
  - `0002-trash-30-days.md`
  - `0003-monday-week-start.md`
  - `0004-local-only-storage.md`

### 5.10 마지막 다듬기
- [ ] 모든 화면 모바일 반응형 점검
- [ ] 접근성 (키보드 네비, alt 텍스트) 점검
- [ ] 빠진 로딩 스피너 추가
- [ ] 에러 상태 처리 (PRD §9 화면별 정책 표 대조)

### 5.11 모바일 우선 마무리 (PRD §15)
- [ ] **PWA 설치 안내 배너** (메인 상단, 1회 dismiss 기억) — iOS Safari ITP 7일 IndexedDB 삭제 대응
- [ ] **자동 백업 알림**: 마지막 백업이 N일 이전이면 메인 상단 배지 + 토스트
- [ ] `app/layout.tsx` viewport metadata에 `viewport-fit=cover` 추가 + body `safe-area-inset` padding
- [ ] `/check-mobile` 슬래시 커맨드로 자가 점검 통과
- [ ] 실제 단말 (iPhone Safari + Android Chrome) 1회 이상 테스트
- [ ] ADR 추가: `0005-ios-itp-mitigation.md` (왜 PWA 설치 권유 + v1.1 클라우드 백업인가)

**✅ Phase 5 완료 기준**: MVP 완성. 본인이 만들고, 매일 사용 시작 가능. iOS ITP 대응 정책 UI 노출 완료.

---

## 🎯 MVP 검증 (Phase 5 이후)

### 본인 사용 검증 (최소 1개월)
- [ ] 매일 우표 붙이기 — 부담감 없이?
- [ ] 한 달 끝나고 캘린더 보기 — 시각적 만족?
- [ ] 수정/삭제 시도해보기 — UX 흐름 자연스러운가?
- [ ] 백업 한 번 해보기 — 작동 확인
- [ ] 한 달 시트 이미지 내보내기 — 인스타에 올려보기

### 만약 문제 발견되면
- 작은 것: 그때그때 수정
- 큰 것: 발견 사항 모아서 다음 라운드 결정

---

## 🚀 v1.1 (MVP 완료 후 1-2개월 뒤)

- [ ] 검색 기능 (메모 텍스트)
- [ ] 감정별 필터
- [ ] 월 점프 (특정 년/월로 바로 이동)
- [ ] JSON 가져오기 (복원)
- [ ] 상세 월말 회고 화면 (감정 차트, 요일별 패턴 등)
- [ ] 다크모드

## 🌐 v2.0 (사용 정착 후)

- [ ] Supabase 도입 + 옵션 로그인
- [ ] 클라우드 백업 동기화
- [ ] 링크 공유 (읽기 전용 페이지)
- [ ] 다국어 (영어)

---

## 📊 예상 소요 시간 (개인 프로젝트 기준)

| Phase | 작업량 |
|---|---|
| 1: 셋업 + 디자인 | 1-2일 |
| 2: DB + 캘린더 | 1-2일 |
| 3: 등록 + 크롭 | 2-3일 |
| 4: 상세 + 수정 | 1-2일 |
| 5: 휴지통 + 백업 + PWA | 2-3일 |
| **합계** | **약 1-2주** (집중 작업 기준) |

---

## 💡 클로드 코드 사용 팁 (v3 구조)

1. **세션 시작 시**: `CLAUDE.md` → `PRD/00-index.md` 순서로 읽도록 안내
2. **Phase 시작은 슬래시 커맨드로**: `/start-phase 1` → 자동으로 필요 PRD만 로드
3. **큰 작업은 서브에이전트에게 위임**:
   - 우표 비주얼 → `stamp-designer`
   - DB 작업 → `db-architect`
   - 화면 조립 → `ui-builder`
4. **Phase 종료 직전**: `/end-phase 1` 실행 → 자동 검증 + 커밋 메시지
5. **수상한 코드 발견 시**: `/check-prd <feature>` → prd-guardian이 위반 사항 탐지
6. **결정 사항 변경 시**: 해당 `PRD/NN-*.md` 먼저 업데이트 후 코드 작업
7. **막힐 때**: 디자인 시안이 필요하면 Claude.ai로 와서 시각화 후 다시 갖고 가기

---

*Happy stamping! 📮*
