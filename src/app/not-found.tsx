import Link from "next/link";
import { Search } from "lucide-react";
import { SearchBox } from "@/components/ui/SearchBox";
import { ToolCard } from "@/components/ui/ToolCard";
import { getToolBySlug } from "@/config/tools";

const POPULAR = ["compress-image-to-100kb", "compress-pdf-to-500kb", "image-to-pdf", "passport-photo-resizer"];

export default function NotFound() {
  const items = POPULAR.map((s) => getToolBySlug(s)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Search size={28} />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-[var(--color-text)]">Page not found</h1>
      <p className="mt-2 text-base text-[var(--color-text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching for a tool below.
      </p>
      <div className="mt-6 w-full max-w-md">
        <SearchBox />
      </div>

      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <ToolCard key={t.slug} href={`/${t.slug}`} title={t.title} />
        ))}
      </div>

      <Link href="/" className="btn-primary mt-10 px-5 py-2.5 text-sm">
        Back to homepage
      </Link>
    </div>
  );
}
