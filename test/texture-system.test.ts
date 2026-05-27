import { describe, expect, it } from "vitest";
import {
  CubeMapTexture,
  ProceduralTexture,
  RenderTexture,
  Texture2D,
  TextureAtlas,
  TextureManager,
} from "../src/texture-system.js";

describe("texture-system", () => {
  it("caches textures and reports memory statistics", () => {
    const manager = new TextureManager();
    const first = manager.loadTexture("checker", () => ProceduralTexture.checkerboard("checker", 4, 4, 2));
    const second = manager.loadTexture("checker", () => new Texture2D("other", 4, 4));

    expect(first).toBe(second);
    expect(manager.stats().count).toBe(1);
    expect(manager.stats().references).toBe(2);
    expect(manager.release("checker")).toBe(false);
    expect(manager.release("checker")).toBe(true);
  });

  it("supports 2d textures, mipmaps, and render targets", () => {
    const texture = new Texture2D("diffuse", 4, 4)
      .setPixel(0, 0, [255, 0, 0, 255])
      .setPixel(3, 3, [0, 0, 255, 255]);
    const renderTexture = new RenderTexture("framebuffer", 2, 2).clear([5, 10, 15, 255]);

    expect(texture.generateMipmaps()).toEqual([
      { width: 4, height: 4 },
      { width: 2, height: 2 },
      { width: 1, height: 1 },
    ]);
    expect(texture.sampleNearest(0, 0)).toEqual([255, 0, 0, 255]);
    expect(renderTexture.getPixel(1, 1)).toEqual([5, 10, 15, 255]);
    expect(renderTexture.resize(1, 1, [9, 9, 9, 255]).getPixel(0, 0)).toEqual([9, 9, 9, 255]);
  });

  it("validates cube maps and packs atlases", () => {
    const face = () => new Texture2D("face", 2, 2, [1, 2, 3, 255]);
    const cube = new CubeMapTexture("skybox", {
      px: face(), nx: face(), py: face(), ny: face(), pz: face(), nz: face(),
    });
    const atlas = new TextureAtlas("ui", 8, 8, 1);
    const icon = atlas.pack("icon", 3, 3);
    const badge = atlas.pack("badge", 2, 2);

    expect(cube.getFace("pz").getPixel(0, 0)).toEqual([1, 2, 3, 255]);
    expect(icon).toMatchObject({ x: 0, y: 0, width: 3, height: 3 });
    expect(badge.x).toBeGreaterThan(icon.x);
    expect(() => new CubeMapTexture("broken", {
      px: new Texture2D("a", 1, 1),
      nx: new Texture2D("b", 2, 1),
      py: new Texture2D("c", 1, 1),
      ny: new Texture2D("d", 1, 1),
      pz: new Texture2D("e", 1, 1),
      nz: new Texture2D("f", 1, 1),
    })).toThrow(/does not match/);
  });

  it("generates procedural checkerboard, noise, and gradients", () => {
    const checker = ProceduralTexture.checkerboard("checker", 4, 4, 2, [[0, 0, 0, 255], [255, 255, 255, 255]]);
    const noise = ProceduralTexture.noise("noise", 2, 2, 123);
    const gradient = ProceduralTexture.gradient("gradient", 1, 3, [0, 0, 0, 255], [255, 128, 64, 255]);

    expect(checker.getPixel(0, 0)).toEqual([0, 0, 0, 255]);
    expect(checker.getPixel(3, 0)).toEqual([255, 255, 255, 255]);
    expect(noise.getPixel(0, 0)).not.toEqual(noise.getPixel(1, 1));
    expect(gradient.getPixel(0, 0)).toEqual([0, 0, 0, 255]);
    expect(gradient.getPixel(0, 2)).toEqual([255, 128, 64, 255]);
  });
});
