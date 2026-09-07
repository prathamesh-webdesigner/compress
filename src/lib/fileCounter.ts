const FILE_COUNT_KEY = "sizesnap-total-files-created";
const FILE_COUNT_EVENT = "sizesnap-files-created";

export function incrementFileCount(amount = 1) {
  if (typeof window === "undefined" || amount <= 0) return;

  const current = Number.parseInt(window.localStorage.getItem(FILE_COUNT_KEY) || "0", 10);
  const next = (Number.isFinite(current) ? current : 0) + amount;
  window.localStorage.setItem(FILE_COUNT_KEY, String(next));
  window.dispatchEvent(new CustomEvent(FILE_COUNT_EVENT, { detail: next }));
}

export function getFileCount() {
  if (typeof window === "undefined") return 0;

  const count = Number.parseInt(window.localStorage.getItem(FILE_COUNT_KEY) || "0", 10);
  return Number.isFinite(count) ? count : 0;
}

export const FILE_COUNT_UPDATED_EVENT = FILE_COUNT_EVENT;