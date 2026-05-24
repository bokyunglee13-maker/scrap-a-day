import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// @serwist/next wires the service worker for offline / install-to-home support.
// swSrc is our source SW (app/sw.ts), swDest is the generated bundle that
// Next.js serves from public/.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // disable SW in dev — it confuses fast-refresh and IndexedDB inspection.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
