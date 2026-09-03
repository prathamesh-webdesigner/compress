"use client";

import { useEffect, useRef, useState } from "react";
import { Tool } from "@/types/tool";
import { UploadBox } from "@/components/ui/UploadBox";
import { FilePreview } from "@/components/ui/FilePreview";
import { ProgressState } from "@/components/ui/ProgressState";
import { ResultCard } from "@/components/ui/ResultCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { convertImageFormat } from "@/lib/imageTransform";
import { generateOutputFilename } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

const MIME_FOR_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function ImageConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
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
  }

  async function handleConvert() {
    if (!file || !tool.outputFormat || tool.outputFormat === "keep" || tool.outputFormat === "pdf") return;
    setIsRunning(true);
    setError(null);
    trackEvent("compression_started", { tool_slug: tool.slug });
    try {
      const outputMime = MIME_FOR_FORMAT[tool.outputFormat];
      const fillWhite = outputMime === "image/jpeg";
      const out = await convertImageFormat(file, outputMime, fillWhite);
      setResult(out.blob);
      setResultUrl(track(URL.createObjectURL(out.blob)));
      trackEvent("compression_completed", { tool_slug: tool.slug });
    } catch {
      setError("Something went wrong while converting your file. Please try another image.");
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
          <FilePreview fileName={file.name} fileType={file.type} fileSize={file.size} previewUrl={previewUrl} onRemove={reset} />
          <p className="text-xs text-[var(--color-text-subtle)]">Your file is processed in your browser and is not uploaded to our servers.</p>
          <button onClick={handleConvert} className="btn-primary w-full px-5 py-3 text-sm sm:w-auto">
            Convert to {tool.outputFormat?.toUpperCase()}
          </button>
        </div>
      )}

      {isRunning && <ProgressState label="Converting image..." />}

      {result && resultUrl && file && (
        <ResultCard
          originalBytes={file.size}
          compressedBytes={result.size}
          downloadUrl={resultUrl}
          downloadName={generateOutputFilename(file.name, "converted", result.type || MIME_FOR_FORMAT[tool.outputFormat || "jpeg"])}
          beforePreviewUrl={previewUrl}
          afterPreviewUrl={resultUrl}
          onReset={reset}
        />
      )}
    </div>
  );
}
