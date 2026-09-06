import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { pageMetadata, siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Disclaimer",
  description: `Important information and limitations for using ${siteConfig.name} file compression, conversion and resizing tools.`,
  path: "/disclaimer",
  keywords: ["CompNivi disclaimer", "file compression limitations", "passport photo tool disclaimer"],
});

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" updated="04-09-2026">
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
    </LegalLayout>
  );
}
