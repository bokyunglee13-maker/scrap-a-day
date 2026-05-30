-- docs/supabase-schema.sql
-- Phase 6 — Supabase 스키마 초기 마이그레이션 (ADR 0006).
--
-- 실행 방법:
--   1. Supabase Dashboard → 좌측 사이드바 → SQL Editor → 'New query'
--   2. 이 파일 전체를 복사해서 붙여넣기
--   3. 우상단 'Run' 클릭
--   4. 'Success. No rows returned' 보이면 완료
--
-- 멱등성: 모든 statement는 IF NOT EXISTS 또는 OR REPLACE라 여러 번 실행해도 안전.
--
-- 데이터 모델 매핑 (IndexedDB ↔ Postgres):
--   - photoBlob / originalPhotoBlob → Storage bucket 'stamp-photos'에 path로 저장
--   - 기타 필드는 column에 직접 매핑
--   - companions: TEXT[] (Postgres 배열)
--   - crop: JSONB (구조화된 객체)
--
-- 사용자 격리: 모든 테이블 RLS 활성화 + auth.uid() = user_id 정책

------------------------------------------------------------
-- 1. STAMPS 테이블
------------------------------------------------------------

create table if not exists public.stamps (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- IndexedDB Stamp 미러
  date text not null,                       -- 'YYYY-MM-DD'
  memo text not null default '',
  mood text check (mood in ('joy','calm','serene','blue','flutter')),
  mood_visible boolean not null default true,
  style text not null check (style in ('classic','minimal','polaroid')),
  companions text[] not null default '{}',
  crop_data jsonb not null,                 -- { x, y, width, height, zoom }

  -- Storage path (실제 사진은 storage bucket에)
  photo_path text,                          -- 'stamp-photos/{user_id}/{id}-cropped.jpg'
  original_photo_path text,                 -- 'stamp-photos/{user_id}/{id}-original.jpg'

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,                   -- 휴지통 (소프트 삭제)
  synced_at timestamptz not null default now()
);

-- Date 범위 쿼리 + 휴지통 필터 + 변경 감지에 사용
create index if not exists stamps_user_date_idx
  on public.stamps (user_id, date);

create index if not exists stamps_user_updated_idx
  on public.stamps (user_id, updated_at desc);

------------------------------------------------------------
-- 2. SETTINGS 테이블 (user당 1행)
------------------------------------------------------------

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_style text not null default 'minimal'
    check (default_style in ('classic','minimal','polaroid')),
  week_start text not null default 'monday',
  last_backup_at timestamptz,
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- 3. ROW LEVEL SECURITY — 모든 테이블에 자기 데이터만 접근 가능
------------------------------------------------------------

alter table public.stamps enable row level security;
alter table public.settings enable row level security;

-- STAMPS: 4가지 CRUD 정책
drop policy if exists "stamps_select_own" on public.stamps;
create policy "stamps_select_own"
  on public.stamps for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "stamps_insert_own" on public.stamps;
create policy "stamps_insert_own"
  on public.stamps for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "stamps_update_own" on public.stamps;
create policy "stamps_update_own"
  on public.stamps for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "stamps_delete_own" on public.stamps;
create policy "stamps_delete_own"
  on public.stamps for delete
  to authenticated
  using (auth.uid() = user_id);

-- SETTINGS: 단일 정책으로 4가지 모두
drop policy if exists "settings_all_own" on public.settings;
create policy "settings_all_own"
  on public.settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- 4. STORAGE BUCKET (사진 저장)
------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stamp-photos',
  'stamp-photos',
  false,                                    -- private; signed URL로만 접근
  20 * 1024 * 1024,                         -- 20MB 제한 (PRD §05 §3.2 사전 검증과 일치)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: 사용자별 폴더 격리. 경로 첫 segment가 자기 user_id여야만 접근.
drop policy if exists "stamp_photos_select_own" on storage.objects;
create policy "stamp_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stamp_photos_insert_own" on storage.objects;
create policy "stamp_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stamp_photos_update_own" on storage.objects;
create policy "stamp_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stamp_photos_delete_own" on storage.objects;
create policy "stamp_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

------------------------------------------------------------
-- 5. (선택) updated_at 자동 갱신 트리거 — Stage 5에서 클라이언트가
--    직접 updated_at을 보내지만, 트리거가 한 번 더 강제하면 안전망.
------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stamps_touch_updated_at on public.stamps;
create trigger stamps_touch_updated_at
  before update on public.stamps
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

------------------------------------------------------------
-- 완료. 'Run' 결과로 Success 메시지가 나오면 OK.
-- 다음 단계: 클라이언트(lib/supabase.ts + sync 레이어)에서 이 스키마를 사용.
------------------------------------------------------------
