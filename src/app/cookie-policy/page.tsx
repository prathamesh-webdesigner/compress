import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${siteConfig.name} uses cookies.`,
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="[Insert publish date]">
      <p>This Cookie Policy explains what cookies are and how {siteConfig.name} uses them.</p>

      <h2>What are cookies</h2>
      <p>Cookies are small text files stored on your device that help websites remember information about your visit.</p>

      <h2>Cookies we use</h2>
      <ul>
        <li><strong>Essential cookies:</strong> required for basic site functionality.</li>
        <li><strong>Analytics cookies:</strong> if enabled, help us understand how the site is used so we can improve it.</li>
        <li><strong>Advertising cookies:</strong> if enabled, used by ad networks (such as Google AdSense) to serve and measure ads.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You can control or delete cookies through your browser settings. Where required by applicable law, we present
        a consent option before loading non-essential analytics or advertising scripts.
      </p>

      <p className="text-sm text-[var(--color-text-subtle)]">
        [This is a template. Replace bracketed placeholders and review with legal counsel before publishing.]
      </p>
    </LegalLayout>
  );
}
