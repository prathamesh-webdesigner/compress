import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { tools } from "@/config/tools";

export const metadata: Metadata = {
  title: "Image Conversion & Resizing Tools",
  description: "Convert between JPG, PNG and WebP, resize images to exact dimensions, or combine images into a PDF.",
  alternates: { canonical: "/conversion-tools" },
};

export default function ConversionToolsPage() {
  const list = tools.filter((t) => t.category === "image-convert" || t.category === "image-resize" || t.category === "image-to-pdf");
  return (
    <CategoryPage
      title="Image Conversion & Resizing Tools"
      intro="Convert between JPG, PNG and WebP, resize images to exact pixel dimensions, or combine one or more images into a single PDF — all free and processed in your browser."
      tools={list}
    />
  );
}
