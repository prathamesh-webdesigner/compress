// Core client-side image compression engine.
// Designed to run either inside a Web Worker (using OffscreenCanvas) or on the
// main thread (using a regular <canvas> element) so the same logic can be used
// as a graceful-degradation fallback when Web Workers / OffscreenCanvas aren't
// available.

export type ProgressStage =
  | "analyzing"
  | "searching"
  | "optimizing"
  | "finalizing";

export interface CompressImageOptions {
  targetBytes: number;
  outputFormat: "keep" | "jpeg" | "png" | "webp";
  originalMime: string;
  hasTransparency: boolean;
  minDimension?: number; // floor for width/height reduction, default 64
  onProgress?: (stage: ProgressStage) => void;
}

export interface CompressImageResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  qualityUsed: number | null;
  metTarget: boolean;
  formatChanged: boolean;
  dimensionsChanged: boolean;
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function getCtx(canvas: CanvasLike): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = (canvas as HTMLCanvasElement).getContext("2d");
  if (!ctx) throw new Error("Could not acquire a 2D canvas context.");
  return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

async function canvasToBlob(canvas: CanvasLike, type: string, quality?: number): Promise<Blob> {
  if (typeof (canvas as OffscreenCanvas).convertToBlob === "function") {
    return (canvas as OffscreenCanvas).convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas encoding failed."))),
      type,
      quality
    );
  });
}

function drawScaled(bitmap: ImageBitmap, width: number, height: number, fillWhite: boolean): CanvasLike {
  const canvas = makeCanvas(width, height);
  const ctx = getCtx(canvas);
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

/**
 * Binary-searches the encoder quality for a given canvas size and mime type
 * to find the highest quality whose output size is <= targetBytes.
 * Returns null if even the lowest quality setting can't fit the target.
 */
async function bestQualityForSize(
  canvas: CanvasLike,
  mime: string,
  targetBytes: number
): Promise<{ blob: Blob; quality: number } | null> {
  let lo = 0.02;
  let hi = 0.97;
  let best: { blob: Blob; quality: number } | null = null;

  // Check the top end first as a fast path.
  const highBlob = await canvasToBlob(canvas, mime, hi);
  if (highBlob.size <= targetBytes) {
    return { blob: highBlob, quality: hi };
  }

  const lowBlob = await canvasToBlob(canvas, mime, lo);
  if (lowBlob.size > targetBytes) {
    // Even the lowest quality doesn't fit at this resolution.
    return null;
  }
  best = { blob: lowBlob, quality: lo };

  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, mime, mid);
    if (blob.size <= targetBytes) {
      if (!best || blob.size > best.blob.size) {
        best = { blob, quality: mid };
      }
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

export async function decodeImage(file: Blob): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

/**
 * Detects transparency by sampling the alpha channel of a downscaled copy of
 * the image (fast, approximate, sufficient for a format decision).
 */
export async function detectTransparency(bitmap: ImageBitmap): Promise<boolean> {
  const sampleSize = 64;
  const w = Math.min(sampleSize, bitmap.width);
  const h = Math.min(sampleSize, bitmap.height);
  const canvas = makeCanvas(w, h);
  const ctx = getCtx(canvas);
  ctx.drawImage(bitmap, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

const MIME_FOR_FORMAT: Record<"jpeg" | "png" | "webp", string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function compressImageToTarget(
  file: Blob,
  opts: CompressImageOptions
): Promise<CompressImageResult> {
  const { targetBytes, outputFormat, hasTransparency, onProgress } = opts;
  const minDimension = opts.minDimension ?? 64;

  onProgress?.("analyzing");
  const { bitmap, width: originalWidth, height: originalHeight } = await decodeImage(file);

  // Decide the working output format.
  let format: "jpeg" | "png" | "webp";
  let formatChanged = false;
  if (outputFormat === "jpeg" || outputFormat === "png" || outputFormat === "webp") {
    format = outputFormat;
    formatChanged = MIME_FOR_FORMAT[format] !== opts.originalMime;
  } else {
    // "keep": preserve original type unless it's PNG with no transparency,
    // in which case JPEG generally compresses far better with no downside.
    if (opts.originalMime === "image/png" && !hasTransparency) {
      format = "jpeg";
      formatChanged = true;
    } else if (opts.originalMime === "image/webp") {
      format = "webp";
      formatChanged = false;
    } else if (opts.originalMime === "image/png") {
      format = "png";
      formatChanged = false;
    } else {
      format = "jpeg";
      formatChanged = false;
    }
  }
  const mime = MIME_FOR_FORMAT[format];
  const fillWhite = format === "jpeg"; // no alpha support

  onProgress?.("searching");

  let width = originalWidth;
  let height = originalHeight;
  let dimensionsChanged = false;

  // PNG can't be quality-tuned by the canvas API, so if a PNG target can't be
  // met at full size, we shrink dimensions directly (and, if the caller left
  // the format as "keep" and PNG truly can't reach the target, fall back to
  // WebP which supports both transparency and quality compression).
  if (format === "png") {
    let canvas = drawScaled(bitmap, width, height, false);
    let blob = await canvasToBlob(canvas, mime);
    let attempts = 0;
    while (blob.size > targetBytes && Math.min(width, height) > minDimension && attempts < 12) {
      onProgress?.("optimizing");
      width = Math.max(minDimension, Math.round(width * 0.85));
      height = Math.max(minDimension, Math.round(height * 0.85));
      dimensionsChanged = true;
      canvas = drawScaled(bitmap, width, height, false);
      blob = await canvasToBlob(canvas, mime);
      attempts++;
    }

    if (blob.size > targetBytes && outputFormat === "keep") {
      // Fall back to WebP, which preserves transparency but supports quality tuning.
      onProgress?.("optimizing");
      width = originalWidth;
      height = originalHeight;
      dimensionsChanged = false;
      const webpResult = await encodeWithQualitySearch(bitmap, "image/webp", false, targetBytes, originalWidth, originalHeight, minDimension, onProgress);
      onProgress?.("finalizing");
      return {
        blob: webpResult.blob,
        mimeType: "image/webp",
        width: webpResult.width,
        height: webpResult.height,
        originalWidth,
        originalHeight,
        qualityUsed: webpResult.quality,
        metTarget: webpResult.blob.size <= targetBytes,
        formatChanged: true,
        dimensionsChanged: webpResult.width !== originalWidth || webpResult.height !== originalHeight,
      };
    }

    onProgress?.("finalizing");
    return {
      blob,
      mimeType: mime,
      width,
      height,
      originalWidth,
      originalHeight,
      qualityUsed: null,
      metTarget: blob.size <= targetBytes,
      formatChanged,
      dimensionsChanged,
    };
  }

  const result = await encodeWithQualitySearch(bitmap, mime, fillWhite, targetBytes, width, height, minDimension, onProgress);
  onProgress?.("finalizing");
  return {
    blob: result.blob,
    mimeType: mime,
    width: result.width,
    height: result.height,
    originalWidth,
    originalHeight,
    qualityUsed: result.quality,
    metTarget: result.blob.size <= targetBytes,
    formatChanged,
    dimensionsChanged: result.width !== originalWidth || result.height !== originalHeight,
  };
}

// ---------------------------------------------------------------------------
// Quality-preserving "smart" compression — no target size, no forced resize.
// Goal: shrink the file by using efficient encoding settings, never by
// trading away visible quality. Dimensions are always preserved exactly.
// ---------------------------------------------------------------------------

export interface SmartCompressResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  qualityUsed: number | null;
  formatChanged: boolean;
  isLossless: boolean;
}

const SMART_QUALITY = 0.92; // visually-lossless for photographic JPEG/WebP re-encoding

export async function compressImageSmart(
  file: Blob,
  opts: { outputFormat: "keep" | "jpeg" | "png" | "webp"; originalMime: string; onProgress?: (stage: ProgressStage) => void }
): Promise<SmartCompressResult> {
  const { outputFormat, originalMime, onProgress } = opts;
  onProgress?.("analyzing");
  const { bitmap, width, height } = await decodeImage(file);
  const hasTransparency =
    originalMime === "image/png" || originalMime === "image/webp" ? await detectTransparency(bitmap) : false;

  let format: "jpeg" | "png" | "webp";
  let formatChanged = false;
  if (outputFormat === "jpeg" || outputFormat === "png" || outputFormat === "webp") {
    format = outputFormat;
    formatChanged = MIME_FOR_FORMAT[format] !== originalMime;
  } else if (originalMime === "image/png" && hasTransparency) {
    // Must stay lossless-capable to keep transparency intact.
    format = "png";
  } else if (originalMime === "image/png") {
    // Opaque PNG: re-encoding as a high-quality JPEG gives a real size
    // reduction with no meaningfully visible loss, which is the entire
    // point of this tool (unlike a plain format conversion).
    format = "jpeg";
    formatChanged = true;
  } else if (originalMime === "image/webp") {
    format = "webp";
  } else {
    format = "jpeg";
  }

  onProgress?.("optimizing");
  const mime = MIME_FOR_FORMAT[format];
  const fillWhite = format === "jpeg";
  const canvas = drawScaled(bitmap, width, height, fillWhite);

  let blob: Blob;
  let qualityUsed: number | null = null;
  let isLossless = false;
  if (format === "png") {
    // Canvas PNG encoding is always lossless — no quality knob. Any size
    // reduction here comes purely from re-compressing with the canvas's
    // encoder; if the source was already an efficiently-encoded PNG, the
    // savings may be small, and that is expected and honest behavior.
    blob = await canvasToBlob(canvas, mime);
    isLossless = true;
  } else {
    blob = await canvasToBlob(canvas, mime, SMART_QUALITY);
    qualityUsed = SMART_QUALITY;
    // Never let re-encoding produce a LARGER file than the original for the
    // same format — if that happens, keep the original bytes instead.
    if (!formatChanged && blob.size >= file.size) {
      blob = file instanceof Blob ? file : blob;
    }
  }

  onProgress?.("finalizing");
  return { blob, mimeType: mime, width, height, qualityUsed, formatChanged, isLossless };
}

// ---------------------------------------------------------------------------
// Image upscaler — genuine multi-step high-quality resampling + a light
// unsharp-mask sharpening pass. This is NOT an AI/ML super-resolution model:
// it cannot invent detail that isn't in the source image. It is an honest,
// well-implemented classical upscaling pipeline (repeated 2x Lanczos-quality
// canvas resampling, which measurably outperforms a single-step stretch,
// followed by edge sharpening to counteract softness introduced by scaling).
// ---------------------------------------------------------------------------

export interface UpscaleResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

function sharpen(canvas: CanvasLike, amount = 0.35): CanvasLike {
  const ctx = getCtx(canvas);
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  // Simple 3x3 unsharp kernel (identity + amount * (identity - blur)).
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        out[idx] = src[idx];
        out[idx + 1] = src[idx + 1];
        out[idx + 2] = src[idx + 2];
        out[idx + 3] = src[idx + 3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * w + (x + kx)) * 4 + c;
            sum += src[nIdx] * kernel[k++];
          }
        }
        const sharpened = sum;
        const blended = src[idx + c] + (sharpened - src[idx + c]) * amount;
        out[idx + c] = Math.max(0, Math.min(255, blended));
      }
      out[idx + 3] = src[idx + 3];
    }
  }
  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function upscaleImage(
  file: Blob,
  opts: { scale: 2 | 4 | "4k"; outputFormat: "keep" | "jpeg" | "png" | "webp"; originalMime: string; onProgress?: (stage: ProgressStage) => void }
): Promise<UpscaleResult> {
  const { scale, outputFormat, originalMime, onProgress } = opts;
  onProgress?.("analyzing");
  const { bitmap, width: originalWidth, height: originalHeight } = await decodeImage(file);

  let targetWidth: number;
  let targetHeight: number;
  if (scale === "4k") {
    // Scale so the longer edge reaches 3840px (4K UHD), preserving aspect ratio.
    const longEdge = Math.max(originalWidth, originalHeight);
    const factor = Math.min(4, 3840 / longEdge); // never downscale, cap at 4x
    targetWidth = Math.round(originalWidth * Math.max(factor, 1));
    targetHeight = Math.round(originalHeight * Math.max(factor, 1));
  } else {
    targetWidth = originalWidth * scale;
    targetHeight = originalHeight * scale;
  }

  onProgress?.("searching");
  // Upscale in repeated 2x (or smaller final) steps rather than one big jump —
  // each intermediate step gives the browser's high-quality resampler a
  // gentler ratio to work with, which measurably reduces blur/aliasing
  // compared to a single large-factor stretch.
  let currentBitmap: ImageBitmap = bitmap;
  let curW = originalWidth;
  let curH = originalHeight;
  let canvas: CanvasLike = makeCanvas(curW, curH);
  let steps = 0;
  while ((curW < targetWidth || curH < targetHeight) && steps < 4) {
    const nextW = Math.min(targetWidth, Math.round(curW * 2));
    const nextH = Math.min(targetHeight, Math.round(curH * 2));
    canvas = drawScaled(currentBitmap, nextW, nextH, false);
    onProgress?.("optimizing");
    const stepBlob = await canvasToBlob(canvas, "image/png");
    currentBitmap = await createImageBitmap(stepBlob);
    curW = nextW;
    curH = nextH;
    steps++;
  }

  onProgress?.("optimizing");
  const sharpened = sharpen(canvas, 0.35);

  let format: "jpeg" | "png" | "webp";
  if (outputFormat === "jpeg" || outputFormat === "png" || outputFormat === "webp") {
    format = outputFormat;
  } else if (originalMime === "image/png") {
    format = "png";
  } else if (originalMime === "image/webp") {
    format = "webp";
  } else {
    format = "jpeg";
  }
  const mime = MIME_FOR_FORMAT[format];
  const blob = format === "png" ? await canvasToBlob(sharpened, mime) : await canvasToBlob(sharpened, mime, 0.93);

  onProgress?.("finalizing");
  return { blob, mimeType: mime, width: curW, height: curH, originalWidth, originalHeight };
}

async function encodeWithQualitySearch(
  bitmap: ImageBitmap,
  mime: string,
  fillWhite: boolean,
  targetBytes: number,
  startWidth: number,
  startHeight: number,
  minDimension: number,
  onProgress?: (stage: ProgressStage) => void
): Promise<{ blob: Blob; quality: number | null; width: number; height: number }> {
  let width = startWidth;
  let height = startHeight;
  let bestOverall: { blob: Blob; quality: number | null; width: number; height: number } | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const canvas = drawScaled(bitmap, width, height, fillWhite);
    const found = await bestQualityForSize(canvas, mime, targetBytes);
    if (found) {
      return { blob: found.blob, quality: found.quality, width, height };
    }
    // Track the smallest attempt so far as a fallback if we never fit.
    const lowestQualityBlob = await canvasToBlob(canvas, mime, 0.02);
    if (!bestOverall || lowestQualityBlob.size < bestOverall.blob.size) {
      bestOverall = { blob: lowestQualityBlob, quality: 0.02, width, height };
    }
    if (Math.min(width, height) <= minDimension) break;
    onProgress?.("optimizing");
    width = Math.max(minDimension, Math.round(width * 0.82));
    height = Math.max(minDimension, Math.round(height * 0.82));
  }

  if (bestOverall) return bestOverall;

  // Should not normally happen, but guarantee a return value.
  const canvas = drawScaled(bitmap, width, height, fillWhite);
  const blob = await canvasToBlob(canvas, mime, 0.02);
  return { blob, quality: 0.02, width, height };
}
