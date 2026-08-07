// Image metrics are computed in the browser via Canvas (see computeImageMetrics).
// The server pipeline consumes these numbers; it never needs the raw pixels.

export interface ImageMetrics {
  width: number;
  height: number;
  /** Mean luminance, 0..1 */
  brightness: number;
  /** Luminance standard deviation, 0..1 (contrast proxy) */
  contrast: number;
  /** Normalized variance-of-Laplacian, 0..1 (higher = sharper) */
  sharpness: number;
  /** Mean HSV saturation, 0..1 */
  saturation: number;
  /** Hue histogram, 12 bins of 30deg each, normalized to sum 1 */
  hueHistogram: number[];
  /** Fraction of colored pixels that read as purple/blue (Gram-positive-like) */
  purpleBlueFraction: number;
  /** Fraction of colored pixels that read as pink/red (Gram-negative-like) */
  pinkRedFraction: number;
  /** Fraction of pixels at/near white (overexposure proxy) */
  overexposedFraction: number;
  /** Fraction of pixels at/near black (underexposure proxy) */
  underexposedFraction: number;
  /** Fraction of "foreground" (stained) pixels vs background */
  foregroundFraction: number;
  /** Stable integer signature derived from a downscaled thumbnail */
  signature: number;
}

const SAMPLE_MAX = 256;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

/**
 * Compute image metrics from an already-loaded HTMLImageElement.
 * Runs entirely on the client using an offscreen canvas.
 */
export function computeImageMetrics(img: HTMLImageElement): ImageMetrics {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const scale = Math.min(1, SAMPLE_MAX / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(img, 0, 0, sw, sh);
  const { data } = ctx.getImageData(0, 0, sw, sh);

  const n = sw * sh;
  const lum = new Float32Array(n);

  let sumL = 0;
  let overexposed = 0;
  let underexposed = 0;
  let saturationSum = 0;
  let coloredCount = 0;
  let purpleBlue = 0;
  let pinkRed = 0;
  let foreground = 0;
  const hueHistogram = new Array(12).fill(0);
  let signature = 2166136261; // FNV-ish seed

  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[i] = l;
    sumL += l;

    if (l > 244) overexposed++;
    if (l < 12) underexposed++;

    const [h, s, v] = rgbToHsv(r, g, b);
    saturationSum += s;

    // A pixel is "stained foreground" if it has meaningful color and isn't background white.
    if (s > 0.18 && v > 0.12) {
      coloredCount++;
      foreground++;
      const bin = Math.min(11, Math.floor(h / 30));
      hueHistogram[bin] += 1;

      // Gram-positive-like: crystal-violet purples/blues (~230-300deg)
      if (h >= 215 && h <= 305) purpleBlue++;
      // Gram-negative-like: safranin pinks/reds (>=320 or <=15, plus magenta 290-320)
      else if (h >= 305 || h <= 18 || (h >= 290 && h < 305)) pinkRed++;
    } else if (v > 0.12 && v < 0.92) {
      // mid-tone, low-saturation tissue still counts a little as foreground
      foreground += 0.3;
    }

    // Build a stable signature from coarse, downsampled luminance.
    if (i % 7 === 0) {
      signature ^= Math.round(l) & 0xff;
      signature = Math.imul(signature, 16777619) >>> 0;
    }
  }

  const meanL = sumL / n;

  // Contrast = normalized std-dev of luminance.
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    const d = lum[i] - meanL;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / n);

  // Sharpness via a simple Laplacian over the luminance grid.
  let lapVarSum = 0;
  let lapMean = 0;
  const laplace: number[] = [];
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = y * sw + x;
      const val =
        4 * lum[idx] -
        lum[idx - 1] -
        lum[idx + 1] -
        lum[idx - sw] -
        lum[idx + sw];
      laplace.push(val);
      lapMean += val;
    }
  }
  if (laplace.length > 0) {
    lapMean /= laplace.length;
    for (const v of laplace) {
      const d = v - lapMean;
      lapVarSum += d * d;
    }
  }
  const lapVar = laplace.length > 0 ? lapVarSum / laplace.length : 0;

  return {
    width,
    height,
    brightness: clamp01(meanL / 255),
    contrast: clamp01(std / 80),
    sharpness: clamp01(lapVar / 700),
    saturation: clamp01(saturationSum / n),
    hueHistogram: normalize(hueHistogram),
    purpleBlueFraction: coloredCount > 0 ? purpleBlue / coloredCount : 0,
    pinkRedFraction: coloredCount > 0 ? pinkRed / coloredCount : 0,
    overexposedFraction: overexposed / n,
    underexposedFraction: underexposed / n,
    foregroundFraction: clamp01(foreground / n),
    signature: signature >>> 0,
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normalize(arr: number[]): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return arr.map(() => 0);
  return arr.map((v) => v / sum);
}
