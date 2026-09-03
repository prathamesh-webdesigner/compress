import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { getToolsByCategory } from "@/config/tools";

export const metadata: Metadata = {
  title: "PDF Compression Tools",
  description: "Compress PDF files to an exact KB or MB target for email, portals and forms.",
  alternates: { canonical: "/pdf-tools" },
};

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
