# memory.md — Scrap a Day 세션 메모리

> **다음 세션 시작 시 가장 먼저 보는 문서.** 진행 상태 + 결정 이력 + 알아야 할 것을 빠르게 회수.
> CLAUDE.md(라우터) → memory.md(상태) → 필요 시 PRD/00-index.md
> 마지막 업데이트: **2026-05-30**

---

## 0. 한 줄 상태

**MVP (Phase 1-6) 완성 + 본인 사용 검증 단계 진입 직전.** 코드 빌드 클린, prd-guardian 위반 0건, 8개 page route prerender OK. URL은 `scrap-a-day-eosin.vercel.app` 그대로 (변경은 Phase 6 후 보류).

---

## 1. 진행 상태

| Phase | 상태 | 핵심 결과물 |
|---|---|---|
| 1: 셋업 + 우표 컴포넌트 | ✅ | 4종 우표 (Classic/Minimal/Polaroid/Empty), 톱니 SVG, 디자인 토큰 |
| 2: IndexedDB + 캘린더 | ✅ | Dexie 스키마 (stamps/settings/errors/usage), 월간 보드, 빈 상태 후킹 문구 |
| 3: 등록 + 크롭 | ✅ | 카메라/갤러리 dual input, react-easy-crop, canvas 기반 crop 추출 |
| 4: 상세 + 수정 + 삭제 | ✅ | 상세 페이지, 메모/감정/스타일 수정, 휴지통 이동, 우표 1장 PNG |
| 5: 휴지통 + 백업 + PWA + 회고 | ✅ | 30일 자동 정리, JSON+ZIP 백업, manifest.json, BackupNag, InstallBanner, ADR 5개 |
| 6: Supabase sync + Magic Link | ✅ | RLS 스키마, PKCE auth, sync.ts (LWW), useAutoSync (debounce + reconnection + 첫-sync UX) |
| MVP 본인 사용 검증 (1개월) | 🚧 진행 예정 | |
| v1.1 | 보류 | 폴리시 백로그 (§5) |

---

## 2. 주요 결정 사항 (ADR 외 작은 것 포함)

### ADR (`docs/decisions/`)

| 번호 | 결정 | 비고 |
|---|---|---|
| 0001 | 사진 변경 금지 | 자기검열 방지 (PRD §6.1) |
| 0002 | 휴지통 30일 자동 정리 | 비파괴 + 디스크 관리 균형 |
| 0003 | 월요일 시작 | 한국 사용자 선호 (date-fns `weekStartsOn: 1`) |
| 0004 | 로컬 전용 저장 | **부분 Superseded by 0006**. Phase 6에서 옵셔널 클라우드 추가 |
| 0005 | iOS ITP 7일 완화 | PWA 설치 + 자동 백업 알림 + v1.1 클라우드 (실제 Phase 6에서 도입) |
| 0006 | Supabase + 이메일 매직 링크 | Phase 6 핵심. LWW 충돌 정책, RLS, anon key public |

### 작은 결정들 (커밋 메시지에 흩어져 있던 것)

- **canvas 기반 crop**: react-easy-crop 출력의 cropper-container px를 stamp display px(~50px)로 변환 시 깨짐 → 저장 시점에 canvas로 crop blob 추출 (`lib/imageProcessing.ts`)
- **Painted teeth (SVG circle fill)**: CSS mask는 작은 크기(size='full' = ~50px)에서 1-2px 잘림이 거의 invisible → 칠한 원으로 "paper 보임" 표현
- **`useLiveQuery` 외부 async 추적 X**: search page + MonthExportLayout 모두 인라인 Dexie 호출로 해결
- **Items-center 금지** (size='full' 컨테이너): flex column에서 w-full 자식이 0px collapse. 기본 stretch 사용
- **사진 blob 즉시 cropped 저장**: original도 별도 보존 (`originalPhotoBlob`)해서 Phase 4 recrop 가능
- **양방향 LWW (Phase 6)**: settings은 `updatedAt` 미보유 → 1초 윈도우로 ping-pong 회피 (정확한 LWW는 v1.1)
- **Dexie hook으로 sync 트리거**: CRUD 코드는 sync 무지 (단일 책임). `useAutoSync`가 hook 감지 → 2초 debounce → syncAll
- **첫-sync 감지**: `getLastSyncedAt(userId)` null 시 = 첫 sync. `wasFirstSync` 변수로 cycle 전에 캡처 (cycle 중 watermark가 bump되므로)
- **anon key는 public OK**: RLS가 `auth.uid() = user_id` 강제. service_role 키만 절대 노출 X
- **갤러리 저장 = a.click + 공유 액션 토스트**: 한 번 클릭으로 다운로드 + 토스트의 "공유하기" 버튼이 navigator.share

---

## 3. 알려진 트레이드오프 (인지 + 수용)

- **LWW silent loss**: 두 기기 동시 수정 시 늦게 push한 쪽 조용히 덮어씀. ADR 0006에 명시. 1개월 사용 검증 후 빈도 보고 충돌 UI 강화 결정.
- **Settings sync 부정확**: `updatedAt` 없어서 1초 윈도우로 우회. 변경 빈도 매우 낮아 실용상 문제 X.
- **Storage orphan 사진**: 영구 삭제 시 Supabase Storage 사진 안 지움. 무료 500MB 한계까지 여유. v1.1 정리.
- **Crimson Pro/Caveat 제거**: 시각 차이 0이지만 PRD 02-tech-stack.md의 이력 노트로 보존.
- **TTF 폰트 (woff2 미사용)**: 4MB → 압축 시 ~30% 절약 가능. v1.1 폴리시.
- **iOS Safari a.click**: 사진 앱이 아닌 Files 앱으로 감. 공유 액션 토스트로 우회.

---

## 4. 다음 세션 시작 시 알아야 할 것

### 4.1 즉시 컨텍스트
- 코드는 main 브랜치 `81b6922` 시점 (PRD/ROADMAP 문서 동기화 직후).
- Vercel 배포는 main push 자동. 보통 1-2분.
- 로컬 dev: `npm run dev` (Turbopack 기본이지만 PWA 호환 위해 `next build` 시 `--webpack` 사용 — package.json 확인).
- Supabase 프로젝트는 사용자 본인 계정에 생성됨. anon key는 `.env.local` + Vercel env vars에 있음 (gitignored).

### 4.2 작업 시작 전 체크
1. `CLAUDE.md` 빠른 훑기 (라우터)
2. **이 파일(memory.md)** — 현재 상태
3. 작업이 어느 영역인지에 따라 `PRD/00-index.md`의 매핑 표 참조
4. 디자인 결정 필요 시 `design.md` 참조

### 4.3 자주 까먹는 것 (반복 발생)
- IndexedDB 컴포넌트 `'use client'` 빼먹기 → 빌드 실패
- `useLiveQuery` 안에서 외부 async 함수 호출 → 반응성 깨짐
- `size='full'` 컨테이너에 `items-center` → 자식 0px collapse
- input/textarea `text-base` (16px) 미만 → iOS 자동 줌
- 미래 날짜 등록 차단 빼먹기 → PRD §6.3 위반

### 4.4 절대 규칙 (위반 시 즉시 중단)
PRD §6 + ADR 0001~0006. 핵심:
1. 사진 변경 코드/UI 추가 X
2. 외부 분석/추적 (GA, Sentry 등) 추가 X — Supabase는 본인 데이터 저장이므로 예외
3. 미래 날짜 등록 허용 X
4. 외부 폰트 CDN 의존 X (next/font self-host)
5. 비파괴 — 삭제는 휴지통 경유, 트랜잭션 atomic
6. `service_role` 키 프론트에 노출 X (anon key는 OK)

---

## 5. v1.1 백로그 (audit 발견 + 사용자 검증 발견 예상)

우선순위 순:

### 기능
1. **JSON 가져오기** — 로컬 백업 복원, 로컬 전용 사용자 이동용
2. **월 점프** — 특정 년/월 직접 이동
3. **상세 월말 회고 화면** — 감정 차트, 요일별 패턴
4. **다크모드**
5. **메모 텍스트 검색** — 현재 검색은 companion + mood만

### Phase 6 후속 폴리시
6. **영구 삭제 → Supabase Storage 청소** — orphan 사진 정리
7. **Settings sync에 `updatedAt`** — 정확한 LWW
8. **LWW silent loss UX** — 충돌 토스트 또는 ADR 0006 재검토
9. **PWA 아이콘 PNG fallback** — iOS 일부 환경 호환
10. **sw.js의 GA dead code 정리** — serwist 기본 포함, 우리 사용 X
11. **Paperlogy TTF → woff2** — ~30% 압축

### 인프라
12. **URL 변경 검토** — `scrap-a-day-eosin` → 더 깔끔한 이름. Vercel rename + Supabase Auth URL 재설정.

### v2.0 (사용 정착 후)
- 링크 공유 (읽기 전용 페이지)
- 다국어 (영어)
- 우표 디자인 스킨 (계절/이벤트)
- E2E 암호화

---

## 6. TIL / 디버깅 노트

세션 중 시간 많이 잡아먹은 것 + 다시 만나면 빨리 풀어야 할 것:

### TIL: useLiveQuery 반응성 contract
dexie-react-hooks는 콜백 안의 **직접 Dexie 호출**만 추적. `await someAsyncHelper()` 같이 외부 async를 거치면 반응성 깨짐. 페이지 안에서 인라인 Dexie 호출 필수. (search page 버그 #2/#3에서 발견)

### TIL: Next.js 16 + Turbopack + serwist 충돌
`next build`가 Turbopack 기본인데 serwist와 호환 X. `next build --webpack`로 우회. package.json의 build 스크립트 확인.

### TIL: React 19 → JSX.Element 사라짐
`ReactElement` import from 'react' 사용.

### TIL: html-to-image의 함정
- `cacheBust: true`는 blob URL 깨뜨림 (blob URL은 캐시 X)
- `skipFonts: false`가 iOS Safari foreignObject 렌더에 필수 (자체 self-host 폰트도 embed 안 하면 시스템 sans로 fallback)
- `waitForImages` 헬퍼 직접 만들기 (img.complete + load/error 이벤트)
- 외부 데이터 의존 컴포넌트는 prop으로 미리 fetch해서 전달 (useLiveQuery 비동기 함정 회피)

### TIL: Supabase PKCE
매직 링크는 **링크 받은 브라우저 = 링크 여는 브라우저** 필수. code_verifier가 시작 브라우저 localStorage에 있어야 callback에서 교환 가능. 다른 브라우저에서 열면 실패.

### TIL: a.click 모바일 동작 차이
- Android: 다운로드 폴더 → 갤러리에 보임 (대부분)
- iOS: Files 앱 (사진 앱 X) → navigator.share 통한 "이미지 저장"만 사진 앱 저장

### TIL: Samsung 공유 시트 한계
Quick Share, ChatGPT, KakaoTalk 등은 표시되지만 "갤러리에 저장" 옵션은 share sheet에 없음. 직접 다운로드 + share 분리해야.

### TIL: cqw / container query
구현 안 했지만 size='full' 우표 라벨이 컨테이너 크기에 비례하면 더 자연스러움. 일단 단순 px로 진행.

### 디버깅: ExportMonth 우표 빈 셀 (Phase 6 폴리시)
1. 증상: 공유 결과 PNG가 빈 칼럼만
2. 원인: MonthExportLayout이 useLiveQuery로 비동기 fetch + 부모 toPng가 데이터 도착 전 실행
3. 해결: stamps를 prop으로 미리 fetch + phase state ('idle'/'loading'/'rendering')로 mount 시점 제어

### 디버깅: 검색 결과 안 보임 (Phase 5)
1. 증상: 우표 등록해도 검색 결과 갱신 X
2. 원인: searchStamps()를 useLiveQuery 안에서 await — 외부 async라 추적 X
3. 해결: db.stamps.toArray() 직접 호출 + filter 인라인

---

## 7. 변경 이력 (이 파일)

- **2026-05-30 (v1)**: 초기 작성. Phase 6 마감 + 폰트 통일 + 라벨 통일 + ExportMonth 폴리시 후 상태 캡처.
