import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { getToolsByCategory } from "@/config/tools";
import { pageMetadata } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Application Tools — Signature & Passport Photo",
  description: "Purpose-built resizers and compressors for signatures and passport photos that meet common form and portal requirements.",
  path: "/application-tools",
  keywords: ["passport photo resizer", "signature resizer", "compress signature", "visa photo size"],
});

export default function ApplicationToolsPage() {
  const tools = getToolsByCategory("application");
  return (
    <CategoryPage
      title="Application Tools"
      intro="Purpose-built signature and passport photo tools that meet common bank, exam and visa portal requirements for dimensions and file size."
      tools={tools}
    />
  );
}
