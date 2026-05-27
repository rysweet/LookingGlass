import type { AnimationStateName, AnimationTransition } from "./types.js";
import { clamp01 } from "./math.js";

const DEFAULT_TRANSITIONS: readonly AnimationTransition[] = Object.freeze([
  { from: "idle", to: "walking", durationMs: 200 },
  { from: "walking", to: "idle", durationMs: 220 },
  { from: "idle", to: "talking", durationMs: 120 },
  { from: "talking", to: "idle", durationMs: 160 },
  { from: "walking", to: "talking", durationMs: 150 },
  { from: "talking", to: "walking", durationMs: 180 },
]);

interface ActiveTransitionState {
  readonly from: AnimationStateName;
  readonly to: AnimationStateName;
  readonly durationMs: number;
  readonly elapsedMs: number;
}

function stateWeightsOf(state: AnimationStateName): Readonly<Record<string, number>> {
  return { [state]: 1 };
}

export class AnimationStateMachine {
  readonly #transitions: readonly AnimationTransition[];
  #state: AnimationStateName;
  #transition: ActiveTransitionState | null = null;

  constructor(initialState: AnimationStateName = "idle", transitions: readonly AnimationTransition[] = DEFAULT_TRANSITIONS) {
    this.#state = initialState;
    this.#transitions = transitions;
  }

  getCurrentState(): AnimationStateName {
    return this.#transition?.to ?? this.#state;
  }

  getBlendWeights(): Readonly<Record<string, number>> {
    if (!this.#transition) {
      return stateWeightsOf(this.#state);
    }
    const progress = this.#transition.durationMs <= 0 ? 1 : clamp01(this.#transition.elapsedMs / this.#transition.durationMs);
    return { [this.#transition.from]: 1 - progress, [this.#transition.to]: progress };
  }

  trigger(nextState: AnimationStateName): void {
    const sourceState = this.getCurrentState();
    if (sourceState === nextState) return;
    const transition = this.#transitions.find((candidate) => (candidate.from === sourceState || candidate.from === "*") && candidate.to === nextState);
    if (!transition || transition.durationMs <= 0) {
      this.#state = nextState;
      this.#transition = null;
      return;
    }
    this.#state = sourceState;
    this.#transition = { from: sourceState, to: nextState, durationMs: transition.durationMs, elapsedMs: 0 };
  }

  update(deltaMs: number): void {
    if (!this.#transition) return;
    const nextElapsed = this.#transition.elapsedMs + Math.max(deltaMs, 0);
    if (nextElapsed >= this.#transition.durationMs) {
      this.#state = this.#transition.to;
      this.#transition = null;
      return;
    }
    this.#transition = { ...this.#transition, elapsedMs: nextElapsed };
  }
}
