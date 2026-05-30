import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorListeners } from "@/components/ErrorListeners";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Paperlogy — the SOLE font face across the app (user preference, post-Phase 6).
// Three weights loaded (Regular / Medium / Bold) to cover the design system's
// needs while keeping the payload modest (~4MB total in .ttf — .woff2 would
// compress further, future polish).
//
// Previously we also loaded Crimson Pro (--font-crimson, was used by
// font-serif) and Caveat (--font-caveat, was used by font-handwriting). Both
// are now aliased to Paperlogy in globals.css @theme, so the Google Fonts
// imports were deadweight on first paint (~150-200KB). Removed.
const paperlogy = localFont({
  variable: "--font-paperlogy",
  display: "swap",
  src: [
    { path: "../public/fonts/paperlogy/Paperlogy-4Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/paperlogy/Paperlogy-5Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/paperlogy/Paperlogy-7Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Scrap a Day",
  description: "우표 한 장으로 하루를 기록하는 미니멀 비주얼 다이어리",
  applicationName: "Scrap a Day",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scrap a Day",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  // viewport-fit=cover lets safe-area-inset-* see the real iOS notch/home insets
  // so our pb-[env(safe-area-inset-bottom)] body padding actually works.
  viewportFit: "cover",
  themeColor: "#FBEAF0",
  initialScale: 1,
  maximumScale: 1, // disable user pinch-zoom on chrome (per-app feel; cropper still pinches)
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${paperlogy.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-stamp-paper text-stamp-ink"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <ErrorListeners />
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
