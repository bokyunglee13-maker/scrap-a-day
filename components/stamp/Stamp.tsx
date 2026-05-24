'use client';

// components/stamp/Stamp.tsx
// Router component — picks the right style implementation based on `stamp.style`.
// Re-exports EmptyStamp for convenience.

import type { Stamp as StampRecord } from '@/types';
import { StampClassic, type StampProps, type StampSize } from './StampClassic';
import { StampMinimal } from './StampMinimal';
import { StampPolaroid } from './StampPolaroid';

export { EmptyStamp } from './EmptyStamp';
export type { StampProps, StampSize };

export function Stamp(props: StampProps) {
  const style: StampRecord['style'] = props.stamp.style;
  switch (style) {
    case 'classic':
      return <StampClassic {...props} />;
    case 'polaroid':
      return <StampPolaroid {...props} />;
    case 'minimal':
    default:
      return <StampMinimal {...props} />;
  }
}
