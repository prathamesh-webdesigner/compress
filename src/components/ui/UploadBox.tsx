"use client";

import { useCallback, useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export function UploadBox({
  accept,
  maxFileSizeMB,
  multiple = false,
  maxFiles,
  batchNote,
  onFiles,
  helpText,
}: {
  accept: string[]; // extensions like ['.jpg', '.png']
  maxFileSizeMB: number;
  multiple?: boolean;
  maxFiles?: number;
  /** Shown prominently when multiple + maxFiles are set, explaining what happens with a batch. */
  batchNote?: string;
  onFiles: (files: File[]) => void;
  helpText?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    },
    [onFiles]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload file. Accepted types: ${accept.join(", ")}. Maximum size ${maxFileSizeMB} MB.`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`focus-ring flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver
            ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-surface-muted)]"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <UploadCloud size={26} />
        </span>
        <p className="mt-4 text-base font-semibold text-[var(--color-text)]">
          Drag &amp; drop your {multiple ? "files" : "file"} here
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">or tap to browse from your device</p>
        <p className="mt-4 text-xs text-[var(--color-text-subtle)]">
          Supports {accept.join(", ")} &middot; Max {maxFileSizeMB} MB {multiple ? "per file" : ""}
        </p>
        {multiple && maxFiles && (
          <p className="mt-1 text-xs font-medium text-[var(--color-brand)]">
            {batchNote || `Upload up to ${maxFiles} files at once.`}
          </p>
        )}
        {helpText && <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{helpText}</p>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept.join(",")}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
