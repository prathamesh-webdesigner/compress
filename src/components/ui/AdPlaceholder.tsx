"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";

/**
 * Reusable, configurable ad slot. Renders nothing visible until an AdSense
 * client ID and slot ID are configured via environment variables, so pages
 * never ship an empty ad box or a placeholder that looks broken.
 *
 * Placement is controlled entirely by where <AdPlaceholder /> is used —
 * never inside the active compression/upload flow.
 */
export function AdPlaceholder({ slot, label = "Advertisement" }: { slot: string; label?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const enabled = Boolean(siteConfig.adsenseClientId) && Boolean(slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet loaded (e.g. blocked by an ad blocker) — fail silently.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="my-6 flex flex-col items-center gap-1" aria-label={label}>
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-subtle)]">{label}</span>
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={siteConfig.adsenseClientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
