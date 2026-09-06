import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { getToolsByCategory } from "@/config/tools";
import { pageMetadata } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "PDF Compression Tools",
  description: "Compress PDF files to an exact KB or MB target for email, portals and forms.",
  path: "/pdf-tools",
  keywords: ["PDF compressor", "compress PDF online", "reduce PDF size", "PDF size reducer"],
});

export default function PdfToolsPage() {
  const tools = getToolsByCategory("pdf-compress");
  return (
    <CategoryPage
      title="PDF Compression Tools"
      intro="Reduce PDF file size for email attachments, application portals and forms — from 100 KB up to 5 MB, or any custom target — without breaking the document."
      tools={tools}
    />
  );
}
