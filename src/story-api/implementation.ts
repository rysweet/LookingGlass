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

export function isBindingSyncDirection(
  value: unknown,
): value is BindingSyncDirection {
  return value === "self" || value === "other" || value === "none";
}

export function getSceneLifecycleState(
  scene: SceneLifecycleHost,
): { isActive: boolean; hasProgram: boolean } {
  return {
    isActive: scene.isActive,
    hasProgram: scene.program !== null,
  };
}
