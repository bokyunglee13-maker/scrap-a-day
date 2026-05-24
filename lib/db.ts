// lib/db.ts
// Dexie instance + schema per PRD §09.
//
// SSR safety:
//   Dexie's constructor calls `indexedDB.open(...)` synchronously. On the Next.js
//   server (build-time prerender, route handlers, RSC), `indexedDB` is undefined
//   and instantiating Dexie throws `ReferenceError: indexedDB is not defined`.
//
//   We expose `db` as a module-level Proxy. The underlying `ScrapADayDB` is
//   constructed lazily on first property access, but only ever happens inside
//   code paths that run on the client (hooks use `'use client'`, CRUD modules
//   are called from client components). If a server-rendered module merely
//   imports `db`, no construction happens until something touches a property.
//
//   `getDb()` is also exported for callers that prefer to fail loud on the
//   server rather than rely on the proxy.

import Dexie, { type Table } from 'dexie';
import type { Stamp, Settings, ErrorLog, UsageDay } from '@/types';

export class ScrapADayDB extends Dexie {
  stamps!: Table<Stamp, string>;
  settings!: Table<Settings, string>;
  errors!: Table<ErrorLog, string>;
  usage!: Table<UsageDay, string>;

  constructor() {
    super('ScrapADay');
    this.version(1).stores({
      stamps: 'id, date, deletedAt',
      settings: 'id',
      errors: 'id, timestamp',
      usage: 'date',
    });
  }
}

let _instance: ScrapADayDB | null = null;

/**
 * Construct (or return cached) Dexie instance. Throws on the server.
 * Prefer the `db` proxy below for hook ergonomics.
 */
export function getDb(): ScrapADayDB {
  if (typeof indexedDB === 'undefined') {
    throw new Error(
      'IndexedDB is not available. lib/db.ts must only be touched on the client.',
    );
  }
  if (!_instance) {
    _instance = new ScrapADayDB();
  }
  return _instance;
}

/**
 * Lazy proxy. Importing this module on the server is safe — Dexie is only
 * constructed when a property is read AND we are on the client.
 *
 * Hooks just do `import { db } from '@/lib/db'` and use `db.stamps...` as if
 * it were a plain Dexie instance. The proxy forwards every access to the
 * lazily-constructed real instance.
 */
export const db: ScrapADayDB = new Proxy({} as ScrapADayDB, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    // Bind methods so `this` stays correct.
    if (typeof value === 'function') {
      return value.bind(real);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getDb(), prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getDb());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDb(), prop);
  },
});
