import * as THREE from "three";

const EPSILON = 1e-9;

function clampPortion(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function vectorLengthSquared(vector: Vector3): number {
  return (vector.x * vector.x) + (vector.y * vector.y) + (vector.z * vector.z);
}

function vectorLength(vector: Vector3): number {
  return Math.sqrt(vectorLengthSquared(vector));
}

function scaleVector(vector: Vector3, factor: number): Vector3 {
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor };
}

function addVector(left: Vector3, right: Vector3): Vector3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtractVector(left: Vector3, right: Vector3): Vector3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function clonePoint(point: Point3): Point3 {
  return { x: point.x, y: point.y, z: point.z };
}

function normalizeQuaternion(quaternion: Quaternion): Quaternion {
  const magnitude = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  if (!Number.isFinite(magnitude) || magnitude <= EPSILON) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  return {
    x: quaternion.x / magnitude,
    y: quaternion.y / magnitude,
    z: quaternion.z / magnitude,
    w: quaternion.w / magnitude,
  };
}

function toThreeQuaternion(quaternion: Quaternion): THREE.Quaternion {
  const normalized = normalizeQuaternion(quaternion);
  return new THREE.Quaternion(normalized.x, normalized.y, normalized.z, normalized.w);
}

function fromThreeQuaternion(quaternion: THREE.Quaternion): Quaternion {
  const normalized = quaternion.clone().normalize();
  return { x: normalized.x, y: normalized.y, z: normalized.z, w: normalized.w };
}

function toThreeMatrix4(matrix: Matrix4): THREE.Matrix4 {
  if (matrix.elements.length !== 16) {
    throw new TypeError(`matrix requires 16 elements, received ${matrix.elements.length}`);
  }
  return new THREE.Matrix4().fromArray([...matrix.elements]);
}

function fromThreeMatrix4(matrix: THREE.Matrix4): Matrix4 {
  return { elements: [...matrix.elements] };
}

export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Quaternion {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface Matrix4 {
  readonly elements: readonly number[];
}

export interface Ray {
  readonly origin: Point3;
  readonly direction: Vector3;
}

export interface Plane {
  readonly normal: Vector3;
  readonly distance: number;
}

export interface BoundingBox {
  readonly min: Point3;
  readonly max: Point3;
}

export class Point3Operations {
  static add(point: Point3, vector: Vector3): Point3 {
    return {
      x: point.x + vector.x,
      y: point.y + vector.y,
      z: point.z + vector.z,
    };
  }

  static subtract(left: Point3, right: Point3): Vector3 {
    return {
      x: left.x - right.x,
      y: left.y - right.y,
      z: left.z - right.z,
    };
  }

  static distance(left: Point3, right: Point3): number {
    return vectorLength(Point3Operations.subtract(left, right));
  }

  static lerp(start: Point3, end: Point3, amount: number): Point3 {
    const portion = clampPortion(amount);
    return {
      x: start.x + ((end.x - start.x) * portion),
      y: start.y + ((end.y - start.y) * portion),
      z: start.z + ((end.z - start.z) * portion),
    };
  }

  static midpoint(left: Point3, right: Point3): Point3 {
    return Point3Operations.lerp(left, right, 0.5);
  }
}

export class Vector3Operations {
  static normalize(vector: Vector3): Vector3 {
    const magnitude = vectorLength(vector);
    if (!Number.isFinite(magnitude) || magnitude <= EPSILON) {
      return { x: 0, y: 0, z: 0 };
    }
    return scaleVector(vector, 1 / magnitude);
  }

  static dot(left: Vector3, right: Vector3): number {
    return (left.x * right.x) + (left.y * right.y) + (left.z * right.z);
  }

  static cross(left: Vector3, right: Vector3): Vector3 {
    return {
      x: (left.y * right.z) - (left.z * right.y),
      y: (left.z * right.x) - (left.x * right.z),
      z: (left.x * right.y) - (left.y * right.x),
    };
  }

  static reflect(vector: Vector3, normal: Vector3): Vector3 {
    const unitNormal = Vector3Operations.normalize(normal);
    return subtractVector(vector, scaleVector(unitNormal, 2 * Vector3Operations.dot(vector, unitNormal)));
  }

  static project(vector: Vector3, onto: Vector3): Vector3 {
    const denominator = vectorLengthSquared(onto);
    if (denominator <= EPSILON) {
      return { x: 0, y: 0, z: 0 };
    }
    return scaleVector(onto, Vector3Operations.dot(vector, onto) / denominator);
  }
}

export class QuaternionOperations {
  static multiply(left: Quaternion, right: Quaternion): Quaternion {
    const a = normalizeQuaternion(left);
    const b = normalizeQuaternion(right);
    return normalizeQuaternion({
      x: (a.w * b.x) + (a.x * b.w) + (a.y * b.z) - (a.z * b.y),
      y: (a.w * b.y) - (a.x * b.z) + (a.y * b.w) + (a.z * b.x),
      z: (a.w * b.z) + (a.x * b.y) - (a.y * b.x) + (a.z * b.w),
      w: (a.w * b.w) - (a.x * b.x) - (a.y * b.y) - (a.z * b.z),
    });
  }

  static slerp(start: Quaternion, end: Quaternion, amount: number): Quaternion {
    const from = toThreeQuaternion(start);
    const to = toThreeQuaternion(end);
    const result = new THREE.Quaternion().slerpQuaternions(from, to, clampPortion(amount));
    return fromThreeQuaternion(result);
  }

  static fromAxisAngle(axis: Vector3, angleRadians: number): Quaternion {
    const unitAxis = Vector3Operations.normalize(axis);
    const halfAngle = angleRadians / 2;
    const sine = Math.sin(halfAngle);
    return normalizeQuaternion({
      x: unitAxis.x * sine,
      y: unitAxis.y * sine,
      z: unitAxis.z * sine,
      w: Math.cos(halfAngle),
    });
  }

  static toEuler(quaternion: Quaternion): { pitch: number; yaw: number; roll: number } {
    const euler = new THREE.Euler().setFromQuaternion(toThreeQuaternion(quaternion), "XYZ");
    return {
      pitch: euler.x,
      yaw: euler.y,
      roll: euler.z,
    };
  }

  static lookRotation(forward: Vector3, up: Vector3 = { x: 0, y: 1, z: 0 }): Quaternion {
    const unitForward = Vector3Operations.normalize(forward);
    if (vectorLengthSquared(unitForward) <= EPSILON) {
      return { x: 0, y: 0, z: 0, w: 1 };
    }

    let unitUp = Vector3Operations.normalize(up);
    if (Math.abs(Vector3Operations.dot(unitForward, unitUp)) > 1 - EPSILON) {
      unitUp = Math.abs(unitForward.y) < 0.999
        ? { x: 0, y: 1, z: 0 }
        : { x: 1, y: 0, z: 0 };
    }

    const right = Vector3Operations.normalize(Vector3Operations.cross(unitUp, unitForward));
    const correctedUp = Vector3Operations.cross(unitForward, right);
    const matrix = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(right.x, right.y, right.z),
      new THREE.Vector3(correctedUp.x, correctedUp.y, correctedUp.z),
      new THREE.Vector3(unitForward.x, unitForward.y, unitForward.z),
    );
    return fromThreeQuaternion(new THREE.Quaternion().setFromRotationMatrix(matrix));
  }
}

export class Matrix4Operations {
  static multiply(left: Matrix4, right: Matrix4): Matrix4 {
    return fromThreeMatrix4(toThreeMatrix4(left).multiply(toThreeMatrix4(right)));
  }

  static invert(matrix: Matrix4): Matrix4 {
    return fromThreeMatrix4(toThreeMatrix4(matrix).invert());
  }

  static transpose(matrix: Matrix4): Matrix4 {
    return fromThreeMatrix4(toThreeMatrix4(matrix).transpose());
  }

  static decompose(matrix: Matrix4): {
    translation: Point3;
    quaternion: Quaternion;
    scale: Vector3;
  } {
    const translation = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    toThreeMatrix4(matrix).decompose(translation, quaternion, scale);
    return {
      translation: { x: translation.x, y: translation.y, z: translation.z },
      quaternion: fromThreeQuaternion(quaternion),
      scale: { x: scale.x, y: scale.y, z: scale.z },
    };
  }

  static compose(translation: Point3, quaternion: Quaternion, scale: Vector3 | number = 1): Matrix4 {
    const factor = typeof scale === "number"
      ? new THREE.Vector3(scale, scale, scale)
      : new THREE.Vector3(scale.x, scale.y, scale.z);
    return fromThreeMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(translation.x, translation.y, translation.z),
      toThreeQuaternion(quaternion),
      factor,
    ));
  }
}

export class RayOperations {
  static create(origin: Point3, direction: Vector3): Ray {
    return {
      origin: clonePoint(origin),
      direction: Vector3Operations.normalize(direction),
    };
  }

  static pointAt(ray: Ray, distance: number): Point3 {
    return Point3Operations.add(ray.origin, scaleVector(ray.direction, distance));
  }

  static closestPoint(ray: Ray, point: Point3): Point3 {
    const offset = Point3Operations.subtract(point, ray.origin);
    const distance = Math.max(0, Vector3Operations.dot(offset, ray.direction));
    return RayOperations.pointAt(ray, distance);
  }
}

export class PlaneOperations {
  static create(normal: Vector3, distance: number): Plane {
    const magnitude = vectorLength(normal);
    if (magnitude <= EPSILON) {
      return { normal: { x: 0, y: 1, z: 0 }, distance: 0 };
    }
    return {
      normal: Vector3Operations.normalize(normal),
      distance: distance / magnitude,
    };
  }

  static rayIntersect(plane: Plane, ray: Ray): Point3 | null {
    const denominator = Vector3Operations.dot(plane.normal, ray.direction);
    if (Math.abs(denominator) <= EPSILON) {
      return null;
    }
    const numerator = plane.distance - Vector3Operations.dot(plane.normal, ray.origin);
    const distance = numerator / denominator;
    if (distance < 0) {
      return null;
    }
    return RayOperations.pointAt(ray, distance);
  }

  static projectPoint(plane: Plane, point: Point3): Point3 {
    const offset = plane.distance - Vector3Operations.dot(plane.normal, point);
    return Point3Operations.add(point, scaleVector(plane.normal, offset));
  }
}

export class BoundingBoxOperations {
  static union(left: BoundingBox, right: BoundingBox): BoundingBox {
    return {
      min: {
        x: Math.min(left.min.x, right.min.x),
        y: Math.min(left.min.y, right.min.y),
        z: Math.min(left.min.z, right.min.z),
      },
      max: {
        x: Math.max(left.max.x, right.max.x),
        y: Math.max(left.max.y, right.max.y),
        z: Math.max(left.max.z, right.max.z),
      },
    };
  }

  static intersection(left: BoundingBox, right: BoundingBox): BoundingBox | null {
    const min = {
      x: Math.max(left.min.x, right.min.x),
      y: Math.max(left.min.y, right.min.y),
      z: Math.max(left.min.z, right.min.z),
    };
    const max = {
      x: Math.min(left.max.x, right.max.x),
      y: Math.min(left.max.y, right.max.y),
      z: Math.min(left.max.z, right.max.z),
    };
    if (min.x > max.x || min.y > max.y || min.z > max.z) {
      return null;
    }
    return { min, max };
  }

  static contains(box: BoundingBox, point: Point3): boolean {
    return point.x >= box.min.x
      && point.x <= box.max.x
      && point.y >= box.min.y
      && point.y <= box.max.y
      && point.z >= box.min.z
      && point.z <= box.max.z;
  }

  static expand(box: BoundingBox, amount: number): BoundingBox {
    return {
      min: {
        x: box.min.x - amount,
        y: box.min.y - amount,
        z: box.min.z - amount,
      },
      max: {
        x: box.max.x + amount,
        y: box.max.y + amount,
        z: box.max.z + amount,
      },
    };
  }
}
