import type { AnimationClip, AnimationObserver } from "../animation";

export function notifyImmediateObserver(observer?: AnimationObserver): void {
  if (!observer) {
    return;
  }
  const completed: AnimationClip = {
    durationMs: 0,
    elapsedMs: 0,
    progress: 1,
    complete: true,
    isComplete: true,
    update: () => ({ elapsedMs: 0, durationMs: 0, progress: 1, complete: true }),
    reset: () => {},
  };
  observer.started?.(completed);
  observer.updated?.(completed, { elapsedMs: 0, durationMs: 0, progress: 1, complete: true });
  observer.finished?.(completed);
  observer.completed?.(completed);
}
