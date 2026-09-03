"use client";

import { useEffect, useRef, useState } from "react";
import { Tool } from "@/types/tool";
import { UploadBox } from "@/components/ui/UploadBox";
import { FilePreview } from "@/components/ui/FilePreview";
import { ProgressState } from "@/components/ui/ProgressState";
import { ResultCard } from "@/components/ui/ResultCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { resizeImage } from "@/lib/imageTransform";
import { generateOutputFilename } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

export function ImageResizerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);
  const [lockRatio, setLockRatio] = useState(true);
  const [mode, setMode] = useState<"fit" | "stretch">("fit");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number; mime: string } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  function track(url: string) {
    objectUrls.current.push(url);
    return url;
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setResultUrl(null);
    setError(null);
  }

  async function handleFiles(files: File[]) {
    const f = files[0];
    if (!f) return;
    if (!tool.acceptedMime.includes(f.type)) {
      setError(`Unsupported file type. Please upload one of: ${tool.acceptedFileTypes.join(", ")}.`);
      return;
    }
    if (f.size > tool.maxFileSizeMB * 1024 * 1024) {
      setError(`This file is too large. The maximum allowed size is ${tool.maxFileSizeMB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(track(URL.createObjectURL(f)));
    trackEvent("file_selected", { tool_slug: tool.slug, file_type: f.type });
    const bitmap = await createImageBitmap(f);
    setOrigDims({ width: bitmap.width, height: bitmap.height });
    setWidth(bitmap.width);
    setHeight(bitmap.height);
    bitmap.close?.();
  }

  function onWidthChange(v: number) {
    setWidth(v);
    if (lockRatio && origDims) {
      setHeight(Math.round((v * origDims.height) / origDims.width));
    }
  }
  function onHeightChange(v: number) {
    setHeight(v);
    if (lockRatio && origDims) {
      setWidth(Math.round((v * origDims.width) / origDims.height));
    }
  }

  async function handleResize() {
    if (!file) return;
    if (width < 1 || height < 1) {
      setError("Enter a width and height of at least 1 pixel.");
      return;
    }
    setError(null);
    setIsRunning(true);
    trackEvent("compression_started", { tool_slug: tool.slug });
    try {
      const fillWhite = file.type !== "image/png" && file.type !== "image/webp";
      const out = await resizeImage(file, width, height, mode, file.type, fillWhite);
      setResult({ blob: out.blob, width: out.width, height: out.height, mime: out.mimeType });
      setResultUrl(track(URL.createObjectURL(out.blob)));
      trackEvent("compression_completed", { tool_slug: tool.slug });
    } catch {
      setError("Something went wrong while resizing your file. Please try another image.");
      trackEvent("compression_failed", { tool_slug: tool.slug });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file && <UploadBox accept={tool.acceptedFileTypes} maxFileSizeMB={tool.maxFileSizeMB} onFiles={handleFiles} />}
      {error && <ErrorMessage message={error} />}

      {file && !result && !isRunning && (
        <div className="card space-y-5 p-5 sm:p-6">
          <FilePreview fileName={file.name} fileType={file.type} fileSize={file.size} dimensions={origDims || undefined} previewUrl={previewUrl} onRemove={reset} />

          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]" htmlFor="w-input">Width (px)</label>
              <input id="w-input" type="number" min={1} value={width} onChange={(e) => onWidthChange(Number(e.target.value))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm focus-ring outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]" htmlFor="h-input">Height (px)</label>
              <input id="h-input" type="number" min={1} value={height} onChange={(e) => onHeightChange(Number(e.target.value))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm focus-ring outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)]" />
            Lock aspect ratio
          </label>

          {!lockRatio && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">If dimensions don&apos;t match the original ratio</span>
              <div className="flex gap-2">
                <button onClick={() => setMode("fit")} className={mode === "fit" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Crop to fill</button>
                <button onClick={() => setMode("stretch")} className={mode === "stretch" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Stretch to fit</button>
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-subtle)]">Your file is processed in your browser and is not uploaded to our servers.</p>
          <button onClick={handleResize} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">Resize Image</button>
        </div>
      )}

      {isRunning && <ProgressState label="Resizing image..." />}

      {result && resultUrl && file && (
        <ResultCard
          originalBytes={file.size}
          compressedBytes={result.blob.size}
          downloadUrl={resultUrl}
          downloadName={generateOutputFilename(file.name, `resized-${result.width}x${result.height}`, result.mime)}
          beforePreviewUrl={previewUrl}
          afterPreviewUrl={resultUrl}
          dimensionsNote={`New dimensions: ${result.width}×${result.height}px.`}
          onReset={reset}
        />
      )}
    </div>
  );
}
