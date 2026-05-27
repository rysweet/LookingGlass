import { describe, expect, it } from "vitest";
import * as PublicApi from "../src/index.js";
import { AnimationClock, Clock, ScheduledTask, TimeManager, Timer } from "../src/time-system.js";

describe("time-system", () => {
  it("exports the new timing and story api helper modules from the public api", () => {
    expect(PublicApi).toHaveProperty("StoryApiEvents");
    expect(PublicApi).toHaveProperty("StoryApiMethods");
    expect(PublicApi).toHaveProperty("TimeSystem");
  });

  it("tracks elapsed time delta and fixed timestep accumulation", () => {
    const clock = new Clock(0.02);

    const snapshot = clock.tick(0.05);

    expect(snapshot.elapsedSeconds).toBeCloseTo(0.05, 6);
    expect(snapshot.deltaSeconds).toBeCloseTo(0.05, 6);
    expect(snapshot.fixedDeltaSeconds).toBeCloseTo(0.02, 6);
    expect(snapshot.pendingFixedSteps).toBe(2);
    expect(snapshot.interpolationAlpha).toBeCloseTo(0.5, 6);
    expect(clock.consumeFixedSteps()).toBe(2);
    expect(clock.pendingFixedSteps).toBe(0);
  });

  it("supports countdown one-shot and repeating timers", () => {
    let callbackCount = 0;
    const countdown = Timer.countdown(2);
    const oneShot = Timer.oneShot(1, () => { callbackCount += 1; });
    const repeating = Timer.repeating(0.5, () => { callbackCount += 1; });

    expect(countdown.tick(0.5)).toMatchObject({ fired: 0, remainingSeconds: 1.5, complete: false, running: true });
    expect(oneShot.tick(0.4)).toMatchObject({ fired: 0, remainingSeconds: 0.6, complete: false, running: true });
    expect(oneShot.tick(0.6)).toMatchObject({ fired: 1, remainingSeconds: 0, complete: true, running: false });
    expect(repeating.tick(1.25)).toMatchObject({ fired: 2, remainingSeconds: 0.25, complete: false, running: true });
    expect(callbackCount).toBe(3);
  });

  it("coordinates pause resume speed timer and scheduled task updates", () => {
    let fired = 0;
    let executed = 0;
    const manager = new TimeManager({ fixedDeltaSeconds: 0.1, speed: 2 });
    manager.registerTimer(Timer.repeating(0.5, () => { fired += 1; }));
    manager.schedule(new ScheduledTask(0.75, () => { executed += 1; }));

    const fastForward = manager.update(0.25);
    expect(fastForward.deltaSeconds).toBeCloseTo(0.5, 6);
    expect(fastForward.consumedFixedSteps).toBe(5);
    expect(fastForward.firedTimers[0]?.fired).toBe(1);
    expect(executed).toBe(0);

    manager.pause();
    const paused = manager.update(1);
    expect(paused.deltaSeconds).toBe(0);
    expect(paused.firedTimers).toEqual([]);
    expect(executed).toBe(0);

    manager.resume();
    manager.setSpeed(1);
    const resumed = manager.update(0.25);
    expect(resumed.deltaSeconds).toBe(0.25);
    expect(resumed.executedTasks).toHaveLength(1);
    expect(fired).toBe(1);
    expect(executed).toBe(1);
  });

  it("lets scheduled tasks be cancelled and rescheduled", () => {
    let executions = 0;
    const task = new ScheduledTask(0.5, () => { executions += 1; });

    expect(task.tick(0.25)).toBe(false);
    task.reschedule(1);
    expect(task.remainingSeconds).toBe(1);
    task.cancel();
    expect(task.tick(1)).toBe(false);
    expect(executions).toBe(0);

    task.reschedule(0.2);
    expect(task.tick(0.2)).toBe(true);
    expect(executions).toBe(1);
  });

  it("advances animation time with playback rate and pause support", () => {
    const clock = new AnimationClock(2, 2);

    expect(clock.tick(0.5)).toMatchObject({ elapsedSeconds: 1, deltaSeconds: 1, progress: 0.5, paused: false, complete: false });
    clock.pause();
    expect(clock.tick(0.5)).toMatchObject({ elapsedSeconds: 1, deltaSeconds: 0, progress: 0.5, paused: true, complete: false });
    clock.resume();
    clock.setPlaybackRate(1);
    expect(clock.tick(0.5)).toMatchObject({ elapsedSeconds: 1.5, deltaSeconds: 0.5, progress: 0.75, paused: false, complete: false });
    clock.seek(2);
    expect(clock.snapshot()).toMatchObject({ elapsedSeconds: 2, progress: 1, complete: true });
  });
});
