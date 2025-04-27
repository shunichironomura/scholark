
/**
 * Convert a hex colour like "#abc" or "#aabbcc" to an RGB tuple.
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
 * Generate a soft background colour for a given foreground/text colour,
 * similar to GitHub issue labels.
 * It linearly blends the text colour with white using the provided ratio.
 *
 * @param textColor Any valid 3‑ or 6‑digit hex colour (e.g. "#0e8a16").
 * @param ratio Blend ratio (0–1). 0.15 roughly matches GitHub’s appearance.
 */
export function generateLabelBackground(
  textColor: string,
  ratio = 0.15,
): string {
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
