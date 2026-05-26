/**
 * Alice Web Renderer — Three.js rendering pipeline matching Java's GL renderer.
 *
 * Java has core/glrender with 77 adapter classes, RenderContext, picking,
 * and display tasks. This ports the key subsystems to Three.js.
 */

// ── Render Target ──────────────────────────────────────────────────

export interface RenderTargetListener {
  cleared?(): void;
  rendered?(): void;
  resized?(width: number, height: number): void;
}

export class RenderTarget {
  private listeners: RenderTargetListener[] = [];
  private _width: number;
  private _height: number;
  private _enabled = true;
  private _renderCount = 0;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  get width() { return this._width; }
  get height() { return this._height; }
  get enabled() { return this._enabled; }
  get renderCount() { return this._renderCount; }

  setEnabled(enabled: boolean) { this._enabled = enabled; }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;
    for (const l of this.listeners) l.resized?.(width, height);
  }

  addListener(listener: RenderTargetListener) { this.listeners.push(listener); }
  removeListener(listener: RenderTargetListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  render(context: RenderContext) {
    if (!this._enabled) return;
    for (const l of this.listeners) l.cleared?.();
    context.render();
    this._renderCount++;
    for (const l of this.listeners) l.rendered?.();
  }
}

// ── Render Context ─────────────────────────────────────────────────

export interface RenderPass {
  name: string;
  execute(context: RenderContext): void;
}

export class RenderContext {
  private passes: RenderPass[] = [];
  private _frameCount = 0;
  private _lastFrameTime = 0;
  private _fps = 0;
  private opacityStack: number[] = [1.0];

  get frameCount() { return this._frameCount; }
  get fps() { return this._fps; }
  get currentOpacity() { return this.opacityStack[this.opacityStack.length - 1]; }

  addPass(pass: RenderPass) { this.passes.push(pass); }
  removePass(name: string) { this.passes = this.passes.filter(p => p.name !== name); }

  pushOpacity(opacity: number) {
    this.opacityStack.push(this.currentOpacity * opacity);
  }
  popOpacity() {
    if (this.opacityStack.length > 1) this.opacityStack.pop();
  }

  render() {
    const now = performance.now();
    if (this._lastFrameTime > 0) {
      const dt = now - this._lastFrameTime;
      this._fps = dt > 0 ? 1000 / dt : 0;
    }
    this._lastFrameTime = now;
    for (const pass of this.passes) pass.execute(this);
    this._frameCount++;
  }
}

// ── Picking System ─────────────────────────────────────────────────

export interface PickResult {
  object: string;
  point: { x: number; y: number; z: number };
  distance: number;
  faceIndex?: number;
}

export class PickContext {
  private objects: Map<string, { bounds: { minX: number; minY: number; maxX: number; maxY: number }; depth: number }> = new Map();

  registerPickable(id: string, screenBounds: { minX: number; minY: number; maxX: number; maxY: number }, depth: number) {
    this.objects.set(id, { bounds: screenBounds, depth });
  }

  unregisterPickable(id: string) { this.objects.delete(id); }

  pick(screenX: number, screenY: number): PickResult | null {
    let closest: { id: string; depth: number } | null = null;
    for (const [id, { bounds, depth }] of this.objects) {
      if (screenX >= bounds.minX && screenX <= bounds.maxX &&
          screenY >= bounds.minY && screenY <= bounds.maxY) {
        if (!closest || depth < closest.depth) {
          closest = { id, depth };
        }
      }
    }
    if (!closest) return null;
    return {
      object: closest.id,
      point: { x: screenX, y: screenY, z: closest.depth },
      distance: closest.depth,
    };
  }

  pickAll(screenX: number, screenY: number): PickResult[] {
    const results: PickResult[] = [];
    for (const [id, { bounds, depth }] of this.objects) {
      if (screenX >= bounds.minX && screenX <= bounds.maxX &&
          screenY >= bounds.minY && screenY <= bounds.maxY) {
        results.push({ object: id, point: { x: screenX, y: screenY, z: depth }, distance: depth });
      }
    }
    return results.sort((a, b) => a.distance - b.distance);
  }
}

// ── Resource Cache ─────────────────────────────────────────────────

export class ResourceCache<K, V> {
  private cache = new Map<K, { value: V; refCount: number; lastAccessed: number }>();
  private _maxSize: number;

  constructor(maxSize = 1000) { this._maxSize = maxSize; }

  get size() { return this.cache.size; }
  get maxSize() { return this._maxSize; }

  acquire(key: K, factory: () => V): V {
    const existing = this.cache.get(key);
    if (existing) {
      existing.refCount++;
      existing.lastAccessed = Date.now();
      return existing.value;
    }
    if (this.cache.size >= this._maxSize) this.evictLeastRecentlyUsed();
    const value = factory();
    this.cache.set(key, { value, refCount: 1, lastAccessed: Date.now() });
    return value;
  }

  release(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    entry.refCount--;
    if (entry.refCount <= 0) { this.cache.delete(key); return true; }
    return false;
  }

  has(key: K) { return this.cache.has(key); }
  getRefCount(key: K) { return this.cache.get(key)?.refCount ?? 0; }

  private evictLeastRecentlyUsed() {
    let oldest: K | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of this.cache) {
      if (entry.refCount <= 0 && entry.lastAccessed < oldestTime) {
        oldest = key;
        oldestTime = entry.lastAccessed;
      }
    }
    if (oldest !== null) this.cache.delete(oldest);
  }

  clear() { this.cache.clear(); }
}

// ── Texture Management ─────────────────────────────────────────────

export interface TextureDescriptor {
  width: number;
  height: number;
  format: 'rgba' | 'rgb' | 'luminance';
  wrapS: 'repeat' | 'clamp' | 'mirror';
  wrapT: 'repeat' | 'clamp' | 'mirror';
  minFilter: 'nearest' | 'linear' | 'mipmap';
  magFilter: 'nearest' | 'linear';
}

export class TextureManager {
  private textures = new ResourceCache<string, TextureDescriptor>(512);
  private _loadCount = 0;
  private _evictCount = 0;

  get loadCount() { return this._loadCount; }
  get evictCount() { return this._evictCount; }
  get activeCount() { return this.textures.size; }

  load(id: string, descriptor: TextureDescriptor): TextureDescriptor {
    this._loadCount++;
    return this.textures.acquire(id, () => descriptor);
  }

  release(id: string) {
    if (this.textures.release(id)) this._evictCount++;
  }

  isLoaded(id: string) { return this.textures.has(id); }
}

// ── Shader Management ──────────────────────────────────────────────

export interface ShaderUniform {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D' | 'int';
  value: unknown;
}

export interface ShaderProgram {
  name: string;
  vertexSource: string;
  fragmentSource: string;
  uniforms: ShaderUniform[];
}

export class ShaderManager {
  private programs = new Map<string, ShaderProgram>();

  register(program: ShaderProgram) { this.programs.set(program.name, program); }
  get(name: string) { return this.programs.get(name) ?? null; }
  has(name: string) { return this.programs.has(name); }
  get count() { return this.programs.size; }

  setUniform(programName: string, uniformName: string, value: unknown): boolean {
    const program = this.programs.get(programName);
    if (!program) return false;
    const uniform = program.uniforms.find(u => u.name === uniformName);
    if (!uniform) return false;
    uniform.value = value;
    return true;
  }

  getUniformValue(programName: string, uniformName: string): unknown | null {
    return this.programs.get(programName)?.uniforms.find(u => u.name === uniformName)?.value ?? null;
  }
}

// ── Render Pipeline ────────────────────────────────────────────────

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface RenderSettings {
  quality: RenderQuality;
  antialiasing: boolean;
  shadows: boolean;
  reflections: boolean;
  maxLights: number;
  pixelRatio: number;
}

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  quality: 'medium',
  antialiasing: true,
  shadows: false,
  reflections: false,
  maxLights: 4,
  pixelRatio: 1,
};

export function settingsForQuality(quality: RenderQuality): RenderSettings {
  switch (quality) {
    case 'low': return { ...DEFAULT_RENDER_SETTINGS, quality, antialiasing: false, maxLights: 2, pixelRatio: 0.75 };
    case 'medium': return { ...DEFAULT_RENDER_SETTINGS, quality };
    case 'high': return { ...DEFAULT_RENDER_SETTINGS, quality, shadows: true, maxLights: 8, pixelRatio: 1.5 };
    case 'ultra': return { ...DEFAULT_RENDER_SETTINGS, quality, shadows: true, reflections: true, maxLights: 16, pixelRatio: 2 };
  }
}

// ── Display Task System ────────────────────────────────────────────

export type DisplayTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface DisplayTask {
  id: string;
  status: DisplayTaskStatus;
  execute(): Promise<void>;
}

export class DisplayTaskQueue {
  private tasks: DisplayTask[] = [];
  private _completedCount = 0;
  private _failedCount = 0;

  get pendingCount() { return this.tasks.filter(t => t.status === 'pending').length; }
  get completedCount() { return this._completedCount; }
  get failedCount() { return this._failedCount; }

  enqueue(task: DisplayTask) { this.tasks.push(task); }

  async processNext(): Promise<DisplayTask | null> {
    const task = this.tasks.find(t => t.status === 'pending');
    if (!task) return null;
    task.status = 'running';
    try {
      await task.execute();
      task.status = 'completed';
      this._completedCount++;
    } catch {
      task.status = 'failed';
      this._failedCount++;
    }
    return task;
  }

  async processAll(): Promise<number> {
    let count = 0;
    while (this.pendingCount > 0) {
      await this.processNext();
      count++;
    }
    return count;
  }

  clear() { this.tasks = []; }
}

// ── Image Capture ──────────────────────────────────────────────────

export interface CaptureOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0-1
  includeAlpha: boolean;
}

export const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  width: 800,
  height: 600,
  format: 'png',
  quality: 0.92,
  includeAlpha: false,
};

export function computeCaptureDataSize(options: CaptureOptions): number {
  const channels = options.includeAlpha ? 4 : 3;
  return options.width * options.height * channels;
}

// ── Viewport ───────────────────────────────────────────────────────

export class Viewport {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  get aspectRatio() { return this.width / this.height; }

  contains(px: number, py: number) {
    return px >= this.x && px < this.x + this.width &&
           py >= this.y && py < this.y + this.height;
  }

  toNormalized(px: number, py: number): { nx: number; ny: number } {
    return {
      nx: (px - this.x) / this.width,
      ny: (py - this.y) / this.height,
    };
  }

  fromNormalized(nx: number, ny: number): { px: number; py: number } {
    return {
      px: this.x + nx * this.width,
      py: this.y + ny * this.height,
    };
  }

  intersects(other: Viewport): boolean {
    return !(other.x >= this.x + this.width || other.x + other.width <= this.x ||
             other.y >= this.y + this.height || other.y + other.height <= this.y);
  }
}

// ── Fog ────────────────────────────────────────────────────────────

export type FogType = 'none' | 'linear' | 'exponential' | 'exponential-squared';

export interface FogSettings {
  type: FogType;
  color: { r: number; g: number; b: number };
  density: number;
  near: number;
  far: number;
}

export function computeFogFactor(fogSettings: FogSettings, distance: number): number {
  switch (fogSettings.type) {
    case 'none': return 1;
    case 'linear': {
      const range = fogSettings.far - fogSettings.near;
      return range > 0 ? Math.max(0, Math.min(1, (fogSettings.far - distance) / range)) : 1;
    }
    case 'exponential':
      return Math.exp(-fogSettings.density * distance);
    case 'exponential-squared':
      return Math.exp(-((fogSettings.density * distance) ** 2));
  }
}
