'use client';

// app/auth/callback/page.tsx
// Phase 6 Stage 4 — magic-link callback handler.
//
// When the user clicks the link in the email, Supabase appends a token to
// the URL fragment (#access_token=... / #type=magiclink / #refresh_token=...).
// Because the supabase client was created with detectSessionInUrl: true,
// it parses this automatically on the first auth call after page load.
//
// This route does the bare minimum: wait one tick for session detection,
// then route the user to /settings/account (success) or /auth/login (failure).

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    // Give the supabase client a tick to consume the URL fragment.
    const tick = window.setTimeout(async () => {
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        router.replace('/settings/account?welcome=1');
      } else {
        // Likely an expired or already-consumed link.
        router.replace('/auth/login?error=invalid');
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(tick);
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <p className="font-handwriting text-2xl text-stamp-ink">로그인 중…</p>
      <p className="mt-3 text-sm text-stamp-ink/60">잠시만 기다려주세요</p>
    </main>
  );
}
