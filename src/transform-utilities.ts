import * as THREE from "three";
import {
  Matrix4Operations,
  Point3Operations,
  QuaternionOperations,
  type Matrix4,
  type Point3,
  type Quaternion,
  type Vector3,
} from "./geometry-operations.js";

const IDENTITY_ROTATION: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
const UNIT_SCALE: Vector3 = { x: 1, y: 1, z: 1 };

export interface Transform {
  readonly translation: Point3;
  readonly rotation: Quaternion;
  readonly scale: Vector3;
}

export interface AxisConstraint {
  readonly min?: number;
  readonly max?: number;
  readonly value?: number;
}

export interface VectorConstraints {
  readonly x?: AxisConstraint;
  readonly y?: AxisConstraint;
  readonly z?: AxisConstraint;
}

export interface TransformConstraints {
  readonly translation?: VectorConstraints;
  readonly rotation?: VectorConstraints;
  readonly scale?: VectorConstraints;
}

export interface OrbitOptions {
  readonly elevationRadians?: number;
  readonly up?: Vector3;
  readonly scale?: Vector3;
}

function clonePoint(point: Point3): Point3 {
  return { x: point.x, y: point.y, z: point.z };
}

function cloneVector(vector: Vector3): Vector3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function cloneQuaternion(quaternion: Quaternion): Quaternion {
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

function cloneMatrix(matrix: Matrix4): Matrix4 {
  return { elements: [...matrix.elements] };
}

function clamp(value: number, constraint?: AxisConstraint): number {
  if (!constraint) {
    return value;
  }
  if (typeof constraint.value === "number") {
    return constraint.value;
  }
  const minimum = constraint.min ?? Number.NEGATIVE_INFINITY;
  const maximum = constraint.max ?? Number.POSITIVE_INFINITY;
  return Math.min(maximum, Math.max(minimum, value));
}

function applyVectorConstraints(
  vector: Vector3,
  constraints?: VectorConstraints,
): Vector3 {
  return {
    x: clamp(vector.x, constraints?.x),
    y: clamp(vector.y, constraints?.y),
    z: clamp(vector.z, constraints?.z),
  };
}

function toThreeQuaternion(quaternion: Quaternion): THREE.Quaternion {
  return new THREE.Quaternion(
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w,
  ).normalize();
}

function fromThreeQuaternion(quaternion: THREE.Quaternion): Quaternion {
  const normalized = quaternion.clone().normalize();
  return {
    x: normalized.x,
    y: normalized.y,
    z: normalized.z,
    w: normalized.w,
  };
}

function toEuler(quaternion: Quaternion): Vector3 {
  const euler = new THREE.Euler().setFromQuaternion(
    toThreeQuaternion(quaternion),
    "XYZ",
  );
  return { x: euler.x, y: euler.y, z: euler.z };
}

function fromEuler(euler: Vector3): Quaternion {
  return fromThreeQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(euler.x, euler.y, euler.z, "XYZ"),
    ),
  );
}

function lerpNumber(start: number, end: number, amount: number): number {
  return start + ((end - start) * amount);
}

function lerpVector(start: Vector3, end: Vector3, amount: number): Vector3 {
  return {
    x: lerpNumber(start.x, end.x, amount),
    y: lerpNumber(start.y, end.y, amount),
    z: lerpNumber(start.z, end.z, amount),
  };
}

function toTransform(transform: Partial<Transform> | undefined): Transform {
  return {
    translation: clonePoint(transform?.translation ?? { x: 0, y: 0, z: 0 }),
    rotation: cloneQuaternion(transform?.rotation ?? IDENTITY_ROTATION),
    scale: cloneVector(transform?.scale ?? UNIT_SCALE),
  };
}

function toMatrix(transform: Matrix4 | Transform): Matrix4 {
  if ("elements" in transform) {
    return cloneMatrix(transform);
  }
  return TransformComposer.compose(transform);
}

export class TransformComposer {
  static identity(): Transform {
    return toTransform(undefined);
  }

  static compose(transform: Partial<Transform>): Matrix4 {
    const normalized = toTransform(transform);
    return Matrix4Operations.compose(
      normalized.translation,
      normalized.rotation,
      normalized.scale,
    );
  }

  static fromParts(
    translation: Point3,
    rotation: Quaternion = IDENTITY_ROTATION,
    scale: Vector3 = UNIT_SCALE,
  ): Matrix4 {
    return TransformComposer.compose({ translation, rotation, scale });
  }
}

export class TransformDecomposer {
  static decompose(matrix: Matrix4): Transform {
    const decomposition = Matrix4Operations.decompose(matrix);
    return {
      translation: clonePoint(decomposition.translation),
      rotation: cloneQuaternion(decomposition.quaternion),
      scale: cloneVector(decomposition.scale),
    };
  }
}

export class TransformInterpolator {
  static interpolate(
    start: Partial<Transform>,
    end: Partial<Transform>,
    amount: number,
  ): Transform {
    const from = toTransform(start);
    const to = toTransform(end);
    return {
      translation: Point3Operations.lerp(from.translation, to.translation, amount),
      rotation: QuaternionOperations.slerp(from.rotation, to.rotation, amount),
      scale: lerpVector(from.scale, to.scale, amount),
    };
  }

  static interpolateMatrix(
    start: Partial<Transform>,
    end: Partial<Transform>,
    amount: number,
  ): Matrix4 {
    return TransformComposer.compose(
      TransformInterpolator.interpolate(start, end, amount),
    );
  }
}

export class ConstrainedTransform {
  static apply(
    transform: Partial<Transform>,
    constraints: TransformConstraints,
  ): Transform {
    const normalized = toTransform(transform);
    const euler = applyVectorConstraints(
      toEuler(normalized.rotation),
      constraints.rotation,
    );
    return {
      translation: applyVectorConstraints(
        normalized.translation,
        constraints.translation,
      ),
      rotation: fromEuler(euler),
      scale: applyVectorConstraints(normalized.scale, constraints.scale),
    };
  }
}

export class TransformStack {
  private readonly stack: Matrix4[];

  constructor(root: Matrix4 | Partial<Transform> = TransformComposer.identity()) {
    this.stack = [toMatrix(root as Matrix4 | Transform)];
  }

  depth(): number {
    return this.stack.length;
  }

  peek(): Matrix4 {
    return cloneMatrix(this.stack[this.stack.length - 1]!);
  }

  peekTransform(): Transform {
    return TransformDecomposer.decompose(this.peek());
  }

  push(localTransform: Matrix4 | Partial<Transform>): Matrix4 {
    const next = Matrix4Operations.multiply(
      this.stack[this.stack.length - 1]!,
      toMatrix(localTransform as Matrix4 | Transform),
    );
    this.stack.push(next);
    return cloneMatrix(next);
  }

  pop(): Matrix4 {
    if (this.stack.length === 1) {
      throw new RangeError("Cannot pop the root transform");
    }
    return cloneMatrix(this.stack.pop()!);
  }

  reset(root: Matrix4 | Partial<Transform> = TransformComposer.identity()): void {
    this.stack.splice(0, this.stack.length, toMatrix(root as Matrix4 | Transform));
  }
}

export class LookAtTransform {
  static create(
    source: Point3,
    target: Point3,
    up: Vector3 = { x: 0, y: 1, z: 0 },
    scale: Vector3 = UNIT_SCALE,
  ): Transform {
    const forward = Point3Operations.subtract(target, source);
    return {
      translation: clonePoint(source),
      rotation: QuaternionOperations.lookRotation(forward, up),
      scale: cloneVector(scale),
    };
  }

  static matrix(
    source: Point3,
    target: Point3,
    up: Vector3 = { x: 0, y: 1, z: 0 },
    scale: Vector3 = UNIT_SCALE,
  ): Matrix4 {
    return TransformComposer.compose(
      LookAtTransform.create(source, target, up, scale),
    );
  }
}

export class OrbitTransform {
  static create(
    target: Point3,
    distance: number,
    azimuthRadians: number,
    options: OrbitOptions = {},
  ): Transform {
    const elevation = options.elevationRadians ?? 0;
    const horizontal = distance * Math.cos(elevation);
    const source = {
      x: target.x + (horizontal * Math.sin(azimuthRadians)),
      y: target.y + (distance * Math.sin(elevation)),
      z: target.z + (horizontal * Math.cos(azimuthRadians)),
    };
    return LookAtTransform.create(
      source,
      target,
      options.up,
      options.scale ?? UNIT_SCALE,
    );
  }

  static matrix(
    target: Point3,
    distance: number,
    azimuthRadians: number,
    options: OrbitOptions = {},
  ): Matrix4 {
    return TransformComposer.compose(
      OrbitTransform.create(target, distance, azimuthRadians, options),
    );
  }
}
