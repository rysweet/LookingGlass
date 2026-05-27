import {
  collectCollisionPairs,
  collectProximityPairs,
  type CollisionTransitionEvent,
  type PairState,
  type ProximityState,
  type ProximityTransitionEvent,
  type ProximityWatch,
  SThing,
} from "./shared.js";

export class CollisionStartListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #active = new Map<string, PairState>();
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) { this.#onEvent = onEvent; }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const current = collectCollisionPairs(entities);
    const events: CollisionTransitionEvent[] = [];
    for (const [key, pair] of current) {
      if (this.#active.has(key)) continue;
      const event: CollisionTransitionEvent = { type: "collision-start", ...pair };
      this.events.push(event); this.#onEvent?.(event); events.push(event);
    }
    this.#active.clear();
    for (const [key, pair] of current) this.#active.set(key, pair);
    return events;
  }
}

export class CollisionEndListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #active = new Map<string, PairState>();
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) { this.#onEvent = onEvent; }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const current = collectCollisionPairs(entities);
    const events: CollisionTransitionEvent[] = [];
    for (const [key, pair] of this.#active) {
      if (current.has(key)) continue;
      const event: CollisionTransitionEvent = { type: "collision-end", ...pair };
      this.events.push(event); this.#onEvent?.(event); events.push(event);
    }
    this.#active.clear();
    for (const [key, pair] of current) this.#active.set(key, pair);
    return events;
  }
}

export class WhileCollisionListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) { this.#onEvent = onEvent; }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const events = [...collectCollisionPairs(entities).values()].map((pair) => ({ type: "while-collision" as const, ...pair }));
    this.events.push(...events);
    events.forEach((event) => this.#onEvent?.(event));
    return events;
  }
}

abstract class ProximityListenerBase {
  readonly events: ProximityTransitionEvent[] = [];
  protected readonly active = new Map<string, ProximityState>();
  constructor(protected readonly onEvent?: (event: ProximityTransitionEvent) => void) {}
  protected emit(event: ProximityTransitionEvent, events: ProximityTransitionEvent[]): void {
    this.events.push(event);
    this.onEvent?.(event);
    events.push(event);
  }
}

export class ProximityEnterListener extends ProximityListenerBase {
  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const current = collectProximityPairs(watches);
    const events: ProximityTransitionEvent[] = [];
    for (const [key, proximity] of current) {
      if (this.active.has(key)) continue;
      this.emit({ type: "proximity-enter", ...proximity }, events);
    }
    this.active.clear();
    for (const [key, proximity] of current) this.active.set(key, proximity);
    return events;
  }
}

export class ProximityExitListener extends ProximityListenerBase {
  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const current = collectProximityPairs(watches);
    const events: ProximityTransitionEvent[] = [];
    for (const [key, proximity] of this.active) {
      if (current.has(key)) continue;
      this.emit({ type: "proximity-exit", ...proximity }, events);
    }
    this.active.clear();
    for (const [key, proximity] of current) this.active.set(key, proximity);
    return events;
  }
}

export class WhileProximityListener extends ProximityListenerBase {
  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const events = [...collectProximityPairs(watches).values()].map((proximity) => ({ type: "while-proximity" as const, ...proximity }));
    this.events.push(...events);
    events.forEach((event) => this.onEvent?.(event));
    return events;
  }
}
