/**
 * Convert a hex color like "#abc" or "#aabbcc" to an RGB tuple.
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Convert r, g, b components (0‑255) back to a full 6‑digit hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a soft background color for a given foreground/text color,
 * similar to GitHub issue labels.
 * It linearly blends the text color with white using the provided ratio.
 *
 * @param textColor Any valid 3‑ or 6‑digit hex color (e.g. "#0e8a16").
 * @param ratio Blend ratio (0–1). 0.15 roughly matches GitHub’s appearance.
 */
export function generateLabelBackground(textColor: string, ratio = 0.15): string {
  if (!textColor) return "";
  try {
    const [r, g, b] = hexToRgb(textColor);
    const blend = (c: number) => Math.round((1 - ratio) * 255 + ratio * c);
    return rgbToHex(blend(r), blend(g), blend(b));
  } catch {
    // Fallback: just return the input if parsing fails
    return textColor;
  }
}

/**
 * Return `"white"` or `"black"` depending on which gives better
 * WCAG-2.1 contrast against the supplied background color.
 *
 * @param hex - Background color in `#RRGGBB`, `RRGGBB`, `#RGB`, or `RGB` form.
 */
export function pickLabelTextColor(hex: string): "white" | "black" {
  // ── 1. Normalise hex ──────────────────────────────────────────
  let clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  // ── 2. Parse to 0‒255 integers ───────────────────────────────
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // ── 3. Convert to linear-sRGB and compute relative luminance ─
  const toLinear = (v: number) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // ── 4. Contrast ratios against white and black ───────────────
  const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  return contrastWithWhite >= contrastWithBlack ? "white" : "black";
}
