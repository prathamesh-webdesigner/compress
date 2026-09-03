"use client";

import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { formatBytes, percentReduced } from "@/lib/format";
import { WarningMessage } from "./ErrorMessage";

export function ResultCard({
  originalBytes,
  compressedBytes,
  targetLabel,
  targetMet,
  downloadUrl,
  downloadName,
  beforePreviewUrl,
  afterPreviewUrl,
  formatNote,
  dimensionsNote,
  onReset,
}: {
  originalBytes: number;
  compressedBytes: number;
  targetLabel?: string;
  targetMet?: boolean;
  downloadUrl: string;
  downloadName: string;
  beforePreviewUrl?: string | null;
  afterPreviewUrl?: string | null;
  formatNote?: string | null;
  dimensionsNote?: string | null;
  onReset: () => void;
}) {
  const reduced = percentReduced(originalBytes, compressedBytes);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[var(--color-success)]">
        <CheckCircle2 size={20} />
        <h3 className="text-base font-semibold text-[var(--color-text)]">Compression complete</h3>
      </div>

      {targetMet === false && (
        <div className="mt-3">
          <WarningMessage message="Your requested size was extremely tight for this file. We created the smallest reasonable version while preserving as much quality as possible." />
        </div>
      )}

      {(beforePreviewUrl || afterPreviewUrl) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-subtle)]">Before</p>
            <div className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {beforePreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={beforePreviewUrl} alt="Original file preview before compression" className="h-full w-full object-contain" />
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-subtle)]">After</p>
            <div className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {afterPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={afterPreviewUrl} alt="Compressed file preview after compression" className="h-full w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-[var(--color-text-subtle)]">Original</dt>
          <dd className="text-sm font-semibold text-[var(--color-text)]">{formatBytes(originalBytes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-subtle)]">Compressed</dt>
          <dd className="text-sm font-semibold text-[var(--color-text)]">{formatBytes(compressedBytes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-subtle)]">Reduced by</dt>
          <dd className="text-sm font-semibold text-[var(--color-success)]">{reduced}%</dd>
        </div>
        {targetLabel && (
          <div>
            <dt className="text-xs text-[var(--color-text-subtle)]">Target</dt>
            <dd className="text-sm font-semibold text-[var(--color-text)]">{targetLabel}</dd>
          </div>
        )}
      </dl>

      {(formatNote || dimensionsNote) && (
        <div className="mt-4 space-y-1 rounded-xl bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text-muted)]">
          {formatNote && <p>{formatNote}</p>}
          {dimensionsNote && <p>{dimensionsNote}</p>}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={downloadUrl}
          download={downloadName}
          className="btn-primary flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm"
        >
          <Download size={16} /> Download {downloadName}
        </a>
        <button onClick={onReset} className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 text-sm">
          <RotateCcw size={16} /> Compress another
        </button>
      </div>
    </div>
  );
}
