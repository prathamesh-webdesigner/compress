import { Tool } from "@/types/tool";
import { ToolCard } from "./ToolCard";

export function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-xl font-bold text-[var(--color-text)]">
        Related Tools
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <ToolCard key={t.slug} href={`/${t.slug}`} title={t.title} description={t.metaDescription} />
        ))}
      </div>
    </section>
  );
}
