// Thin wrapper around gtag so event tracking is a one-line call from anywhere,
// and does nothing (safely) when analytics isn't configured or hasn't loaded.

export type AnalyticsEvent =
  | "tool_opened"
  | "file_selected"
  | "compression_started"
  | "compression_completed"
  | "compression_failed"
  | "download_clicked";

interface EventParams {
  tool_slug?: string;
  file_type?: string;
  target_size_kb?: number;
  reduced_percent?: number;
  error_reason?: string;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, params: EventParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // Never pass file contents, filenames, or any user-identifying data here.
  window.gtag("event", event, params);
}
