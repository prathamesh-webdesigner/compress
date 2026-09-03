import { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export function LegalLayout({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
      {updated && <p className="mt-2 text-sm text-[var(--color-text-subtle)]">Last updated: {updated}</p>}
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-[var(--color-text-muted)] [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[var(--color-text)] [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
