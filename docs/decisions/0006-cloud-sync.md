# 0006. 클라우드 동기화 도입 (Supabase + 이메일 매직링크)

**날짜**: 2026-05-30
**상태**: 채택 (Accepted) — Phase 5 마감 직전에 MVP 범위 확장. ADR 0004를 **부분 supersede**.
**관련 PRD**: `01-overview.md`, `09-data-model.md` (스키마 확장 필요), `14-roadmap.md` (v1.1 #1 → MVP 포함)
**Supersedes (부분적)**: ADR 0004 "로컬 전용 저장" — 로컬 우선은 유지하되 옵셔널 클라우드 sync 추가
**Related**: ADR 0005 (iOS ITP 7일 삭제 대응의 **최종 해결**)

## 컨텍스트

ADR 0004는 MVP를 로컬 전용으로 정했고, ADR 0005는 그 위험 (iOS ITP 7일 삭제)을 PWA 설치 + 자동 백업 알림으로 완화했다. **본인 사용 검증 1개월 후 v1.1에 클라우드 백업 도입** 예정이었다.

그러나 Phase 5 마감 직전 사용자 테스트에서 다음 두 페인 포인트가 실제로 드러났다:

1. **다른 브라우저에서 같은 데이터 안 보임**: 모바일 Safari에서 등록 → 데스크탑 Chrome에서 빈 캘린더. 로컬 전용의 직접적 결과.
2. **iOS Safari ITP 7일 위험은 잠재적**: 아직 실제 손실은 없지만 7일 미방문 시나리오는 일기 앱에서 충분히 가능.

사용자는 "기다리지 말고 지금 도입" 결정. v1.1 #1을 MVP에 포함.

## 결정

**Supabase + 이메일 매직링크 (passwordless) + 옵셔널 가입 + 양방향 자동 동기화** 도입.

핵심 원칙:
- **로컬 우선 (Local-first)**: 모든 쓰기는 IndexedDB에 먼저, 그 뒤 백그라운드로 Supabase에 sync. 오프라인에서도 정상 작동.
- **옵셔널**: 로그인 안 한 사용자는 기존대로 로컬 전용. 클라우드는 명시 가입 시에만.
- **이메일만**: 닉네임+비밀번호 X. 비밀번호 분실 → 데이터 손실 위험 (ADR 0001 데이터 무게감 정신과 모순). 매직링크가 마찰 최저 + 복구 가능.
- **충돌 해결**: Last-Write-Wins by `updatedAt`. 단순함 우선. 더 정교한 CRDT는 v2.0+.

## 이유

1. **사용자가 경험으로 검증** — "다른 브라우저에서 안 보임" 페인을 실제로 겪음. 이론적 위험이 아닌 실제 사용 시나리오.
2. **ITP 7일 위험 최종 해결** — 클라우드 백업 있으면 IndexedDB 삭제돼도 복구 가능. ADR 0005의 4단계 완화 중 마지막 단계 (v1.1 1순위)가 앞당겨짐.
3. **이메일 매직링크 = 최저 마찰** — 비번 입력/저장/잊어버림 0. 한 번의 이메일 클릭으로 끝. 일기 앱에 적합.
4. **Supabase 선택 근거**:
   - Postgres 기반 → 친숙한 데이터 모델
   - Auth (매직링크) 기본 제공
   - Row Level Security (RLS) → 다중 사용자 격리 자동
   - Storage → Blob 저장 (사진)
   - 무료 티어: 500MB DB, 50K MAU, 5GB bandwidth/월 → 본인 사용 + 소규모 베타 충분
   - 한국 서울 리전 → 응답 속도 좋음

## 결과

### 데이터 모델 변경

`Stamp` 인터페이스에 추가:
- `userId?: string` — 클라우드 sync 사용자 식별 (로컬 전용 사용자는 undefined)
- `syncedAt?: Date` — 마지막 서버 sync 시각 (충돌 해결 + UI 표시용)
- `originalPhotoBlob`은 Supabase Storage URL 또는 로컬 Blob 중 하나 (마이그레이션 필요)

Supabase 스키마:
- `auth.users` (Supabase 기본)
- `public.stamps` — Stamp 미러
- `public.settings` — Settings 미러
- Photo Storage: `stamp-photos/{user_id}/{stamp_id}.jpg`

RLS:
- 모든 테이블에 `auth.uid() = user_id` 정책
- Storage에도 같은 정책

### 동기화 흐름

**쓰기** (createStamp / updateStamp / softDeleteStamp / recropStamp):
1. IndexedDB에 먼저 저장 (즉시, UX 빠름)
2. 로그인 상태면 sync queue에 추가
3. 백그라운드로 Supabase에 push (네트워크 실패 시 retry)

**읽기** (useLiveQuery 등):
1. IndexedDB에서 즉시 (오프라인 OK)
2. 로그인 상태면 백그라운드로 서버에서 pull, 최신 데이터 IndexedDB에 반영

**충돌**:
- 같은 stamp.id를 두 디바이스에서 동시 수정 → updatedAt 늦은 쪽이 이김
- Photo 변경은 정책상 금지 (PRD §06 §3.4) → 충돌 없음

### 인증 흐름

1. 사용자가 설정 → 로그인 클릭
2. 이메일 입력 → Supabase가 매직링크 발송
3. 사용자가 이메일에서 링크 클릭 → /auth/callback 라우트
4. 세션 생성 → 로컬 데이터를 서버에 첫 push
5. 이후 다른 브라우저에서 같은 이메일로 로그인 → 서버 데이터 자동 pull

### 새 화면

- `/auth/login` — 이메일 입력
- `/auth/callback` — 매직링크 콜백 처리
- `/settings/account` — 로그인 상태, 로그아웃, 마지막 sync 시각

## 트레이드오프 (인지된 비용)

### 비용
- **인프라 의존**: Supabase가 장애나거나 무료 티어 초과 시 sync 끊김. 단 로컬은 여전히 작동.
- **개인 정보 일부 노출**: 이메일이 Supabase에 저장됨. 그러나 사진/메모는 사용자 본인 계정에만 접근 가능 (RLS).
- **MVP 범위 확장**: 원래 2주 분량의 v1.1 #1 작업이 MVP에 포함됨. Phase 6로 명명.
- **충돌 케이스 단순화**: Last-Write-Wins는 정교하지 않음. 같은 stamp를 두 기기에서 거의 동시에 수정하면 한쪽 작업 손실 가능. 일기 앱 사용 패턴에선 거의 발생 안 함.

### 회피한 비용
- 닉네임 + 비밀번호 (복구 불가능 → 데이터 손실 위험)
- 자체 서버 운영 (인프라 + 인증 직접 구현)
- E2E 암호화 (UX 복잡도 ↑, MVP 과스코프)

## 대안 (검토 + 기각)

- **Firebase**: 비슷한 기능, 비용 구조 더 복잡, Google 의존 강함
- **PocketBase / Appwrite (self-hosted)**: 호스팅 부담, 인증 직접 운영
- **iCloud (Apple) 또는 Google Drive (Google)**: 사용자가 자기 클라우드에 직접 백업. iOS/Android 모두 지원 어려움, 동기화 X
- **WebRTC P2P + QR 페어링** (Standard Notes 방식): 복잡, E2E 암호 필요, 디바이스 잃으면 끝
- **닉네임 + 비밀번호**: 복구 불가 → 데이터 손실 위험. **거부**.

## 마이그레이션 정책

기존 로컬 전용 사용자가 처음 로그인할 때:
1. 로컬에 있는 모든 stamps + settings를 서버에 push
2. 충돌 시: 서버에 데이터 없음이 일반적 (새 계정) → 그냥 push
3. 만약 서버에 이미 데이터 있음 (예: 다른 기기에서 먼저 등록) → 서버 + 로컬 merge by date+id

기존 로컬 데이터 절대 손실하지 않음. 사용자 명시 동작 없이 데이터 사라지면 안 됨.

## 재검토 시점

- Stage 7 (테스트) 완료 후: 실제 sync UX 검증
- 본인 사용 1개월 후: 충돌 시나리오 실제 발생 여부, 무료 티어 한도 도달 여부
- v2.0 검토: 외부 공개 시 RLS 강화, E2E 암호화, 그룹/공유 기능 등

## 참고

- Supabase Auth (Magic Link): https://supabase.com/docs/guides/auth/passwords#with-magic-link
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Local-first principles: https://www.inkandswitch.com/local-first/
