'use client';

// hooks/useAutoSync.ts
// Phase 6 Stage 5.B + 5.C — automatic background sync.
//
// Triggers:
//   - Mount (with a logged-in user): initial syncAll.
//   - dexie hooks (creating/updating/deleting): debounced sync after 2s
//     of quiet, so rapid-fire CRUD coalesces into one cycle.
//   - window 'online' event (Stage 5.C): bypasses debounce — reconnection
//     is a strong signal that the network just came back, so we sync
//     immediately rather than wait.
//
// First-sync UX (Stage 5.C):
//   - If lastSyncedAt is null at cycle start, show a loading toast.
//   - After the cycle, replace it with a contextual success message:
//     * pushed > 0, pulled == 0 → '첫 백업 완료' (existing local → server)
//     * pulled > 0, pushed == 0 → '서버에서 우표 N개 받았어요' (new device)
//     * both     → 'X 올림 · Y 받음'
//   - Empty first sync (no local data, nothing on server) → silent.
//
// Logged-out users get a complete no-op (no Supabase calls, no listeners).

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/db';
import { getLastSyncedAt, syncAll } from '@/lib/sync';

const DEBOUNCE_MS = 2000;
const FIRST_SYNC_TOAST_ID = 'first-sync-loading';

export function useAutoSync(): void {
  const { user, loading } = useUser();
  const debounceRef = useRef<number | null>(null);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    if (loading || !user) return;
    const userId = user.id;

    const runSync = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      // Decide whether to show migration UX BEFORE the cycle runs (the
      // watermark is bumped during sync, so checking after would always
      // read 'not first').
      const wasFirstSync = getLastSyncedAt(userId) === null;
      if (wasFirstSync) {
        toast.loading('첫 동기화 중…', {
          id: FIRST_SYNC_TOAST_ID,
          duration: 60_000, // safety cap; dismissed manually below
        });
      }

      try {
        const result = await syncAll(userId);
        if (!wasFirstSync) return;

        // First-sync follow-up toast.
        toast.dismiss(FIRST_SYNC_TOAST_ID);
        if (!result.ok) {
          toast.error('첫 동기화에 문제가 생겼어요');
          return;
        }
        const { pushed, pulled, failed } = result.value;
        if (pushed === 0 && pulled === 0) {
          // Truly empty account — no toast (nothing happened).
          return;
        }
        if (failed > 0) {
          toast.warning(
            `첫 동기화 일부 실패 · 올림 ${pushed} · 받음 ${pulled} · 실패 ${failed}`,
          );
          return;
        }
        if (pushed > 0 && pulled === 0) {
          toast.success(`첫 백업 완료 · 우표 ${pushed}개를 서버에 저장했어요`);
        } else if (pulled > 0 && pushed === 0) {
          toast.success(`다른 기기 우표 ${pulled}개를 가져왔어요`);
        } else {
          toast.success(`동기화 완료 · 올림 ${pushed} · 받음 ${pulled}`);
        }
      } catch {
        // syncAll never throws, but if it somehow does, kill the loader.
        toast.dismiss(FIRST_SYNC_TOAST_ID);
      } finally {
        inFlightRef.current = false;
      }
    };

    // Initial sync on mount.
    void runSync();

    const scheduleSync = () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        void runSync();
      }, DEBOUNCE_MS);
    };

    // 'online' event → bypass debounce. Reconnection after airplane mode,
    // subway tunnel, etc. — the user just came back online; sync now.
    const handleOnline = () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void runSync();
    };

    // dexie hook listeners — only care that *something* changed.
    const onCreating = () => scheduleSync();
    const onUpdating = () => scheduleSync();
    const onDeleting = () => scheduleSync();

    window.addEventListener('online', handleOnline);
    db.stamps.hook('creating', onCreating);
    db.stamps.hook('updating', onUpdating);
    db.stamps.hook('deleting', onDeleting);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      window.removeEventListener('online', handleOnline);
      db.stamps.hook('creating').unsubscribe(onCreating);
      db.stamps.hook('updating').unsubscribe(onUpdating);
      db.stamps.hook('deleting').unsubscribe(onDeleting);
    };
  }, [user, loading]);
}
