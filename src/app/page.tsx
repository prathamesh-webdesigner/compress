import type { Metadata } from "next";
import Link from "next/link";
import {
  Image as ImageIcon,
  FileText,
  RefreshCw,
  IdCard,
  ShieldCheck,
  Zap,
  Gauge,
  UploadCloud,
  SlidersHorizontal,
  Download,
  Layers,
  Lock,
  FolderArchive,
  ArrowRight,
} from "lucide-react";
import { SearchBox } from "@/components/ui/SearchBox";
import { ToolCard, ToolCardTone } from "@/components/ui/ToolCard";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { FAQ } from "@/components/ui/FAQ";
import { HeroIllustration } from "@/components/HeroIllustration";
import { JsonLd, faqSchema } from "@/components/structured-data/JsonLd";
import { siteConfig, AD_SLOTS } from "@/config/site";
import { getToolBySlug, tools } from "@/config/tools";

export const metadata: Metadata = {
  title: "Free Image & PDF Compressor - Exact KB or MB Size",
  description:
    "Compress images and PDFs online to exact KB or MB sizes. Free image compressor, PDF compressor, resizer and converter with no sign-up.",
  keywords: [
    "compress image online",
    "compress image to 20KB",
    "compress image to 50KB",
    "compress image to 100KB",
    "compress PDF online",
    "reduce image file size",
    "resize image online",
    "image converter",
    "free online file compressor",
  ],
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: "Free Image & PDF Compressor - Exact KB or MB Size",
    description:
      "Compress images and PDFs online to exact KB or MB sizes. Free, fast and private with no sign-up required.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Free Image & PDF Compressor - Exact KB or MB Size",
    description:
      "Compress images and PDFs online to exact KB or MB sizes. Free, fast and private with no sign-up required.",
  },
};

const POPULAR_IMAGE = ["compress-image", "compress-image-to-100kb", "compress-image-to-200kb", "compress-image-to-500kb"];
const POPULAR_PDF = ["compress-pdf-to-100kb", "compress-pdf-to-500kb", "compress-pdf-to-1mb"];
const CONVERSION = ["jpg-to-png", "png-to-jpg", "webp-to-jpg", "image-to-pdf"];
const APPLICATION = ["passport-photo-resizer", "signature-resizer", "compress-signature-to-20kb"];
const ENHANCE = ["image-upscaler-4k", "image-resizer", "resize-image-to-custom-dimensions"];

const HOME_FAQ = [
  {
    q: "Is CompNivi really free?",
    a: "Yes. Every tool is free to use with no account, no watermark and no artificial limits designed to push you toward a paid plan. The site may show ads to cover hosting costs.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "Image compression, resizing, conversion and the 4K upscaler all run entirely in your browser and never leave your device. PDF compression is the one exception — it needs temporary server-side processing, and files are held only in memory and deleted immediately after your compressed file is returned.",
  },
  {
    q: "Will compressing reduce my image or PDF quality?",
    a: "Our target-size tools find the highest quality that fits your requested size, prioritizing quality over aggressive shrinking. If you don't need a specific size at all, use Compress Image (Keep Quality) or a Maximum Quality PDF compression level — both are built to avoid any noticeable quality loss.",
  },
  {
    q: "Is the 4K Image Upscaler powered by AI?",
    a: "No — it's a genuine multi-step resampling and sharpening pipeline, not a generative AI model. We're upfront about this so you know it enhances existing detail rather than inventing new detail.",
  },
  {
    q: "How many files can I process at once?",
    a: `Most tools support batch uploads of up to ${siteConfig.maxBatchFiles} files at a time, downloadable together as a single ZIP.`,
  },
];

const STATS = [
  { label: "Free tools", value: `${tools.length}+` },
  { label: "Files per batch", value: `${siteConfig.maxBatchFiles}` },
  { label: "Free to use", value: "100%" },
  { label: "Account required", value: "None" },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload your files", body: "Drag & drop up to 10 images or PDFs, or pick them from your device." },
  { icon: SlidersHorizontal, title: "Set your target size", body: "Choose a preset like 100 KB, or type any custom KB/MB target." },
  { icon: Download, title: "Download instantly", body: "Get each file back — or all of them together in one ZIP." },
];

function ToolRow({ title, slugs, href, tone }: { title: string; slugs: string[]; href: string; tone: ToolCardTone }) {
  const items = slugs.map((s) => getToolBySlug(s)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
        <Link href={href} className="group flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline">
          View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <ToolCard key={t.slug} href={`/${t.slug}`} title={t.navLabel} tone={tone} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <JsonLd data={faqSchema(HOME_FAQ)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div
          className="bg-dot-grid absolute inset-0"
          style={{ maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)" }}
          aria-hidden
        />
        <div
          className="absolute -top-32 left-1/4 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--color-brand)" }}
          aria-hidden
        />
        <div
          className="absolute -top-20 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--color-accent)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] shadow-sm">
                <Zap size={12} className="text-[var(--color-brand)]" /> Free forever &middot; No sign-up
              </span>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Compress Files to the Size You Need
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-muted)] lg:mx-0">
                Free online tools to compress images and PDFs to specific KB or MB sizes. Fast, private and free — no account required.
              </p>

              <div className="mx-auto mt-8 max-w-xl lg:mx-0">
                <SearchBox />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--color-text-subtle)] lg:justify-start">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Private &amp; secure</span>
                <span className="flex items-center gap-1.5"><Zap size={14} /> No sign-up required</span>
                <span className="flex items-center gap-1.5"><Gauge size={14} /> Instant results</span>
                <span className="flex items-center gap-1.5"><FolderArchive size={14} /> Batch + ZIP download</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[var(--color-brand)] sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)] sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        <ToolRow title="Popular Image Tools" slugs={POPULAR_IMAGE} href="/image-tools" tone="blue" />
        <ToolRow title="Popular PDF Tools" slugs={POPULAR_PDF} href="/pdf-tools" tone="rose" />

        <AdPlaceholder slot={AD_SLOTS.midContent} />

        <ToolRow title="Image Conversion" slugs={CONVERSION} href="/conversion-tools" tone="purple" />
        <ToolRow title="Resize & Enhance" slugs={ENHANCE} href="/image-tools" tone="amber" />
        <ToolRow title="Application Tools" slugs={APPLICATION} href="/application-tools" tone="teal" />

        {/* How it works teaser */}
        <section>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Three steps. That&apos;s it.</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">No installs, no accounts, no waiting rooms.</p>
          </div>
          <div className="relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-6 hidden border-t-2 border-dashed border-[var(--color-border)] sm:block"
            />
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md" style={{ background: "var(--color-brand)" }}>
                  <step.icon size={20} />
                </span>
                <span className="mt-3 text-xs font-semibold text-[var(--color-text-subtle)]">STEP {i + 1}</span>
                <h3 className="mt-1 font-semibold text-[var(--color-text)]">{step.title}</h3>
                <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-[var(--color-text-muted)]">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline">
              See the full compression architecture <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Why CompNivi */}
        <section>
          <h2 className="text-lg font-bold text-[var(--color-text)]">Why CompNivi</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <ImageIcon size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Precise size targeting</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                Tell us the exact KB or MB you need and we find the highest quality that fits — not just a generic &quot;compress&quot; button.
              </p>
            </div>
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#fff1f2", color: "#e11d48" }}>
                <FileText size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Images and PDFs</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                One place for the file compression tasks that come up again and again — forms, portals, email attachments and more.
              </p>
            </div>
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                <RefreshCw size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Convert and resize too</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                Switch formats, resize to exact dimensions, or combine images into a PDF — all in the same fast, free toolkit.
              </p>
            </div>
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#ecfeff", color: "#0891b2" }}>
                <Layers size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Batch, then ZIP</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                Compress up to {siteConfig.maxBatchFiles} files in one go and download everything together as a single ZIP.
              </p>
            </div>
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#fffbeb", color: "#b45309" }}>
                <Lock size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Private by default</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                Image compression happens entirely in your browser. Your files are never uploaded for these tools.
              </p>
            </div>
            <div className="card p-5 transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Gauge size={20} />
              </span>
              <h3 className="mt-3 font-semibold text-[var(--color-text)]">Built for speed</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                A Web Worker keeps compression off the main thread, so the page stays responsive even on large files.
              </p>
            </div>
          </div>
        </section>

        {/* Application tools CTA */}
        <section className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "#ecfeff", color: "#0891b2" }}>
              <IdCard size={22} />
            </span>
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">Need a passport photo or signature resized?</h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]">Purpose-built tools for common form and application requirements.</p>
            </div>
          </div>
          <Link href="/application-tools" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
            Browse application tools
          </Link>
        </section>

        {/* Privacy & Security */}
        <section className="card grid grid-cols-1 gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
              <ShieldCheck size={13} /> Privacy &amp; security
            </span>
            <h2 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Your files stay yours</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              We designed CompNivi around a simple rule: don&apos;t touch a server unless the task genuinely requires it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <Lock size={15} />
              </span>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">Image tools:</strong> compression, resizing, conversion and the 4K upscaler all run locally in your browser via the Canvas API. Nothing is uploaded.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                <FileText size={15} />
              </span>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">PDF tools:</strong> processed temporarily on our server (browsers can&apos;t recompress embedded PDF images), then deleted immediately after your file is returned.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)]">
                <ShieldCheck size={15} />
              </span>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">No accounts:</strong> nothing to sign up for, no file history stored, no tracking beyond basic anonymous analytics.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                <Gauge size={15} />
              </span>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">Full details:</strong> read exactly what happens to your data in our <Link href="/privacy-policy" className="font-medium text-[var(--color-brand)] hover:underline">Privacy Policy</Link>.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ items={HOME_FAQ} />

        {/* Bottom gradient CTA */}
        <section
          className="relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-12 sm:py-14"
          style={{ background: "linear-gradient(135deg, var(--color-brand), var(--color-accent))" }}
        >
          <div className="bg-dot-grid absolute inset-0 opacity-20" aria-hidden style={{ filter: "invert(1)" }} />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to shrink your first file?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/90 sm:text-base">
              No account, no watermark, no catch — just pick a tool and go.
            </p>
            <Link
              href="/tools"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand)] shadow-lg transition-transform hover:scale-[1.02]"
            >
              Browse all {tools.length} tools <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
