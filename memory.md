# memory.md — Scrap a Day 세션 메모리

> **다음 세션 시작 시 가장 먼저 보는 문서.** 진행 상태 + 결정 이력 + 알아야 할 것을 빠르게 회수.
> CLAUDE.md(라우터) → memory.md(상태) → 필요 시 PRD/00-index.md
> 마지막 업데이트: **2026-05-31** (post-MVP polish 라운드 완료)

---

## 0. 한 줄 상태

**MVP (Phase 1-6) + post-MVP 시각/UX polish 라운드 완료. 본인 사용 검증 단계 진입.** 코드 빌드 클린, 17개 route prerender OK. URL은 `scrap-a-day-eosin.vercel.app` 그대로 (변경은 후순위).

이번 polish 라운드에 추가된 큰 기능:
- **특별한 날 스티커 17개** (라이프 6 + 공휴일 5 + 기존 6) + 키치 일러스트 스타일
- **per-stamp 스티커 토글** (등록 + 상세 페이지에서 사진 보면서 결정)
- **배경 컬러 자유 선택** (프리셋 6 + react-colorful + HEX/RGB)

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
| Post-MVP polish (2026-05-31) | ✅ | 특별한 날 17개 + per-stamp 토글 + 배경 컬러 자유 선택 + 검색 통계 + 다양한 모바일 fix |
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

### Post-MVP polish 결정들 (2026-05-31)

- **특별한 날 17개**: 라이프(어린이날, 어버이날, 스승의 날, 부처님 오신날, 핼러윈, 크리스마스) + 공휴일(삼일절, 현충일, 광복절, 개천절, 한글날). 음력은 2026-2030 사전 계산. `lib/specialDays.ts`.
- **키치 SVG 스타일**: 17개 스티커 모두 통일 — 굵은 outline (0.7-1.2) + 단일 채색 + 흰 highlight (회전 -25°) + 통통한 비율 + drop-shadow-sm.
- **per-stamp 스티커 토글 (NOT per-day)**: 처음엔 settings 페이지로 만들었다가 사용자 피드백으로 등록/상세 페이지에서 사진 보면서 결정하도록 변경. `Stamp.hideSpecialDaySticker?: boolean`. settings 페이지 (`/settings/stickers`) 통째로 제거.
- **카네이션 redesign**: 사용자 참고 이미지대로 5-lobe 단순 꽃 (5 overlapping circles + 짙은 중앙 + 짧은 줄기 + 잎). 어버이날 빨강, 스승의 날 분홍.
- **배경 컬러 자유 선택**: `Settings.backgroundColor`. body + 우표 톱니 fill에 적용 (우표 안쪽 paper는 항상 흰색 — 우표가 액자 역할). CSS variable `--user-bg`로 stamp 컴포넌트들이 자동 따라감. Export PNG에도 적용.
- **react-colorful 도입**: Samsung Internet native `<input type="color">`가 (a) controlled value 무시하고 검정으로 시작 (b) 시스템 chrome 변경 불가 → JS picker로 우회. ~4KB. shadcn Dialog 안에 wrap.
- **검색 통계 카드 (CSS만)**: 사람 1명 → 감정 분포 + 월별 + co-occur + 총 횟수. 감정 1개 → Top 함께한 사람 + 월별. 차트 라이브러리 0. RetrospectCard mood bar 패턴 재사용.
- **검색 결과 월별 collapse**: 결과 > 2개월이면 최신 월만 자동 펼침, 나머지 헤더만. 100+ 우표 결과도 부담 없이.
- **검색 다운로드 60개 초과 시 다이얼로그**: 작은 검색은 무마찰. 큰 검색은 "긴 이미지가 만들어져요" 확인 후 진행.
- **사람 chip single-select**: 처음 multi-select OR 매칭 → 사용자 혼란. mood처럼 한 명만 선택 (다른 사람 누르면 교체)으로 변경.
- **검색 결과 우표 그리드 = size='md' + flex-wrap**: size='full' + grid + aspect-ratio가 Samsung Internet에서 0px collapse. 고정 너비 (80px)로 회피.
- **모든 export Blob URL**: Naver / KakaoTalk in-app browser가 `data:` URL 다운로드 거부. `fetch(dataUrl).blob()` → `URL.createObjectURL`.

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

## 5. v1.1 백로그 (audit + post-MVP polish 잔여)

우선순위 순:

### 기능 (검색 / 통계 확장 — 본인 검증 후 결정)
1. **JSON 가져오기** — 로컬 백업 복원, 로컬 전용 사용자 이동용
2. **월 점프** — 특정 년/월 직접 이동
3. **검색 통계 깊이 확장** (Phase 2 of stats) — 별도 `/stats/companion/{name}` 페이지, 차트 라이브러리 도입, 시간대/요일 패턴. 본인 1개월 사용 패턴 보고 결정.
4. **다크모드**
5. **메모 텍스트 검색** — 현재 검색은 companion + mood만
6. **사용자 등록 기념일** — 생일/결혼기념일 등 본인 정의 special day

### 배경 컬러 폴리시 (post-MVP polish 잔여)
7. **이미지 업로드 배경** — 컬러만으로 부족하면 사용자 사진 업로드. 1개월 사용 후 결정.
8. **계절 자동 변경** — 봄/여름/가을/겨울 자동 색 전환 (수동 + 자동 토글)

### Phase 6 후속
9. **영구 삭제 → Supabase Storage 청소** — orphan 사진 정리
10. **Settings sync에 `updatedAt`** — 정확한 LWW
11. **LWW silent loss UX** — 충돌 토스트 또는 ADR 0006 재검토

### 작은 폴리시
12. **PWA 아이콘 PNG fallback** — iOS 일부 환경 호환
13. **sw.js의 GA dead code 정리** — serwist 기본 포함, 우리 사용 X
14. **Paperlogy TTF → woff2** — ~30% 압축
15. **Settings.disabledSpecialDays 필드 정리** — per-stamp 토글로 대체됨, deprecated. cleanup 시점 결정.

### 인프라
16. **URL 변경 검토** — `scrap-a-day-eosin` → 더 깔끔한 이름. Vercel rename + Supabase Auth URL 재설정.

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

### TIL: Samsung Internet `<input type="color">` quirks
- React-controlled `value` 무시. native picker가 OS 캐시된 색으로 시작 (보통 검정 또는 빨강).
- 1차 fix: `key={color} + defaultValue={color}`로 강제 re-mount.
- 2차 fix: react-colorful 도입 (4KB JS picker, 시스템 picker 완전 우회 + slider 화살표 등 fully themable).

### TIL: shadcn Dialog의 자식 width 누수
DialogContent가 grid layout이라 자식 cell width가 부모 max-w를 무시할 수 있음. `overflow-hidden` + `p-0 + 내부 div로 직접 padding + min-w-0 + w-full` 명시 필요. DialogFooter는 모바일에서 `flex-col-reverse` 기본이라 버튼 stack — 직접 flex row + flex-1 권장.

### TIL: react-colorful 통합
- Library는 200px default. globals.css에서 `width: 100% !important + max-width: 100%` 강제.
- `__pointer` class로 slider 화살표 직접 styling (border + box-shadow).
- HexColorPicker는 controlled (color/onChange). draft state로 dialog 안에서만 drag, "적용" 누를 때만 commit.

### TIL: 검색 결과 그리드 size='full' + grid + aspect-ratio
Samsung Internet에서 0px collapse. 원인: grid item default `align-self: stretch` + 아직 width 안 잡힌 aspect-ratio = 0. 해결: size='md' (w-20 = 80px 고정) + flex-wrap. 부모 width 의존성 자체 제거.

### TIL: 모바일 페이지 가로 스크롤
원인: 어떤 자식이 부모 max-w를 무시. 안전망:
- main에 `overflow-x-hidden`
- main에 `w-full max-w-md` (둘 다)
- 내부 flex/grid 자식에 `min-w-0` (자식이 intrinsic content보다 작게 shrink 가능하게)

### 디버깅: 검색 결과 안 보임 (Phase 5)
1. 증상: 우표 등록해도 검색 결과 갱신 X
2. 원인: searchStamps()를 useLiveQuery 안에서 await — 외부 async라 추적 X
3. 해결: db.stamps.toArray() 직접 호출 + filter 인라인

---

## 7. 변경 이력 (이 파일)

- **2026-05-30 (v1)**: 초기 작성. Phase 6 마감 + 폰트 통일 + 라벨 통일 + ExportMonth 폴리시 후 상태 캡처.
