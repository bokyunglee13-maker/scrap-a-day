"use client";

// components/pwa/InstallBanner.tsx
// Phase 5 — "Add to home screen" banner. PRD §15.5.1 — primary mitigation for
// iOS Safari's 7-day ITP IndexedDB purge: installed PWAs are exempt.
//
// Hidden when:
//   - The site is already running in standalone display mode (installed), OR
//   - The user dismissed the banner (localStorage flag).

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISS_KEY = "install-banner-dismissed";

export function InstallBanner() {
  // 'hidden' on the server; resolved after mount so SSR/CSR match without flash.
  const [visible, setVisible] = useState<boolean>(false);
  const [howOpen, setHowOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Standalone = installed PWA (iOS + Android both expose this).
      const standalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      if (standalone) return;

      // Legacy iOS Safari uses navigator.standalone.
      const iosStandalone =
        typeof navigator !== "undefined" &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (iosStandalone) return;

      const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
      if (dismissed) return;

      setVisible(true);
    } catch {
      // localStorage blocked (private mode, etc.) — fall back to showing the
      // banner; the dismiss button just won't persist across reloads.
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — banner still hides for this session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="mx-auto mt-3 max-w-md px-4">
        <div className="relative rounded-sm border border-stamp-ink/15 bg-white/60 p-3 pr-10">
          <p className="font-sans text-sm font-medium text-stamp-ink">
            홈 화면에 추가하면 데이터가 더 안전해요
          </p>
          <p className="mt-1 font-sans text-xs text-stamp-ink/60">
            iOS Safari는 7일 미방문 시 데이터를 자동 삭제할 수 있어요. 홈 화면
            설치 시 보호됩니다.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setHowOpen(true)}
            >
              방법 보기
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={handleDismiss}
            >
              닫기
            </Button>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="absolute right-1 top-1 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/50 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={howOpen} onOpenChange={setHowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>홈 화면에 추가하는 방법</DialogTitle>
            <DialogDescription>
              아래 단계로 앱을 홈 화면에 추가할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-sans font-medium text-stamp-ink">
                iOS Safari
              </p>
              <p className="mt-1 font-sans text-stamp-ink/70">
                공유 버튼 → 홈 화면에 추가
              </p>
            </div>
            <div>
              <p className="font-sans font-medium text-stamp-ink">
                Android Chrome
              </p>
              <p className="mt-1 font-sans text-stamp-ink/70">
                주소창의 설치 버튼 또는 메뉴 → 앱 설치
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
