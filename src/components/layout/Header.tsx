"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  FileText,
  Grid2X2,
  House,
  Image as ImageIcon,
  Info,
  Menu,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { SearchBox } from "@/components/ui/SearchBox";
import { siteConfig } from "@/config/site";

const NAV_LINKS = [
  { href: "/image-tools", label: "Image Tools", icon: ImageIcon },
  { href: "/pdf-tools", label: "PDF Tools", icon: FileText },
  { href: "/conversion-tools", label: "Conversion Tools", icon: ArrowLeftRight },
  { href: "/application-tools", label: "Other Tools", icon: Grid2X2 },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-30 bg-[#eff4ff]/90 px-3 py-2 backdrop-blur sm:px-4 sm:py-2.5">
      <div className="mx-auto max-w-[1880px] rounded-[26px] border border-white/80 bg-white/95 px-4 shadow-[0_8px_28px_rgba(37,99,235,0.08)] sm:px-6">
        <div className="flex min-h-[64px] items-center gap-3 sm:min-h-[72px] sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl focus-ring sm:gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-[0_5px_12px_rgba(37,99,235,0.22)] sm:h-12 sm:w-12">
              <Zap size={24} strokeWidth={2.5} />
            </span>
            <span className="text-[21px] font-bold leading-none text-[var(--color-text)] sm:text-[25px]">{siteConfig.name}</span>
          </Link>

          <nav className="ml-3 hidden flex-1 items-center justify-center gap-1 xl:flex 2xl:ml-8 2xl:gap-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex shrink-0 items-center gap-2 rounded-full px-3 py-3 text-sm font-medium transition-colors 2xl:px-4 ${
                    active
                      ? "bg-[#eef4ff] text-[var(--color-brand)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  } focus-ring`}
                >
                  <Icon size={19} strokeWidth={1.9} />
                  <span>{link.label}</span>
                  {active && <span className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[var(--color-brand)]" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden w-full max-w-[340px] lg:block xl:ml-1 2xl:max-w-[380px]">
            <SearchBox compact />
          </div>

          <Link
            href="/how-it-works"
            className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.2)] transition hover:bg-[var(--color-brand-hover)] focus-ring xl:flex 2xl:px-6"
          >
            <Sparkles size={17} />
            <span>Get Started</span>
            <ArrowRight size={17} />
          </Link>

          <button
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] focus-ring xl:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[var(--color-border)] pb-4 pt-4 xl:hidden">
            <div className="mb-3 lg:hidden">
              <SearchBox compact />
            </div>
            <nav className="grid gap-1 sm:grid-cols-2">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                    } focus-ring`}
                  >
                    <Icon size={19} strokeWidth={1.9} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/how-it-works"
              onClick={() => setMobileOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-ring"
            >
              <Sparkles size={17} /> Get Started <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
