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
import { useToast } from "@/components/ui/Toast";
import { toBytes, formatBytes, percentReduced, generateOutputFilename } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { createZip } from "@/lib/zip";
import { siteConfig } from "@/config/site";

interface BatchItem {
  id: string;
  file: File;
  status: "queued" | "running" | "done" | "error";
  resultBlob?: Blob;
  metTarget?: boolean;
  resultUrl?: string;
  outputName?: string;
  error?: string;
}

let idCounter = 0;

type CompressionLevel = "quality" | "balanced" | "compression";

const LEVELS: { key: CompressionLevel; label: string; hint: string }[] = [
  { key: "quality", label: "Maximum Quality", hint: "Best for text-heavy or important documents" },
  { key: "balanced", label: "Balanced", hint: "Good size reduction with minimal visible change" },
  { key: "compression", label: "Maximum Compression", hint: "Smallest file, more aggressive image reduction" },
];

export function PdfCompressorTool({ tool }: { tool: Tool }) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [targetValue, setTargetValue] = useState<number>(tool.defaultTargetSize ?? 500);
  const [targetUnit, setTargetUnit] = useState<SizeUnit>(tool.defaultTargetUnit ?? "KB");
  const [level, setLevel] = useState<CompressionLevel>("balanced");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);
  const { push } = useToast();

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  function track(url: string) {
    objectUrls.current.push(url);
    return url;
  }

  function reset() {
    setItems([]);
    setValidationError(null);
    setZipUrl(null);
  }

  function handleFiles(files: File[]) {
    setZipUrl(null);
    const room = siteConfig.maxBatchFiles - items.length;
    let incoming = files;
    if (files.length > room) {
      incoming = files.slice(0, Math.max(room, 0));
      push("info", `You can compress up to ${siteConfig.maxBatchFiles} files at a time — the first ${incoming.length || 0} were added.`);
    }
    const accepted: BatchItem[] = [];
    for (const f of incoming) {
      if (f.type !== "application/pdf") {
        push("error", `${f.name}: unsupported file type. Please upload a PDF.`);
        continue;
      }
      if (f.size > tool.maxFileSizeMB * 1024 * 1024) {
        push("error", `${f.name}: exceeds the ${tool.maxFileSizeMB} MB limit.`);
        continue;
      }
      accepted.push({ id: `${Date.now()}-${idCounter++}`, file: f, status: "queued" });
      trackEvent("file_selected", { tool_slug: tool.slug, file_type: f.type });
    }
    if (accepted.length > 0) setItems((prev) => [...prev, ...accepted]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setZipUrl(null);
  }

  async function handleCompressAll() {
    if (items.length === 0) return;
    const targetBytes = toBytes(targetValue, targetUnit);
    if (targetBytes < 1024) {
      setValidationError("Target must be greater than 1 KB.");
      return;
    }
    setValidationError(null);
    setZipUrl(null);
    setIsBatchRunning(true);

    for (const item of items) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "running" } : i)));
      trackEvent("compression_started", { tool_slug: tool.slug, target_size_kb: targetUnit === "MB" ? targetValue * 1024 : targetValue });
      try {
        const form = new FormData();
        form.append("file", item.file);
        form.append("targetBytes", String(targetBytes));
        form.append("level", level);
        const res = await fetch("/api/compress-pdf", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Compression failed." }));
          throw new Error(body.error || "Compression failed.");
        }
        const blob = await res.blob();
        const metTarget = res.headers.get("X-Target-Met") === "true";
        const url = track(URL.createObjectURL(blob));
        const outputName = generateOutputFilename(item.file.name, `compressed-${targetValue}${targetUnit.toLowerCase()}`, "application/pdf");
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done", resultBlob: blob, metTarget, resultUrl: url, outputName } : i))
        );
        trackEvent("compression_completed", {
          tool_slug: tool.slug,
          reduced_percent: Math.round(((item.file.size - blob.size) / item.file.size) * 100),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Compression failed for this file.";
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: message } : i)));
        trackEvent("compression_failed", { tool_slug: tool.slug });
      }
    }
    setIsBatchRunning(false);
  }

  async function handleDownloadZip() {
    const done = items.filter((i) => i.status === "done" && i.resultBlob && i.outputName);
    if (done.length === 0) return;
    setIsZipping(true);
    try {
      const blob = await createZip(done.map((i) => ({ name: i.outputName!, blob: i.resultBlob! })));
      setZipUrl(track(URL.createObjectURL(blob)));
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

      {items.length > 0 && !allDone && !isBatchRunning && (
        <div className="card space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {items.length} of {siteConfig.maxBatchFiles} files added
            </p>
            {items.map((item) => (
              <FilePreview key={item.id} fileName={item.file.name} fileType={item.file.type} fileSize={item.file.size} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
          <CompressionSettings value={targetValue} unit={targetUnit} onValueChange={setTargetValue} onUnitChange={setTargetUnit} error={validationError} />
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Compression level</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                    level === l.key
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  <span className="block font-semibold text-[var(--color-text)]">{l.label}</span>
                  <span className="block text-xs text-[var(--color-text-subtle)]">{l.hint}</span>
                </button>
              ))}
            </div>
            {level === "quality" && (
              <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                On Maximum Quality, the target size is treated as a goal, not a hard limit — we never drop below a
                quality floor just to hit the number.
              </p>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-subtle)]">
            PDF compression requires secure server-side processing. Each file is held only in temporary memory during compression and is automatically
            discarded immediately afterward — never stored or shared.
            {items.length > 1 && " All files share the target size above and download together as one ZIP when done."}
          </p>
          <button onClick={handleCompressAll} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">
            Compress {items.length > 1 ? `${items.length} Files` : "File"}
          </button>
        </div>
      )}

      {isBatchRunning && items.length === 1 && <ProgressState label="Optimizing embedded images..." />}
      {isBatchRunning && items.length > 1 && (
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

      {allDone && singleItem && singleItem.status === "done" && singleItem.resultBlob && singleItem.resultUrl && (
        <ResultCard
          originalBytes={singleItem.file.size}
          compressedBytes={singleItem.resultBlob.size}
          targetLabel={targetLabel}
          targetMet={singleItem.metTarget}
          downloadUrl={singleItem.resultUrl}
          downloadName={singleItem.outputName!}
          onReset={reset}
        />
      )}
      {allDone && singleItem && singleItem.status === "error" && <ErrorMessage message={singleItem.error || "Compression failed."} />}

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
                  {item.status === "done" && item.resultBlob ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatBytes(item.file.size)} → {formatBytes(item.resultBlob.size)} ({percentReduced(item.file.size, item.resultBlob.size)}% smaller)
                      {!item.metTarget && " · target was very tight"}
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
