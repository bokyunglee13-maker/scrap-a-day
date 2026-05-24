"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

// Mounted once in the root layout. Catches errors that escape React
// (raw window errors, unhandled promise rejections from non-React code
// or async event handlers).

export function ErrorListeners(): null {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      void logError("unhandledrejection", event.reason);
    };
    const onError = (event: ErrorEvent) => {
      void logError("window.onerror", event.error ?? event.message);
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
  return null;
}
