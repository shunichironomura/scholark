import { describe, expect, test } from "vite-plus/test";
import { generateLabelBackground, hexToRgb, pickLabelTextColor, rgbToHex } from "./color";

describe("pickLabelTextColor", () => {
  test.each([
    ["#000000", "white"],
    ["#ffffff", "black"],
    ["#0f0", "black"],
    ["1e3a8a", "white"],
  ])("picks the higher-contrast text color for %s", (background, expected) => {
    expect(pickLabelTextColor(background)).toBe(expected);
  });

  test.each(["red", "", "#12345", "#gggggg", "not a color"])(
    "falls back to black instead of throwing for invalid input %j",
    (background) => {
      expect(pickLabelTextColor(background)).toBe("black");
    },
  );
});

describe("hexToRgb / rgbToHex", () => {
  test("round-trips a 6-digit color", () => {
    expect(hexToRgb("#1e90ff")).toEqual([30, 144, 255]);
    expect(rgbToHex(30, 144, 255)).toBe("#1e90ff");
  });

  test("expands 3-digit colors", () => {
    expect(hexToRgb("#0f0")).toEqual([0, 255, 0]);
  });
});

describe("generateLabelBackground", () => {
  test("blends toward white", () => {
    expect(generateLabelBackground("#000000", 0)).toBe("#ffffff");
    expect(generateLabelBackground("#000000", 1)).toBe("#000000");
  });

  test("returns the input when empty", () => {
    expect(generateLabelBackground("")).toBe("");
  });
});
