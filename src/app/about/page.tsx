import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Lock, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name} — free browser-based tools for compressing and converting images and PDFs.`,
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Target, title: "Purpose-built", body: "Every tool solves one specific, common problem — like fitting a signature under 20 KB — instead of a generic all-in-one editor." },
  { icon: Lock, title: "Private by default", body: "Image tools process entirely on your device. Nothing is uploaded unless the task genuinely requires it." },
  { icon: Zap, title: "Fast and free", body: "No account, no watermark, no artificial limits designed to push you toward a paid plan." },
  { icon: ShieldCheck, title: "Honest about limits", body: "We tell you plainly when a target can't be hit, when a format has trade-offs, or when a feature is not AI." },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="bg-dot-grid absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
          <Heart size={13} /> Our mission
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">About {siteConfig.name}</h1>

        <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {siteConfig.name} provides free, browser-based file utilities that help people resize, convert and
            compress images and PDFs for common online applications, websites, forms, email and document submission
            requirements.
          </p>
          <p>
            A lot of everyday tasks — uploading a passport photo, attaching a resume, submitting a signature to a bank
            form, or fitting a scanned document under an email attachment limit — are blocked by an arbitrary file
            size limit rather than a quality standard. {siteConfig.name} is built specifically to solve that problem:
            tell it the size you need, and it finds the best possible quality that fits.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <v.icon size={18} />
              </span>
              <h2 className="mt-3 font-semibold text-[var(--color-text)]">{v.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
            <Sparkles size={18} className="text-[var(--color-brand)]" /> Technology &amp; privacy approach
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Wherever technically possible, files are processed entirely in your browser using the Canvas API and never
            uploaded to a server. PDF compression is the one exception — it requires temporary server-side processing
            to recompress embedded images and rebuild the file efficiently, and files are discarded immediately after
            processing. You can read the specifics in our{" "}
            <Link href="/privacy-policy" className="font-medium text-[var(--color-brand)] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {siteConfig.name} is free to use and does not require an account for any of its core functionality. The
            site may display advertising to support hosting costs; ads are never placed inside the active compression
            flow.
          </p>
        </div>

        <p className="mt-6 text-sm text-[var(--color-text-subtle)]">
          [Company / entity information can be added here — legal name, registration details, and any information the
          site owner wants to provide.]
        </p>
      </div>
    </div>
  );
}
