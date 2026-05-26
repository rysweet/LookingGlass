import { afterEach, describe, expect, it, vi } from "vitest";
import { RunSystem } from "../src/run-system.js";

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

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

  it("runs initialize, step, and dispose with evolving context", async () => {
    vi.useFakeTimers();
    const lifecycle: Array<{ phase: string; frame: number; elapsedMs: number; speed: number; aborted: boolean }> = [];
    const system = new RunSystem({ tickMs: 100, speed: 2 });

    await system.start({
      initialize: ({ frame, elapsedMs, speed, signal }) => {
        lifecycle.push({ phase: "initialize", frame, elapsedMs, speed, aborted: signal.aborted });
      },
      step: ({ frame, elapsedMs, speed, signal }) => {
        lifecycle.push({ phase: "step", frame, elapsedMs, speed, aborted: signal.aborted });
        return frame < 1;
      },
      dispose: ({ frame, elapsedMs, speed, signal }) => {
        lifecycle.push({ phase: "dispose", frame, elapsedMs, speed, aborted: signal.aborted });
      },
    });

    await vi.runAllTimersAsync();

    expect(lifecycle.map(({ phase }) => phase)).toEqual(["initialize", "step", "step", "dispose"]);
    expect(lifecycle[0]).toMatchObject({ frame: 0, elapsedMs: 0, speed: 2, aborted: false });
    expect(lifecycle[1]).toMatchObject({ frame: 0, elapsedMs: 0, speed: 2, aborted: false });
    expect(lifecycle[2]).toMatchObject({ frame: 1, elapsedMs: 50, speed: 2, aborted: false });
    expect(lifecycle[3]).toMatchObject({ frame: 2, elapsedMs: 50, speed: 2, aborted: false });
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
    await expect(system.waitForCompletion()).resolves.toEqual({
      reason: "completed",
      frameCount: 2,
      elapsedMs: 25,
      error: null,
    });
  });

  it("clamps speed changes and rejects invalid values", () => {
    const system = new RunSystem({ tickMs: 100 });

    system.setSpeed(100);
    expect(system.speed).toBe(16);
    system.setSpeed(0.1);
    expect(system.speed).toBe(0.25);
    expect(() => system.setSpeed(0)).toThrow(TypeError);
    expect(() => new RunSystem({ speed: Number.NaN })).toThrow(TypeError);
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

  it("stops cleanly when cancellation happens during initialize", async () => {
    const gate = deferred();
    const disposed = vi.fn();
    const stepped = vi.fn();
    const system = new RunSystem({ tickMs: 100 });

    const startPromise = system.start({
      initialize: () => gate.promise,
      step: stepped,
      dispose: disposed,
    });
    await Promise.resolve();

    const stopPromise = system.stop();
    gate.resolve();

    await startPromise;
    await expect(stopPromise).resolves.toEqual({
      reason: "stopped",
      frameCount: 0,
      elapsedMs: 0,
      error: null,
    });
    expect(stepped).not.toHaveBeenCalled();
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(system.status).toBe("idle");
  });

  it("restarts from the stored program factory with fresh state", async () => {
    const stepCalls: number[] = [];
    let runId = 0;
    const factory = vi.fn(() => {
      const currentRun = runId++;
      return {
        step: ({ frame }: { frame: number }) => {
          stepCalls.push((currentRun * 10) + frame);
          return false;
        },
      };
    });
    const system = new RunSystem({ tickMs: 100 });

    await system.start(factory);
    await expect(system.waitForCompletion()).resolves.toEqual({
      reason: "completed",
      frameCount: 1,
      elapsedMs: 0,
      error: null,
    });

    await system.restart();
    await expect(system.waitForCompletion()).resolves.toEqual({
      reason: "completed",
      frameCount: 1,
      elapsedMs: 0,
      error: null,
    });
    expect(factory).toHaveBeenCalledTimes(2);
    expect(stepCalls).toEqual([0, 10]);
  });

  it("captures initialize errors", async () => {
    const disposed = vi.fn();
    const system = new RunSystem({ tickMs: 100 });

    await system.start({
      initialize: () => {
        throw new Error("failed to initialize");
      },
      step: () => false,
      dispose: disposed,
    });

    const result = await system.waitForCompletion();
    expect(result?.reason).toBe("error");
    expect(system.status).toBe("error");
    expect(system.lastError?.phase).toBe("initialize");
    expect((system.lastError?.cause as Error).message).toBe("failed to initialize");
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

  it("surfaces dispose errors after an otherwise completed run", async () => {
    const system = new RunSystem({ tickMs: 100 });

    await system.start({
      step: () => false,
      dispose: () => {
        throw new Error("cleanup failed");
      },
    });

    const result = await system.waitForCompletion();
    expect(result?.reason).toBe("error");
    expect(result?.frameCount).toBe(1);
    expect(result?.elapsedMs).toBe(0);
    expect(result?.error?.phase).toBe("dispose");
    expect((result?.error?.cause as Error).message).toBe("cleanup failed");
    expect(system.lastError?.phase).toBe("dispose");
    expect(system.status).toBe("completed");
  });

  it("returns null when the system is idle", async () => {
    const system = new RunSystem({ tickMs: 100 });

    await expect(system.stop()).resolves.toBeNull();
    await expect(system.waitForCompletion()).resolves.toBeNull();
  });
});
