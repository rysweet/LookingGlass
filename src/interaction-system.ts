import type { Orientation, Position, Size, Vec3 } from "./story-api/types";
import {
  addVec3,
  clonePosition,
  quaternionFromAxisAngle,
  quaternionMultiply,
  rotateVector,
} from "./story-api/expanded-math";
import { EntityImp, ModelImp } from "./entity-impls";

export type AxisName = "x" | "y" | "z";

export interface PointerSample {
  readonly x: number;
  readonly y: number;
  readonly depth?: number;
  readonly timeMs?: number;
}

export interface DragResult {
  readonly started: Position;
  readonly current: Position;
  readonly delta: Vec3;
}

function axisVector(axis: AxisName): Vec3 {
  switch (axis) {
    case "x":
      return { x: 1, y: 0, z: 0 };
    case "y":
      return { x: 0, y: 1, z: 0 };
    case "z":
      return { x: 0, y: 0, z: 1 };
  }
}

function componentForAxis(axis: AxisName, value: Vec3): number {
  return value[axis];
}

function setComponentForAxis(axis: AxisName, value: Size, next: number): Size {
  if (axis === "x") {
    return { ...value, width: next };
  }
  if (axis === "y") {
    return { ...value, height: next };
  }
  return { ...value, depth: next };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function snapValue(value: number, increment: number): number {
  if (!Number.isFinite(increment) || increment <= 0) {
    return value;
  }
  const snapped = Math.round(value / increment) * increment;
  return Object.is(snapped, -0) ? 0 : snapped;
}

export class SnapGrid {
  constructor(
    readonly positionIncrement = 0.5,
    readonly rotationIncrementRadians = Math.PI / 8,
    readonly scaleIncrement = 0.25,
  ) {}

  snapPosition(value: Position): Position {
    return {
      x: snapValue(value.x, this.positionIncrement),
      y: snapValue(value.y, this.positionIncrement),
      z: snapValue(value.z, this.positionIncrement),
    };
  }

  snapAngle(radians: number): number {
    return snapValue(radians, this.rotationIncrementRadians);
  }

  snapScale(value: Size): Size {
    return {
      width: Math.max(this.scaleIncrement, snapValue(value.width, this.scaleIncrement)),
      height: Math.max(this.scaleIncrement, snapValue(value.height, this.scaleIncrement)),
      depth: Math.max(this.scaleIncrement, snapValue(value.depth, this.scaleIncrement)),
    };
  }
}

export abstract class ManipulationHandle<TTarget extends EntityImp = EntityImp> {
  visible = false;
  protected dragOrigin: Position | null = null;

  constructor(
    readonly axis: AxisName,
    readonly target: TTarget,
    protected readonly snapGrid: SnapGrid | null = null,
  ) {}

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  beginDrag(pointerWorld: Position): void {
    this.dragOrigin = clonePosition(pointerWorld);
  }

  abstract drag(pointerWorld: Position): number;

  endDrag(): void {
    this.dragOrigin = null;
  }
}

export class LinearDragHandle extends ManipulationHandle<EntityImp> {
  distanceTravelled = 0;

  override drag(pointerWorld: Position): number {
    if (!this.dragOrigin) {
      throw new TypeError("drag has not started");
    }
    const delta = subtract(pointerWorld, this.dragOrigin);
    const worldAxis = rotateVector(this.target.getWorldOrientation(), axisVector(this.axis));
    const projectedDistance =
      (delta.x * worldAxis.x) + (delta.y * worldAxis.y) + (delta.z * worldAxis.z);
    const nextPosition = addVec3(this.target.getWorldPosition(), {
      x: worldAxis.x * projectedDistance,
      y: worldAxis.y * projectedDistance,
      z: worldAxis.z * projectedDistance,
    });
    this.target.setWorldPosition(this.snapGrid ? this.snapGrid.snapPosition(nextPosition) : nextPosition);
    this.distanceTravelled += projectedDistance;
    this.dragOrigin = clonePosition(pointerWorld);
    return projectedDistance;
  }
}

export class LinearScaleHandle extends ManipulationHandle<ModelImp> {
  override drag(pointerWorld: Position): number {
    if (!this.dragOrigin) {
      throw new TypeError("drag has not started");
    }
    const delta = subtract(pointerWorld, this.dragOrigin);
    const amount = componentForAxis(this.axis, delta);
    const current = this.target.size;
    const rawSize = setComponentForAxis(
      this.axis,
      current,
      Math.max(0.05, (this.axis === "x" ? current.width : this.axis === "y" ? current.height : current.depth) + amount),
    );
    this.target.size = this.snapGrid ? this.snapGrid.snapScale(rawSize) : rawSize;
    this.dragOrigin = clonePosition(pointerWorld);
    return amount;
  }
}

export class RotationRingHandle extends ManipulationHandle<EntityImp> {
  accumulatedRadians = 0;

  override drag(pointerWorld: Position): number {
    if (!this.dragOrigin) {
      throw new TypeError("drag has not started");
    }
    const delta = subtract(pointerWorld, this.dragOrigin);
    const unsnapped = (componentForAxis(this.axis, delta) + (delta.x + delta.y + delta.z) * 0.25) * Math.PI * 2;
    const radians = this.snapGrid ? this.snapGrid.snapAngle(unsnapped) : unsnapped;
    const rotation = this.axis === "x"
      ? quaternionFromAxisAngle(1, 0, 0, radians)
      : this.axis === "y"
        ? quaternionFromAxisAngle(0, 1, 0, radians)
        : quaternionFromAxisAngle(0, 0, 1, radians);
    this.target.setWorldOrientation(quaternionMultiply(rotation, this.target.getWorldOrientation()));
    this.accumulatedRadians += radians;
    this.dragOrigin = clonePosition(pointerWorld);
    return radians;
  }
}

export class DragAdapter {
  #activeHandle: ManipulationHandle | null = null;
  #dragStartWorld: Position | null = null;
  #currentWorld: Position | null = null;

  constructor(
    readonly viewportWidth = 800,
    readonly viewportHeight = 600,
    readonly worldUnitsPerPixel = 0.02,
  ) {}

  mapPointerToWorld(sample: PointerSample): Position {
    const x = (sample.x - this.viewportWidth / 2) * this.worldUnitsPerPixel;
    const y = (this.viewportHeight / 2 - sample.y) * this.worldUnitsPerPixel;
    return { x, y, z: sample.depth ?? 0 };
  }

  startDrag(handle: ManipulationHandle, sample: PointerSample): DragResult {
    const world = this.mapPointerToWorld(sample);
    this.#activeHandle = handle;
    this.#dragStartWorld = world;
    this.#currentWorld = world;
    handle.beginDrag(world);
    return { started: world, current: world, delta: { x: 0, y: 0, z: 0 } };
  }

  updateDrag(sample: PointerSample): DragResult {
    if (!this.#activeHandle || !this.#dragStartWorld || !this.#currentWorld) {
      throw new TypeError("drag has not started");
    }
    const world = this.mapPointerToWorld(sample);
    this.#activeHandle.drag(world);
    const delta = subtract(world, this.#dragStartWorld);
    this.#currentWorld = world;
    return {
      started: this.#dragStartWorld,
      current: world,
      delta,
    };
  }

  endDrag(sample?: PointerSample): DragResult | null {
    if (!this.#activeHandle || !this.#dragStartWorld || !this.#currentWorld) {
      return null;
    }
    const world = sample ? this.mapPointerToWorld(sample) : this.#currentWorld;
    const delta = subtract(world, this.#dragStartWorld);
    const result: DragResult = {
      started: this.#dragStartWorld,
      current: world,
      delta,
    };
    this.#activeHandle.endDrag();
    this.#activeHandle = null;
    this.#dragStartWorld = null;
    this.#currentWorld = null;
    return result;
  }
}

export class HandleManager {
  #selected: ModelImp | null = null;
  #handles: ManipulationHandle[] = [];

  constructor(private readonly snapGrid: SnapGrid = new SnapGrid()) {}

  select(target: ModelImp | null): void {
    this.#selected = target;
    this.#handles = target ? this.#createHandles(target) : [];
  }

  get selected(): ModelImp | null {
    return this.#selected;
  }

  get handles(): ManipulationHandle[] {
    return [...this.#handles];
  }

  show(): void {
    this.#handles.forEach((handle) => handle.show());
  }

  hide(): void {
    this.#handles.forEach((handle) => handle.hide());
  }

  #createHandles(target: ModelImp): ManipulationHandle[] {
    return [
      new LinearDragHandle("x", target, this.snapGrid),
      new LinearDragHandle("y", target, this.snapGrid),
      new LinearDragHandle("z", target, this.snapGrid),
      new RotationRingHandle("x", target, this.snapGrid),
      new RotationRingHandle("y", target, this.snapGrid),
      new RotationRingHandle("z", target, this.snapGrid),
      new LinearScaleHandle("x", target, this.snapGrid),
      new LinearScaleHandle("y", target, this.snapGrid),
      new LinearScaleHandle("z", target, this.snapGrid),
    ];
  }
}

export function describeHandleSet(handles: readonly ManipulationHandle[]): string[] {
  return handles.map((handle) => `${handle.constructor.name}:${handle.axis}:${handle.visible ? "visible" : "hidden"}`);
}

export function applyRotation(target: EntityImp, axis: AxisName, radians: number): Orientation {
  const rotation = axis === "x"
    ? quaternionFromAxisAngle(1, 0, 0, radians)
    : axis === "y"
      ? quaternionFromAxisAngle(0, 1, 0, radians)
      : quaternionFromAxisAngle(0, 0, 1, radians);
  const orientation = quaternionMultiply(rotation, target.getWorldOrientation());
  target.setWorldOrientation(orientation);
  return orientation;
}
