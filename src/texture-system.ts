export type TexturePixel = readonly [number, number, number, number];
export type CubeFace = "px" | "nx" | "py" | "ny" | "pz" | "nz";

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function createPixels(width: number, height: number, fill: TexturePixel = [0, 0, 0, 255]): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    pixels.set(fill, index * 4);
  }
  return pixels;
}

function pixelOffset(width: number, x: number, y: number): number {
  return (y * width + x) * 4;
}

function seededValue(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export class Texture2D {
  readonly mipLevels: Array<{ width: number; height: number }> = [];
  protected pixels: Uint8ClampedArray;

  constructor(
    readonly name: string,
    readonly width: number,
    readonly height: number,
    fill: TexturePixel = [0, 0, 0, 255],
  ) {
    if (width <= 0 || height <= 0) {
      throw new TypeError("texture dimensions must be positive");
    }
    this.pixels = createPixels(width, height, fill);
    this.mipLevels.push({ width, height });
  }

  get byteLength(): number {
    return this.pixels.byteLength + this.mipLevels.slice(1).reduce((sum, level) => sum + (level.width * level.height * 4), 0);
  }

  getPixel(x: number, y: number): TexturePixel {
    const offset = pixelOffset(this.width, x, y);
    return [
      this.pixels[offset],
      this.pixels[offset + 1],
      this.pixels[offset + 2],
      this.pixels[offset + 3],
    ];
  }

  setPixel(x: number, y: number, pixel: TexturePixel): this {
    const offset = pixelOffset(this.width, x, y);
    this.pixels.set(pixel, offset);
    return this;
  }

  sampleNearest(u: number, v: number): TexturePixel {
    const x = Math.max(0, Math.min(this.width - 1, Math.round(u * (this.width - 1))));
    const y = Math.max(0, Math.min(this.height - 1, Math.round(v * (this.height - 1))));
    return this.getPixel(x, y);
  }

  fill(pixel: TexturePixel): this {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.setPixel(x, y, pixel);
      }
    }
    return this;
  }

  generateMipmaps(): Array<{ width: number; height: number }> {
    this.mipLevels.length = 1;
    let width = this.width;
    let height = this.height;
    while (width > 1 || height > 1) {
      width = Math.max(1, Math.floor(width / 2));
      height = Math.max(1, Math.floor(height / 2));
      this.mipLevels.push({ width, height });
    }
    return [...this.mipLevels];
  }
}

export class CubeMapTexture {
  private readonly faces: Record<CubeFace, Texture2D>;

  constructor(readonly name: string, faces: Record<CubeFace, Texture2D>) {
    const entries = Object.entries(faces) as Array<[CubeFace, Texture2D]>;
    if (entries.length !== 6) {
      throw new TypeError("cube maps require exactly six faces");
    }
    const [referenceFace] = entries;
    const expectedWidth = referenceFace[1].width;
    const expectedHeight = referenceFace[1].height;
    entries.forEach(([face, texture]) => {
      if (texture.width !== expectedWidth || texture.height !== expectedHeight) {
        throw new TypeError(`cube face ${face} does not match expected dimensions`);
      }
    });
    this.faces = { ...faces };
  }

  get byteLength(): number {
    return Object.values(this.faces).reduce((sum, face) => sum + face.byteLength, 0);
  }

  getFace(face: CubeFace): Texture2D {
    return this.faces[face];
  }
}

export class RenderTexture extends Texture2D {
  resize(width: number, height: number, fill: TexturePixel = [0, 0, 0, 255]): this {
    (this as { width: number }).width = width;
    (this as { height: number }).height = height;
    this.pixels = createPixels(width, height, fill);
    this.mipLevels.length = 0;
    this.mipLevels.push({ width, height });
    return this;
  }

  clear(pixel: TexturePixel = [0, 0, 0, 255]): this {
    return this.fill(pixel);
  }
}

export interface AtlasFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly u0: number;
  readonly v0: number;
  readonly u1: number;
  readonly v1: number;
}

export class TextureAtlas {
  private readonly frames = new Map<string, AtlasFrame>();
  private cursorX = 0;
  private cursorY = 0;
  private rowHeight = 0;

  constructor(
    readonly name: string,
    readonly width: number,
    readonly height: number,
    readonly padding = 1,
  ) {}

  pack(name: string, width: number, height: number): AtlasFrame {
    if (width > this.width || height > this.height) {
      throw new RangeError("frame is larger than the atlas");
    }
    if (this.cursorX + width > this.width) {
      this.cursorX = 0;
      this.cursorY += this.rowHeight + this.padding;
      this.rowHeight = 0;
    }
    if (this.cursorY + height > this.height) {
      throw new RangeError("atlas is full");
    }
    const frame: AtlasFrame = {
      x: this.cursorX,
      y: this.cursorY,
      width,
      height,
      u0: this.cursorX / this.width,
      v0: this.cursorY / this.height,
      u1: (this.cursorX + width) / this.width,
      v1: (this.cursorY + height) / this.height,
    };
    this.frames.set(name, frame);
    this.cursorX += width + this.padding;
    this.rowHeight = Math.max(this.rowHeight, height);
    return frame;
  }

  getFrame(name: string): AtlasFrame | undefined {
    return this.frames.get(name);
  }
}

export class ProceduralTexture {
  static checkerboard(name: string, width: number, height: number, cellSize = 1, colors: readonly [TexturePixel, TexturePixel] = [[0, 0, 0, 255], [255, 255, 255, 255]]): Texture2D {
    const texture = new Texture2D(name, width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2;
        texture.setPixel(x, y, colors[index]);
      }
    }
    return texture;
  }

  static noise(name: string, width: number, height: number, seed = 1): Texture2D {
    const nextValue = seededValue(seed);
    const texture = new Texture2D(name, width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const value = clampByte(nextValue() * 255);
        texture.setPixel(x, y, [value, value, value, 255]);
      }
    }
    return texture;
  }

  static gradient(name: string, width: number, height: number, top: TexturePixel, bottom: TexturePixel): Texture2D {
    const texture = new Texture2D(name, width, height);
    for (let y = 0; y < height; y += 1) {
      const ratio = height === 1 ? 0 : y / (height - 1);
      for (let x = 0; x < width; x += 1) {
        texture.setPixel(x, y, [
          clampByte(top[0] + ((bottom[0] - top[0]) * ratio)),
          clampByte(top[1] + ((bottom[1] - top[1]) * ratio)),
          clampByte(top[2] + ((bottom[2] - top[2]) * ratio)),
          clampByte(top[3] + ((bottom[3] - top[3]) * ratio)),
        ]);
      }
    }
    return texture;
  }
}

export class TextureManager {
  private readonly textures = new Map<string, Texture2D | CubeMapTexture | RenderTexture>();
  private readonly references = new Map<string, number>();

  register(name: string, texture: Texture2D | CubeMapTexture | RenderTexture): typeof texture {
    this.textures.set(name, texture);
    this.references.set(name, 1);
    return texture;
  }

  loadTexture<T extends Texture2D | CubeMapTexture | RenderTexture>(name: string, loader: () => T): T {
    const existing = this.textures.get(name);
    if (existing) {
      this.references.set(name, (this.references.get(name) ?? 0) + 1);
      return existing as T;
    }
    return this.register(name, loader()) as T;
  }

  get(name: string): Texture2D | CubeMapTexture | RenderTexture | undefined {
    return this.textures.get(name);
  }

  release(name: string): boolean {
    const references = (this.references.get(name) ?? 0) - 1;
    if (references <= 0) {
      this.references.delete(name);
      return this.textures.delete(name);
    }
    this.references.set(name, references);
    return false;
  }

  stats(): { count: number; references: number; bytes: number } {
    return {
      count: this.textures.size,
      references: [...this.references.values()].reduce((sum, count) => sum + count, 0),
      bytes: [...this.textures.values()].reduce((sum, texture) => sum + texture.byteLength, 0),
    };
  }
}
