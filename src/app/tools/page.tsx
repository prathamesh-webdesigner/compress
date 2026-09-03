import type { Metadata } from "next";
import { CategoryPage } from "@/components/tools/CategoryPage";
import { tools } from "@/config/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Browse every free SizeSnap tool for compressing, converting and resizing images and PDFs.",
  alternates: { canonical: "/tools" },
};

export default function AllToolsPage() {
  return <CategoryPage title="All Tools" intro="Every free SizeSnap tool in one place." tools={tools} />;
}
