'use client';

// hooks/useUser.ts
// Phase 6 Stage 4 — current Supabase user + sign-out helper.
//
// On mount:
//   1. Read existing session (survives tab close via localStorage persist).
//   2. Subscribe to auth state changes so the UI updates on login/logout
//      from any tab (Supabase broadcasts via BroadcastChannel).
//
// `loading` is true until the first session read returns — components
// should not redirect on absent-user until loading is false (otherwise
// a brief flash before session loads would incorrectly bounce).

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';

interface UseUserResult {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    // Initial session check.
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Live subscription. Fires on sign-in, sign-out, token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signOut };
}
