import { ToolFaqItem } from "@/types/tool";

export function FAQ({ items }: { items: ToolFaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-bold text-[var(--color-text)]">
        Frequently Asked Questions
      </h2>
      <div className="mt-4 divide-y divide-[var(--color-border)] card px-5">
        {items.map((item, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[var(--color-text)] focus-ring rounded">
              <span>{item.q}</span>
              <span className="shrink-0 text-[var(--color-text-subtle)] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
