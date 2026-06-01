import { describe, expect, it } from "vitest";

import {
  Color,
  ColorMix,
  GradientPaint,
  PaintConverter,
  PaintPalette,
  Texture,
} from "../src/paint-system";

describe("paint-system", () => {
  it("supports color constants and format conversions", () => {
    expect(Color.RED.toHex()).toBe("#ff0000");
    expect(PaintConverter.toRgb(Color.BLUE)).toEqual({ r: 0, g: 0, b: 255, a: 255 });

    const teal = PaintConverter.fromHex("#336699cc");
    const hsl = PaintConverter.toHsl(teal);

    expect(PaintConverter.toHex(teal, true)).toBe("#336699cc");
    expect(PaintConverter.toRgbString(teal)).toBe("rgba(51, 102, 153, 0.8)");
    expect(hsl.h).toBeCloseTo(210, 0);
    expect(hsl.s).toBeCloseTo(0.5, 2);
    expect(hsl.l).toBeCloseTo(0.4, 2);
    expect(PaintConverter.toHslString(PaintConverter.fromHsl(120, 1, 0.25, 0.5))).toBe("hsla(120, 100%, 25%, 0.5)");
  });

  it("interpolates colors and samples gradients", () => {
    const mid = ColorMix.interpolate(Color.RED, Color.BLUE, 0.5);
    const gradient = GradientPaint.linear([
      { offset: 0, color: Color.RED },
      { offset: 0.5, color: Color.WHITE },
      { offset: 1, color: Color.BLUE },
    ]);

    expect(mid.equals(new Color(0.5, 0, 0.5, 1))).toBe(true);
    expect(gradient.sample(0.25).equals(new Color(1, 0.5, 0.5, 1))).toBe(true);
    expect(gradient.sample(0.75).equals(new Color(0.5, 0.5, 1, 1))).toBe(true);
  });

  it("tracks texture metadata and curated palettes", () => {
    const texture = new Texture("/textures/grass.png", 64, 32).repeat(2, 3);
    const curated = PaintPalette.curated();

    expect(texture.kind).toBe("texture");
    expect(texture.repeatX).toBe(2);
    expect(texture.repeatY).toBe(3);
    expect(curated.map((palette) => palette.name)).toEqual(["basic", "ocean", "sunset"]);
    expect(PaintPalette.BASIC.get("red")?.equals(Color.RED)).toBe(true);
    expect(PaintPalette.OCEAN.names()).toContain("surf");
    expect(PaintPalette.SUNSET.toRecord().ember.toHex()).toBe("#ff6f59");
  });

  it("provides DARK_GRAY GRAY LIGHT_GRAY LIME ORANGE PINK PURPLE color constants", () => {
    // All new constants are Color instances with alpha=1
    const newColors = [
      Color.DARK_GRAY, Color.GRAY, Color.LIGHT_GRAY,
      Color.LIME, Color.ORANGE, Color.PINK, Color.PURPLE,
    ];
    for (const color of newColors) {
      expect(color).toBeInstanceOf(Color);
      expect(color.alpha).toBe(1);
    }

    // DARK_GRAY: Java AWT 64/255 ≈ 0.251
    expect(Color.DARK_GRAY.equals(new Color(64 / 255, 64 / 255, 64 / 255))).toBe(true);
    expect(Color.DARK_GRAY.toHex()).toBe("#404040");

    // GRAY: Java AWT 128/255 ≈ 0.502
    expect(Color.GRAY.equals(new Color(128 / 255, 128 / 255, 128 / 255))).toBe(true);
    expect(Color.GRAY.toHex()).toBe("#808080");

    // LIGHT_GRAY: Java AWT 192/255 ≈ 0.753
    expect(Color.LIGHT_GRAY.equals(new Color(192 / 255, 192 / 255, 192 / 255))).toBe(true);
    expect(Color.LIGHT_GRAY.toHex()).toBe("#c0c0c0");

    // LIME: (0.5, 1, 0)
    expect(Color.LIME.equals(new Color(0.5, 1, 0))).toBe(true);
    expect(Color.LIME.toHex()).toBe("#80ff00");

    // ORANGE: Java AWT (255, 200, 0) → (1, 200/255, 0)
    expect(Color.ORANGE.equals(new Color(1, 200 / 255, 0))).toBe(true);
    const orangeRgb = PaintConverter.toRgb(Color.ORANGE);
    expect(orangeRgb.r).toBe(255);
    expect(orangeRgb.g).toBe(200);
    expect(orangeRgb.b).toBe(0);

    // PINK: Java AWT (255, 175, 175) → (1, 175/255, 175/255)
    expect(Color.PINK.equals(new Color(1, 175 / 255, 175 / 255))).toBe(true);

    // PURPLE: (0.5, 0, 0.5)
    expect(Color.PURPLE.equals(new Color(0.5, 0, 0.5))).toBe(true);
    expect(Color.PURPLE.toHex()).toBe("#800080");

    // Standard operations work on new constants
    const transparent = Color.LIME.withAlpha(0.5);
    expect(transparent.alpha).toBeCloseTo(0.5, 3);
    expect(transparent.green).toBe(1);

    const blend = ColorMix.interpolate(Color.PURPLE, Color.PINK, 0.5);
    expect(blend).toBeInstanceOf(Color);
  });

  it("expands PaintPalette.BASIC from 5 to 15 entries with all Color statics", () => {
    const palette = PaintPalette.BASIC;
    const names = palette.names();

    // Should have exactly 15 entries
    expect(names).toHaveLength(15);

    // Should contain all expected names
    const expectedNames = [
      "black", "blue", "cyan", "dark_gray", "gray", "green",
      "light_gray", "lime", "magenta", "orange", "pink",
      "purple", "red", "white", "yellow",
    ];
    expect(names.sort()).toEqual(expectedNames.sort());

    // Existing entries unchanged
    expect(palette.get("red")?.equals(Color.RED)).toBe(true);
    expect(palette.get("blue")?.equals(Color.BLUE)).toBe(true);
    expect(palette.get("black")?.equals(Color.BLACK)).toBe(true);
    expect(palette.get("white")?.equals(Color.WHITE)).toBe(true);
    expect(palette.get("green")?.equals(Color.GREEN)).toBe(true);

    // New entries present
    expect(palette.get("orange")?.equals(Color.ORANGE)).toBe(true);
    expect(palette.get("dark_gray")?.equals(Color.DARK_GRAY)).toBe(true);
    expect(palette.get("gray")?.equals(Color.GRAY)).toBe(true);
    expect(palette.get("light_gray")?.equals(Color.LIGHT_GRAY)).toBe(true);
    expect(palette.get("lime")?.equals(Color.LIME)).toBe(true);
    expect(palette.get("pink")?.equals(Color.PINK)).toBe(true);
    expect(palette.get("purple")?.equals(Color.PURPLE)).toBe(true);
    expect(palette.get("cyan")?.equals(Color.CYAN)).toBe(true);
    expect(palette.get("magenta")?.equals(Color.MAGENTA)).toBe(true);
    expect(palette.get("yellow")?.equals(Color.YELLOW)).toBe(true);

    // Curated list still returns same 3 palettes
    expect(PaintPalette.curated().map((p) => p.name)).toEqual(["basic", "ocean", "sunset"]);
  });
});
