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
// Image upscaler (HD pipeline)
//
//  1. Pixelation reconstruction – if the image is a "mosaic" (each source pixel
//     blown up into an NxN block, typical of pixelated / nearest-neighbour
//     images) the blocks are detected and collapsed back to the true low-res
//     pixels, so smooth resampling doesn't just smooth the staircase edges.
//  2. Heavy-noise cleanup – gentle edge-preserving bilateral filter, applied only
//     when the image is clearly very noisy.
//  3. Multi-step Catmull-Rom resampling (<= 2x per step) with light detail
//     recovery between steps.
//  4. Final halo-free luminance sharpening (unsharp mask clamped to the local
//     min/max, which also steepens edges).
//
// This is classical signal processing, not a generative AI model, so it cannot
// invent detail that isn't in the source – but it is far cleaner than a single
// canvas resample + 3x3 sharpen.
// ---------------------------------------------------------------------------

export interface UpscaleResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  /** Detected pixel-block size that was reconstructed, or null if none. */
  pixelBlockSize: number | null;
  /** True when noise / compression-artifact cleanup was applied. */
  denoised: boolean;
  /** Number of classical resampling passes used (after any AI pass). */
  steps: number;
  /** True when the AI super-resolution model was applied. */
  aiUsed: boolean;
  /** Why AI mode was skipped (null if it ran or wasn't requested). */
  aiNote: string | null;
}

export class UpscaleTooLargeError extends Error {
  constructor(width: number, height: number) {
    super(
      `The result would be ${width}×${height}px, which is too large for your browser to process safely. Try the 2x option or a smaller image.`
    );
    this.name = "UpscaleTooLargeError";
  }
}

const MAX_OUTPUT_PIXELS = 48e6;
// AI 4x produces 16x the input pixels; keep the input modest so memory stays safe.
const AI_MAX_INPUT_PIXELS = 1.6e6;
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

interface Pix {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function readPixels(bitmap: ImageBitmap): Pix {
  const canvas = makeCanvas(bitmap.width, bitmap.height);
  const ctx = getCtx(canvas);
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  return { data: img.data, width: bitmap.width, height: bitmap.height };
}

function pixelsToCanvas(p: Pix): CanvasLike {
  const canvas = makeCanvas(p.width, p.height);
  const ctx = getCtx(canvas);
  const img = ctx.createImageData(p.width, p.height);
  img.data.set(p.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function luminanceOf(p: Pix): Uint8Array {
  const { data, width, height } = p;
  const out = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) {
    out[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
  }
  return out;
}

function hasAlphaChannel(p: Pix): boolean {
  const d = p.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

// ----- 1. Pixelation (mosaic) detection & reconstruction -------------------

/**
 * Finds the best (blockSize, offset) for a 1-D "edge profile" where profile[x]
 * is the fraction of sampled lines that have a visible step between pixel x and
 * x+1. A true mosaic has ~no steps inside blocks and many at block borders.
 */
function bestBlockFromProfile(profile: Float32Array): { b: number; off: number; score: number } | null {
  const n = profile.length;
  const candidates: { b: number; off: number; score: number }[] = [];
  for (let b = 2; b <= 32; b++) {
    for (let off = 0; off < b; off++) {
      let bSum = 0, bN = 0, iSum = 0, iN = 0;
      for (let x = 0; x < n; x++) {
        if ((((x + 1 - off) % b) + b) % b === 0) {
          bSum += profile[x];
          bN++;
        } else {
          iSum += profile[x];
          iN++;
        }
      }
      if (bN < 6 || iN === 0) continue;
      const bm = bSum / bN;
      const im = iSum / iN;
      // Near-zero steps inside blocks, clearly more steps on the borders.
      // (Flat regions have no steps anywhere, so the border bar is low.)
      if (im <= 0.03 && bm >= 0.1 && bm >= im * 8) candidates.push({ b, off, score: bm - im });
    }
  }
  if (candidates.length === 0) return null;
  const top = Math.max(...candidates.map((c) => c.score));
  // Divisors of the true size score ~half; multiples score similarly, so take
  // the smallest size that is close to the best score.
  const good = candidates.filter((c) => c.score >= top * 0.8);
  good.sort((a, c) => a.b - c.b || c.score - a.score);
  return good[0];
}

function detectPixelBlocks(p: Pix): { size: number; offX: number; offY: number } | null {
  const { width: w, height: h } = p;
  if (w < 48 || h < 48) return null;
  const lum = luminanceOf(p);
  const STEP_THRESHOLD = 4;

  const hProfile = new Float32Array(w - 1);
  const rowStride = Math.max(1, Math.floor(h / 200));
  let rows = 0;
  for (let y = 0; y < h; y += rowStride) {
    rows++;
    const base = y * w;
    for (let x = 0; x < w - 1; x++) {
      if (Math.abs(lum[base + x + 1] - lum[base + x]) > STEP_THRESHOLD) hProfile[x]++;
    }
  }
  for (let x = 0; x < w - 1; x++) hProfile[x] /= rows;

  const vProfile = new Float32Array(h - 1);
  const colStride = Math.max(1, Math.floor(w / 200));
  let cols = 0;
  for (let x = 0; x < w; x += colStride) {
    cols++;
    for (let y = 0; y < h - 1; y++) {
      if (Math.abs(lum[(y + 1) * w + x] - lum[y * w + x]) > STEP_THRESHOLD) vProfile[y]++;
    }
  }
  for (let y = 0; y < h - 1; y++) vProfile[y] /= cols;

  const hb = bestBlockFromProfile(hProfile);
  const vb = bestBlockFromProfile(vProfile);
  if (!hb || !vb || hb.b !== vb.b) return null;
  return { size: hb.b, offX: hb.off, offY: vb.off };
}

/** Average every NxN block back into one pixel (recovers the true low-res image). */
function collapseBlocks(p: Pix, size: number, offX: number, offY: number): Pix {
  const { data, width: w, height: h } = p;
  const nw = Math.floor((w - offX) / size);
  const nh = Math.floor((h - offY) / size);
  const out = new Uint8ClampedArray(nw * nh * 4);
  const area = size * size;
  for (let by = 0; by < nh; by++) {
    for (let bx = 0; bx < nw; bx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < size; dy++) {
        const rowBase = ((offY + by * size + dy) * w + offX + bx * size) * 4;
        for (let dx = 0; dx < size; dx++) {
          const j = rowBase + dx * 4;
          r += data[j];
          g += data[j + 1];
          b += data[j + 2];
          a += data[j + 3];
        }
      }
      const o = (by * nw + bx) * 4;
      out[o] = r / area;
      out[o + 1] = g / area;
      out[o + 2] = b / area;
      out[o + 3] = a / area;
    }
  }
  return { data: out, width: nw, height: nh };
}

// ----- 2. Noise / compression-artifact cleanup -----------------------------

/** Immerkaer's fast noise-sigma estimator on luminance. */
function estimateNoise(lum: Uint8Array, w: number, h: number): number {
  if (w < 3 || h < 3) return 0;
  let sum = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        4 * lum[i] -
        2 * (lum[i - 1] + lum[i + 1] + lum[i - w] + lum[i + w]) +
        (lum[i - w - 1] + lum[i - w + 1] + lum[i + w - 1] + lum[i + w + 1]);
      sum += Math.abs(v);
    }
  }
  return (sum * Math.sqrt(Math.PI / 2)) / (6 * (w - 2) * (h - 2));
}

/** 5x5 edge-preserving bilateral filter (RGB, alpha untouched). */
async function bilateral(p: Pix, sigmaR: number): Promise<Pix> {
  const { data, width: w, height: h } = p;
  const lum = luminanceOf(p);
  const lut = new Float32Array(256);
  for (let d = 0; d < 256; d++) lut[d] = Math.exp(-(d * d) / (2 * sigmaR * sigmaR));
  const spatial = new Float32Array(25);
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) spatial[(dy + 2) * 5 + dx + 2] = Math.exp(-(dx * dx + dy * dy) / (2 * 1.4 * 1.4));

  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    if (y % 64 === 0) await tick();
    for (let x = 0; x < w; x++) {
      const ci = y * w + x;
      const yc = lum[ci];
      let wsum = 0, r = 0, g = 0, b = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -2; dx <= 2; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const ni = yy * w + xx;
          const wgt = spatial[(dy + 2) * 5 + dx + 2] * lut[Math.abs(lum[ni] - yc)];
          const j = ni * 4;
          wsum += wgt;
          r += data[j] * wgt;
          g += data[j + 1] * wgt;
          b += data[j + 2] * wgt;
        }
      }
      const o = ci * 4;
      out[o] = r / wsum;
      out[o + 1] = g / wsum;
      out[o + 2] = b / wsum;
      out[o + 3] = data[o + 3];
    }
  }
  return { data: out, width: w, height: h };
}

// ----- 3. Catmull-Rom resampling --------------------------------------------

/** Catmull-Rom cubic: sharp like Lanczos but with far less ringing/halos. */
function catmullRom(x: number): number {
  const ax = Math.abs(x);
  if (ax < 1) return 1.5 * ax * ax * ax - 2.5 * ax * ax + 1;
  if (ax < 2) return -0.5 * ax * ax * ax + 2.5 * ax * ax - 4 * ax + 2;
  return 0;
}

const TAPS = 6;

function buildWeights(srcLen: number, dstLen: number): { idx: Int32Array; wts: Float32Array } {
  const scale = dstLen / srcLen;
  const idx = new Int32Array(dstLen * TAPS);
  const wts = new Float32Array(dstLen * TAPS);
  for (let i = 0; i < dstLen; i++) {
    const center = (i + 0.5) / scale - 0.5;
    const base = Math.floor(center) - 2;
    let sum = 0;
    for (let k = 0; k < TAPS; k++) {
      const pos = base + k;
      const wgt = catmullRom(center - pos);
      wts[i * TAPS + k] = wgt;
      idx[i * TAPS + k] = Math.min(srcLen - 1, Math.max(0, pos));
      sum += wgt;
    }
    for (let k = 0; k < TAPS; k++) wts[i * TAPS + k] /= sum;
  }
  return { idx, wts };
}

async function resampleCubic(src: Pix, dw: number, dh: number): Promise<Pix> {
  const { data, width: sw, height: sh } = src;
  const wx = buildWeights(sw, dw);
  const wy = buildWeights(sh, dh);

  // Horizontal pass (float precision so ringing isn't clipped prematurely).
  const tmp = new Float32Array(dw * sh * 4);
  for (let y = 0; y < sh; y++) {
    if (y % 128 === 0) await tick();
    const rowBase = y * sw * 4;
    const o = y * dw * 4;
    for (let x = 0; x < dw; x++) {
      const t = x * TAPS;
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < TAPS; k++) {
        const j = rowBase + wx.idx[t + k] * 4;
        const wgt = wx.wts[t + k];
        r += data[j] * wgt;
        g += data[j + 1] * wgt;
        b += data[j + 2] * wgt;
        a += data[j + 3] * wgt;
      }
      const oo = o + x * 4;
      tmp[oo] = r;
      tmp[oo + 1] = g;
      tmp[oo + 2] = b;
      tmp[oo + 3] = a;
    }
  }

  // Vertical pass.
  const out = new Uint8ClampedArray(dw * dh * 4);
  const rowLen = dw * 4;
  for (let y = 0; y < dh; y++) {
    if (y % 128 === 0) await tick();
    const t = y * TAPS;
    const r0 = wy.idx[t] * rowLen, r1 = wy.idx[t + 1] * rowLen, r2 = wy.idx[t + 2] * rowLen;
    const r3 = wy.idx[t + 3] * rowLen, r4 = wy.idx[t + 4] * rowLen, r5 = wy.idx[t + 5] * rowLen;
    const w0 = wy.wts[t], w1 = wy.wts[t + 1], w2 = wy.wts[t + 2];
    const w3 = wy.wts[t + 3], w4 = wy.wts[t + 4], w5 = wy.wts[t + 5];
    const o = y * rowLen;
    for (let x = 0; x < rowLen; x++) {
      out[o + x] =
        tmp[r0 + x] * w0 + tmp[r1 + x] * w1 + tmp[r2 + x] * w2 + tmp[r3 + x] * w3 + tmp[r4 + x] * w4 + tmp[r5 + x] * w5;
    }
  }
  return { data: out, width: dw, height: dh };
}

// ----- 4. Halo-free luminance sharpening ----------------------------------

function gaussianBlur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let ksum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v;
    ksum += v;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= ksum;

  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        s += src[row + xx] * kernel[k + radius];
      }
      tmp[row + x] = s;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        s += tmp[yy * w + x] * kernel[k + radius];
      }
      out[y * w + x] = s;
    }
  }
  return out;
}

/**
 * Unsharp mask on luminance only, with (a) a noise gate so tiny variations
 * aren't amplified and (b) clamping to the local 3x3 min/max so no bright/dark
 * halos appear around edges. Clamping also makes edges steeper (crisper).
 */
async function enhanceDetail(p: Pix, sigma: number, amount: number): Promise<void> {
  const { data, width: w, height: h } = p;
  if (w < 3 || h < 3) return;
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }
  await tick();
  const blur = gaussianBlur(lum, w, h, sigma);
  await tick();

  for (let y = 1; y < h - 1; y++) {
    if (y % 256 === 0) await tick();
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const j = i * 4;
      if (data[j + 3] === 0) continue;
      const l = lum[i];
      const d = l - blur[i];
      const ad = d < 0 ? -d : d;
      const gate = ad <= 1.5 ? 0 : ad >= 6 ? 1 : (ad - 1.5) / 4.5;
      if (gate === 0) continue;

      let mn = l, mx = l;
      for (let k = 0; k < 8; k++) {
        const ni = k < 3 ? i - w + (k - 1) : k < 5 ? i + (k === 3 ? -1 : 1) : i + w + (k - 6);
        const v = lum[ni];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      let target = l + d * amount * gate;
      if (target < mn - 2) target = mn - 2;
      else if (target > mx + 2) target = mx + 2;
      const delta = target - l;
      data[j] += delta;
      data[j + 1] += delta;
      data[j + 2] += delta;
    }
  }
}

/** High-quality downscale (supersampling) via the browser's canvas. */
function downscalePixels(p: Pix, dw: number, dh: number): Pix {
  const src = pixelsToCanvas(p);
  const dst = makeCanvas(dw, dh);
  const ctx = getCtx(dst);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src as CanvasImageSource, 0, 0, dw, dh);
  const img = ctx.getImageData(0, 0, dw, dh);
  return { data: img.data, width: dw, height: dh };
}

// ----- Alpha helpers -------------------------------------------------------

function premultiply(d: Uint8ClampedArray): void {
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] *= a;
    d[i + 1] *= a;
    d[i + 2] *= a;
  }
}

function unpremultiply(d: Uint8ClampedArray): void {
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const f = 255 / a;
    d[i] *= f;
    d[i + 1] *= f;
    d[i + 2] *= f;
  }
}

/** Composite premultiplied pixels over white (for JPEG output). */
function flattenOverWhite(d: Uint8ClampedArray): void {
  for (let i = 0; i < d.length; i += 4) {
    const inv = 255 - d[i + 3];
    d[i] += inv;
    d[i + 1] += inv;
    d[i + 2] += inv;
    d[i + 3] = 255;
  }
}

// ----- Public API ----------------------------------------------------------

export async function upscaleImage(
  file: Blob,
  opts: {
    scale: 2 | 4 | "4k";
    outputFormat: "keep" | "jpeg" | "png" | "webp";
    originalMime: string;
    onProgress?: (stage: ProgressStage) => void;
    /** Optional human-readable status for finer-grained UI labels. */
    onStatus?: (message: string) => void;
    /** "ai" (default) uses the neural upscaler when possible; "classic" skips it. */
    mode?: "ai" | "classic";
    /** Override where the AI model.json is loaded from. */
    aiModelUrls?: string[];
  }
): Promise<UpscaleResult> {
  const { scale, outputFormat, originalMime, onProgress, onStatus } = opts;
  const mode = opts.mode ?? "ai";
  onProgress?.("analyzing");
  onStatus?.("Analyzing image...");
  const { bitmap, width: originalWidth, height: originalHeight } = await decodeImage(file);

  // Target size. 4K = longer edge reaches exactly 3840px (never downscales).
  let targetWidth: number;
  let targetHeight: number;
  if (scale === "4k") {
    const factor = Math.max(1, 3840 / Math.max(originalWidth, originalHeight));
    targetWidth = Math.round(originalWidth * factor);
    targetHeight = Math.round(originalHeight * factor);
  } else {
    targetWidth = originalWidth * scale;
    targetHeight = originalHeight * scale;
  }
  if (targetWidth * targetHeight > MAX_OUTPUT_PIXELS) {
    bitmap.close?.();
    throw new UpscaleTooLargeError(targetWidth, targetHeight);
  }

  let pix = readPixels(bitmap);
  bitmap.close?.();
  const hasAlpha = hasAlphaChannel(pix);
  await tick();

  // 1. Undo pixelation if the image is a block mosaic.
  let pixelBlockSize: number | null = null;
  const blocks = detectPixelBlocks(pix);
  if (blocks) {
    onStatus?.(`Reconstructing pixelated image (${blocks.size}px blocks)...`);
    pix = collapseBlocks(pix, blocks.size, blocks.offX, blocks.offY);
    pixelBlockSize = blocks.size;
    await tick();
  }

  // 2. Clean noise – only when it is unmistakably heavy. The estimator can't
  // reliably separate fine photo texture from mild noise, so anything milder is
  // left untouched (smoothing real detail is worse than leaving light noise).
  const noise = estimateNoise(luminanceOf(pix), pix.width, pix.height);
  let denoised = false;
  if (noise >= 7) {
    onStatus?.("Reducing heavy noise...");
    pix = await bilateral(pix, Math.min(24, 6 + noise * 1.5));
    denoised = true;
  }

  // 3a. AI super-resolution (4x) – predicts real edge/texture detail.
  let aiUsed = false;
  let aiNote: string | null = null;
  if (mode === "ai" && Math.max(targetWidth / pix.width, targetHeight / pix.height) > 1) {
    try {
      if (pix.width * pix.height > AI_MAX_INPUT_PIXELS) {
        throw new Error("The image is already large, so the standard high-quality mode was used.");
      }
      onProgress?.("optimizing");
      onStatus?.("Loading AI model...");
      const { aiUpscale4x } = await import("./aiUpscale");
      const w4 = pix.width * 4;
      const h4 = pix.height * 4;
      const rgb = await aiUpscale4x(pix.data, pix.width, pix.height, {
        modelUrls: opts.aiModelUrls,
        onProgress: (f) => onStatus?.(`AI enhancing... ${Math.round(f * 100)}%`),
      });
      let aiPix: Pix = { data: rgb, width: w4, height: h4 };
      if (hasAlpha) {
        // The network only handles RGB; resample the alpha channel separately.
        const a = new Uint8ClampedArray(pix.data.length);
        for (let i = 0; i < a.length; i += 4) {
          a[i] = a[i + 1] = a[i + 2] = pix.data[i + 3];
          a[i + 3] = 255;
        }
        const aBig = await resampleCubic({ data: a, width: pix.width, height: pix.height }, w4, h4);
        for (let i = 0; i < rgb.length; i += 4) rgb[i + 3] = aBig.data[i];
        aiPix = { data: rgb, width: w4, height: h4 };
      }
      pix = aiPix;
      aiUsed = true;
      // ESRGAN leaves a faint tile/grid texture in flat areas; a very light
      // edge-preserving pass removes it without touching real edges.
      if (pix.width * pix.height <= 9e6) {
        onStatus?.("Smoothing AI artifacts...");
        pix = await bilateral(pix, 7);
      }
      // Bigger than the target (e.g. 2x mode, or a large source)? Supersample down.
      if (pix.width > targetWidth || pix.height > targetHeight) {
        onStatus?.("Fitting to target size...");
        pix = downscalePixels(pix, targetWidth, targetHeight);
      }
    } catch (err) {
      aiNote = err instanceof Error ? err.message : "AI mode was unavailable.";
    }
  }
  if (hasAlpha) premultiply(pix.data);

  // 3b. Classical multi-step resampling (<= 2x per step) for whatever is left.
  onProgress?.("searching");
  onStatus?.("Planning upscale steps...");
  const ratio = Math.max(targetWidth / pix.width, targetHeight / pix.height);
  const steps = ratio <= 1 ? 0 : Math.ceil(Math.log2(ratio) - 1e-9);
  const startW = pix.width;
  const startH = pix.height;
  const totalFactor = Math.max(1, targetWidth / originalWidth);

  onProgress?.("optimizing");
  for (let s = 1; s <= steps; s++) {
    onStatus?.(steps > 1 ? `Upscaling (pass ${s} of ${steps})...` : "Upscaling...");
    const isLast = s === steps;
    const dw = isLast ? targetWidth : Math.round(startW * Math.pow(targetWidth / startW, s / steps));
    const dh = isLast ? targetHeight : Math.round(startH * Math.pow(targetHeight / startH, s / steps));
    pix = await resampleCubic(pix, Math.max(dw, pix.width), Math.max(dh, pix.height));
    if (!isLast) await enhanceDetail(pix, 0.8, aiUsed ? 0.3 : 0.5);
  }

  // 4. Final sharpening tuned to the overall magnification.
  onStatus?.("Sharpening edges...");
  const sigma = aiUsed ? 1.0 : Math.min(2.2, Math.max(0.8, 0.8 + 0.35 * Math.log2(totalFactor)));
  await enhanceDetail(pix, sigma, aiUsed ? 0.7 : 1.1);

  // Encode.
  onProgress?.("finalizing");
  onStatus?.("Finalizing...");
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
  if (hasAlpha) {
    if (format === "jpeg") flattenOverWhite(pix.data);
    else unpremultiply(pix.data);
  }
  const mime = MIME_FOR_FORMAT[format];
  const canvas = pixelsToCanvas(pix);
  const blob = format === "png" ? await canvasToBlob(canvas, mime) : await canvasToBlob(canvas, mime, 0.95);

  return {
    blob,
    mimeType: mime,
    width: pix.width,
    height: pix.height,
    originalWidth,
    originalHeight,
    pixelBlockSize,
    denoised,
    steps,
    aiUsed,
    aiNote,
  };
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
