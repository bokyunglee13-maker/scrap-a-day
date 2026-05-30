"use client";

// components/BackgroundProvider.tsx
// Reads the user's chosen backgroundColor from Settings and applies it
// to the document body + sets a CSS variable (--user-bg) that the stamp
// perforation overlays consume so the 'teeth' read as paper instead of
// gaps on whatever background the user picks.
//
// Mounted near the top of the tree in app/layout.tsx. Defaults to the
// brand pink (#FBEAF0) until Dexie returns settings, so SSR + first
// paint stay on-brand and any flash on color change is one frame.

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { DEFAULT_BACKGROUND_COLOR, getSettings } from "@/lib/settings";

export function BackgroundProvider() {
  const settingsResult = useLiveQuery(() => getSettings(), []);
  const bg =
    (settingsResult?.ok && settingsResult.value.backgroundColor) ||
    DEFAULT_BACKGROUND_COLOR;

  useEffect(() => {
    // body backgroundColor — catches mobile over-scroll bounce (iOS Safari)
    // which would otherwise show whatever the html element's bg is.
    document.body.style.backgroundColor = bg;
    // CSS variable — consumed by stamp perforation overlays via
    // style={{ fill: 'var(--user-bg, #FBEAF0)' }}.
    document.documentElement.style.setProperty("--user-bg", bg);
    return () => {
      document.body.style.backgroundColor = "";
      document.documentElement.style.removeProperty("--user-bg");
    };
  }, [bg]);

  return null;
}
