"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Tool } from "@/types/tool";
import { UploadBox } from "@/components/ui/UploadBox";
import { FilePreview } from "@/components/ui/FilePreview";
import { ProgressState } from "@/components/ui/ProgressState";
import { ResultCard } from "@/components/ui/ResultCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { imagesToPdf, toEmbeddableImageBytes } from "@/lib/imageToPdf";
import { formatBytes } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { useToast } from "@/components/ui/Toast";

interface QueuedImage {
  file: File;
  previewUrl: string;
}

export function ImageToPdfTool({ tool }: { tool: Tool }) {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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
    setQueue([]);
    setResultBlob(null);
    setResultUrl(null);
    setError(null);
  }

  function handleFiles(files: File[]) {
    const room = siteConfig.maxBatchFiles - queue.length;
    let incoming = files;
    if (files.length > room) {
      incoming = files.slice(0, Math.max(room, 0));
      push("info", `You can add up to ${siteConfig.maxBatchFiles} images at a time — the first ${incoming.length || 0} were added.`);
    }
    const valid: QueuedImage[] = [];
    for (const f of incoming) {
      if (!tool.acceptedMime.includes(f.type)) {
        setError(`Unsupported file type: ${f.name}. Please upload ${tool.acceptedFileTypes.join(", ")} files.`);
        continue;
      }
      if (f.size > tool.maxFileSizeMB * 1024 * 1024) {
        setError(`${f.name} is too large. The maximum allowed size is ${tool.maxFileSizeMB} MB per file.`);
        continue;
      }
      valid.push({ file: f, previewUrl: track(URL.createObjectURL(f)) });
    }
    if (valid.length) setError(null);
    setQueue((prev) => [...prev, ...valid]);
    trackEvent("file_selected", { tool_slug: tool.slug });
  }

  function move(index: number, dir: -1 | 1) {
    setQueue((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeAt(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConvert() {
    if (queue.length === 0) return;
    setIsRunning(true);
    setError(null);
    trackEvent("compression_started", { tool_slug: tool.slug });
    try {
      const images = await Promise.all(queue.map((q) => toEmbeddableImageBytes(q.file)));
      const blob = await imagesToPdf(images);
      setResultBlob(blob);
      setResultUrl(track(URL.createObjectURL(blob)));
      trackEvent("compression_completed", { tool_slug: tool.slug });
    } catch {
      setError("Something went wrong while building your PDF. Please check your images and try again.");
      trackEvent("compression_failed", { tool_slug: tool.slug });
    } finally {
      setIsRunning(false);
    }
  }

  const totalBytes = queue.reduce((sum, q) => sum + q.file.size, 0);

  return (
    <div className="space-y-4">
      {queue.length < siteConfig.maxBatchFiles && (
        <UploadBox
          accept={tool.acceptedFileTypes}
          maxFileSizeMB={tool.maxFileSizeMB}
          multiple
          maxFiles={siteConfig.maxBatchFiles}
          batchNote={`Upload up to ${siteConfig.maxBatchFiles} images at once — they'll be combined into a single PDF, one page per image.`}
          onFiles={handleFiles}
          helpText="They'll appear in this order in the PDF — reorder them below if needed."
        />
      )}
      {error && <ErrorMessage message={error} />}

      {queue.length > 0 && !resultBlob && (
        <div className="card space-y-3 p-5 sm:p-6">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {queue.length} image{queue.length > 1 ? "s" : ""} queued ({formatBytes(totalBytes)} total)
          </p>
          <div className="space-y-2">
            {queue.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <FilePreview fileName={q.file.name} fileType={q.file.type} fileSize={q.file.size} previewUrl={q.previewUrl} onRemove={() => removeAt(i)} />
                </div>
                <div className="flex flex-col gap-1">
                  <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="btn-secondary rounded-lg p-1.5 disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button aria-label="Move down" disabled={i === queue.length - 1} onClick={() => move(i, 1)} className="btn-secondary rounded-lg p-1.5 disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-subtle)]">Your files are processed in your browser and are not uploaded to our servers.</p>
          {!isRunning && (
            <button onClick={handleConvert} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">
              Create PDF
            </button>
          )}
        </div>
      )}

      {isRunning && <ProgressState label="Building your PDF..." />}

      {resultBlob && resultUrl && (
        <ResultCard
          originalBytes={totalBytes}
          compressedBytes={resultBlob.size}
          downloadUrl={resultUrl}
          downloadName="images-combined.pdf"
          onReset={reset}
        />
      )}
    </div>
  );
}
