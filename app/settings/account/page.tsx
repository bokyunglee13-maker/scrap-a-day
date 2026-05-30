'use client';

// app/settings/account/page.tsx
// Phase 6 Stage 4 — account view + sign-out.
//
// Auth guard: if not logged in, redirect to /auth/login. Loading state held
// while the session is read (useUser handles the timing).
//
// Sync status section is a placeholder until Stage 5 (real sync layer)
// lands — keeps the UI shape stable so adding sync state later is purely
// additive.

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

function AccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useUser();

  // Welcome toast on first arrival from /auth/callback.
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      toast.success('로그인 됐어요');
      // Clean the param so reload doesn't re-toast.
      router.replace('/settings/account');
    }
  }, [searchParams, router]);

  // Auth guard.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

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
  if (!user) {
    // Redirect in flight — render nothing rather than flash content.
    return null;
  }

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
          <p className="text-xs uppercase tracking-wide text-stamp-ink/50">
            이메일
          </p>
          <p className="mt-1 break-all text-base text-stamp-ink">{user.email}</p>
        </div>

        <div className="rounded-md border border-stamp-ink/10 bg-white/40 p-4">
          <p className="text-xs uppercase tracking-wide text-stamp-ink/50">
            동기화
          </p>
          <p className="mt-1 text-sm text-stamp-ink/70">
            ⏳ 자동 동기화는 곧 활성화돼요 (Phase 6 Stage 5).
          </p>
          <p className="mt-2 text-xs text-stamp-ink/50">
            지금은 로그인 상태만 유지되고, 데이터는 여전히 이 기기에 저장돼요.
          </p>
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
          (Stage 5 이후) 서버와 자동으로 동기화됩니다.
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
