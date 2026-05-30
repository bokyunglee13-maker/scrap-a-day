"use client";

// app/settings/page.tsx
// Phase 5 — Settings hub. Lists sub-routes + inline default stamp style picker.
// PRD §07 settings menu structure.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import { db } from "@/lib/db";
import { getSettings, updateSettings } from "@/lib/settings";
import { useUser } from "@/hooks/useUser";
import type { Settings, StampStyle } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Classic removed from the picker per user feedback. Existing stamps with
// style='classic' still render (back-compat); only new stamps are limited.
const STYLE_OPTIONS: Array<{ value: StampStyle; label: string }> = [
  { value: "minimal", label: "미니멀" },
  { value: "polaroid", label: "폴라로이드" },
];

export default function SettingsPage() {
  // Live trash count — useLiveQuery filters in JS (db.stamps can't index nullable deletedAt).
  const trashCount = useLiveQuery(
    async () => {
      const all = await db.stamps.toArray();
      return all.filter((s) => s.deletedAt !== null).length;
    },
    [],
    0,
  );

  const [settings, setSettings] = useState<Settings | null>(null);
  const [styleSaving, setStyleSaving] = useState(false);

  // Auth state — controls whether we show '계정' or '로그인' as the top row.
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getSettings();
      if (!cancelled && res.ok) setSettings(res.value);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStyleChange = async (value: string) => {
    const next = value as StampStyle;
    setStyleSaving(true);
    const res = await updateSettings({ defaultStyle: next });
    setStyleSaving(false);
    if (res.ok) {
      setSettings(res.value);
    } else {
      toast.error("저장 중 문제가 생겼어요");
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="홈으로"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          설정
        </h1>
      </header>

      <nav className="mt-6 divide-y divide-stamp-ink/10 rounded-sm border border-stamp-ink/10 bg-white/40">
        {/* Account row — '계정' when logged in (shows email), '로그인' otherwise.
            While auth is loading, render a neutral placeholder to avoid flash. */}
        {userLoading ? (
          <div className="flex h-14 items-center px-4 text-base text-stamp-ink/40">
            계정 확인 중…
          </div>
        ) : user ? (
          <SettingsRow
            href="/settings/account"
            label="계정"
            trailing={
              <span className="font-sans text-xs text-stamp-ink/50 max-w-[160px] truncate">
                {user.email}
              </span>
            }
          />
        ) : (
          <SettingsRow
            href="/auth/login"
            label="로그인"
            trailing={
              <span className="font-sans text-xs text-stamp-ink/40">
                다른 기기 동기화
              </span>
            }
          />
        )}

        <SettingsRow href="/search" label="검색" />
        <SettingsRow href="/settings/backup" label="백업" />
        <SettingsRow
          href="/settings/trash"
          label="휴지통"
          trailing={
            trashCount > 0 ? (
              <span className="font-sans text-sm text-stamp-ink/50">
                {trashCount}개
              </span>
            ) : null
          }
        />
        <SettingsRow href="/settings/usage" label="사용 통계" />
        <SettingsRow href="/settings/errors" label="에러 로그" />

        {/* Inline: default stamp style */}
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <span className="font-sans text-base text-stamp-ink">
            기본 우표 스타일
          </span>
          <Select
            value={settings?.defaultStyle ?? "minimal"}
            onValueChange={handleStyleChange}
            disabled={!settings || styleSaving}
          >
            <SelectTrigger className="h-10 min-w-28 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SettingsRow href="/settings/about" label="정보" />
      </nav>
    </main>
  );
}

function SettingsRow({
  href,
  label,
  trailing,
}: {
  href: string;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-14 items-center justify-between gap-3 px-4 text-stamp-ink hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:bg-stamp-ink/5"
    >
      <span className="font-sans text-base">{label}</span>
      <span className="flex items-center gap-2">
        {trailing}
        <ChevronRight className="size-4 text-stamp-ink/40" />
      </span>
    </Link>
  );
}
