import type { MetadataRoute } from "next";
import { tools } from "@/config/tools";
import { siteConfig } from "@/config/site";

const STATIC_PATHS = [
  "",
  "/tools",
  "/image-tools",
  "/pdf-tools",
  "/conversion-tools",
  "/application-tools",
  "/how-it-works",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const toolEntries: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${siteConfig.url}/${tool.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...toolEntries];
}
