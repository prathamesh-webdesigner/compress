import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles your files and data.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="[Insert publish date]">
      <p>
        This Privacy Policy explains how {siteConfig.name} (&quot;we&quot;, &quot;us&quot;) handles information when you use our
        website and tools.
      </p>

      <h2>File processing</h2>
      <p>
        Image compression, resizing and conversion tools run entirely in your browser using the HTML5 Canvas API. Your
        image files are never uploaded to our servers for these tools — they are read, processed and downloaded
        locally on your device.
      </p>
      <p>
        PDF compression requires temporary server-side processing, because recompressing images embedded inside a PDF
        and rebuilding the file&apos;s internal structure isn&apos;t possible purely in the browser. When you use a PDF tool,
        your file is transmitted over an encrypted connection, held only in server memory for the duration of
        processing, and discarded immediately afterward. We do not write uploaded PDFs to persistent storage, do not
        retain them after your request completes, and do not inspect their contents beyond what&apos;s required to
        compress them.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Standard server logs (IP address, browser type, pages visited) for security and reliability.</li>
        <li>Aggregated, non-identifying usage analytics (e.g. which tool was opened, whether compression succeeded) if analytics is enabled — we do not log file names, file contents, or compression targets tied to an individual.</li>
        <li>Information you voluntarily submit through our contact form (name, email, message).</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We may use cookies for essential site functionality and, where enabled, privacy-conscious analytics and
        advertising. See our <Link href="/cookie-policy" className="text-[var(--color-brand)] hover:underline">Cookie Policy</Link> for details.
      </p>

      <h2>Advertising</h2>
      <p>
        This site may display advertisements served by Google AdSense or similar networks. These networks may use
        cookies or similar technologies to serve relevant ads. You can control ad personalization through your
        browser and Google&apos;s Ad Settings.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct or delete personal data we hold about you.
        Contact us at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`} className="text-[var(--color-brand)] hover:underline">
          {siteConfig.contactEmail}
        </a>{" "}
        to make a request.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.</p>

      <p className="text-sm text-[var(--color-text-subtle)]">
        [This is a template policy. Replace bracketed placeholders and review with legal counsel before publishing.]
      </p>
    </LegalLayout>
  );
}
