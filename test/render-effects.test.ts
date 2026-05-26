import { describe, expect, it } from 'vitest';
import {
  applyBloomEffect,
  applyFogToFrame,
  applyFogToPixel,
  detectOutlineMask,
  detectSilhouette,
  renderSelectionOutline,
  type EffectColor,
} from '../src/render-effects';

const BLACK: EffectColor = { r: 0, g: 0, b: 0 };
const WHITE: EffectColor = { r: 1, g: 1, b: 1 };

describe('render effects', () => {
  it('applies fog per pixel by blending toward fog color', () => {
    expect(applyFogToPixel({ r: 1, g: 0.5, b: 0 }, BLACK, 0.25)).toEqual({ r: 0.25, g: 0.125, b: 0 });
    expect(applyFogToFrame([WHITE, BLACK], { r: 0.2, g: 0.4, b: 0.6 }, [1, 0])).toEqual([
      WHITE,
      { r: 0.2, g: 0.4, b: 0.6 },
    ]);
  });

  it('rejects fog frames with mismatched visibility lengths', () => {
    expect(() => applyFogToFrame([WHITE], BLACK, [])).toThrow(/same length/);
  });

  it('computes bloom from bright pixels into neighboring samples', () => {
    const frame = [BLACK, WHITE, BLACK];
    const bloomed = applyBloomEffect(frame, 3, 1, { threshold: 0.5, intensity: 1, radius: 1 });

    expect(bloomed[1]).toMatchObject(WHITE);
    expect(bloomed[0].r).toBeGreaterThan(0);
    expect(bloomed[2].g).toBeGreaterThan(0);
  });

  it('renders selection outlines around selected pixels', () => {
    const mask = [
      false, false, false,
      false, true, false,
      false, false, false,
    ];

    expect(detectOutlineMask(mask, 3, 3)).toEqual([
      true, true, true,
      true, false, true,
      true, true, true,
    ]);

    const colors = renderSelectionOutline(mask, 3, 3, {
      color: { r: 1, g: 1, b: 0 },
      fillColor: { r: 0, g: 0, b: 1, a: 0.25 },
    });

    expect(colors[4]).toEqual({ r: 0, g: 0, b: 1, a: 0.25 });
    expect(colors[1]).toEqual({ r: 1, g: 1, b: 0 });
  });

  it('detects stencil silhouettes from stencil edges and depth discontinuities', () => {
    const stencil = [
      0, 0, 0,
      0, 1, 1,
      0, 1, 1,
    ];
    const depth = [
      1, 1, 1,
      1, 0.4, 0.4,
      1, 0.4, 0.9,
    ];

    expect(detectSilhouette(stencil, 3, 3, { stencilRef: 1 })).toEqual([
      false, false, false,
      false, true, true,
      false, true, true,
    ]);
    expect(detectSilhouette(stencil, 3, 3, { stencilRef: 1, depthThreshold: 0.2 }, depth)[8]).toBe(true);
  });
});
