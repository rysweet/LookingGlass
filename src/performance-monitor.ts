export interface FrameSample {
  timestamp: number;
  deltaMs: number;
  fps: number;
}

export class FPSCounter {
  private _samples: FrameSample[] = [];

  constructor(private readonly windowSize = 60) {
  }

  get samples(): FrameSample[] {
    return this._samples.map((sample) => ({ ...sample }));
  }

  get latest(): FrameSample | null {
    return this._samples.length > 0 ? { ...this._samples.at(-1)! } : null;
  }

  get averageFps(): number {
    if (this._samples.length === 0) {
      return 0;
    }
    return this._samples.reduce((total, sample) => total + sample.fps, 0) / this._samples.length;
  }

  recordFrame(deltaMs: number, timestamp = Date.now()): FrameSample {
    const sample = {
      timestamp,
      deltaMs,
      fps: deltaMs > 0 ? 1000 / deltaMs : 0,
    } satisfies FrameSample;
    this._samples.push(sample);
    if (this._samples.length > this.windowSize) {
      this._samples.shift();
    }
    return { ...sample };
  }
}

export interface MemorySample {
  timestamp: number;
  usedBytes: number;
  totalBytes: number;
}

export class MemoryMonitor {
  private _samples: MemorySample[] = [];

  get samples(): MemorySample[] {
    return this._samples.map((sample) => ({ ...sample }));
  }

  get latest(): MemorySample | null {
    return this._samples.length > 0 ? { ...this._samples.at(-1)! } : null;
  }

  get averageUsedBytes(): number {
    if (this._samples.length === 0) {
      return 0;
    }
    return this._samples.reduce((total, sample) => total + sample.usedBytes, 0) / this._samples.length;
  }

  record(usedBytes: number, totalBytes = usedBytes, timestamp = Date.now()): MemorySample {
    const sample = { timestamp, usedBytes, totalBytes } satisfies MemorySample;
    this._samples.push(sample);
    return { ...sample };
  }

  toMegabytes(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  isGrowing(thresholdBytes: number): boolean {
    if (this._samples.length < 2) {
      return false;
    }
    return this._samples.at(-1)!.usedBytes - this._samples[0].usedBytes >= thresholdBytes;
  }
}

export interface RenderFrameBreakdown {
  timestamp: number;
  totalMs: number;
  sections: Record<string, number>;
}

export class RenderProfiler {
  private _frames: RenderFrameBreakdown[] = [];
  private _current: Record<string, number> | null = null;

  get frames(): RenderFrameBreakdown[] {
    return this._frames.map((frame) => ({ timestamp: frame.timestamp, totalMs: frame.totalMs, sections: { ...frame.sections } }));
  }

  get lastFrame(): RenderFrameBreakdown | null {
    return this._frames.length > 0 ? this.frames.at(-1)! : null;
  }

  beginFrame(): void {
    this._current = {};
  }

  mark(section: string, durationMs: number): void {
    if (this._current === null) {
      this.beginFrame();
    }
    this._current![section] = (this._current![section] ?? 0) + durationMs;
  }

  endFrame(timestamp = Date.now()): RenderFrameBreakdown {
    const sections = this._current ?? {};
    const totalMs = Object.values(sections).reduce((total, duration) => total + duration, 0);
    const frame = {
      timestamp,
      totalMs,
      sections: { ...sections },
    } satisfies RenderFrameBreakdown;
    this._frames.push(frame);
    this._current = null;
    return { timestamp: frame.timestamp, totalMs: frame.totalMs, sections: { ...frame.sections } };
  }

  averageSection(section: string): number {
    const matching = this._frames.filter((frame) => frame.sections[section] !== undefined);
    if (matching.length === 0) {
      return 0;
    }
    return matching.reduce((total, frame) => total + frame.sections[section], 0) / matching.length;
  }
}

export interface NetworkSample {
  endpoint: string;
  latencyMs: number;
  ok: boolean;
  timestamp: number;
}

export class NetworkMonitor {
  private _samples: NetworkSample[] = [];

  record(endpoint: string, latencyMs: number, ok = true, timestamp = Date.now()): NetworkSample {
    const sample = { endpoint, latencyMs, ok, timestamp } satisfies NetworkSample;
    this._samples.push(sample);
    return { ...sample };
  }

  averageLatency(endpoint?: string): number {
    const matching = endpoint ? this._samples.filter((sample) => sample.endpoint === endpoint) : this._samples;
    if (matching.length === 0) {
      return 0;
    }
    return matching.reduce((total, sample) => total + sample.latencyMs, 0) / matching.length;
  }

  failures(endpoint?: string): number {
    return this._samples.filter((sample) => !sample.ok && (!endpoint || sample.endpoint === endpoint)).length;
  }

  slowest(): NetworkSample | null {
    if (this._samples.length === 0) {
      return null;
    }
    return { ...this._samples.reduce((slowest, sample) => sample.latencyMs > slowest.latencyMs ? sample : slowest) };
  }
}

export interface PerformanceMetrics {
  fps: number;
  memoryMB: number;
  renderMs: number;
  networkMs: number;
}

export interface BudgetAlert {
  metric: keyof PerformanceMetrics;
  actual: number;
  threshold: number;
}

export class PerformanceBudget {
  constructor(private readonly thresholds: PerformanceMetrics = { fps: 30, memoryMB: 512, renderMs: 16.7, networkMs: 500 }) {
  }

  get limits(): PerformanceMetrics {
    return { ...this.thresholds };
  }

  evaluate(metrics: PerformanceMetrics): { overBudget: boolean; alerts: BudgetAlert[] } {
    const alerts: BudgetAlert[] = [];
    if (metrics.fps < this.thresholds.fps) {
      alerts.push({ metric: "fps", actual: metrics.fps, threshold: this.thresholds.fps });
    }
    if (metrics.memoryMB > this.thresholds.memoryMB) {
      alerts.push({ metric: "memoryMB", actual: metrics.memoryMB, threshold: this.thresholds.memoryMB });
    }
    if (metrics.renderMs > this.thresholds.renderMs) {
      alerts.push({ metric: "renderMs", actual: metrics.renderMs, threshold: this.thresholds.renderMs });
    }
    if (metrics.networkMs > this.thresholds.networkMs) {
      alerts.push({ metric: "networkMs", actual: metrics.networkMs, threshold: this.thresholds.networkMs });
    }
    return {
      overBudget: alerts.length > 0,
      alerts,
    };
  }
}

export class PerformanceOverlay {
  private _visible = false;

  get visible(): boolean {
    return this._visible;
  }

  show(): void {
    this._visible = true;
  }

  hide(): void {
    this._visible = false;
  }

  toggle(): boolean {
    this._visible = !this._visible;
    return this._visible;
  }

  render(metrics: PerformanceMetrics): string[] {
    if (!this._visible) {
      return [];
    }
    return [
      `FPS: ${metrics.fps.toFixed(1)}`,
      `Memory: ${metrics.memoryMB.toFixed(1)} MB`,
      `Render: ${metrics.renderMs.toFixed(1)} ms`,
      `Network: ${metrics.networkMs.toFixed(1)} ms`,
    ];
  }
}
