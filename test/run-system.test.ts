import { afterEach, describe, expect, it, vi } from "vitest";
import { RunSystem } from "../src/run-system.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("run-system", () => {
  it("runs programs to completion", async () => {
    vi.useFakeTimers();
    const frames: number[] = [];
    const system = new RunSystem({ tickMs: 100 });

    await system.start({
      step: ({ frame }) => {
        frames.push(frame);
        return frame < 2;
      },
    });
    const completion = system.waitForCompletion();
    await vi.runAllTimersAsync();

    await expect(completion).resolves.toEqual({
      reason: "completed",
      frameCount: 3,
      elapsedMs: 200,
      error: null,
    });
    expect(system.status).toBe("completed");
    expect(frames).toEqual([0, 1, 2]);
  });

  it("applies speed control to scheduling", async () => {
    vi.useFakeTimers();
    const frames: number[] = [];
    const system = new RunSystem({ tickMs: 100, speed: 4 });

    await system.start({
      step: ({ frame }) => {
        frames.push(frame);
        return frame < 1;
      },
    });

    await vi.advanceTimersByTimeAsync(24);
    expect(frames).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    await expect(system.waitForCompletion()).resolves?.toEqual({
      reason: "completed",
      frameCount: 2,
      elapsedMs: 25,
      error: null,
    });
  });

  it("supports stopping a running program", async () => {
    vi.useFakeTimers();
    const disposed = vi.fn();
    const system = new RunSystem({ tickMs: 100 });

    await system.start({
      step: () => true,
      dispose: disposed,
    });
    await vi.advanceTimersByTimeAsync(100);
    const result = await system.stop();

    expect(result).toEqual({
      reason: "stopped",
      frameCount: 2,
      elapsedMs: 100,
      error: null,
    });
    expect(system.status).toBe("idle");
    expect(disposed).toHaveBeenCalled();
  });

  it("captures runtime errors", async () => {
    vi.useFakeTimers();
    const disposed = vi.fn();
    const system = new RunSystem({ tickMs: 100 });

    await system.start({
      step: () => {
        throw new Error("boom");
      },
      dispose: disposed,
    });

    const result = await system.waitForCompletion();
    expect(result?.reason).toBe("error");
    expect(system.status).toBe("error");
    expect(system.lastError?.phase).toBe("step");
    expect(disposed).toHaveBeenCalled();
  });
});
