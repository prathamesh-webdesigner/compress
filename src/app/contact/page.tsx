import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ContactForm } from "@/components/ContactForm";
import { pageMetadata, siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Contact the ${siteConfig.name} team with questions, feedback or requests for new image and PDF tools.`,
  path: "/contact",
  keywords: ["contact CompNivi", "file tool support", "image compressor support"],
});

const POINTS = [
  { icon: MessageCircle, text: "Questions, feedback or a tool request are all welcome." },
  { icon: Clock, text: "We typically reply within 1–2 business days." },
  { icon: ShieldCheck, text: "Your message is sent securely and never shared." },
];

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="bg-dot-grid absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
          <Mail size={13} /> Get in touch
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">Contact Us</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          Questions, feedback or a tool request? Send us a message and we&apos;ll get back to you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {POINTS.map((p) => (
              <div key={p.text} className="card flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <p.icon size={16} />
                </span>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{p.text}</p>
              </div>
            ))}
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
