import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tools, getToolBySlug, getRelatedTools } from "@/config/tools";
import { getCategoryMeta } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { FAQ } from "@/components/ui/FAQ";
import { RelatedTools } from "@/components/ui/RelatedTools";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { JsonLd, breadcrumbSchema, faqSchema, softwareApplicationSchema } from "@/components/structured-data/JsonLd";
import { AD_SLOTS } from "@/config/site";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: tool.seoTitle,
    description: tool.metaDescription,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: {
      title: tool.seoTitle,
      description: tool.metaDescription,
      url: `${siteConfig.url}/${tool.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: tool.seoTitle,
      description: tool.metaDescription,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const category = getCategoryMeta(tool.category);
  const related = getRelatedTools(tool);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(category ? [{ label: category.label, href: `/${category.slug}` }] : []),
    { label: tool.title },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbSchema(siteConfig.url, breadcrumbItems)} />
      <JsonLd data={softwareApplicationSchema(siteConfig.url, tool)} />
      {tool.faq.length > 0 && <JsonLd data={faqSchema(tool.faq)} />}

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">{tool.title}</h1>
      <p className="mt-3 max-w-2xl text-base text-[var(--color-text-muted)]">{tool.intro}</p>

      <AdPlaceholder slot={AD_SLOTS.belowHeader} />

      <div className="mt-6">
        <ToolRunner tool={tool} />
      </div>

      <div className="mt-14 space-y-10">
        {tool.contentSections.map((section, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold text-[var(--color-text)]">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{section.body}</p>
            {i === 0 && <AdPlaceholder slot={AD_SLOTS.midContent} />}
          </section>
        ))}

        {tool.tips.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[var(--color-text)]">Tips for the best result</h2>
            <ul className="mt-3 space-y-2">
              {tool.tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <FAQ items={tool.faq} />

        <AdPlaceholder slot={AD_SLOTS.beforeRelated} />

        <RelatedTools tools={related} />
      </div>
    </div>
  );
}
