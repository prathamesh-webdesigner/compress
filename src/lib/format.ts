export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${roundSmart(kb)} KB`;
  const mb = kb / 1024;
  return `${roundSmart(mb)} MB`;
}

function roundSmart(n: number): string {
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export function toBytes(value: number, unit: "KB" | "MB"): number {
  return unit === "MB" ? Math.round(value * 1024 * 1024) : Math.round(value * 1024);
}

export function percentReduced(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.max(0, Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10);
}

export function extensionFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function baseName(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeIdx = safe.lastIndexOf(".");
  return safeIdx > 0 ? safe.slice(0, safeIdx) : safe;
}

export function generateOutputFilename(
  originalName: string,
  suffix: string,
  outputMime: string
): string {
  const base = baseName(originalName) || "file";
  const ext = extensionFor(outputMime);
  return `${base}-${suffix}.${ext}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
