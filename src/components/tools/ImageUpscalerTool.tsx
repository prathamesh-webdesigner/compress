"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Info } from "lucide-react";
import { Tool } from "@/types/tool";
import { UploadBox } from "@/components/ui/UploadBox";
import { FilePreview } from "@/components/ui/FilePreview";
import { ProgressState } from "@/components/ui/ProgressState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatBytes } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { incrementFileCount } from "@/lib/fileCounter";
import { upscaleImage, UpscaleResult } from "@/lib/imageCompression";

export function ImageUpscalerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState<2 | "4k">(2);
  const [isRunning, setIsRunning] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setDimensions(null);
    setResult(null);
    setResultUrl(null);
    setError(null);
  }

  async function handleFiles(files: File[]) {
    const f = files[0];
    if (!f) return;
    if (!tool.acceptedMime.includes(f.type)) {
      setError(`${f.name}: unsupported file type.`);
      return;
    }
    if (f.size > tool.maxFileSizeMB * 1024 * 1024) {
      setError(`${f.name}: exceeds the ${tool.maxFileSizeMB} MB limit.`);
      return;
    }
    setError(null);
    setResult(null);
    setResultUrl(null);
    try {
      const bitmap = await createImageBitmap(f);
      setDimensions({ width: bitmap.width, height: bitmap.height });
      bitmap.close?.();
    } catch {
      setError(`${f.name}: could not be read as an image.`);
      return;
    }
    setFile(f);
    setPreviewUrl(track(URL.createObjectURL(f)));
    trackEvent("file_selected", { tool_slug: tool.slug, file_type: f.type });
  }

  async function handleUpscale() {
    if (!file) return;
    setIsRunning(true);
    setError(null);
    trackEvent("compression_started", { tool_slug: tool.slug });
    try {
      const outcome = await upscaleImage(file, {
        scale,
        outputFormat: "keep",
        originalMime: file.type,
        onProgress: (s) =>
          setStageLabel(
            s === "analyzing"
              ? "Analyzing image..."
              : s === "searching"
                ? "Planning upscale steps..."
                : s === "optimizing"
                  ? "Resampling and sharpening..."
                  : "Finalizing..."
          ),
      });
      setResult(outcome);
      setResultUrl(track(URL.createObjectURL(outcome.blob)));
      trackEvent("compression_completed", { tool_slug: tool.slug });
      incrementFileCount();
    } catch {
      setError("Upscaling failed for this image. Try a smaller file or a different format.");
      trackEvent("compression_failed", { tool_slug: tool.slug });
    } finally {
      setIsRunning(false);
      setStageLabel(null);
    }
  }

  const targetLabel =
    scale === "4k"
      ? "up to 3840×2160 (4K, longer edge)"
      : dimensions
        ? `${dimensions.width * 2}×${dimensions.height * 2}`
        : "2x";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-brand-soft)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
        <p>
          This upscaler uses multi-step high-quality resampling plus edge sharpening — a genuine, well-tuned classical
          algorithm. It is <strong>not</strong> a generative AI model: it sharpens and enlarges existing detail, it
          does not invent new detail. Results are best on images that are only moderately low-resolution.
        </p>
      </div>

      {!file && (
        <UploadBox accept={tool.acceptedFileTypes} maxFileSizeMB={tool.maxFileSizeMB} onFiles={handleFiles} />
      )}

      {error && <ErrorMessage message={error} />}

      {file && !result && !isRunning && (
        <div className="card space-y-5 p-5 sm:p-6">
          <FilePreview
            fileName={file.name}
            fileType={file.type}
            fileSize={file.size}
            dimensions={dimensions || undefined}
            previewUrl={previewUrl || undefined}
            onRemove={reset}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Upscale target</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScale(2)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  scale === 2 ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                <span className="block font-semibold text-[var(--color-text)]">2x</span>
                <span className="block text-xs text-[var(--color-text-subtle)]">Double width and height</span>
              </button>
              <button
                onClick={() => setScale("4k")}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  scale === "4k" ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                <span className="block font-semibold text-[var(--color-text)]">4K Enhance</span>
                <span className="block text-xs text-[var(--color-text-subtle)]">Scale toward 3840×2160</span>
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-subtle)]">
            {dimensions && `Original: ${dimensions.width}×${dimensions.height}px → Target: ${targetLabel}px. `}
            Processed entirely in your browser — never uploaded to our servers.
          </p>
          <button onClick={handleUpscale} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">
            Upscale Image
          </button>
        </div>
      )}

      {isRunning && <ProgressState label={stageLabel || "Upscaling..."} />}

      {result && resultUrl && file && (
        <div className="card p-5 sm:p-6">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Upscale complete</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-text-subtle)]">Before ({result.originalWidth}×{result.originalHeight}px)</p>
              <div className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl || ""} alt="Original image before upscaling" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-text-subtle)]">After ({result.width}×{result.height}px)</p>
              <div className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Upscaled image after processing" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--color-text-subtle)]">Original resolution</dt>
              <dd className="text-sm font-semibold text-[var(--color-text)]">{result.originalWidth}×{result.originalHeight}px</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-text-subtle)]">New resolution</dt>
              <dd className="text-sm font-semibold text-[var(--color-text)]">{result.width}×{result.height}px</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-text-subtle)]">File size</dt>
              <dd className="text-sm font-semibold text-[var(--color-text)]">{formatBytes(result.blob.size)}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={resultUrl}
              download={file.name.replace(/\.[^.]+$/, "") + `-upscaled.${result.mimeType.split("/")[1]}`}
              className="btn-primary flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Download size={16} /> Download upscaled image
            </a>
            <button onClick={reset} className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 text-sm">
              <RotateCcw size={16} /> Upscale another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
