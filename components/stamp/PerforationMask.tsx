// components/stamp/PerforationMask.tsx
// Reusable SVG <defs><mask>...</mask></defs> fragment for stamp perforation.
// Returns only the <defs> element — caller embeds it inside their own <svg>.

import {
  getClassicPerforationPath,
  getMinimalPerforationPath,
  type PerforationVariant,
} from '@/lib/perforation';

export interface PerforationMaskProps {
  id: string;
  variant: PerforationVariant;
  width: number;
  height: number;
}

export function PerforationMask({
  id,
  variant,
  width,
  height,
}: PerforationMaskProps) {
  const d =
    variant === 'classic'
      ? getClassicPerforationPath(width, height)
      : getMinimalPerforationPath(width, height);

  return (
    <defs>
      <mask id={id} maskUnits="userSpaceOnUse">
        {/* Fill rule evenodd → the rectangle is "on" (white = visible),
            while the tooth circles cut through it to become transparent. */}
        <path d={d} fill="white" fillRule="evenodd" />
      </mask>
    </defs>
  );
}
