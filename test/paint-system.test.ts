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
});
