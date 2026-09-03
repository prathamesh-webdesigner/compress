import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Disclaimer for ${siteConfig.name}.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" updated="[Insert publish date]">
      <p>
        The tools on {siteConfig.name} are provided for general file compression, conversion and resizing purposes.
        While we aim for accuracy and reliability, we make no guarantees about fitness for any specific purpose.
      </p>
      <h2>Official requirements</h2>
      <p>
        Tools such as the Passport Photo Resizer and Signature Resizer help you meet common dimension and file size
        requirements, but requirements vary by country, institution and form. Always verify current official
        requirements with the relevant authority before submitting a document or photo.
      </p>
      <h2>No professional advice</h2>
      <p>
        Nothing on this site constitutes legal, financial, or professional advice. Use of our tools is at your own
        discretion and risk.
      </p>
      <p className="text-sm text-[var(--color-text-subtle)]">
        [This is a template. Replace bracketed placeholders and review with legal counsel before publishing.]
      </p>
    </LegalLayout>
  );
}
