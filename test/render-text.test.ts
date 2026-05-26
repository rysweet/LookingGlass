import { describe, expect, it } from "vitest";
import {
  computeSpeechBubbleShape,
  layoutText,
  measureText,
  renderTextToTexture,
} from "../src/render-text.js";

describe("render-text", () => {
  it("measures text with larger fonts producing taller glyph bounds", async () => {
    const small = await measureText("Alice", { fontFamily: "sans-serif", fontSize: 12 });
    const large = await measureText("Alice", { fontFamily: "sans-serif", fontSize: 24 });

    expect(large.width).toBeGreaterThan(small.width);
    expect(large.height).toBeGreaterThan(small.height);
  });

  it("wraps text by words and preserves explicit new lines", async () => {
    const hello = await measureText("hello", { fontFamily: "monospace", fontSize: 16 });
    const layout = await layoutText("hello world\nagain", {
      fontFamily: "monospace",
      fontSize: 16,
      maxWidth: hello.width + 2,
    });

    expect(layout.lines.map((line) => line.text)).toEqual(["hello", "world", "again"]);
    expect(layout.height).toBe(layout.lineHeight * 3);
  });

  it("splits long words when they exceed the wrap width", async () => {
    const layout = await layoutText("supercalifragilisticexpialidocious", {
      fontFamily: "monospace",
      fontSize: 18,
      maxWidth: 64,
    });

    expect(layout.lines.length).toBeGreaterThan(1);
    for (const line of layout.lines) {
      expect(line.width).toBeLessThanOrEqual(64);
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it("computes speech bubble bounds, padding, and tail geometry", () => {
    const bubble = computeSpeechBubbleShape({ width: 80, height: 24 }, {
      padding: 10,
      tailHeight: 12,
      tailWidth: 18,
      tailSide: "bottom",
      tailAnchor: 0.25,
    });

    expect(bubble.textBounds).toEqual({ x: 10, y: 10, width: 80, height: 24 });
    expect(bubble.bodyBounds).toEqual({ x: 0, y: 0, width: 100, height: 44 });
    expect(bubble.bounds).toEqual({ x: 0, y: 0, width: 100, height: 56 });
    expect(bubble.tail[1]).toEqual({ x: 25, y: 56 });
    expect(bubble.outline).toContainEqual({ x: 100, y: 44 });
  });

  it("renders text into texture-ready RGBA image data", async () => {
    const texture = await renderTextToTexture("Alice says hello", {
      fontFamily: "sans-serif",
      fontSize: 20,
      maxWidth: 140,
      textColor: "#000000",
      backgroundColor: "#ffffff",
      bubble: {
        padding: 12,
        tailHeight: 10,
      },
    });

    expect(texture.image.width).toBeGreaterThan(texture.layout.width);
    expect(texture.image.height).toBeGreaterThan(texture.layout.height);
    expect(texture.bubble).not.toBeNull();
    const opaquePixels = Array.from(texture.image.data).filter((_, index) => index % 4 === 3 && texture.image.data[index] > 0).length;
    expect(opaquePixels).toBeGreaterThan(0);
  });
});
