# Supabase 셋업 가이드

Phase 6 cloud sync를 위한 1회성 설정. 약 10-15분.

---

## 1. SQL 스키마 실행 (3분)

**대상**: Supabase Dashboard

1. https://supabase.com → 본인 프로젝트 (`scrap-a-day`) 진입
2. 좌측 사이드바 → **SQL Editor** (`</>` 아이콘)
3. 우상단 **`New query`** 클릭
4. 로컬 파일 `docs/supabase-schema.sql` 전체 복사 → 에디터에 붙여넣기
5. 우상단 초록 **`Run`** 버튼 (또는 `Ctrl/Cmd + Enter`)
6. 하단에 `Success. No rows returned` 나오면 완료

### 확인
- 좌측 사이드바 → **Table Editor**
- `stamps`, `settings` 테이블 보이면 OK
- 각 테이블의 `RLS enabled` 체크 표시 확인
- 좌측 사이드바 → **Storage** → `stamp-photos` bucket 존재 확인

---

## 2. Auth URL 설정 (2분)

매직링크 이메일에서 클릭 시 어디로 redirect할지 등록.

1. 좌측 사이드바 → **Authentication** → **URL Configuration**
2. **Site URL**:
   ```
   https://scrap-a-day-eosin.vercel.app
   ```
3. **Redirect URLs** (Add URL 클릭해서 둘 다 추가):
   ```
   https://scrap-a-day-eosin.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. **Save** 클릭

---

## 3. 이메일 매직링크 활성화 (1분)

기본 활성화돼 있지만 확인.

1. 좌측 사이드바 → **Authentication** → **Sign In / Up** (또는 **Providers**)
2. **Email** 옵션 확인:
   - `Enable Email provider` ✅
   - `Confirm email` ⬜ (체크 해제 — 매직링크는 클릭 자체가 인증)
   - `Secure email change` ✅ 유지
3. (선택) **Email Templates** → `Magic Link` 한글로 커스터마이즈 가능 (나중에)

---

## 4. 로컬 환경변수 (.env.local)

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjloaykexetkqkgsjpnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbG9heWtleGV0a3FrZ3NqcG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTA5NDIsImV4cCI6MjA5NTY4Njk0Mn0.bgll9FdMfqvqDOEQAlFhCQMAA0CV46vtfeAajAXGTt4
```

**`.env.local`은 git에 안 들어감** (Next.js의 `.gitignore` 기본 패턴에 포함).
`NEXT_PUBLIC_` prefix는 브라우저에서 접근 가능. anon key는 public이라 OK.

---

## 5. Vercel 환경변수 (2분)

배포본에도 같은 환경변수 필요.

1. https://vercel.com → `scrap-a-day` 프로젝트
2. **Settings** → **Environment Variables**
3. 두 변수 추가:

   | Name | Value | Environment |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hjloaykexetkqkgsjpnd.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (전체 JWT) | Production, Preview, Development |

4. **Save** 클릭
5. **Deployments** 탭 → 최신 배포 옆 ⋯ → **Redeploy** (환경변수 변경 반영)

---

## 완료 후 점검

- [ ] Supabase SQL Editor에서 schema 실행 완료
- [ ] Table Editor에 `stamps`, `settings` 보임 + RLS 활성화
- [ ] Storage에 `stamp-photos` bucket 보임
- [ ] Auth → URL Configuration에 Site URL + Redirect URLs 입력
- [ ] Auth → Email Provider 활성화
- [ ] 로컬 `.env.local` 생성
- [ ] Vercel Environment Variables 추가 + redeploy

여기까지 끝나면 Stage 4 (Auth UI) + Stage 5 (sync layer) 진행.
