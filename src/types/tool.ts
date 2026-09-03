export type ToolCategory =
  | "image-compress"
  | "pdf-compress"
  | "image-convert"
  | "image-resize"
  | "image-to-pdf"
  | "image-upscale"
  | "application";

export type EngineKind =
  | "image-target-size" // compress an image to <= target size
  | "image-custom-size" // same engine, user picks target
  | "image-smart-compress" // quality-preserving compression, no forced target
  | "pdf-target-size" // compress a pdf to <= target size (server-assisted)
  | "image-convert" // change format only
  | "image-resize" // change dimensions only
  | "image-to-pdf" // combine image(s) into a pdf
  | "image-upscale"; // upscale resolution (2x / 4K)

export type SizeUnit = "KB" | "MB";

export interface ToolFaqItem {
  q: string;
  a: string;
}

export interface ToolContentSection {
  heading: string;
  body: string;
}

export interface Tool {
  slug: string;
  title: string; // H1
  navLabel: string; // short label for nav/cards
  category: ToolCategory;
  engine: EngineKind;
  acceptedFileTypes: string[]; // extensions, e.g. ['.jpg', '.jpeg', '.png']
  acceptedMime: string[];
  outputFormat?: "jpeg" | "png" | "webp" | "pdf" | "keep";
  defaultTargetSize?: number;
  defaultTargetUnit?: SizeUnit;
  allowCustomTarget: boolean;
  maxFileSizeMB: number;
  clientSideOnly: boolean;
  seoTitle: string;
  metaDescription: string;
  intro: string;
  contentSections: ToolContentSection[];
  tips: string[];
  faq: ToolFaqItem[];
  relatedSlugs: string[];
}

export interface ToolCategoryMeta {
  key: ToolCategory;
  label: string;
  slug: string;
  description: string;
}
