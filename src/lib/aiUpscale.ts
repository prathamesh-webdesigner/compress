// Browser-side AI super-resolution (ESRGAN "RDN" medium, 4x) using TensorFlow.js.
// Loaded lazily (dynamic import) so the ~1 MB of tfjs is only fetched when the
// upscaler is actually used. Runs fully on the user's device (WebGL when
// available); images are never uploaded.

import type * as TF from "@tensorflow/tfjs";

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

// Self-hosted copy first (public/models/esrgan-medium-x4/), CDN copy as fallback.
export const DEFAULT_MODEL_URLS = [
  "/models/esrgan-medium-x4/model.json",
  "https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@1.0.0/models/x4/model.json",
];

const SCALE = 4;
const TILE = 96; // input pixels per tile (core region)
const PAD = 12; // extra context around each tile, cropped away after inference
const SLOW_CPU_MAX_PIXELS = 250_000;

let tfPromise: Promise<typeof TF> | null = null;
let modelPromise: Promise<TF.LayersModel> | null = null;
let modelKey = "";

async function getTf(): Promise<typeof TF> {
  if (!tfPromise) {
    tfPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      try {
        if (tf.getBackend() !== "webgl") await tf.setBackend("webgl");
      } catch {
        /* fall back to whatever backend is available */
      }
      await tf.ready();
      return tf;
    })();
  }
  return tfPromise;
}

async function getModel(tf: typeof TF, urls: string[]): Promise<TF.LayersModel> {
  const key = urls.join("|");
  if (!modelPromise || modelKey !== key) {
    modelKey = key;
    modelPromise = (async () => {
      let lastErr: unknown;
      for (const url of urls) {
        try {
          return await tf.loadLayersModel(url);
        } catch (e) {
          lastErr = e;
        }
      }
      throw new AiUnavailableError(
        `Could not load the AI model (${lastErr instanceof Error ? lastErr.message : "network error"}).`
      );
    })();
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

/**
 * Upscales RGBA pixels 4x. Only RGB is processed by the network; the returned
 * buffer has alpha = 255 (callers handle real alpha separately).
 */
export async function aiUpscale4x(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  opts: { onProgress?: (fraction: number) => void; modelUrls?: string[] } = {}
): Promise<Uint8ClampedArray> {
  const tf = await getTf();
  if (tf.getBackend() === "cpu" && w * h > SLOW_CPU_MAX_PIXELS) {
    throw new AiUnavailableError("WebGL is not available on this device, so AI mode would be too slow.");
  }
  const model = await getModel(tf, opts.modelUrls ?? DEFAULT_MODEL_URLS);

  const outW = w * SCALE;
  const out = new Uint8ClampedArray(outW * h * SCALE * 4);
  const tilesX = Math.ceil(w / TILE);
  const tilesY = Math.ceil(h / TILE);
  const totalTiles = tilesX * tilesY;
  let done = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * TILE;
      const y0 = ty * TILE;
      const cw = Math.min(TILE, w - x0);
      const ch = Math.min(TILE, h - y0);
      const ix0 = Math.max(0, x0 - PAD);
      const iy0 = Math.max(0, y0 - PAD);
      const ix1 = Math.min(w, x0 + cw + PAD);
      const iy1 = Math.min(h, y0 + ch + PAD);
      const iw = ix1 - ix0;
      const ih = iy1 - iy0;

      const input = new Float32Array(iw * ih * 3);
      for (let y = 0; y < ih; y++) {
        for (let x = 0; x < iw; x++) {
          const s = ((iy0 + y) * w + ix0 + x) * 4;
          const o = (y * iw + x) * 3;
          input[o] = rgba[s];
          input[o + 1] = rgba[s + 1];
          input[o + 2] = rgba[s + 2];
        }
      }

      const result = tf.tidy(() => {
        const t = tf.tensor4d(input, [1, ih, iw, 3]);
        return (model.predict(t) as TF.Tensor4D).clipByValue(0, 255);
      });
      const data = (await result.data()) as Float32Array;
      result.dispose();

      const rowLen = iw * SCALE;
      const offX = (x0 - ix0) * SCALE;
      const offY = (y0 - iy0) * SCALE;
      for (let yy = 0; yy < ch * SCALE; yy++) {
        let si = ((offY + yy) * rowLen + offX) * 3;
        let di = ((y0 * SCALE + yy) * outW + x0 * SCALE) * 4;
        for (let xx = 0; xx < cw * SCALE; xx++) {
          out[di] = data[si];
          out[di + 1] = data[si + 1];
          out[di + 2] = data[si + 2];
          out[di + 3] = 255;
          si += 3;
          di += 4;
        }
      }

      done++;
      opts.onProgress?.(done / totalTiles);
      await tf.nextFrame(); // keep the UI responsive
    }
  }
  return out;
}
