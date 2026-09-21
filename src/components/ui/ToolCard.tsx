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
  backgroundImage,
}: {
  href: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: ToolCardTone;
  badge?: string;
  backgroundImage?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <Link
      href={href}
      className="card group relative flex flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-ring"
    >
      <div className="relative h-40 overflow-hidden rounded-t-[26px] bg-[var(--color-surface-muted)]">
        {backgroundImage ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: toneStyle.bg }}>
            <Icon size={28} style={{ color: toneStyle.fg }} />
          </div>
        )}
      </div>

      <div className="relative flex flex-col items-center justify-center px-4 py-2 text-center">
        <span className="text-[20px] font-bold leading-tight text-[var(--color-text)] sm:text-[20px]">{title}</span>
        {description && <p className="mt-1 text-[15px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>}
      </div>

      {badge && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: toneStyle.bg, color: toneStyle.fg }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
