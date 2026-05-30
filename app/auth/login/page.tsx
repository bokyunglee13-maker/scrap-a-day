'use client';

// app/auth/login/page.tsx
// Phase 6 Stage 4 — magic-link login.
//
// Flow:
//   1. User enters email → signInWithOtp({ email })
//   2. Supabase sends an email containing a one-time link.
//   3. User clicks link → redirected to /auth/callback (registered in
//      Supabase Auth URL Configuration earlier).
//   4. detectSessionInUrl: true on the supabase client parses the URL,
//      establishes the session, and persists it to localStorage.
//
// No password ever stored on our side (ADR 0006 — magic link only).

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

function LoginInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  // Surface callback errors (?error=invalid means the link was bad/expired).
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'invalid') {
      toast.error('로그인 링크가 만료됐어요. 다시 발송해주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        // Where the magic link sends the user back.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);

    if (error) {
      toast.error(`이메일 발송 실패: ${error.message}`);
      return;
    }
    setSent(true);
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col px-4 py-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="설정으로"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          로그인
        </h1>
      </header>

      {sent ? (
        <section className="mt-12 text-center">
          <p className="font-handwriting text-3xl text-stamp-ink">
            이메일을 확인해주세요
          </p>
          <p className="mt-4 text-sm text-stamp-ink/70">
            <span className="font-medium">{email}</span>
            <br />
            로 보낸 로그인 링크를 클릭하면 자동으로 로그인돼요.
          </p>
          <p className="mt-3 text-xs text-stamp-ink/50">
            이메일이 안 보이면 스팸함도 확인해보세요.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="mt-8 text-sm text-stamp-ink/60 underline-offset-2 hover:underline"
          >
            다른 이메일로 다시 시도
          </button>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <p className="text-sm text-stamp-ink/70 leading-relaxed">
            이메일 주소로 로그인 링크를 보내드려요. 클릭만 하면 로그인 완료.
            비밀번호 입력 없어요.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-stamp-ink/50">
              이메일
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={sending}
              autoComplete="email"
              className="h-12 rounded-md border border-stamp-ink/20 bg-white px-3 text-base text-stamp-ink placeholder:text-stamp-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          </label>
          <Button
            type="submit"
            disabled={sending || !email.trim()}
            className="h-12 w-full text-base"
          >
            {sending ? '발송 중…' : '로그인 링크 받기'}
          </Button>
          <p className="mt-2 text-xs leading-relaxed text-stamp-ink/50">
            로그인하면 다른 기기 / 다른 브라우저에서도 같은 우표들을 볼 수
            있어요. 로그인 안 해도 이 기기에서는 그대로 사용 가능합니다.
          </p>
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10 text-center text-sm text-stamp-ink/50">
          로딩 중…
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
