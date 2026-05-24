/// <reference lib="webworker" />
// app/sw.ts
// Service worker source — compiled by @serwist/next into public/sw.js at build.
//
// Behavior:
//   - Precaches the Next.js build output (JS, CSS, fonts).
//   - Uses serwist's defaultCache for runtime caching policies (images, etc).
//   - skipWaiting + clientsClaim: a new SW activates immediately on next load.
//   - This is the minimum that lets iOS / Android treat the site as installable
//     and protects 'already-viewed' stamps when offline. New-stamp registration
//     still works offline because IndexedDB is local.

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
