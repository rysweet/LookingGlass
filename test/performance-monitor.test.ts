import { describe, expect, it } from "vitest";
import {
  FPSCounter,
  MemoryMonitor,
  NetworkMonitor,
  PerformanceBudget,
  PerformanceOverlay,
  RenderProfiler,
} from "../src/performance-monitor.js";

describe("performance-monitor", () => {
  it("computes a rolling FPS average", () => {
    const counter = new FPSCounter(2);
    counter.recordFrame(16.67, 1);
    counter.recordFrame(20, 2);
    counter.recordFrame(25, 3);

    expect(counter.samples).toHaveLength(2);
    expect(counter.latest?.timestamp).toBe(3);
    expect(counter.averageFps).toBeCloseTo((50 + 40) / 2, 5);
  });

  it("tracks memory growth and converts bytes to megabytes", () => {
    const monitor = new MemoryMonitor();
    monitor.record(100, 200, 1);
    monitor.record(300, 400, 2);

    expect(monitor.averageUsedBytes).toBe(200);
    expect(monitor.toMegabytes(1048576)).toBe(1);
    expect(monitor.isGrowing(150)).toBe(true);
  });

  it("profiles render frames by section", () => {
    const profiler = new RenderProfiler();
    profiler.beginFrame();
    profiler.mark("layout", 3);
    profiler.mark("draw", 5);
    profiler.mark("draw", 2);
    const frame = profiler.endFrame(10);

    expect(frame.totalMs).toBe(10);
    expect(frame.sections.draw).toBe(7);
    expect(profiler.averageSection("layout")).toBe(3);
  });

  it("records network latency, failures, and slowest request", () => {
    const monitor = new NetworkMonitor();
    monitor.record("/health", 30);
    monitor.record("/save", 250, false);
    monitor.record("/save", 150);

    expect(monitor.averageLatency("/save")).toBe(200);
    expect(monitor.failures("/save")).toBe(1);
    expect(monitor.slowest()).toMatchObject({ endpoint: "/save", latencyMs: 250 });
  });

  it("raises budget alerts when metrics exceed thresholds", () => {
    const budget = new PerformanceBudget({ fps: 55, memoryMB: 128, renderMs: 12, networkMs: 100 });
    const result = budget.evaluate({ fps: 45, memoryMB: 256, renderMs: 14, networkMs: 50 });

    expect(result.overBudget).toBe(true);
    expect(result.alerts).toEqual([
      { metric: "fps", actual: 45, threshold: 55 },
      { metric: "memoryMB", actual: 256, threshold: 128 },
      { metric: "renderMs", actual: 14, threshold: 12 },
    ]);
  });

  it("renders an overlay only when visible", () => {
    const overlay = new PerformanceOverlay();
    expect(overlay.render({ fps: 60, memoryMB: 100, renderMs: 8, networkMs: 20 })).toEqual([]);

    overlay.show();
    const lines = overlay.render({ fps: 60, memoryMB: 100, renderMs: 8, networkMs: 20 });

    expect(lines[0]).toContain("FPS: 60.0");
    expect(lines[1]).toContain("Memory: 100.0 MB");
    expect(overlay.toggle()).toBe(false);
  });
});
