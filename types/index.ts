// Scrap a Day — shared type definitions
// Phase 1.4: Stamp visual components.
// Phase 2.1: Settings, ErrorLog, UsageDay (per PRD §09).

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
  photoBlob: Blob; // display blob (Phase 3+: cropped result)
  originalPhotoBlob?: Blob; // original (for Phase 4 re-crop); Phase 3 rows may lack this
  crop: CropData;
  memo: string; // max 100 chars
  mood: Mood | null;
  moodVisible: boolean;
  style: StampStyle;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Settings {
  id: 'default';
  defaultStyle: StampStyle;
  weekStart: 'monday';
  lastBackupAt: Date | null;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  source: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export interface UsageDay {
  date: string; // 'YYYY-MM-DD'
  visitedAt: Date;
  registeredStamps: number;
  failedAttempts: number;
}
