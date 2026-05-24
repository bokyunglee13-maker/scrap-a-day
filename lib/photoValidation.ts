// lib/photoValidation.ts
// Pre-upload validation per PRD §05 step 1 and §11 §9.2.2.
// Pure: no IO, no DOM. Strings are user-facing per PRD §10 §5.2.

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface PhotoValidationError {
  code: 'TOO_LARGE' | 'UNSUPPORTED_FORMAT';
  message: string;
}

/**
 * Returns null when the file is acceptable, or a structured error otherwise.
 * HEIC and other formats commonly arrive as `application/octet-stream`; anything
 * outside the allowlist is rejected.
 */
export function validatePhotoFile(file: File): PhotoValidationError | null {
  if (file.size > MAX_BYTES) {
    return {
      code: 'TOO_LARGE',
      message: '더 작은 사진을 선택해주세요 (최대 20MB)',
    };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      code: 'UNSUPPORTED_FORMAT',
      message: 'JPEG 또는 PNG 사진을 선택해주세요',
    };
  }
  return null;
}
