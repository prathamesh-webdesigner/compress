"use client";

import { useRef, useState } from "react";
import { ProgressStage, compressImageToTarget, detectTransparency, decodeImage } from "@/lib/imageCompression";
import type { WorkerRequest, WorkerResponse } from "@/workers/image-compressor.worker";

export interface CompressOutcome {
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

const STAGE_LABEL: Record<ProgressStage, string> = {
  analyzing: "Analyzing image...",
  searching: "Finding best compression settings...",
  optimizing: "Optimizing...",
  finalizing: "Almost done...",
};

export function useImageCompressor() {
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  async function run(
    file: File,
    targetBytes: number,
    outputFormat: "keep" | "jpeg" | "png" | "webp"
  ): Promise<CompressOutcome> {
    setIsRunning(true);
    setStageLabel(STAGE_LABEL.analyzing);
    try {
      if (typeof Worker !== "undefined") {
        try {
          return await runInWorker(file, targetBytes, outputFormat, (stage) => setStageLabel(STAGE_LABEL[stage]));
        } catch (workerErr) {
          // Fall through to main-thread processing if the worker fails for any reason.
          console.warn("Falling back to main-thread compression:", workerErr);
        }
      }
      const hasTransparency =
        file.type === "image/png" || file.type === "image/webp"
          ? await detectTransparency((await decodeImage(file)).bitmap)
          : false;
      const result = await compressImageToTarget(file, {
        targetBytes,
        outputFormat,
        originalMime: file.type,
        hasTransparency,
        onProgress: (stage) => setStageLabel(STAGE_LABEL[stage]),
      });
      return result;
    } finally {
      setIsRunning(false);
      setStageLabel(null);
    }
  }

  const runInWorker = (
    file: File,
    targetBytes: number,
    outputFormat: "keep" | "jpeg" | "png" | "webp",
    onProgress: (stage: ProgressStage) => void
  ): Promise<CompressOutcome> => {
    return new Promise((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL("../workers/image-compressor.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch (e) {
        reject(e);
        return;
      }
      workerRef.current = worker;

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error("Compression timed out."));
      }, 60000);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const data = event.data;
        if (data.type === "progress") {
          onProgress(data.stage);
        } else if (data.type === "done") {
          clearTimeout(timeout);
          worker.terminate();
          resolve({
            blob: data.blob,
            mimeType: data.mimeType,
            width: data.width,
            height: data.height,
            originalWidth: data.originalWidth,
            originalHeight: data.originalHeight,
            qualityUsed: data.qualityUsed,
            metTarget: data.metTarget,
            formatChanged: data.formatChanged,
            dimensionsChanged: data.dimensionsChanged,
          });
        } else if (data.type === "error") {
          clearTimeout(timeout);
          worker.terminate();
          reject(new Error(data.message));
        }
      };
      worker.onerror = (err) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(err);
      };

      const request: WorkerRequest = {
        file,
        targetBytes,
        outputFormat,
        originalMime: file.type,
      };
      worker.postMessage(request);
    });
  };

  return { run, isRunning, stageLabel };
}
