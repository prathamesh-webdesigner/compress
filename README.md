# CompNivi

Free, browser-first tools to compress and convert images and PDFs to an exact KB or MB size. Built with Next.js (App Router), React, TypeScript and Tailwind CSS.

## What's inside

- **Image compression** to an exact target size (20 KB → 1 MB, or custom), running entirely client-side via the Canvas API and a Web Worker, using an iterative quality/dimension search.
- **Compress Image (Keep Quality)** — a quality-preserving compressor with no target size and no forced resizing: it always keeps original dimensions and re-encodes at a fixed, visually-lossless quality setting (`src/lib/imageCompression.ts`, `compressImageSmart`).
- **4K Image Upscaler** — enlarges an image 2x or toward 4K (3840×2160) using multi-step high-quality canvas resampling plus an unsharp-mask sharpening pass (`upscaleImage` in `src/lib/imageCompression.ts`). This is a genuine classical algorithm, not a generative AI model, and the UI says so explicitly.
- **PDF compression** to an exact target size with three selectable compression levels (Maximum Quality / Balanced / Maximum Compression), via a server API route (`/api/compress-pdf`) that recompresses embedded images with `sharp` and rebuilds the file with `pdf-lib`. The Maximum Quality level never drops encoding quality below its floor just to force-fit the numeric target.
- **Image utilities**: resizing, JPG/PNG/WebP conversion, image → PDF.
- **Application tools**: signature and passport photo resizers/compressors.
- 36 tool pages, each with unique SEO content, generated from a central config (`src/config/tools.ts`).
- A shared, premium design system (gradient accents, tone-colored tool cards, consistent cards/buttons/inputs) applied across the homepage, all four category pages, every individual tool page, How It Works, About and Contact.
- Sitemap, robots.txt, JSON-LD structured data (WebApplication, SoftwareApplication, BreadcrumbList, FAQPage), Open Graph/Twitter metadata.
- AdSense- and GA4-ready (disabled until you add IDs), legal pages, 404 page, tool search.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit values as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm run start
```

`npm run build` runs the Next.js production build (Turbopack) and type-checks the project. `npm run lint` runs ESLint separately.

## Environment variables

See `.env.example` for the full list with comments. Summary:

| Variable | Public? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL used in metadata, sitemap, JSON-LD |
| `NEXT_PUBLIC_GA_ID` | yes | Google Analytics 4 Measurement ID (defaults to `G-1MX16G6167`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | yes | Google AdSense publisher ID (blank = ads disabled) |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | yes | Individual ad slot IDs per placement |
| `NEXT_PUBLIC_MAX_FILE_SIZE_IMAGE_MB` / `_PDF_MB` | yes | Upload size limits |
| `NEXT_PUBLIC_MAX_BATCH_FILES` | yes | Max files per batch compression (default 10) |
| `CONTACT_EMAIL` | server | Destination address shown/used for the contact form |
| `WEB3FORMS_ACCESS_KEY` | server | Delivers `/api/contact` submissions by email via Web3Forms (see below) |
| `RESEND_API_KEY` | server | Alternative provider — used only if `WEB3FORMS_ACCESS_KEY` is unset |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | server | Shared counter storage for total files created |

**Never** put secrets in a `NEXT_PUBLIC_*` variable — anything with that prefix is bundled into client-side JavaScript.

The total files created counter is shared across all devices through Upstash Redis. Create a Redis database in Upstash and add its REST URL and token as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the deployment environment.

### Contact form email delivery

`/api/contact` sends real email via [Web3Forms](https://web3forms.com) when `WEB3FORMS_ACCESS_KEY` is configured in your hosting provider. To configure delivery, either:

- Get your own free Web3Forms access key (instant, no signup — just enter an email at web3forms.com) and set `WEB3FORMS_ACCESS_KEY`, or
- Set `RESEND_API_KEY` instead (used only when `WEB3FORMS_ACCESS_KEY` is not set) and update `CONTACT_EMAIL` to the destination address.

If neither is configured, submissions are logged server-side instead of emailed, so nothing is silently lost.

## Deployment

The app is a standard Next.js app and deploys to any Node-capable host (Vercel, a Docker container, a Node server, etc.). The PDF compression route uses `sharp`, which needs a Node.js runtime (already configured via `serverExternalPackages: ["sharp"]` in `next.config.ts`) — it will not work on an Edge runtime.

## Adding a new tool

1. Add an entry to the `tools` array in `src/config/tools.ts` (or use the `imgTool(...)` helper for another "compress image/jpg/png to X KB" page). Every field is typed — `slug`, `title`, `engine`, accepted file types, SEO metadata, content sections, tips, FAQ and related tool slugs.
2. Pick the right `engine`: `image-target-size` / `image-custom-size` (compress to a size), `image-smart-compress` (quality-preserving, no target), `image-resize`, `image-convert`, `image-to-pdf`, `image-upscale`, or `pdf-target-size`. `ToolRunner` (`src/components/tools/ToolRunner.tsx`) maps each engine to its interactive component.
3. The page at `src/app/[slug]/page.tsx` picks it up automatically via `generateStaticParams` — no new route file needed.
4. Add the slug to `relatedSlugs` on a few existing tools so it's discoverable through internal links, and to a category page (`src/app/image-tools/page.tsx` etc.) if it should appear there.

## Adding a new SEO landing page

SEO pages for target sizes are just tool entries in `src/config/tools.ts` — see `imgTool(...)` and the PDF tools array for the pattern used to generate genuinely different copy per size tier (`src/lib/toolContent.ts`, `tierForKB`). Avoid copy that only swaps the number; the tier-based content in `toolContent.ts` is there specifically so pages differ in substance, not just digits.

## AdSense configuration

1. Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to your AdSense publisher ID (`ca-pub-...`).
2. Set one or more `NEXT_PUBLIC_ADSENSE_SLOT_*` variables to real ad unit slot IDs.
3. `<AdPlaceholder slot={...} />` (`src/components/ui/AdPlaceholder.tsx`) renders nothing until both a client ID and a slot ID are present, so unconfigured placements never show a broken/empty box. Placements are used below the header, mid-content, and before related tools on tool pages — never inside the active upload/compression flow.

## Analytics configuration

The root layout loads the Google Analytics tag globally using `G-1MX16G6167` by default. Set `NEXT_PUBLIC_GA_ID` to another GA4 Measurement ID, or leave it blank to use the project default. Event tracking helpers live in `src/lib/analytics.ts` (`trackEvent`) and are already wired into the tool components for `tool_opened`, `file_selected`, `compression_started`, `compression_completed`, and `compression_failed` events. No file names, file contents, or PII are ever sent.

## Sitemap & robots

`src/app/sitemap.ts` and `src/app/robots.ts` use Next.js's built-in metadata route conventions and are generated automatically from the tool config plus a static page list — no manual sitemap maintenance needed when you add a tool via the config.

## Compression architecture

**Images** (`src/lib/imageCompression.ts`, run inside `src/workers/image-compressor.worker.ts` via `src/hooks/useImageCompressor.ts`, with an automatic main-thread fallback if Web Workers/OffscreenCanvas aren't available):

1. Decode the image with `createImageBitmap`.
2. Decide the output format (respecting the tool's forced format, or auto-picking JPEG over non-transparent PNG).
3. Binary-search JPEG/WebP quality (0.02–0.97) for the highest quality whose encoded size is ≤ the target.
4. If even the lowest quality doesn't fit, scale dimensions down (~18% per step, floor 64px) and repeat the quality search.
5. For PNG (which the Canvas API can't quality-tune), shrink dimensions directly; if a `keep`-format tool still can't reach the target, fall back to WebP (which supports both transparency and quality tuning) and clearly label the format change in the result.
6. Return the highest-quality result that fits, or the smallest achievable result plus an on-screen warning if the target truly can't be reached.

**PDFs** (`src/app/api/compress-pdf/route.ts`, Node runtime):

1. Load the PDF with `pdf-lib`, strip non-essential metadata.
2. Walk every indirect object for image XObjects; for JPEG-encoded (`DCTDecode`) images and safe raw Flate-encoded RGB/Gray images (no soft mask, no indexed color — anything else is left untouched to avoid corruption), decode to raw pixels via `sharp`, downsampling to a 1800px ceiling if larger.
3. Binary-search a single JPEG quality across all extracted images (bounds depend on the selected compression level — see below), rebuilding the PDF (`useObjectStreams: true`) at each candidate and checking total size, until the highest quality that fits the target is found.
4. Return the compressed PDF, or the smallest achievable version plus a warning if the target can't be reached safely. The uploaded file is held only in server memory for the duration of the request and is never persisted to disk.

**PDF compression levels** (`LEVEL_CONFIG` in `src/app/api/compress-pdf/route.ts`), sent from the UI as a `level` form field:

| Level | Image dimension ceiling | Quality range | Behavior when the target can't be hit |
| --- | --- | --- | --- |
| Maximum Quality | 2400px | 60–95 | Never drops below quality 60 just to force-fit the target — quality wins over the number. |
| Balanced (default) | 1800px | 35–88 | Falls back to quality 35 as the smallest safe attempt. |
| Maximum Compression | 1200px | 15–70 | Falls back to quality 15 as the smallest safe attempt. |

**Image upscaler** (`upscaleImage` in `src/lib/imageCompression.ts`): enlarges in repeated 2x steps (rather than one large stretch) using the canvas's high-quality resampler, then applies a 3×3 unsharp-mask convolution pass. It is explicitly documented in the UI and tool copy as a classical algorithm, not AI/ML super-resolution — it can sharpen and enlarge existing detail but cannot invent detail that was never captured.

## License

Provided as-is for the project owner to configure and deploy.
