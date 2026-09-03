export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative blurred blobs */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--color-brand)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--color-accent)" }}
      />

      {/* Main card mockup */}
      <div className="card relative overflow-hidden p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {/* Before */}
          <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
              <rect x="4" y="4" width="36" height="36" rx="6" fill="var(--color-danger-soft)" stroke="var(--color-danger)" strokeWidth="1.5" />
              <circle cx="16" cy="17" r="3.5" fill="var(--color-danger)" opacity="0.6" />
              <path d="M8 30l8-8 5 5 7-9 8 12" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </svg>
            <span className="text-xs font-semibold text-[var(--color-text)]">photo.jpg</span>
            <span className="text-[11px] font-medium text-[var(--color-danger)]">4.8 MB</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 px-1">
            <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden>
              <path d="M1 8h22M18 2l6 6-6 6" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="whitespace-nowrap text-[10px] font-semibold text-[var(--color-brand)]">-98%</span>
          </div>

          {/* After */}
          <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-success-soft)] p-4">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
              <rect x="4" y="4" width="36" height="36" rx="6" fill="white" stroke="var(--color-success)" strokeWidth="1.5" />
              <circle cx="16" cy="17" r="3.5" fill="var(--color-success)" />
              <path d="M8 30l8-8 5 5 7-9 8 12" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-[var(--color-text)]">photo.jpg</span>
            <span className="text-[11px] font-medium text-[var(--color-success)]">98 KB</span>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--color-text-subtle)]">
            <span>Target: 100 KB</span>
            <span>Quality: best fit</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div className="h-full w-[92%] rounded-full" style={{ background: "linear-gradient(90deg, var(--color-brand), var(--color-accent))" }} />
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="card absolute -left-6 -top-6 hidden items-center gap-2 px-3 py-2 shadow-lg sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--color-success-soft)" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6.5l2.5 2.5L10 3" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold text-[var(--color-text)]">Private &amp; local</span>
      </div>

      <div className="card absolute -bottom-5 -right-4 hidden items-center gap-2 px-3 py-2 shadow-lg sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--color-brand-soft)" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M6 1v7M3 5.5L6 8l3-2.5M2 10.5h8" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold text-[var(--color-text)]">Instant download</span>
      </div>
    </div>
  );
}
