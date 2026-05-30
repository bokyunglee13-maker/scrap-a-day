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
  companions?: string[]; // Phase 5+: 누구랑 함께한 날인지 (free-text tags)
  /**
   * If true, suppress the special-day sticker (e.g. carnation, balloon)
   * on THIS stamp even when the date matches a SpecialDay. User-controlled
   * per-stamp via the registration form and the detail page.
   * undefined or false = sticker shown (default).
   */
  hideSpecialDaySticker?: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Settings {
  id: 'default';
  defaultStyle: StampStyle;
  weekStart: 'monday';
  lastBackupAt: Date | null;
  /**
   * @deprecated Replaced by per-stamp `hideSpecialDaySticker` flag (more
   * intuitive than a global per-day list — user feedback). Field kept
   * to preserve existing data; new code path ignores it.
   */
  disabledSpecialDays?: string[];
  /**
   * App-wide background color (body + perforation fill). Any CSS color
   * string; user-chosen via /settings/background. Default = stamp-paper
   * '#FBEAF0' (the original brand pink) when undefined.
   * Applied to: body background + each stamp's perforation 'teeth' so
   * the bites read as the surrounding paper rather than as gaps.
   * NOT applied to the stamp's inner paper backdrop (kept brand pink
   * so the stamp itself stays the visual anchor on any background).
   */
  backgroundColor?: string;
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
