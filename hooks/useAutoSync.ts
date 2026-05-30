'use client';

// hooks/useAutoSync.ts
// Phase 6 Stage 5.B — automatic background sync.
//
// Behavior:
//   - On mount (with a logged-in user): run an initial syncAll.
//   - Subscribe to db.stamps creating/updating/deleting hooks. Each event
//     resets a debounce timer; when it fires after DEBOUNCE_MS of quiet,
//     a syncAll runs.
//   - Overlapping triggers are coalesced — only one sync runs at a time.
//
// Logged-out users get a complete no-op (no Supabase calls, no listeners).
// CRUD code paths (lib/stamps.ts etc.) stay unchanged: their writes hit
// IndexedDB, dexie's hooks fire, the auto-sync hears them and reconciles
// with the server.

import { useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/db';
import { syncAll } from '@/lib/sync';

const DEBOUNCE_MS = 2000;

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
      try {
        await syncAll(userId);
      } catch {
        // syncAll never throws (Result<T>); swallow defensively.
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

    // Dexie hook listeners. Each receives event-specific arguments we
    // don't need — we only care that *something* changed.
    const onCreating = () => scheduleSync();
    const onUpdating = () => scheduleSync();
    const onDeleting = () => scheduleSync();

    db.stamps.hook('creating', onCreating);
    db.stamps.hook('updating', onUpdating);
    db.stamps.hook('deleting', onDeleting);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      db.stamps.hook('creating').unsubscribe(onCreating);
      db.stamps.hook('updating').unsubscribe(onUpdating);
      db.stamps.hook('deleting').unsubscribe(onDeleting);
    };
  }, [user, loading]);
}
