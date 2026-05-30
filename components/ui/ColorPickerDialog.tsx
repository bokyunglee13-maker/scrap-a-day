"use client";

// components/ui/ColorPickerDialog.tsx
// Dialog wrapper around react-colorful (4KB HSV/HEX picker). All inner
// content is wrapped in a single w-full overflow-hidden container so
// the picker can't spill past the dialog edge on narrow phones — the
// shadcn DialogContent's default grid layout was letting children
// compute their own width independently of the dialog's max-w, which
// caused the saturation rectangle and footer buttons to extend past
// the visible dialog box.

import { useEffect, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  value: string;
  onApply: (next: string) => void;
}

export function ColorPickerDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: ColorPickerDialogProps) {
  const [draft, setDraft] = useState<string>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const handleApply = () => {
    onApply(draft.toUpperCase());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* p-0 strips shadcn's default p-6 so we can apply padding inside
          a single overflow-hidden container — this guarantees every
          child (including react-colorful's internally-positioned
          rectangles) honors the dialog's width. */}
      <DialogContent
        className="box-border w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-sm"
      >
        <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden p-5">
          <h2 className="text-base font-medium text-stamp-ink">색상 선택</h2>

          {/* Picker — width: 100% in globals.css, but we wrap in an
              extra w-full min-w-0 to make absolutely sure flex doesn't
              let it grow past its cell. */}
          <div className="w-full min-w-0 overflow-hidden">
            <HexColorPicker color={draft} onChange={setDraft} />
          </div>

          {/* Swatch + HEX input — min-w-0 on input so flex shrinks it
              past its natural content width. */}
          <div className="flex w-full min-w-0 items-center gap-2">
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

          {/* Footer — explicit flex-row + full-width gap so both buttons
              share the row and never stretch past the dialog. Avoid
              shadcn's DialogFooter (default is flex-col-reverse on
              mobile, which stacks the buttons and made them appear to
              'overflow' below). */}
          <div className="flex w-full min-w-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="button" onClick={handleApply} className="flex-1">
              적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
