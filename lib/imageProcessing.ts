// lib/imageProcessing.ts
// Canvas-based crop extraction.
//
// Phase 3 chose to store the CROPPED blob (not original) as photoBlob. The
// crop math then "just works" — stamps display the blob with a plain
// object-cover and the user's exact selection is preserved at any display
// size.
//
// Tradeoff: re-cropping later (Phase 4 PRD §06 §3.4 allows crop edits)
// will need the original. When that lands, the data model gains an
// `originalPhotoBlob` field and editStamp lets us re-extract. For Phase 3,
// the cropped blob is the only thing we keep.

export interface CropPixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function extractCroppedBlob(
  sourceBlob: Blob,
  pixelArea: CropPixelArea,
  options?: { quality?: number; type?: string },
): Promise<Blob> {
  // Guard: if the cropper never fired onCropComplete, pixelArea is zeros.
  // Returning the source unchanged would store the full uncropped image,
  // which is worse than nothing — surface as an error so the caller can
  // re-prompt.
  if (
    pixelArea.width <= 0 ||
    pixelArea.height <= 0 ||
    !Number.isFinite(pixelArea.width) ||
    !Number.isFinite(pixelArea.height)
  ) {
    throw new Error("INVALID_CROP_AREA");
  }

  const url = URL.createObjectURL(sourceBlob);
  try {
    const img = await loadImage(url);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(pixelArea.width);
    canvas.height = Math.round(pixelArea.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.drawImage(
      img,
      pixelArea.x,
      pixelArea.y,
      pixelArea.width,
      pixelArea.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const outType = options?.type ?? "image/jpeg";
    const quality = options?.quality ?? 0.9;

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("CANVAS_TO_BLOB_FAILED"));
        },
        outType,
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = src;
  });
}
