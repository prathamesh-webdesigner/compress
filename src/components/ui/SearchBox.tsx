"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { tools } from "@/config/tools";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tools
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.navLabel.toLowerCase().includes(q) ||
          t.slug.includes(q.replace(/\s+/g, "-"))
      )
      .slice(0, 8);
  }, [query]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="What do you want to compress?"
          aria-label="Search tools"
          className={`w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-ring outline-none ${
            compact ? "" : "py-3.5 text-base"
          }`}
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && query.trim() && (
        <div className="absolute z-40 mt-2 w-full card overflow-hidden py-1">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No tools match &quot;{query}&quot;.</p>
          ) : (
            results.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              >
                {t.title}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
