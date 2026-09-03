import Link from "next/link";
import {
  ArrowRight,
  FileArchive,
  Gauge,
  ImageIcon,
  Maximize2,
  Repeat,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ToolCard, ToolCardTone } from "@/components/ui/ToolCard";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Tool } from "@/types/tool";
import { AD_SLOTS } from "@/config/site";

function iconAndToneFor(tool: Tool): { icon: typeof Sparkles; tone: ToolCardTone } {
  switch (tool.engine) {
    case "image-smart-compress":
      return { icon: ShieldCheck, tone: "teal" };
    case "image-target-size":
    case "image-custom-size":
      return { icon: FileArchive, tone: "blue" };
    case "pdf-target-size":
      return { icon: FileArchive, tone: "rose" };
    case "image-resize":
      return { icon: Maximize2, tone: "amber" };
    case "image-convert":
      return { icon: Repeat, tone: "purple" };
    case "image-to-pdf":
      return { icon: ImageIcon, tone: "purple" };
    case "image-upscale":
      return { icon: Wand2, tone: "purple" };
    default:
      return { icon: Sparkles, tone: "blue" };
  }
}

const STATS = [
  { icon: Zap, label: "Runs in your browser", value: "Most tools" },
  { icon: Gauge, label: "Free, no signup", value: "Always" },
  { icon: ShieldCheck, label: "Files auto-deleted", value: "Server tools" },
];

export function CategoryPage({
  title,
  intro,
  tools,
}: {
  title: string;
  intro: string;
  tools: Tool[];
}) {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="bg-dot-grid absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />

        <div className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
            <Sparkles size={13} /> {tools.length} free tools
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">{intro}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="card flex items-center gap-2.5 px-4 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <s.icon size={15} />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-[var(--color-text)]">{s.value}</p>
                <p className="text-[11px] text-[var(--color-text-subtle)]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <AdPlaceholder slot={AD_SLOTS.belowHeader} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => {
            const { icon, tone } = iconAndToneFor(t);
            return <ToolCard key={t.slug} href={`/${t.slug}`} title={t.title} description={t.metaDescription} icon={icon} tone={tone} />;
          })}
        </div>

        <div className="mt-12 card flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-[var(--color-brand-soft)] to-[var(--color-surface)] p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Not sure which tool you need?</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Browse every tool on SizeSnap in one place, organized by what you&apos;re trying to do.</p>
          </div>
          <Link href="/tools" className="btn-primary flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm">
            View all tools <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
