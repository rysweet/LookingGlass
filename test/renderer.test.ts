import { describe, expect, it, vi } from 'vitest';
import {
  RenderTarget, RenderContext, PickContext, ResourceCache,
  TextureManager, ShaderManager, DisplayTaskQueue,
  Viewport, computeFogFactor, settingsForQuality,
  computeCaptureDataSize, DEFAULT_RENDER_SETTINGS,
} from '../src/renderer';

describe('RenderTarget', () => {
  it('tracks dimensions', () => {
    const rt = new RenderTarget(800, 600);
    expect(rt.width).toBe(800);
    expect(rt.height).toBe(600);
  });

  it('fires resize listeners', () => {
    const rt = new RenderTarget(800, 600);
    let w = 0, h = 0;
    rt.addListener({ resized: (nw, nh) => { w = nw; h = nh; } });
    rt.resize(1024, 768);
    expect(w).toBe(1024);
    expect(h).toBe(768);
  });

  it('skips render when disabled', () => {
    const rt = new RenderTarget(800, 600);
    const ctx = new RenderContext();
    rt.setEnabled(false);
    rt.render(ctx);
    expect(rt.renderCount).toBe(0);
  });

  it('increments renderCount and fires listeners', () => {
    const rt = new RenderTarget(800, 600);
    const ctx = new RenderContext();
    let cleared = false, rendered = false;
    rt.addListener({ cleared: () => { cleared = true; }, rendered: () => { rendered = true; } });
    rt.render(ctx);
    expect(rt.renderCount).toBe(1);
    expect(cleared).toBe(true);
    expect(rendered).toBe(true);
  });

  it('removes listeners', () => {
    const rt = new RenderTarget(800, 600);
    let count = 0;
    const listener = { rendered: () => { count++; } };
    rt.addListener(listener);
    rt.render(new RenderContext());
    expect(count).toBe(1);
    rt.removeListener(listener);
    rt.render(new RenderContext());
    expect(count).toBe(1);
  });
});

describe('RenderContext', () => {
  it('tracks frame count', () => {
    const ctx = new RenderContext();
    ctx.render();
    ctx.render();
    expect(ctx.frameCount).toBe(2);
  });

  it('executes render passes', () => {
    const ctx = new RenderContext();
    const log: string[] = [];
    ctx.addPass({ name: 'shadow', execute: () => { log.push('shadow'); } });
    ctx.addPass({ name: 'main', execute: () => { log.push('main'); } });
    ctx.render();
    expect(log).toEqual(['shadow', 'main']);
  });

  it('removes passes by name', () => {
    const ctx = new RenderContext();
    const log: string[] = [];
    ctx.addPass({ name: 'a', execute: () => { log.push('a'); } });
    ctx.addPass({ name: 'b', execute: () => { log.push('b'); } });
    ctx.removePass('a');
    ctx.render();
    expect(log).toEqual(['b']);
  });

  it('manages opacity stack', () => {
    const ctx = new RenderContext();
    expect(ctx.currentOpacity).toBe(1.0);
    ctx.pushOpacity(0.5);
    expect(ctx.currentOpacity).toBe(0.5);
    ctx.pushOpacity(0.5);
    expect(ctx.currentOpacity).toBe(0.25);
    ctx.popOpacity();
    expect(ctx.currentOpacity).toBe(0.5);
    ctx.popOpacity();
    expect(ctx.currentOpacity).toBe(1.0);
  });
});

describe('PickContext', () => {
  it('picks closest object at coordinates', () => {
    const pc = new PickContext();
    pc.registerPickable('a', { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 10);
    pc.registerPickable('b', { minX: 50, minY: 50, maxX: 150, maxY: 150 }, 5);
    const result = pc.pick(75, 75);
    expect(result).not.toBeNull();
    expect(result!.object).toBe('b');
  });

  it('returns null when no object at coordinates', () => {
    const pc = new PickContext();
    pc.registerPickable('a', { minX: 0, minY: 0, maxX: 50, maxY: 50 }, 10);
    expect(pc.pick(200, 200)).toBeNull();
  });

  it('pickAll returns sorted by distance', () => {
    const pc = new PickContext();
    pc.registerPickable('far', { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 20);
    pc.registerPickable('near', { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 5);
    pc.registerPickable('mid', { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 10);
    const results = pc.pickAll(50, 50);
    expect(results.map(r => r.object)).toEqual(['near', 'mid', 'far']);
  });

  it('unregister removes from picking', () => {
    const pc = new PickContext();
    pc.registerPickable('a', { minX: 0, minY: 0, maxX: 100, maxY: 100 }, 10);
    pc.unregisterPickable('a');
    expect(pc.pick(50, 50)).toBeNull();
  });
});

describe('ResourceCache', () => {
  it('acquires and releases resources', () => {
    const cache = new ResourceCache<string, number>();
    const val = cache.acquire('key', () => 42);
    expect(val).toBe(42);
    expect(cache.size).toBe(1);
    cache.release('key');
    expect(cache.size).toBe(0);
  });

  it('increments ref count on re-acquire', () => {
    const cache = new ResourceCache<string, number>();
    cache.acquire('key', () => 42);
    cache.acquire('key', () => 99);
    expect(cache.getRefCount('key')).toBe(2);
    cache.release('key');
    expect(cache.size).toBe(1);
    cache.release('key');
    expect(cache.size).toBe(0);
  });

  it('evicts LRU when full', () => {
    const cache = new ResourceCache<string, number>(2);
    cache.acquire('a', () => 1);
    cache.release('a');
    cache.acquire('b', () => 2);
    cache.acquire('c', () => 3);
    expect(cache.size).toBe(2);
    expect(cache.has('a')).toBe(false);
  });
});

describe('TextureManager', () => {
  it('loads and releases textures', () => {
    const tm = new TextureManager();
    const desc = { width: 256, height: 256, format: 'rgba' as const, wrapS: 'repeat' as const, wrapT: 'repeat' as const, minFilter: 'linear' as const, magFilter: 'linear' as const };
    tm.load('tex1', desc);
    expect(tm.isLoaded('tex1')).toBe(true);
    expect(tm.loadCount).toBe(1);
    tm.release('tex1');
    expect(tm.evictCount).toBe(1);
  });
});

describe('ShaderManager', () => {
  it('registers and retrieves programs', () => {
    const sm = new ShaderManager();
    sm.register({ name: 'basic', vertexSource: 'v', fragmentSource: 'f', uniforms: [{ name: 'color', type: 'vec3', value: [1, 0, 0] }] });
    expect(sm.has('basic')).toBe(true);
    expect(sm.count).toBe(1);
  });

  it('sets and gets uniform values', () => {
    const sm = new ShaderManager();
    sm.register({ name: 'p', vertexSource: '', fragmentSource: '', uniforms: [{ name: 'alpha', type: 'float', value: 1.0 }] });
    sm.setUniform('p', 'alpha', 0.5);
    expect(sm.getUniformValue('p', 'alpha')).toBe(0.5);
  });
});

describe('DisplayTaskQueue', () => {
  it('processes tasks in order', async () => {
    const queue = new DisplayTaskQueue();
    const log: string[] = [];
    queue.enqueue({ id: '1', status: 'pending', execute: async () => { log.push('a'); } });
    queue.enqueue({ id: '2', status: 'pending', execute: async () => { log.push('b'); } });
    await queue.processAll();
    expect(log).toEqual(['a', 'b']);
    expect(queue.completedCount).toBe(2);
  });

  it('handles failed tasks', async () => {
    const queue = new DisplayTaskQueue();
    queue.enqueue({ id: '1', status: 'pending', execute: async () => { throw new Error('fail'); } });
    await queue.processNext();
    expect(queue.failedCount).toBe(1);
  });
});

describe('Viewport', () => {
  it('computes aspect ratio', () => {
    const vp = new Viewport(0, 0, 800, 600);
    expect(vp.aspectRatio).toBeCloseTo(4 / 3);
  });

  it('contains checks', () => {
    const vp = new Viewport(100, 100, 200, 200);
    expect(vp.contains(150, 150)).toBe(true);
    expect(vp.contains(50, 50)).toBe(false);
  });

  it('normalizes coordinates', () => {
    const vp = new Viewport(0, 0, 100, 100);
    const { nx, ny } = vp.toNormalized(50, 25);
    expect(nx).toBe(0.5);
    expect(ny).toBe(0.25);
  });

  it('intersects', () => {
    const a = new Viewport(0, 0, 100, 100);
    const b = new Viewport(50, 50, 100, 100);
    const c = new Viewport(200, 200, 50, 50);
    expect(a.intersects(b)).toBe(true);
    expect(a.intersects(c)).toBe(false);
  });
});

describe('Fog', () => {
  it('none fog returns 1', () => {
    expect(computeFogFactor({ type: 'none', color: { r: 1, g: 1, b: 1 }, density: 0, near: 0, far: 100 }, 50)).toBe(1);
  });

  it('linear fog interpolates', () => {
    const fog = { type: 'linear' as const, color: { r: 1, g: 1, b: 1 }, density: 0, near: 10, far: 110 };
    expect(computeFogFactor(fog, 10)).toBeCloseTo(1);
    expect(computeFogFactor(fog, 110)).toBeCloseTo(0);
    expect(computeFogFactor(fog, 60)).toBeCloseTo(0.5);
  });

  it('exponential fog decays', () => {
    const fog = { type: 'exponential' as const, color: { r: 0, g: 0, b: 0 }, density: 0.1, near: 0, far: 100 };
    expect(computeFogFactor(fog, 0)).toBeCloseTo(1);
    expect(computeFogFactor(fog, 10)).toBeLessThan(1);
  });
});

describe('settingsForQuality', () => {
  it('low disables antialiasing', () => {
    expect(settingsForQuality('low').antialiasing).toBe(false);
  });
  it('high enables shadows', () => {
    expect(settingsForQuality('high').shadows).toBe(true);
  });
  it('ultra enables reflections', () => {
    expect(settingsForQuality('ultra').reflections).toBe(true);
  });
});

describe('computeCaptureDataSize', () => {
  it('computes RGB size', () => {
    expect(computeCaptureDataSize({ width: 100, height: 100, format: 'png', quality: 1, includeAlpha: false })).toBe(30000);
  });
  it('computes RGBA size', () => {
    expect(computeCaptureDataSize({ width: 100, height: 100, format: 'png', quality: 1, includeAlpha: true })).toBe(40000);
  });
});
