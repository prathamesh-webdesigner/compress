"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { SearchBox } from "@/components/ui/SearchBox";
import { siteConfig } from "@/config/site";

const NAV_LINKS = [
  { href: "/image-tools", label: "Image Tools" },
  { href: "/pdf-tools", label: "PDF Tools" },
  { href: "/conversion-tools", label: "Conversion Tools" },
  { href: "/application-tools", label: "Other Tools" },
  { href: "/how-it-works", label: "How It Works" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 focus-ring rounded-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
            <Zap size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">{siteConfig.name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block ml-auto w-full max-w-xs">
          <SearchBox compact />
        </div>

        <button
          className="ml-auto lg:hidden rounded-lg p-2 text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] focus-ring"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--color-border)] px-4 py-4 space-y-4">
          <div className="md:hidden">
            <SearchBox compact />
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
