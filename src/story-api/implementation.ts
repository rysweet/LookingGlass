export * from "./expanded-implementation";

import type {
  BindingSyncDirection,
  PropertyChange,
  SceneLifecycleHost,
} from "./expanded-implementation";

export interface PropertyChangeSummary<T> {
  readonly count: number;
  readonly initialValue: T | undefined;
  readonly currentValue: T | undefined;
  readonly values: T[];
  readonly previousValues: T[];
}

export interface PropertyChangeTimelineEntry<T> {
  readonly index: number;
  readonly previousValue: T;
  readonly value: T;
}

export interface SceneLifecycleSummary {
  readonly isActive: boolean;
  readonly hasProgram: boolean;
  readonly activationState: "active" | "inactive";
}

export function summarizePropertyChanges<T>(
  changes: readonly PropertyChange<T>[],
): PropertyChangeSummary<T> {
  return {
    count: changes.length,
    initialValue: changes[0]?.previousValue,
    currentValue: changes.at(-1)?.value,
    values: changes.map((change) => change.value),
    previousValues: changes.map((change) => change.previousValue),
  };
}

export function createPropertyChangeTimeline<T>(
  changes: readonly PropertyChange<T>[],
): PropertyChangeTimelineEntry<T>[] {
  return changes.map((change, index) => ({
    index,
    previousValue: change.previousValue,
    value: change.value,
  }));
}

export function getLatestPropertyValue<T>(
  changes: readonly PropertyChange<T>[],
  fallback?: T,
): T | undefined {
  return changes.at(-1)?.value ?? fallback;
}

export function getInitialPropertyValue<T>(
  changes: readonly PropertyChange<T>[],
  fallback?: T,
): T | undefined {
  return changes[0]?.previousValue ?? fallback;
}

export function propertyChanged<T>(
  changes: readonly PropertyChange<T>[],
  equals: (left: T, right: T) => boolean = Object.is,
): boolean {
  if (changes.length === 0) {
    return false;
  }
  return !equals(changes[0].previousValue, changes.at(-1)!.value);
}

export function distinctPropertyValues<T>(
  changes: readonly PropertyChange<T>[],
  key: (value: T) => string = (value) => JSON.stringify(value),
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const change of changes) {
    const token = key(change.value);
    if (!seen.has(token)) {
      seen.add(token);
      result.push(change.value);
    }
  }
  return result;
}

export function mergePropertyChangeSummaries<T>(
  summaries: readonly PropertyChangeSummary<T>[],
): PropertyChangeSummary<T> {
  const values = summaries.flatMap((summary) => summary.values);
  const previousValues = summaries.flatMap((summary) => summary.previousValues);
  let currentValue: T | undefined;
  for (const summary of summaries) {
    if (summary.currentValue !== undefined) {
      currentValue = summary.currentValue;
    }
  }
  return {
    count: summaries.reduce((total, summary) => total + summary.count, 0),
    initialValue: summaries.find((summary) => summary.initialValue !== undefined)?.initialValue,
    currentValue,
    values,
    previousValues,
  };
}

export function isBindingSyncDirection(
  value: unknown,
): value is BindingSyncDirection {
  return value === "self" || value === "other" || value === "none";
}

export function parseBindingSyncDirection(
  value: unknown,
  fallback: BindingSyncDirection = "self",
): BindingSyncDirection {
  return isBindingSyncDirection(value) ? value : fallback;
}

export function invertBindingSyncDirection(
  value: BindingSyncDirection,
): BindingSyncDirection {
  switch (value) {
    case "self":
      return "other";
    case "other":
      return "self";
    case "none":
      return "none";
  }
}

export function getSceneLifecycleState(
  scene: SceneLifecycleHost,
): { isActive: boolean; hasProgram: boolean } {
  return {
    isActive: scene.isActive,
    hasProgram: scene.program !== null,
  };
}

export function summarizeSceneLifecycle(scene: SceneLifecycleHost): SceneLifecycleSummary {
  const state = getSceneLifecycleState(scene);
  return {
    ...state,
    activationState: state.isActive ? "active" : "inactive",
  };
}

export function describeSceneLifecycle(scene: SceneLifecycleHost): string {
  const summary = summarizeSceneLifecycle(scene);
  return `${summary.activationState}:${summary.hasProgram ? "bound" : "unbound"}`;
}

export function assertSceneIsActive(scene: SceneLifecycleHost): void {
  if (!scene.isActive) {
    throw new TypeError("scene is not active");
  }
}

export function assertSceneHasProgram(scene: SceneLifecycleHost): void {
  if (scene.program === null) {
    throw new TypeError("scene is not bound to a program");
  }
}
