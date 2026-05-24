import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Crimson_Pro, Caveat } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorListeners } from "@/components/ErrorListeners";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
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
      className={`${notoSansKr.variable} ${crimsonPro.variable} ${caveat.variable} h-full antialiased`}
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
