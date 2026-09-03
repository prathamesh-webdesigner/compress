import { ToolContentSection, ToolFaqItem } from "@/types/tool";

/**
 * Generates genuinely differentiated copy for the "compress image/jpg/png to X KB"
 * family of pages. Content varies by size tier (not just a swapped number) because the
 * real-world use case, achievable quality and advice change meaningfully as the target
 * shrinks. Callers can still override any individual field on the final Tool object.
 */

export type SizeTier = "ultra-compact" | "very-small" | "compact" | "moderate" | "generous" | "large";

export function tierForKB(kb: number): SizeTier {
  if (kb <= 25) return "ultra-compact";
  if (kb <= 60) return "very-small";
  if (kb <= 120) return "compact";
  if (kb <= 250) return "moderate";
  if (kb <= 600) return "generous";
  return "large";
}

interface ImageContentInput {
  label: string; // e.g. "20 KB", "1 MB"
  sizeKB: number; // normalized to KB for tier calc
  formatWord: string; // "image", "JPG", "PNG"
  useCaseHint?: string;
}

const tierUseCase: Record<SizeTier, string> = {
  "ultra-compact":
    "government portals, exam and recruitment forms, and older upload widgets that cap attachments at 20-25 KB",
  "very-small":
    "passport and ID photo uploads, e-signature fields and application forms that ask for a 50 KB or smaller file",
  compact:
    "resumes, profile photos, web forms and most online applications that cap uploads around 100 KB",
  moderate:
    "website thumbnails, blog images, marketplace listings and forms with a 200 KB ceiling",
  generous:
    "email attachments, CMS uploads and forms that allow up to roughly 500 KB per file",
  large:
    "sharing full-resolution photos by email, uploading to a CMS, or any form that allows up to about 1 MB",
};

const tierQualityNote: Record<SizeTier, string> = {
  "ultra-compact":
    "At this size some visible softening and compression artifacts are unavoidable for anything but very simple images. Small, low-detail photos (headshots, scanned signatures, logos) hold up far better than busy, high-resolution photography.",
  "very-small":
    "There is still limited headroom, so detailed photographs will lose some fine texture. Portraits, documents and graphics with large flat areas compress cleanly; landscapes and busy scenes show more artifacts.",
  compact:
    "Most everyday photos reach this size with only mild, hard-to-notice softening. It is a practical middle ground between file size and visual quality for general use.",
  moderate:
    "This target gives the compressor enough room that quality loss is usually minor and hard to spot at normal viewing sizes, even for detailed photography.",
  generous:
    "Quality loss is typically negligible at this size. Only very high-resolution or highly detailed originals need meaningful compression to get here.",
  large:
    "This is a generous budget. Most photos from phones and cameras will need only light compression, if any, to fit within it.",
};

export function buildImageIntro({ label, sizeKB, formatWord }: ImageContentInput): string {
  const tier = tierForKB(sizeKB);
  return `Reduce your ${formatWord.toLowerCase()} to ${label} or less while preserving the best possible quality. This tool is built for ${tierUseCase[tier]}. Everything runs in your browser, so nothing is uploaded to a server.`;
}

export function buildImageContentSections(input: ImageContentInput): ToolContentSection[] {
  const { label, sizeKB, formatWord } = input;
  const tier = tierForKB(sizeKB);
  return [
    {
      heading: "How to use this tool",
      body: `Drag your ${formatWord.toLowerCase()} into the upload area (or tap to browse on mobile), confirm the target of ${label}, then press Compress. The tool analyzes the image, iteratively adjusts quality and, if needed, dimensions, and stops as soon as the output is at or below ${label}. Download the result or compress another file — no account or upload required.`,
    },
    {
      heading: `Getting a ${formatWord.toLowerCase()} down to ${label}`,
      body: `${tierQualityNote[tier]} The compressor always tries quality reduction first and only resizes the image's dimensions if quality adjustment alone cannot reach ${label}, so you keep the original resolution whenever possible.`,
    },
    {
      heading: "Why you might need this",
      body: `Many forms, portals and application systems enforce a hard file size ceiling rather than a quality standard. A photo straight from a modern phone camera is usually several megabytes — far above limits like ${label} — so it needs deliberate compression, not just resizing, to be accepted.`,
    },
  ];
}

export function buildImageTips(input: ImageContentInput): string[] {
  const tier = tierForKB(input.sizeKB);
  const tips = [
    "Start from the highest-quality original you have — compressing an already-compressed file compounds quality loss.",
    "Crop out unnecessary background before compressing; a tighter crop means more of your size budget goes to the subject that matters.",
  ];
  if (tier === "ultra-compact" || tier === "very-small") {
    tips.push(
      "For very small targets, a simple, well-lit photo with a plain background compresses far more cleanly than a busy or low-light shot."
    );
    tips.push("If the result still looks too soft, try a smaller source photo rather than a large one forced down aggressively.");
  } else {
    tips.push("Keep the original file until you are happy with the compressed version, in case you want to try a different target size.");
  }
  return tips;
}

export function buildImageFaq(input: ImageContentInput): ToolFaqItem[] {
  const { label, formatWord } = input;
  return [
    {
      q: `How can I reduce ${a(formatWord)} to ${label}?`,
      a: `Upload your file above, keep the target set to ${label}, and press Compress. The tool automatically finds the highest quality setting that still fits within ${label}.`,
    },
    {
      q: "Will compressing reduce quality?",
      a: `Yes — fitting a file into a smaller size always involves some trade-off. This tool prioritizes staying at or under ${label} while keeping quality as high as that budget allows; it will not falsely claim zero quality loss.`,
    },
    {
      q: "Are my files uploaded to a server?",
      a: "No. Image compression on this page runs entirely in your browser using the Canvas API. Your file never leaves your device.",
    },
    {
      q: "Can I use this on my phone?",
      a: "Yes. The uploader supports the mobile file picker and camera roll, and the interface is designed to work on small screens.",
    },
    {
      q: "What happens if the target size is impossible to reach?",
      a: `If ${label} cannot be reached without extreme degradation, the tool clearly warns you and gives you the smallest reasonable version it could produce instead of silently failing.`,
    },
  ];
}

function a(word: string) {
  return /^[aeiou]/i.test(word) ? `an ${word.toLowerCase()}` : `a ${word.toLowerCase()}`;
}
