import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { pageMetadata, siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy",
  description: `Learn how ${siteConfig.name} uses cookies, analytics and advertising technologies on this website.`,
  path: "/cookie-policy",
  keywords: ["CompNivi cookie policy", "website cookies", "analytics cookies"],
});

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="04-09-2026">
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

    </LegalLayout>
  );
}
