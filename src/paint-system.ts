function clampUnit(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function formatAlpha(alpha: number): string {
  return Number(alpha.toFixed(3)).toString();
}

export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface HslColor {
  readonly h: number;
  readonly s: number;
  readonly l: number;
  readonly a: number;
}

export class Color {
  static readonly BLACK = new Color(0, 0, 0, 1);
  static readonly BLUE = new Color(0, 0, 1, 1);
  static readonly CYAN = new Color(0, 1, 1, 1);
  static readonly DARK_GRAY = new Color(64 / 255, 64 / 255, 64 / 255, 1);
  static readonly GRAY = new Color(128 / 255, 128 / 255, 128 / 255, 1);
  static readonly GREEN = new Color(0, 1, 0, 1);
  static readonly LIGHT_GRAY = new Color(192 / 255, 192 / 255, 192 / 255, 1);
  static readonly LIME = new Color(0.5, 1, 0, 1);
  static readonly MAGENTA = new Color(1, 0, 1, 1);
  static readonly ORANGE = new Color(1, 200 / 255, 0, 1);
  static readonly PINK = new Color(1, 175 / 255, 175 / 255, 1);
  static readonly PURPLE = new Color(0.5, 0, 0.5, 1);
  static readonly RED = new Color(1, 0, 0, 1);
  static readonly WHITE = new Color(1, 1, 1, 1);
  static readonly YELLOW = new Color(1, 1, 0, 1);

  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly alpha: number;

  constructor(red: number, green: number, blue: number, alpha = 1) {
    this.red = clampUnit(red);
    this.green = clampUnit(green);
    this.blue = clampUnit(blue);
    this.alpha = clampUnit(alpha, 1);
  }

  equals(other: Color, epsilon = 1e-9): boolean {
    return Math.abs(this.red - other.red) <= epsilon
      && Math.abs(this.green - other.green) <= epsilon
      && Math.abs(this.blue - other.blue) <= epsilon
      && Math.abs(this.alpha - other.alpha) <= epsilon;
  }

  withAlpha(alpha: number): Color {
    return new Color(this.red, this.green, this.blue, alpha);
  }

  toRgb(): RgbColor {
    return PaintConverter.toRgb(this);
  }

  toHsl(): HslColor {
    return PaintConverter.toHsl(this);
  }

  toHex(includeAlpha = this.alpha < 1): string {
    return PaintConverter.toHex(this, includeAlpha);
  }
}

export class ColorMix {
  static interpolate(start: Color, end: Color, amount: number): Color {
    const portion = clampUnit(amount);
    return new Color(
      start.red + ((end.red - start.red) * portion),
      start.green + ((end.green - start.green) * portion),
      start.blue + ((end.blue - start.blue) * portion),
      start.alpha + ((end.alpha - start.alpha) * portion),
    );
  }
}

export class Texture {
  readonly kind = "texture" as const;

  constructor(
    public readonly source: string,
    public readonly width: number | null = null,
    public readonly height: number | null = null,
    public readonly repeatX = 1,
    public readonly repeatY = 1,
  ) {}

  repeat(repeatX: number, repeatY = repeatX): Texture {
    return new Texture(this.source, this.width, this.height, repeatX, repeatY);
  }
}

export interface GradientStop {
  readonly offset: number;
  readonly color: Color;
}

export interface GradientCenter {
  readonly x: number;
  readonly y: number;
}

export class GradientPaint {
  readonly stops: readonly GradientStop[];

  constructor(
    public readonly kind: "linear" | "radial",
    stops: readonly GradientStop[],
    public readonly angle = 0,
    public readonly center: GradientCenter = { x: 0.5, y: 0.5 },
    public readonly radius = 0.5,
  ) {
    if (stops.length === 0) {
      throw new TypeError("gradient paints require at least one stop");
    }
    this.stops = [...stops]
      .map((stop) => ({ offset: clampUnit(stop.offset), color: stop.color }))
      .sort((left, right) => left.offset - right.offset);
  }

  static linear(stops: readonly GradientStop[], angle = 0): GradientPaint {
    return new GradientPaint("linear", stops, angle);
  }

  static radial(
    stops: readonly GradientStop[],
    center: GradientCenter = { x: 0.5, y: 0.5 },
    radius = 0.5,
  ): GradientPaint {
    return new GradientPaint("radial", stops, 0, center, radius);
  }

  sample(position: number): Color {
    const offset = clampUnit(position);
    if (offset <= this.stops[0].offset) {
      return this.stops[0].color;
    }
    const last = this.stops[this.stops.length - 1];
    if (offset >= last.offset) {
      return last.color;
    }

    for (let index = 1; index < this.stops.length; index += 1) {
      const right = this.stops[index];
      if (offset > right.offset) {
        continue;
      }
      const left = this.stops[index - 1];
      const span = right.offset - left.offset;
      const portion = span === 0 ? 0 : (offset - left.offset) / span;
      return ColorMix.interpolate(left.color, right.color, portion);
    }

    return last.color;
  }
}

export type PaintProperty = Color | Texture | GradientPaint;

export class PaintConverter {
  static fromHex(hex: string): Color {
    const normalized = hex.trim().replace(/^#/, "");
    if (![3, 4, 6, 8].includes(normalized.length)) {
      throw new TypeError(`unsupported hex color: ${hex}`);
    }

    const expanded = normalized.length <= 4
      ? normalized.split("").map((value) => `${value}${value}`).join("")
      : normalized;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) : 255;
    return PaintConverter.fromRgb(red, green, blue, alpha);
  }

  static toHex(color: Color, includeAlpha = color.alpha < 1): string {
    const { r, g, b, a } = PaintConverter.toRgb(color);
    const suffix = includeAlpha ? clampByte(a).toString(16).padStart(2, "0") : "";
    return `#${clampByte(r).toString(16).padStart(2, "0")}${clampByte(g).toString(16).padStart(2, "0")}${clampByte(b).toString(16).padStart(2, "0")}${suffix}`;
  }

  static fromRgb(r: number, g: number, b: number, a = 255): Color {
    return new Color(r / 255, g / 255, b / 255, a / 255);
  }

  static toRgb(color: Color): RgbColor {
    return {
      r: clampByte(color.red * 255),
      g: clampByte(color.green * 255),
      b: clampByte(color.blue * 255),
      a: clampByte(color.alpha * 255),
    };
  }

  static fromHsl(h: number, s: number, l: number, a = 1): Color {
    const hue = ((h % 360) + 360) % 360;
    const saturation = clampUnit(s);
    const lightness = clampUnit(l);

    if (saturation === 0) {
      return new Color(lightness, lightness, lightness, a);
    }

    const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    const sector = hue / 60;
    const x = chroma * (1 - Math.abs((sector % 2) - 1));
    let red = 0;
    let green = 0;
    let blue = 0;

    if (sector < 1) {
      red = chroma;
      green = x;
    } else if (sector < 2) {
      red = x;
      green = chroma;
    } else if (sector < 3) {
      green = chroma;
      blue = x;
    } else if (sector < 4) {
      green = x;
      blue = chroma;
    } else if (sector < 5) {
      red = x;
      blue = chroma;
    } else {
      red = chroma;
      blue = x;
    }

    const match = lightness - (chroma / 2);
    return new Color(red + match, green + match, blue + match, a);
  }

  static toHsl(color: Color): HslColor {
    const red = color.red;
    const green = color.green;
    const blue = color.blue;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;
    const delta = max - min;

    if (delta === 0) {
      return { h: 0, s: 0, l: lightness, a: color.alpha };
    }

    const saturation = delta / (1 - Math.abs((2 * lightness) - 1));
    let hue = 0;
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }

    return {
      h: (hue + 360) % 360,
      s: saturation,
      l: lightness,
      a: color.alpha,
    };
  }

  static toRgbString(color: Color): string {
    const { r, g, b } = PaintConverter.toRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${formatAlpha(color.alpha)})`;
  }

  static toHslString(color: Color): string {
    const { h, s, l, a } = PaintConverter.toHsl(color);
    return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${formatAlpha(a)})`;
  }
}

export class PaintPalette {
  static readonly BASIC = new PaintPalette("basic", {
    black: Color.BLACK,
    blue: Color.BLUE,
    cyan: Color.CYAN,
    dark_gray: Color.DARK_GRAY,
    gray: Color.GRAY,
    green: Color.GREEN,
    light_gray: Color.LIGHT_GRAY,
    lime: Color.LIME,
    magenta: Color.MAGENTA,
    orange: Color.ORANGE,
    pink: Color.PINK,
    purple: Color.PURPLE,
    red: Color.RED,
    white: Color.WHITE,
    yellow: Color.YELLOW,
  });

  static readonly OCEAN = new PaintPalette("ocean", {
    deep: PaintConverter.fromHex("#0b3954"),
    foam: PaintConverter.fromHex("#bfd7ea"),
    surf: PaintConverter.fromHex("#087e8b"),
    sun: PaintConverter.fromHex("#ffca3a"),
  });

  static readonly SUNSET = new PaintPalette("sunset", {
    dusk: PaintConverter.fromHex("#5a189a"),
    ember: PaintConverter.fromHex("#ff6f59"),
    gold: PaintConverter.fromHex("#ffca3a"),
    rose: PaintConverter.fromHex("#f72585"),
  });

  private readonly paints: ReadonlyMap<string, Color>;

  constructor(public readonly name: string, colors: Record<string, Color>) {
    this.paints = new Map(Object.entries(colors));
  }

  get(colorName: string): Color | undefined {
    return this.paints.get(colorName);
  }

  names(): string[] {
    return [...this.paints.keys()];
  }

  entries(): Array<[string, Color]> {
    return [...this.paints.entries()];
  }

  toRecord(): Record<string, Color> {
    return Object.fromEntries(this.entries());
  }

  static curated(): readonly PaintPalette[] {
    return [PaintPalette.BASIC, PaintPalette.OCEAN, PaintPalette.SUNSET];
  }
}
