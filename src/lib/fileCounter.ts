const FILE_COUNT_EVENT = "sizesnap-files-created";

export async function incrementFileCount(amount = 1) {
  if (typeof window === "undefined" || amount <= 0) return null;

  try {
    const response = await fetch("/api/file-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) return null;

    const result = (await response.json()) as { count?: number };
    if (typeof result.count !== "number") return null;
    window.dispatchEvent(new CustomEvent(FILE_COUNT_EVENT, { detail: result.count }));
    return result.count;
  } catch {
    return null;
  }
}

export async function getFileCount() {
  if (typeof window === "undefined") return 0;

  try {
    const response = await fetch("/api/file-count", { cache: "no-store" });
    if (!response.ok) return 0;
    const result = (await response.json()) as { count?: number };
    return typeof result.count === "number" ? result.count : 0;
  } catch {
    return 0;
  }
}

export const FILE_COUNT_UPDATED_EVENT = FILE_COUNT_EVENT;