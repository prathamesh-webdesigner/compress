import type { Metadata } from "next";
import { Cpu, FileUp, MousePointerClick, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { pageMetadata, siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description: `Learn how ${siteConfig.name} compresses, resizes and converts files while protecting your privacy.`,
  path: "/how-it-works",
  keywords: ["how image compression works", "how PDF compression works", "private browser file processing"],
});

const STEPS = [
  { n: "01", icon: MousePointerClick, title: "Choose a tool", body: "Pick a preset target size (like 100 KB) or a custom-size tool if your limit doesn't match a preset." },
  { n: "02", icon: FileUp, title: "Upload your file", body: "Drag and drop, or tap to browse from your device. Nothing uploads until you choose a file." },
  { n: "03", icon: SlidersHorizontal, title: "Set your target", body: "Confirm or adjust the target size in KB or MB, or pick a compression level for PDFs." },
  { n: "04", icon: Sparkles, title: "Preview and download", body: "Check the before/after comparison and file size, then download — or process another file." },
];

export default function HowItWorksPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="bg-dot-grid absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "How It Works" }]} />
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
          <Cpu size={13} /> Under the hood
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">How {siteConfig.name} Works</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
          Built to get you from &quot;a file that&apos;s too big&quot; to &quot;a file that fits&quot; in as few steps as
          possible, without an account and without sacrificing more quality than necessary.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.n} className="card relative overflow-hidden p-6">
              <span aria-hidden className="absolute -right-2 -top-4 text-6xl font-black text-[var(--color-surface-muted)]">{step.n}</span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <step.icon size={20} />
              </span>
              <h2 className="relative mt-4 font-semibold text-[var(--color-text)]">{step.title}</h2>
              <p className="relative mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-[var(--color-text)]">The image compression algorithm</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              For target-size tools, the compressor first tries adjusting JPEG or WebP quality using a binary search: it
              repeatedly tests quality settings to find the highest one whose output size is at or below your target.
              Only if quality reduction alone can&apos;t reach the target does it reduce the image&apos;s pixel
              dimensions, then repeats the quality search at the smaller size — quality first, dimensions second, to
              stay as close to the original resolution as possible. Our quality-preserving Compress Image tool skips
              this search entirely and always keeps full dimensions with one high-quality encoding pass.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-[var(--color-text)]">The PDF compression approach</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              For PDFs, size is driven almost entirely by embedded images. The compressor extracts each embedded image,
              recompresses it using the same quality-search approach (bounded by whichever compression level you
              choose), and rebuilds the PDF with a more compact internal structure. Unnecessary metadata is stripped
              along the way. Text, fonts, vector graphics and page layout are never rasterized or altered.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-[var(--color-text)]">The image upscaler</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              The 4K Image Upscaler enlarges images in repeated 2x steps using high-quality resampling, then applies a
              sharpening pass to counteract the softness scaling introduces. It is a classical algorithm, not a
              generative AI model — it enhances existing detail rather than inventing new detail.
            </p>
          </div>
          <div className="card flex flex-col justify-between gap-2 p-6">
            <div className="flex items-center gap-2 text-[var(--color-success)]">
              <ShieldCheck size={18} />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Privacy by default</h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              Image tools and the upscaler run entirely in your browser and never touch our servers. PDF compression is
              the one exception — it requires temporary server-side processing, and files are held only in memory and
              discarded immediately after your compressed file is returned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
