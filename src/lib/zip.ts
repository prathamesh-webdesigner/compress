import { zipSync, type Zippable } from "fflate";

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Bundles multiple output files into a single downloadable ZIP blob, entirely client-side. */
export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  const data: Zippable = {};
  const usedNames = new Set<string>();

  for (const entry of entries) {
    let name = entry.name;
    let suffix = 1;
    while (usedNames.has(name)) {
      const dot = entry.name.lastIndexOf(".");
      name = dot > 0 ? `${entry.name.slice(0, dot)}-${suffix}${entry.name.slice(dot)}` : `${entry.name}-${suffix}`;
      suffix++;
    }
    usedNames.add(name);
    const buf = new Uint8Array(await entry.blob.arrayBuffer());
    data[name] = [buf, { level: 0 }]; // level 0: contents are already-compressed images/PDFs, so just store
  }

  const zipped = zipSync(data);
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}
