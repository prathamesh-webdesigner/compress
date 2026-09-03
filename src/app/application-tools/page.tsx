import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { getToolsByCategory } from "@/config/tools";

export const metadata: Metadata = {
  title: "Application Tools — Signature & Passport Photo",
  description: "Purpose-built resizers and compressors for signatures and passport photos that meet common form and portal requirements.",
  alternates: { canonical: "/application-tools" },
};

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
