/// <reference lib="webworker" />
import { compressImageToTarget, detectTransparency, decodeImage, ProgressStage } from "@/lib/imageCompression";

export interface WorkerRequest {
  file: Blob;
  targetBytes: number;
  outputFormat: "keep" | "jpeg" | "png" | "webp";
  originalMime: string;
}

export type WorkerResponse =
  | { type: "progress"; stage: ProgressStage }
  | {
      type: "done";
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
  | { type: "error"; message: string };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { file, targetBytes, outputFormat, originalMime } = event.data;
  try {
    const { bitmap } = await decodeImage(file);
    const hasTransparency = originalMime === "image/png" || originalMime === "image/webp" ? await detectTransparency(bitmap) : false;

    const result = await compressImageToTarget(file, {
      targetBytes,
      outputFormat,
      originalMime,
      hasTransparency,
      onProgress: (stage) => ctx.postMessage({ type: "progress", stage } as WorkerResponse),
    });

    ctx.postMessage({
      type: "done",
      blob: result.blob,
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
      originalWidth: result.originalWidth,
      originalHeight: result.originalHeight,
      qualityUsed: result.qualityUsed,
      metTarget: result.metTarget,
      formatChanged: result.formatChanged,
      dimensionsChanged: result.dimensionsChanged,
    } as WorkerResponse);
  } catch (err) {
    ctx.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Compression failed unexpectedly.",
    } as WorkerResponse);
  }
};
