"use client";

// components/ui/ColorPickerDialog.tsx
// Dialog wrapper around react-colorful (4KB HSV/HEX picker) so we can
// fully control the look — pastel slider handles, no jarring black
// initial state, no OS-specific quirks like Samsung Internet's native
// <input type="color"> ignoring our value prop.
//
// react-colorful renders a saturation/value square + a hue slider, all
// reactive. We add a small HEX text input below for direct entry.

import { useEffect, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Current committed color — used as the picker's starting value. */
  value: string;
  /** Fired when the user taps '적용'. NOT fired on every drag. */
  onApply: (next: string) => void;
}

export function ColorPickerDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: ColorPickerDialogProps) {
  // Local draft state — only commits to the parent on '적용'. Lets the
  // user fiddle with the slider without re-painting the entire app's
  // background on every micro-drag (would be both visually annoying and
  // a write storm to Dexie + Supabase sync).
  const [draft, setDraft] = useState<string>(value);

  // Re-sync the draft whenever the dialog opens fresh, so a re-open after
  // an external color change (preset tap, HEX input) starts at the new
  // committed value rather than the previous draft.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const handleApply = () => {
    onApply(draft.toUpperCase());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>색상 선택</DialogTitle>
        </DialogHeader>

        {/* react-colorful — saturation/value square on top, hue slider
            below. Custom CSS in globals.css repaints the slider handles
            in a pastel tone matching the app palette. */}
        <div className="flex flex-col items-center gap-3">
          <HexColorPicker
            color={draft}
            onChange={setDraft}
            className="!w-full"
          />

          {/* Hex text input + live swatch. Shows the current draft, lets
              the user type a value directly. HexColorInput auto-prefixes
              '#' and accepts 3- or 6-digit hex. */}
          <div className="flex w-full items-center gap-2">
            <div
              className="size-10 shrink-0 rounded-md border border-stamp-ink/20"
              style={{ backgroundColor: draft }}
              aria-hidden
            />
            <HexColorInput
              color={draft}
              onChange={setDraft}
              prefixed
              className="h-10 min-w-0 flex-1 rounded-md border border-stamp-ink/20 bg-white px-3 text-base text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button type="button" onClick={handleApply}>
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
