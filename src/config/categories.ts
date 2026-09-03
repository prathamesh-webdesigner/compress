import { ToolCategoryMeta } from "@/types/tool";

export const categories: ToolCategoryMeta[] = [
  {
    key: "image-compress",
    label: "Image Compression",
    slug: "image-tools",
    description:
      "Shrink JPG, PNG and WebP images down to an exact KB or MB target while keeping them as sharp as possible.",
  },
  {
    key: "pdf-compress",
    label: "PDF Compression",
    slug: "pdf-tools",
    description:
      "Reduce PDF file size for email attachments, portals and application forms without breaking the document.",
  },
  {
    key: "image-convert",
    label: "Image Conversion",
    slug: "conversion-tools",
    description: "Convert between JPG, PNG and WebP, or turn images into PDF files.",
  },
  {
    key: "image-resize",
    label: "Image Resizing",
    slug: "conversion-tools",
    description: "Resize images to exact pixel dimensions.",
  },
  {
    key: "image-to-pdf",
    label: "Image to PDF",
    slug: "conversion-tools",
    description: "Combine one or more images into a single PDF document.",
  },
  {
    key: "application",
    label: "Application Tools",
    slug: "application-tools",
    description:
      "Purpose-built resizers for signatures and passport photos that meet common form and portal requirements.",
  },
  {
    key: "image-upscale",
    label: "Image Upscaler",
    slug: "image-tools",
    description: "Enhance low-resolution images with high-quality resampling and sharpening, up to 4K.",
  },
];

export function getCategoryMeta(key: string) {
  return categories.find((c) => c.key === key);
}
