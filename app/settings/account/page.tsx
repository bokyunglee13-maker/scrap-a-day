'use client';

// app/settings/account/page.tsx
// Phase 6 Stage 4 + 5.A — account view + manual sync trigger.
//
// Stage 5.A scope: user-initiated sync button + last-synced display. Stage
// 5.B will add auto-sync (on app load, after each CRUD) so this page
// becomes mostly informational.

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { getLastSyncedAt, syncAll, type SyncResult } from '@/lib/sync';

function AccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useUser();
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  // Welcome toast on first arrival from /auth/callback.
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      toast.success('로그인 됐어요');
      router.replace('/settings/account');
    }
  }, [searchParams, router]);

  // Auth guard.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  // Read the per-user last-synced watermark whenever the user resolves.
  useEffect(() => {
    if (!user) return;
    setLastSynced(getLastSyncedAt(user.id));
  }, [user]);

  const handleSync = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await syncAll(user.id);
      if (!result.ok) {
        toast.error(`동기화 실패: ${result.error}`);
        return;
      }
      const r = result.value;
      setLastResult(r);
      setLastSynced(getLastSyncedAt(user.id));
      if (r.failed === 0) {
        toast.success(
          r.pushed === 0 && r.pulled === 0
            ? '이미 최신 상태예요'
            : `동기화 완료 · 올림 ${r.pushed} · 받음 ${r.pulled}`,
        );
      } else {
        toast.warning(
          `일부 항목 실패 · 올림 ${r.pushed} · 받음 ${r.pulled} · 실패 ${r.failed}`,
        );
      }
    } catch (e) {
      toast.error('동기화 중 문제가 생겼어요');
      // eslint-disable-next-line no-console
      console.error('manual sync failed', e);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('로그아웃 됐어요');
    router.replace('/settings');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center text-sm text-stamp-ink/50">
        로딩 중…
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="설정으로"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          계정
        </h1>
      </header>

      <section className="mt-6 space-y-4">
        <div className="rounded-md border border-stamp-ink/10 bg-white/40 p-4">
          <p className="text-sm font-medium text-stamp-ink/60">
            이메일
          </p>
          <p className="mt-1 break-all text-base text-stamp-ink">{user.email}</p>
        </div>

        <div className="rounded-md border border-stamp-ink/10 bg-white/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-stamp-ink/60">
                동기화
              </p>
              <p className="mt-1 text-sm text-stamp-ink">
                {lastSynced
                  ? `마지막 동기화: ${formatDistanceToNow(lastSynced, { locale: ko, addSuffix: true })}`
                  : '아직 동기화된 적이 없어요'}
              </p>
              {lastSynced && (
                <p className="mt-1 text-xs text-stamp-ink/40">
                  {format(lastSynced, 'yyyy-MM-dd HH:mm', { locale: ko })}
                </p>
              )}
              {lastResult && (
                <p className="mt-2 text-xs text-stamp-ink/60">
                  방금 동기화: 올림 {lastResult.pushed} · 받음 {lastResult.pulled}
                  {lastResult.skipped > 0 ? ` · 건너뜀 ${lastResult.skipped}` : ''}
                  {lastResult.failed > 0 ? ` · 실패 ${lastResult.failed}` : ''}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="h-10 gap-1.5"
              aria-label="지금 동기화"
            >
              <RefreshCw
                className={`size-3.5 ${syncing ? 'animate-spin' : ''}`}
              />
              {syncing ? '동기화 중…' : '지금 동기화'}
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="h-12 w-full"
        >
          로그아웃
        </Button>

        <p className="text-xs leading-relaxed text-stamp-ink/50">
          로그아웃해도 이 기기의 우표들은 그대로 남아있어요. 다시 로그인하면
          서버에 백업된 우표들이 자동으로 합쳐집니다.
        </p>
      </section>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10 text-center text-sm text-stamp-ink/50">
          로딩 중…
        </main>
      }
    >
      <AccountInner />
    </Suspense>
  );
}
