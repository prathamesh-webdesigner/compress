"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Tool, SizeUnit } from "@/types/tool";
import { UploadBox } from "@/components/ui/UploadBox";
import { FilePreview } from "@/components/ui/FilePreview";
import { CompressionSettings } from "@/components/ui/CompressionSettings";
import { ProgressState } from "@/components/ui/ProgressState";
import { ResultCard } from "@/components/ui/ResultCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useImageCompressor, CompressOutcome } from "@/hooks/useImageCompressor";
import { useToast } from "@/components/ui/Toast";
import { toBytes, formatBytes, percentReduced, generateOutputFilename } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { incrementFileCount } from "@/lib/fileCounter";
import { createZip } from "@/lib/zip";
import { siteConfig } from "@/config/site";

interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  dimensions: { width: number; height: number } | null;
  status: "queued" | "running" | "done" | "error";
  result?: CompressOutcome;
  resultUrl?: string;
  outputName?: string;
  error?: string;
}

let idCounter = 0;

export function ImageCompressorTool({ tool }: { tool: Tool }) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [targetValue, setTargetValue] = useState<number>(tool.defaultTargetSize ?? 100);
  const [targetUnit, setTargetUnit] = useState<SizeUnit>(tool.defaultTargetUnit ?? "KB");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  const { run, stageLabel } = useImageCompressor();
  const { push } = useToast();
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function trackObjectUrl(url: string) {
    objectUrls.current.push(url);
    return url;
  }

  function reset() {
    setItems([]);
    setRunError(null);
    setValidationError(null);
    setZipUrl(null);
  }

  async function handleFiles(files: File[]) {
    setRunError(null);
    setZipUrl(null);

    const room = siteConfig.maxBatchFiles - items.length;
    let incoming = files;
    if (files.length > room) {
      incoming = files.slice(0, Math.max(room, 0));
      push("info", `You can compress up to ${siteConfig.maxBatchFiles} files at a time — the first ${incoming.length || 0} were added.`);
    }
    if (incoming.length === 0) return;

    const accepted: BatchItem[] = [];
    for (const f of incoming) {
      if (!tool.acceptedMime.includes(f.type)) {
        push("error", `${f.name}: unsupported file type.`);
        continue;
      }
      if (f.size > tool.maxFileSizeMB * 1024 * 1024) {
        push("error", `${f.name}: exceeds the ${tool.maxFileSizeMB} MB limit.`);
        continue;
      }
      const previewUrl = trackObjectUrl(URL.createObjectURL(f));
      let dimensions: { width: number; height: number } | null = null;
      try {
        const bitmap = await createImageBitmap(f);
        dimensions = { width: bitmap.width, height: bitmap.height };
        bitmap.close?.();
      } catch {
        push("error", `${f.name}: could not be read as an image and was skipped.`);
        continue;
      }
      accepted.push({ id: `${Date.now()}-${idCounter++}`, file: f, previewUrl, dimensions, status: "queued" });
      trackEvent("file_selected", { tool_slug: tool.slug, file_type: f.type });
    }
    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted]);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setZipUrl(null);
  }

  function validateTarget(): boolean {
    const targetBytes = toBytes(targetValue, targetUnit);
    if (!targetValue || targetValue <= 0) {
      setValidationError("Enter a target size greater than 0.");
      return false;
    }
    if (targetBytes < 1024) {
      setValidationError("Target must be greater than 1 KB.");
      return false;
    }
    setValidationError(null);
    return true;
  }

  async function handleCompressAll() {
    if (items.length === 0) return;
    if (!validateTarget()) return;
    setRunError(null);
    setZipUrl(null);
    setIsBatchRunning(true);
    const targetBytes = toBytes(targetValue, targetUnit);

    // Process sequentially — keeps memory/CPU bounded and progress easy to show per file.
    for (const item of items) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "running" } : i)));
      trackEvent("compression_started", { tool_slug: tool.slug, target_size_kb: targetUnit === "MB" ? targetValue * 1024 : targetValue });

      try {
        let outcome: CompressOutcome;
        if (targetBytes >= item.file.size) {
          outcome = {
            blob: item.file,
            mimeType: item.file.type,
            width: item.dimensions?.width ?? 0,
            height: item.dimensions?.height ?? 0,
            originalWidth: item.dimensions?.width ?? 0,
            originalHeight: item.dimensions?.height ?? 0,
            qualityUsed: null,
            metTarget: true,
            formatChanged: false,
            dimensionsChanged: false,
          };
        } else {
          outcome = await run(item.file, targetBytes, tool.outputFormat === "keep" ? "keep" : (tool.outputFormat as "jpeg" | "png" | "webp"));
        }
        const url = trackObjectUrl(URL.createObjectURL(outcome.blob));
        const outputName = generateOutputFilename(item.file.name, `compressed-${targetValue}${targetUnit.toLowerCase()}`, outcome.mimeType);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done", result: outcome, resultUrl: url, outputName } : i)));
        trackEvent("compression_completed", {
          tool_slug: tool.slug,
          reduced_percent: Math.round(((item.file.size - outcome.blob.size) / item.file.size) * 100),
        });
        incrementFileCount();
        if (!outcome.metTarget) {
          push("info", `${item.file.name}: your requested size was very tight — we got as close as possible.`);
        }
      } catch {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: "Compression failed for this file." } : i))
        );
        trackEvent("compression_failed", { tool_slug: tool.slug });
      }
    }
    setIsBatchRunning(false);
  }

  async function handleDownloadZip() {
    const done = items.filter((i) => i.status === "done" && i.result && i.outputName);
    if (done.length === 0) return;
    setIsZipping(true);
    try {
      const blob = await createZip(done.map((i) => ({ name: i.outputName!, blob: i.result!.blob })));
      setZipUrl(trackObjectUrl(URL.createObjectURL(blob)));
    } catch {
      push("error", "Couldn't build the ZIP file. Try downloading files individually instead.");
    } finally {
      setIsZipping(false);
    }
  }

  const targetLabel = `${targetValue} ${targetUnit}`;
  const allDone = items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");
  const doneCount = items.filter((i) => i.status === "done").length;
  const singleItem = items.length === 1 ? items[0] : null;

  return (
    <div className="space-y-4">
      {items.length < siteConfig.maxBatchFiles && !allDone && (
        <UploadBox
          accept={tool.acceptedFileTypes}
          maxFileSizeMB={tool.maxFileSizeMB}
          multiple
          maxFiles={siteConfig.maxBatchFiles}
          batchNote={`Upload up to ${siteConfig.maxBatchFiles} files at once — they'll be compressed together and packed into one ZIP to download.`}
          onFiles={handleFiles}
        />
      )}

      {runError && <ErrorMessage message={runError} />}

      {items.length > 0 && !allDone && !isBatchRunning && (
        <div className="card space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {items.length} of {siteConfig.maxBatchFiles} files added
            </p>
            {items.map((item) => (
              <FilePreview
                key={item.id}
                fileName={item.file.name}
                fileType={item.file.type}
                fileSize={item.file.size}
                dimensions={item.dimensions || undefined}
                previewUrl={item.previewUrl}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
          <CompressionSettings
            value={targetValue}
            unit={targetUnit}
            onValueChange={setTargetValue}
            onUnitChange={setTargetUnit}
            error={validationError}
          />
          <p className="text-xs text-[var(--color-text-subtle)]">
            Your files are processed in your browser and are not uploaded to our servers.
            {items.length > 1 && " All files share the target size above and download together as one ZIP when done."}
          </p>
          <button onClick={handleCompressAll} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">
            Compress {items.length > 1 ? `${items.length} Files` : "File"}
          </button>
        </div>
      )}

      {isBatchRunning && (
        <div className="space-y-3">
          {items.length === 1 && stageLabel ? (
            <ProgressState label={stageLabel} />
          ) : (
            <div className="card space-y-2 p-5">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Compressing {items.filter((i) => i.status === "done" || i.status === "error").length + 1} of {items.length}...
              </p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                  {item.status === "done" && <CheckCircle2 size={16} className="shrink-0 text-[var(--color-success)]" />}
                  {item.status === "error" && <XCircle size={16} className="shrink-0 text-[var(--color-danger)]" />}
                  {item.status === "running" && <Loader2 size={16} className="shrink-0 animate-spin text-[var(--color-brand)]" />}
                  {item.status === "queued" && <span className="h-4 w-4 shrink-0 rounded-full border border-[var(--color-border)]" />}
                  <span className="truncate">{item.file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {allDone && singleItem && singleItem.status === "done" && singleItem.result && singleItem.resultUrl && (
        <>
          <ResultCard
            originalBytes={singleItem.file.size}
            compressedBytes={singleItem.result.blob.size}
            targetLabel={targetLabel}
            targetMet={singleItem.result.metTarget}
            downloadUrl={singleItem.resultUrl}
            downloadName={singleItem.outputName!}
            beforePreviewUrl={singleItem.previewUrl}
            afterPreviewUrl={singleItem.resultUrl}
            formatNote={
              singleItem.result.formatChanged
                ? `Format changed from ${singleItem.file.type.split("/")[1].toUpperCase()} to ${singleItem.result.mimeType.split("/")[1].toUpperCase()} to reach your target size.`
                : null
            }
            dimensionsNote={
              singleItem.result.dimensionsChanged
                ? `Dimensions reduced from ${singleItem.result.originalWidth}×${singleItem.result.originalHeight} to ${singleItem.result.width}×${singleItem.result.height} to reach your target size.`
                : `Original dimensions preserved: ${singleItem.result.width}×${singleItem.result.height}px.`
            }
            onReset={reset}
          />
          <p className="text-center text-xs text-[var(--color-text-subtle)]">Original was {formatBytes(singleItem.file.size)}.</p>
        </>
      )}

      {allDone && items.length > 1 && (
        <div className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[var(--color-success)]">
            <CheckCircle2 size={20} />
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              {doneCount} of {items.length} files compressed
            </h3>
          </div>

          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{item.file.name}</p>
                  {item.status === "done" && item.result ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatBytes(item.file.size)} → {formatBytes(item.result.blob.size)} ({percentReduced(item.file.size, item.result.blob.size)}% smaller)
                      {!item.result.metTarget && " · target was very tight"}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-danger)]">{item.error || "Failed to compress"}</p>
                  )}
                </div>
                {item.status === "done" && item.resultUrl && item.outputName && (
                  <a href={item.resultUrl} download={item.outputName} className="btn-secondary flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs">
                    <Download size={13} /> Download
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            {zipUrl ? (
              <a href={zipUrl} download={`${tool.slug}-compressed.zip`} className="btn-primary flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm">
                <Download size={16} /> Download ZIP ({doneCount} files)
              </a>
            ) : (
              <button onClick={handleDownloadZip} disabled={isZipping || doneCount === 0} className="btn-primary flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm">
                <Download size={16} /> {isZipping ? "Building ZIP..." : `Download All as ZIP (${doneCount})`}
              </button>
            )}
            <button onClick={reset} className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 text-sm">
              <RotateCcw size={16} /> Compress more files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
