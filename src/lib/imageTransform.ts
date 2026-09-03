// Simple client-side resize / format-convert helpers (no target-size search).
import { decodeImage } from "./imageCompression";

export interface ResizeResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function getCtx(canvas: CanvasLike) {
  const ctx = (canvas as HTMLCanvasElement).getContext("2d");
  if (!ctx) throw new Error("Could not acquire a 2D canvas context.");
  return ctx as CanvasRenderingContext2D;
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

export async function resizeImage(
  file: Blob,
  targetWidth: number,
  targetHeight: number,
  mode: "fit" | "stretch",
  outputMime: string,
  fillWhite: boolean
): Promise<ResizeResult> {
  const { bitmap, width: ow, height: oh } = await decodeImage(file);
  const dw = targetWidth;
  const dh = targetHeight;
  let sx = 0,
    sy = 0,
    sw = ow,
    sh = oh;

  if (mode === "fit") {
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = ow / oh;
    if (sourceRatio > targetRatio) {
      sw = Math.round(oh * targetRatio);
      sx = Math.round((ow - sw) / 2);
    } else {
      sh = Math.round(ow / targetRatio);
      sy = Math.round((oh - sh) / 2);
    }
  }

  const canvas = makeCanvas(dw, dh);
  const ctx = getCtx(canvas);
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dw, dh);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  const blob = await canvasToBlob(canvas, outputMime, outputMime === "image/jpeg" ? 0.92 : undefined);
  return { blob, mimeType: outputMime, width: dw, height: dh };
}

export async function convertImageFormat(
  file: Blob,
  outputMime: string,
  fillWhite: boolean
): Promise<ResizeResult> {
  const { bitmap, width, height } = await decodeImage(file);
  const canvas = makeCanvas(width, height);
  const ctx = getCtx(canvas);
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob = await canvasToBlob(canvas, outputMime, outputMime === "image/jpeg" || outputMime === "image/webp" ? 0.92 : undefined);
  return { blob, mimeType: outputMime, width, height };
}
