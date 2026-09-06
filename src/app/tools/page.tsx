import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { tools } from "@/config/tools";
import { pageMetadata } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "All Image, PDF & File Tools",
  description: "Browse free online tools to compress, convert and resize images and PDFs to the size you need.",
  path: "/tools",
  keywords: ["online file tools", "image tools", "PDF tools", "compress and resize files"],
});

export default function AllToolsPage() {
  return <CategoryPage title="All Tools" intro="Every free SizeSnap tool in one place." tools={tools} />;
}
