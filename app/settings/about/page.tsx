"use client";

// app/settings/about/page.tsx
// Phase 5 — About / version page.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const APP_VERSION = "0.1.0 (MVP)";

export default function AboutPage() {
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
          정보
        </h1>
      </header>

      <section className="mt-8 text-center">
        <h2 className="font-serif text-2xl font-medium text-stamp-ink">
          Scrap a Day
        </h2>
        <p className="mt-2 font-sans text-sm text-stamp-ink/70">
          우표 한 장으로 하루를 기록하는 미니멀 비주얼 다이어리
        </p>
        <p className="mt-3 font-mono text-xs text-stamp-ink/50">
          v{APP_VERSION}
        </p>
      </section>

      <section className="mt-8 rounded-sm border border-stamp-ink/10 bg-white/40 p-4 text-center">
        <p className="font-sans text-sm text-stamp-ink/70">
          데이터는 이 기기에 먼저 저장됩니다.
          <br />
          로그인하면 본인 계정으로 안전하게 백업돼요.
        </p>
        <p className="mt-2 font-sans text-xs text-stamp-ink/50">
          외부 분석/추적 도구는 사용하지 않아요.
        </p>
      </section>

      <section className="mt-6 text-center">
        <a
          href="https://github.com/bokyunglee13-maker/scrap-a-day"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center font-sans text-sm text-stamp-ink/60 underline underline-offset-4 hover:text-stamp-ink"
        >
          GitHub
        </a>
      </section>

      <p className="mt-12 text-center font-sans text-xs text-stamp-ink/40">
        © {new Date().getFullYear()} Scrap a Day
      </p>
    </main>
  );
}
