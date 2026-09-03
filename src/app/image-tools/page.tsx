import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { getToolsByCategory } from "@/config/tools";

export const metadata: Metadata = {
  title: "Image Compression Tools",
  description: "Compress JPG, PNG and WebP images to an exact KB or MB target, free and in your browser.",
  alternates: { canonical: "/image-tools" },
};

export default function ImageToolsPage() {
  const tools = getToolsByCategory("image-compress");
  return (
    <CategoryPage
      title="Image Compression Tools"
      intro="Shrink JPG, PNG and WebP images down to an exact file size — from 20 KB up to 1 MB, or any custom target — while keeping them as sharp as possible."
      tools={tools}
    />
  );
}
