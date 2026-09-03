import Link from "next/link";
import { Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

const COLUMNS = [
  {
    title: "Tools",
    links: [
      { href: "/image-tools", label: "Image Tools" },
      { href: "/pdf-tools", label: "PDF Tools" },
      { href: "/conversion-tools", label: "Conversion Tools" },
      { href: "/application-tools", label: "Application Tools" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookie-policy", label: "Cookie Policy" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
                <Zap size={16} strokeWidth={2.5} />
              </span>
              <span className="text-base font-bold text-[var(--color-text)]">{siteConfig.name}</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] max-w-xs">
              Free browser-based tools to compress and convert images and PDFs to the exact size you need.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col-reverse items-start gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-subtle)]">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-text-subtle)]">
            Image compression runs locally in your browser. PDF compression uses secure, temporary server processing.
          </p>
        </div>
      </div>
    </footer>
  );
}
