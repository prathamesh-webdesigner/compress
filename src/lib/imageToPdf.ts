import { PDFDocument } from "pdf-lib";
import { decodeImage } from "./imageCompression";

export interface ImageForPdf {
  bytes: ArrayBuffer;
  mime: string; // image/jpeg or image/png (webp must be converted first)
}

/** Combines one or more images (already JPEG/PNG bytes) into a single PDF, one page per image. */
export async function imagesToPdf(images: ImageForPdf[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const bytes = new Uint8Array(img.bytes);
    const embedded = img.mime === "image/png" ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
    const { width, height } = embedded;

    // Fit the image onto a standard-ish page while preserving its aspect ratio.
    const maxDim = 1600; // points, generous page size cap
    let pageWidth = width;
    let pageHeight = height;
    if (Math.max(width, height) > maxDim) {
      const scale = maxDim / Math.max(width, height);
      pageWidth = width * scale;
      pageHeight = height * scale;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/** Ensures an arbitrary image file (including WebP) is available as JPEG or PNG bytes for PDF embedding. */
export async function toEmbeddableImageBytes(file: File): Promise<ImageForPdf> {
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return { bytes: await file.arrayBuffer(), mime: file.type };
  }
  // Re-encode anything else (e.g. WebP) to PNG via canvas.
  const { bitmap, width, height } = await decodeImage(file);
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = (canvas as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const blob: Blob =
    typeof (canvas as OffscreenCanvas).convertToBlob === "function"
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" })
      : await new Promise((resolve, reject) =>
          (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/png")
        );
  return { bytes: await blob.arrayBuffer(), mime: "image/png" };
}
