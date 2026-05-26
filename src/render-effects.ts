export interface EffectColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface BloomSettings {
  threshold: number;
  intensity: number;
  radius?: number;
}

export interface OutlineSettings {
  color: EffectColor;
  fillColor?: EffectColor;
  thickness?: number;
}

export interface SilhouetteSettings {
  stencilRef: number;
  depthThreshold?: number;
}

const TRANSPARENT: EffectColor = { r: 0, g: 0, b: 0 };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function validateFrameSize<T>(values: readonly T[], width: number, height: number, label: string): void {
  if (width <= 0 || height <= 0) {
    throw new RangeError('frame dimensions must be positive');
  }
  if (values.length !== width * height) {
    throw new RangeError(`${label} length must match width * height`);
  }
}

function mixColor(from: EffectColor, to: EffectColor, factor: number): EffectColor {
  const t = clamp01(factor);
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    a: from.a !== undefined || to.a !== undefined
      ? (from.a ?? 1) + ((to.a ?? 1) - (from.a ?? 1)) * t
      : undefined,
  };
}

function scaleColor(color: EffectColor, factor: number): EffectColor {
  return {
    r: color.r * factor,
    g: color.g * factor,
    b: color.b * factor,
    a: color.a,
  };
}

function addColors(base: EffectColor, glow: EffectColor): EffectColor {
  return {
    r: clamp01(base.r + glow.r),
    g: clamp01(base.g + glow.g),
    b: clamp01(base.b + glow.b),
    a: base.a !== undefined || glow.a !== undefined ? (base.a ?? glow.a) : undefined,
  };
}

function luminance(color: EffectColor): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

function isNeighborSelected(mask: readonly boolean[], width: number, height: number, x: number, y: number, thickness: number): boolean {
  for (let dy = -thickness; dy <= thickness; dy++) {
    for (let dx = -thickness; dx <= thickness; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }
      if (mask[(ny * width) + nx]) {
        return true;
      }
    }
  }
  return false;
}

export function applyFogToPixel(color: EffectColor, fogColor: EffectColor, visibility: number): EffectColor {
  return mixColor(fogColor, color, visibility);
}

export function applyFogToFrame(colors: readonly EffectColor[], fogColor: EffectColor, visibilities: readonly number[]): EffectColor[] {
  if (colors.length !== visibilities.length) {
    throw new RangeError('colors and visibilities must have the same length');
  }
  return colors.map((color, index) => applyFogToPixel(color, fogColor, visibilities[index]));
}

export function computeBloomContribution(color: EffectColor, threshold: number, intensity: number): EffectColor {
  const strength = Math.max(0, luminance(color) - threshold) * Math.max(0, intensity);
  return scaleColor(color, strength);
}

export function applyBloomEffect(colors: readonly EffectColor[], width: number, height: number, settings: BloomSettings): EffectColor[] {
  validateFrameSize(colors, width, height, 'colors');
  const radius = Math.max(0, Math.floor(settings.radius ?? 1));
  const brightPass = colors.map((color) => computeBloomContribution(color, settings.threshold, settings.intensity));

  return colors.map((color, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    let samples = 0;
    let glow = TRANSPARENT;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }
        const sample = brightPass[(ny * width) + nx];
        glow = {
          r: glow.r + sample.r,
          g: glow.g + sample.g,
          b: glow.b + sample.b,
          a: glow.a,
        };
        samples++;
      }
    }

    if (samples === 0) {
      return color;
    }

    return addColors(color, scaleColor(glow, 1 / samples));
  });
}

export function detectOutlineMask(selectionMask: readonly boolean[], width: number, height: number, thickness = 1): boolean[] {
  validateFrameSize(selectionMask, width, height, 'selection mask');
  const clampedThickness = Math.max(1, Math.floor(thickness));

  return selectionMask.map((selected, index) => {
    if (selected) {
      return false;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    return isNeighborSelected(selectionMask, width, height, x, y, clampedThickness);
  });
}

export function renderSelectionOutline(selectionMask: readonly boolean[], width: number, height: number, settings: OutlineSettings): EffectColor[] {
  const outlineMask = detectOutlineMask(selectionMask, width, height, settings.thickness ?? 1);
  return selectionMask.map((selected, index) => {
    if (outlineMask[index]) {
      return settings.color;
    }
    if (selected && settings.fillColor) {
      return settings.fillColor;
    }
    return TRANSPARENT;
  });
}

export function detectSilhouette(stencil: readonly number[], width: number, height: number, settings: SilhouetteSettings, depth?: readonly number[]): boolean[] {
  validateFrameSize(stencil, width, height, 'stencil');
  if (depth) {
    validateFrameSize(depth, width, height, 'depth');
  }
  const threshold = Math.max(0, settings.depthThreshold ?? 0);

  return stencil.map((value, index) => {
    if (value !== settings.stencilRef) {
      return false;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    const currentDepth = depth?.[index];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          return true;
        }
        const neighborIndex = (ny * width) + nx;
        if (stencil[neighborIndex] !== settings.stencilRef) {
          return true;
        }
        if (currentDepth !== undefined && depth !== undefined && Math.abs(depth[neighborIndex] - currentDepth) > threshold) {
          return true;
        }
      }
    }

    return false;
  });
}
