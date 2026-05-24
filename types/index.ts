// Scrap a Day — shared type definitions
// Phase 1.4: Stamp visual components only.
// Other domain types (Settings, ErrorLog, Usage, ...) belong to Phase 2.

export type Mood = 'joy' | 'calm' | 'serene' | 'blue' | 'flutter';

export type StampStyle = 'classic' | 'minimal' | 'polaroid';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface Stamp {
  id: string;
  date: string; // 'YYYY-MM-DD'
  photoBlob: Blob;
  crop: CropData;
  memo: string; // max 100 chars
  mood: Mood | null;
  moodVisible: boolean;
  style: StampStyle;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
