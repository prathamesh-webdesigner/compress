import { FileText, Image as ImageIcon, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

export function FilePreview({
  fileName,
  fileType,
  fileSize,
  dimensions,
  previewUrl,
  onRemove,
}: {
  fileName: string;
  fileType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  previewUrl?: string | null;
  onRemove?: () => void;
}) {
  const isPdf = fileType === "application/pdf";
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-muted)]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={`Preview of ${fileName}`} className="h-full w-full object-cover" />
        ) : isPdf ? (
          <FileText size={22} className="text-[var(--color-text-subtle)]" />
        ) : (
          <ImageIcon size={22} className="text-[var(--color-text-subtle)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text)]">{fileName}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {fileType.split("/")[1]?.toUpperCase()} &middot; {formatBytes(fileSize)}
          {dimensions ? ` · ${dimensions.width}×${dimensions.height}px` : ""}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove file"
          className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-ring"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
