import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${siteConfig.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="[Insert publish date]">
      <p>By using {siteConfig.name}, you agree to these Terms of Service. Please read them carefully.</p>

      <h2>Use of the service</h2>
      <p>
        {siteConfig.name} provides free tools to compress, convert and resize images and PDF files. The service is
        provided &quot;as is&quot; without warranties of any kind. You are responsible for ensuring you have the right to
        upload and process any file you submit.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not upload files containing illegal content, malware, or content that infringes someone else&apos;s rights.</li>
        <li>Do not attempt to disrupt, overload, or reverse-engineer the service.</li>
        <li>Do not use automated systems to abuse the service beyond reasonable personal or professional use.</li>
      </ul>

      <h2>File limits</h2>
      <p>
        Free-tier file size limits (currently {siteConfig.maxImageFileSizeMB} MB for images and {siteConfig.maxPdfFileSizeMB} MB for PDFs) are
        enforced to keep the service fast and reliable for everyone, and may change over time.
      </p>

      <h2>No warranty on output quality</h2>
      <p>
        Compression involves an inherent trade-off between file size and quality. We do not guarantee a specific
        output quality or that every requested target size is achievable without visible quality loss.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {siteConfig.name} and its operators are not liable for any indirect,
        incidental or consequential damages arising from use of the service.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

      <p className="text-sm text-[var(--color-text-subtle)]">
        [This is a template. Replace bracketed placeholders and review with legal counsel before publishing.]
      </p>
    </LegalLayout>
  );
}
