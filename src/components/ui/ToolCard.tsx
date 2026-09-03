import Link from "next/link";
import { ArrowRight, LucideIcon, Sparkles } from "lucide-react";

export type ToolCardTone = "blue" | "teal" | "purple" | "amber" | "rose";

const TONE_STYLES: Record<ToolCardTone, { bg: string; fg: string; ring: string }> = {
  blue: { bg: "#eff6ff", fg: "#2563eb", ring: "rgba(37,99,235,0.18)" },
  teal: { bg: "#ecfeff", fg: "#0891b2", ring: "rgba(8,145,178,0.18)" },
  purple: { bg: "#f5f3ff", fg: "#7c3aed", ring: "rgba(124,58,237,0.18)" },
  amber: { bg: "#fffbeb", fg: "#b45309", ring: "rgba(180,83,9,0.18)" },
  rose: { bg: "#fff1f2", fg: "#e11d48", ring: "rgba(225,29,72,0.18)" },
};

export function ToolCard({
  href,
  title,
  description,
  icon: Icon = Sparkles,
  tone = "blue",
  badge,
}: {
  href: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: ToolCardTone;
  badge?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <Link
      href={href}
      className="card group relative flex flex-col gap-3 overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-ring"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: toneStyle.fg }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3"
          style={{ background: toneStyle.bg, color: toneStyle.fg, boxShadow: `0 0 0 1px ${toneStyle.ring}` }}
        >
          <Icon size={19} />
        </span>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: toneStyle.bg, color: toneStyle.fg }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="relative">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--color-text)]">
          {title}
          <ArrowRight
            size={15}
            className="shrink-0 text-[var(--color-text-subtle)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            style={{ color: toneStyle.fg }}
          />
        </span>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>}
      </div>
    </Link>
  );
}
