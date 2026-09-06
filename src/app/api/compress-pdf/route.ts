import { NextRequest, NextResponse } from "next/server";
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type CompressionLevel = "quality" | "balanced" | "compression";

interface LevelConfig {
  maxImageDimension: number;
  qualityLo: number;
  qualityHi: number;
  /** If true, never fall back to a quality below qualityLo just to force-fit the target — quality wins over hitting the number. */
  preserveQualityOverTarget: boolean;
}

const LEVEL_CONFIG: Record<CompressionLevel, LevelConfig> = {
  quality: { maxImageDimension: 2400, qualityLo: 60, qualityHi: 95, preserveQualityOverTarget: true },
  balanced: { maxImageDimension: 1800, qualityLo: 35, qualityHi: 88, preserveQualityOverTarget: false },
  compression: { maxImageDimension: 1200, qualityLo: 15, qualityHi: 70, preserveQualityOverTarget: false },
};

function parseLevel(raw: FormDataEntryValue | null): CompressionLevel {
  return raw === "quality" || raw === "balanced" || raw === "compression" ? raw : "balanced";
}

interface ExtractedImage {
  ref: PDFRef;
  dict: PDFDict;
  raw: Buffer; // decoded raw pixel buffer (already downsampled if needed)
  width: number;
  height: number;
  channels: 1 | 3 | 4;
  originallyJpeg: boolean;
}

/** Reads a PDF Name or Array-of-Names filter entry into a simple string list. */
function filterNames(dict: PDFDict): string[] {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (!filter) return [];
  if (filter instanceof PDFName) return [filter.asString().replace(/^\//, "")];
  if (filter instanceof PDFArray) {
    return filter.asArray().map((n) => n.toString().replace(/^\//, ""));
  }
  return [];
}

async function extractImages(pdfDoc: PDFDocument, maxImageDimension: number): Promise<ExtractedImage[]> {
  const results: ExtractedImage[] = [];
  const entries = pdfDoc.context.enumerateIndirectObjects();

  for (const [ref, obj] of entries) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    const subtype = dict.lookup(PDFName.of("Subtype"));
    if (!(subtype instanceof PDFName) || subtype.asString() !== "/Image") continue;

    const widthObj = dict.lookup(PDFName.of("Width"));
    const heightObj = dict.lookup(PDFName.of("Height"));
    if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) continue;
    const width = widthObj.asNumber();
    const height = heightObj.asNumber();
    if (!width || !height || width * height < 4096) continue; // skip tiny icons — not worth touching

    const filters = filterNames(dict);
    const isJpeg = filters.includes("DCTDecode");
    const isFlate = filters.includes("FlateDecode") && filters.length <= 1;
    const bitsPerComponent = dict.lookup(PDFName.of("BitsPerComponent"));
    const smask = dict.lookup(PDFName.of("SMask"));

    // Only handle the safe, common cases: plain JPEG streams, or Flate-encoded
    // raw 8-bit RGB/Gray with no soft mask / indexed palette. Anything else
    // (CCITT fax, JPX, indexed color, images with transparency masks) is left
    // untouched rather than risking corruption.
    if (smask) continue;
    if (bitsPerComponent && !(bitsPerComponent instanceof PDFNumber && bitsPerComponent.asNumber() === 8)) continue;

    try {
      if (isJpeg) {
        const img = sharp(Buffer.from(obj.contents));
        const meta = await img.metadata();
        const channels = (meta.channels === 1 ? 1 : 3) as 1 | 3;
        let pipeline = img;
        if (Math.max(width, height) > maxImageDimension) {
          pipeline = pipeline.resize({ width: maxImageDimension, height: maxImageDimension, fit: "inside" });
        }
        const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
        results.push({ ref, dict, raw: data, width: info.width, height: info.height, channels: (info.channels as 1 | 3 | 4) ?? channels, originallyJpeg: true });
      } else if (isFlate) {
        const colorSpace = dict.lookup(PDFName.of("ColorSpace"));
        const csName = colorSpace instanceof PDFName ? colorSpace.asString() : "";
        const channels: 1 | 3 = csName === "/DeviceGray" ? 1 : 3;
        const expectedLen = width * height * channels;
        if (obj.contents.length !== expectedLen) continue; // not a plain raw buffer we can trust
        let pipeline = sharp(Buffer.from(obj.contents), { raw: { width, height, channels } });
        let outWidth = width;
        let outHeight = height;
        if (Math.max(width, height) > maxImageDimension) {
          const scale = maxImageDimension / Math.max(width, height);
          outWidth = Math.round(width * scale);
          outHeight = Math.round(height * scale);
          pipeline = pipeline.resize(outWidth, outHeight);
        }
        const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
        results.push({ ref, dict, raw: data, width: info.width, height: info.height, channels: (info.channels as 1 | 3) ?? channels, originallyJpeg: false });
      }
    } catch {
      // If sharp can't decode this particular stream, leave it untouched.
      continue;
    }
  }
  return results;
}

async function encodeAndApply(pdfDoc: PDFDocument, images: ExtractedImage[], quality: number) {
  for (const img of images) {
    const jpegBuffer = await sharp(img.raw, { raw: { width: img.width, height: img.height, channels: img.channels } })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const dict = img.dict;
    dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    dict.delete(PDFName.of("DecodeParms"));
    dict.set(PDFName.of("Width"), PDFNumber.of(img.width));
    dict.set(PDFName.of("Height"), PDFNumber.of(img.height));
    dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    dict.set(PDFName.of("Length"), PDFNumber.of(jpegBuffer.length));
    if (img.channels === 1) {
      dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceGray"));
    } else {
      dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    }
    const newStream = PDFRawStream.of(dict, new Uint8Array(jpegBuffer));
    pdfDoc.context.assign(img.ref, newStream);
  }
}

function stripMetadata(pdfDoc: PDFDocument) {
  try {
    pdfDoc.setProducer("CompNivi");
    pdfDoc.setCreator("CompNivi");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
  } catch {
    // Non-fatal — metadata stripping is best-effort.
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const targetBytesRaw = formData.get("targetBytes");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file was provided." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "This file is too large. The maximum allowed size is 20 MB." }, { status: 400 });
    }
    const targetBytes = Number(targetBytesRaw);
    if (!targetBytes || targetBytes < 1024) {
      return NextResponse.json({ error: "A valid target size is required." }, { status: 400 });
    }
    const level = parseLevel(formData.get("level"));
    const levelConfig = LEVEL_CONFIG[level];

    const inputBytes = new Uint8Array(await file.arrayBuffer());

    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true, updateMetadata: false });
    } catch {
      return NextResponse.json({ error: "This PDF could not be read. It may be corrupted or password-protected." }, { status: 400 });
    }

    stripMetadata(pdfDoc);

    const images = await extractImages(pdfDoc, levelConfig.maxImageDimension);

    // Baseline: object-stream compaction + metadata stripping alone.
    let bestBytes = await pdfDoc.save({ useObjectStreams: true });
    let bestQuality: number | null = null;

    if (bestBytes.length > targetBytes && images.length > 0) {
      let lo = levelConfig.qualityLo;
      let hi = levelConfig.qualityHi;
      let found: Uint8Array | null = null;
      let foundQuality: number | null = null;

      // First check the top of the range as a fast path.
      await encodeAndApply(pdfDoc, images, hi);
      let candidate = await pdfDoc.save({ useObjectStreams: true });
      if (candidate.length <= targetBytes) {
        found = candidate;
        foundQuality = hi;
      } else {
        await encodeAndApply(pdfDoc, images, lo);
        candidate = await pdfDoc.save({ useObjectStreams: true });
        if (candidate.length <= targetBytes) {
          found = candidate;
          foundQuality = lo;
        }

        for (let i = 0; i < 6 && found === null; i++) {
          const mid = Math.round((lo + hi) / 2);
          await encodeAndApply(pdfDoc, images, mid);
          candidate = await pdfDoc.save({ useObjectStreams: true });
          if (candidate.length <= targetBytes) {
            found = candidate;
            foundQuality = mid;
            lo = mid;
          } else {
            hi = mid;
          }
          if (hi - lo <= 3) break;
        }
      }

      if (found) {
        bestBytes = found;
        bestQuality = foundQuality;
      } else if (!levelConfig.preserveQualityOverTarget) {
        // Couldn't fully reach the target — keep the smallest attempt (lowest quality pass).
        // Skipped entirely on the "Maximum Quality" level: hitting the target is never
        // allowed to force quality below that level's floor.
        await encodeAndApply(pdfDoc, images, levelConfig.qualityLo);
        const lowest = await pdfDoc.save({ useObjectStreams: true });
        if (lowest.length < bestBytes.length) {
          bestBytes = lowest;
          bestQuality = levelConfig.qualityLo;
        }
      } else {
        // Maximum Quality level: keep the best-quality candidate tried (qualityLo pass),
        // even though it doesn't hit the numeric target — quality wins over the target here.
        await encodeAndApply(pdfDoc, images, levelConfig.qualityLo);
        const atFloor = await pdfDoc.save({ useObjectStreams: true });
        if (atFloor.length < bestBytes.length) {
          bestBytes = atFloor;
          bestQuality = levelConfig.qualityLo;
        }
      }
    }

    const metTarget = bestBytes.length <= targetBytes;

    return new NextResponse(Buffer.from(bestBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "X-Original-Size": String(inputBytes.length),
        "X-Compressed-Size": String(bestBytes.length),
        "X-Target-Met": String(metTarget),
        "X-Quality-Used": bestQuality === null ? "" : String(bestQuality),
        "X-Level-Used": level,
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("PDF compression failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while compressing your PDF. Please try another file or a larger target size." },
      { status: 500 }
    );
  }
}
