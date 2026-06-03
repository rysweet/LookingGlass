import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnimationLoop,
  AnimationQueue,
  easeInOut,
  interpolateVec3Linear,
  slerpOrientation,
  type FrameScheduler,
} from "../src/animation-loop.js";

afterEach(() => {
  vi.useRealTimers();
});

function createScheduler(): FrameScheduler {
  let nowMs = 0;
  return {
    requestAnimationFrame: (callback) => setTimeout(() => {
      nowMs += 16;
      callback(nowMs);
    }, 16),
    cancelAnimationFrame: (handle) => clearTimeout(handle),
    now: () => nowMs,
  };
}

describe("animation-loop", () => {
  it("queues animations sequentially for one entity", async () => {
    const queue = new AnimationQueue();
    let position = { x: 0, y: 0, z: 0 };

    const first = queue.enqueue({
      entityId: "bunny",
      durationMs: 1000,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 10, y: 0, z: 0 },
      interpolate: interpolateVec3Linear,
      apply: (value) => {
        position = value;
      },
    });
    const second = queue.enqueue({
      entityId: "bunny",
      durationMs: 1000,
      from: { x: 10, y: 0, z: 0 },
      to: { x: 20, y: 0, z: 0 },
      interpolate: interpolateVec3Linear,
      apply: (value) => {
        position = value;
      },
    });

    queue.update(500);
    expect(position.x).toBeCloseTo(5, 5);

    queue.update(1000);
    expect(position.x).toBeCloseTo(10, 5);

    queue.update(1500);
    expect(position.x).toBeCloseTo(15, 5);

    queue.update(2000);
    expect(position.x).toBeCloseTo(20, 5);
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
  });

  it("runs animations concurrently across entities", () => {
    const queue = new AnimationQueue();
    let bunnyX = 0;
    let carZ = 0;

    queue.enqueue({
      entityId: "bunny",
      durationMs: 1000,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 8, y: 0, z: 0 },
      interpolate: interpolateVec3Linear,
      apply: (value) => {
        bunnyX = value.x;
      },
    });
    queue.enqueue({
      entityId: "car",
      durationMs: 1000,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 0, y: 0, z: -6 },
      interpolate: interpolateVec3Linear,
      apply: (value) => {
        carZ = value.z;
      },
    });

    queue.update(500);
    expect(bunnyX).toBeCloseTo(4, 5);
    expect(carZ).toBeCloseTo(-3, 5);
  });

  it("uses ease-in-out and slerp interpolation helpers", () => {
    expect(easeInOut(0.25)).toBeCloseTo(0.15625, 5);

    const halfway = slerpOrientation(
      { x: 0, y: 0, z: 0, w: 1 },
      { x: 0, y: 1, z: 0, w: 0 },
      0.5,
    );

    expect(halfway.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(halfway.w).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it("supports play, pause, stop, and step controls", async () => {
    vi.useFakeTimers();
    const renderTimes: number[] = [];
    const loop = new AnimationLoop({
      scheduler: createScheduler(),
      render: (simulationTimeMs) => {
        renderTimes.push(simulationTimeMs);
      },
    });

    loop.play();
    await vi.advanceTimersByTimeAsync(32);
    expect(loop.state).toBe("playing");
    expect(loop.simulationTimeMs).toBe(16);
    expect(renderTimes).toEqual([0, 16]);

    loop.pause();
    await vi.advanceTimersByTimeAsync(64);
    expect(loop.state).toBe("paused");
    expect(loop.simulationTimeMs).toBe(16);

    loop.step(50);
    expect(loop.simulationTimeMs).toBe(66);
    expect(loop.state).toBe("paused");

    loop.stop();
    expect(loop.state).toBe("stopped");
    expect(loop.simulationTimeMs).toBe(0);
    expect(loop.queue.size).toBe(0);
  });

  it("sequences cross-entity animations in sequential block", () => {
    const queue = new AnimationQueue();
    let posA = 0;
    let posB = 0;

    queue.beginSequentialBlock();

    queue.enqueue({
      entityId: "entityA",
      durationMs: 100,
      from: 0,
      to: 10,
      interpolate: (from, to, t) => from + (to - from) * t,
      apply: (value) => { posA = value as number; },
    });

    queue.enqueue({
      entityId: "entityB",
      durationMs: 100,
      from: 0,
      to: 20,
      interpolate: (from, to, t) => from + (to - from) * t,
      apply: (value) => { posB = value as number; },
    });

    queue.endSequentialBlock();

    // At t=50, only entityA should be animating (starts at 0, ends at 100)
    queue.update(50);
    expect(posA).toBeCloseTo(5);
    expect(posB).toBe(0);

    // At t=100, entityA done, entityB hasn't started yet (starts at 100)
    queue.update(100);
    expect(posA).toBe(10);
    expect(posB).toBe(0);

    // At t=150, entityB is mid-animation
    queue.update(150);
    expect(posB).toBeCloseTo(10);

    // At t=200, entityB is done
    queue.update(200);
    expect(posB).toBe(20);
    expect(queue.size).toBe(0);
  });

  it("overlaps cross-entity animations without sequential block", () => {
    const queue = new AnimationQueue();
    let posA = 0;
    let posB = 0;

    queue.enqueue({
      entityId: "entityA",
      durationMs: 100,
      from: 0,
      to: 10,
      interpolate: (from, to, t) => from + (to - from) * t,
      apply: (value) => { posA = value as number; },
    });

    queue.enqueue({
      entityId: "entityB",
      durationMs: 100,
      from: 0,
      to: 20,
      interpolate: (from, to, t) => from + (to - from) * t,
      apply: (value) => { posB = value as number; },
    });

    // Without sequential block, both start at t=0 — they overlap
    queue.update(50);
    expect(posA).toBeCloseTo(5);
    expect(posB).toBeCloseTo(10);
  });
});
