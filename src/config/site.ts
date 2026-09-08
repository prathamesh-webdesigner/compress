import type { Metadata } from "next";

export const siteConfig = {
  name: "CompNivi",
  tagline: "Compress Files to the Size You Need",
  description:
    "Free online tools to compress images and PDFs to a specific KB or MB size. Reduce file size while preserving the best possible quality.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://compress.nivishdigital.com",
  contactEmail: process.env.CONTACT_EMAIL || "info@nivishdigital.com",
  ga4Id: process.env.NEXT_PUBLIC_GA_ID || "G-1MX16G6167",
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
  maxImageFileSizeMB: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_IMAGE_MB || 20),
  maxPdfFileSizeMB: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_PDF_MB || 20),
  maxBatchFiles: Number(process.env.NEXT_PUBLIC_MAX_BATCH_FILES || 10),
  twitterHandle: "@compnivi",
} as const;

export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    ...(keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      url,
      title,
      description,
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const AD_SLOTS = {
  belowHeader: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BELOW_HEADER || "",
  midContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_CONTENT || "",
  inArticle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || "",
  beforeRelated: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEFORE_RELATED || "",
} as const;
