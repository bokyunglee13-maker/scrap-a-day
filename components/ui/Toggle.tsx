"use client";

// components/ui/Toggle.tsx
// Hand-rolled on/off toggle. Avoided shadcn Switch to keep the dep set
// flat (one screen used it; not worth pulling). Tap target is the
// surrounding label area — the visible switch is 48×28, well above
// touch minimums.

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-stamp-ink" : "bg-stamp-ink/20",
      )}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
