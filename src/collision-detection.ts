import type { Vec3, BoundingBox } from "./story-api/types";
import { SModel } from "./story-api/entities";

const EPSILON = 1e-9;

export interface Sphere {
  center: Vec3;
  radius: number;
}

export interface Ray {
  origin: Vec3;
  direction: Vec3;
  maxDistance?: number;
}

export interface RayAabbHit {
  distance: number;
  point: Vec3;
  normal: Vec3;
}

export interface ProximityTarget {
  id: string;
  position: Vec3;
}

export interface ProximityZoneEvent {
  type: "enter" | "exit";
  sourceId: string;
  targetId: string;
  distance: number;
  radius: number;
}

function assertFiniteVec3(v: Vec3, label: string): void {
  if (
    !Number.isFinite(v.x) ||
    !Number.isFinite(v.y) ||
    !Number.isFinite(v.z)
  ) {
    throw new TypeError(`${label} coordinates must be finite numbers`);
  }
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative finite number`);
  }
}

function assertBoundingBox(box: BoundingBox, label: string): void {
  assertFiniteVec3(box.min, `${label} min`);
  assertFiniteVec3(box.max, `${label} max`);
  if (
    box.min.x > box.max.x ||
    box.min.y > box.max.y ||
    box.min.z > box.max.z
  ) {
    throw new TypeError(`${label} min coordinates must not exceed max coordinates`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

/** Euclidean distance between two 3D points. */
export function euclideanDistance(a: Vec3, b: Vec3): number {
  assertFiniteVec3(a, "first point");
  assertFiniteVec3(b, "second point");
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** True when two points are within (or at) the given distance. */
export function isWithinDistance(a: Vec3, b: Vec3, threshold: number): boolean {
  assertFiniteNonNegative(threshold, "threshold");
  assertFiniteVec3(a, "first point");
  assertFiniteVec3(b, "second point");
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz <= threshold * threshold;
}

/** Compute an axis-aligned bounding box centered on an SModel's position. */
export function aabbFromEntity(entity: SModel): BoundingBox {
  if (!(entity instanceof SModel)) {
    throw new TypeError("entity must be an instance of SModel");
  }
  const { x, y, z } = entity.position;
  const { width, height, depth } = entity.size;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  return {
    min: { x: x - hw, y: y - hh, z: z - hd },
    max: { x: x + hw, y: y + hh, z: z + hd },
  };
}

/** True when two AABBs overlap (touching faces count as intersection). */
export function aabbIntersects(a: BoundingBox, b: BoundingBox): boolean {
  assertBoundingBox(a, "first bounding box");
  assertBoundingBox(b, "second bounding box");
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

/** True when a point lies inside (or on the boundary of) an AABB. */
export function aabbContainsPoint(box: BoundingBox, point: Vec3): boolean {
  assertBoundingBox(box, "bounding box");
  assertFiniteVec3(point, "point");
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y &&
    point.z >= box.min.z &&
    point.z <= box.max.z
  );
}

/** True when two spheres overlap or touch. */
export function sphereIntersects(a: Sphere, b: Sphere): boolean {
  assertFiniteVec3(a.center, "first sphere center");
  assertFiniteVec3(b.center, "second sphere center");
  assertFiniteNonNegative(a.radius, "first sphere radius");
  assertFiniteNonNegative(b.radius, "second sphere radius");
  const radiusSum = a.radius + b.radius;
  return isWithinDistance(a.center, b.center, radiusSum);
}

/** Returns the first ray/AABB hit using slab intersection, or null when missed. */
export function rayAabbIntersection(ray: Ray, box: BoundingBox): RayAabbHit | null {
  assertFiniteVec3(ray.origin, "ray origin");
  assertFiniteVec3(ray.direction, "ray direction");
  assertBoundingBox(box, "bounding box");
  const maxDistance = ray.maxDistance ?? Number.POSITIVE_INFINITY;
  if ((ray.maxDistance !== undefined) && (!Number.isFinite(maxDistance) || maxDistance < 0)) {
    throw new TypeError("ray maxDistance must be a non-negative finite number");
  }
  if (
    Math.abs(ray.direction.x) < EPSILON &&
    Math.abs(ray.direction.y) < EPSILON &&
    Math.abs(ray.direction.z) < EPSILON
  ) {
    throw new TypeError("ray direction must not be the zero vector");
  }

  let tMin = 0;
  let tMax = maxDistance;
  let enterNormal = vec3(0, 0, 0);
  const originInside = aabbContainsPoint(box, ray.origin);

  const axes: Array<keyof Vec3> = ["x", "y", "z"];
  for (const axis of axes) {
    const origin = ray.origin[axis];
    const direction = ray.direction[axis];
    const min = box.min[axis];
    const max = box.max[axis];

    if (Math.abs(direction) < EPSILON) {
      if (origin < min || origin > max) {
        return null;
      }
      continue;
    }

    let t1 = (min - origin) / direction;
    let t2 = (max - origin) / direction;
    let nearNormal = axis === "x"
      ? vec3(direction > 0 ? -1 : 1, 0, 0)
      : axis === "y"
        ? vec3(0, direction > 0 ? -1 : 1, 0)
        : vec3(0, 0, direction > 0 ? -1 : 1);

    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      nearNormal = axis === "x"
        ? vec3(direction > 0 ? 1 : -1, 0, 0)
        : axis === "y"
          ? vec3(0, direction > 0 ? 1 : -1, 0)
          : vec3(0, 0, direction > 0 ? 1 : -1);
    }

    if (t1 > tMin) {
      tMin = t1;
      enterNormal = nearNormal;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) {
      return null;
    }
  }

  const distance = originInside ? 0 : tMin;
  if (distance > maxDistance) {
    return null;
  }
  return {
    distance,
    point: originInside
      ? vec3(ray.origin.x, ray.origin.y, ray.origin.z)
      : vec3(
          ray.origin.x + ray.direction.x * distance,
          ray.origin.y + ray.direction.y * distance,
          ray.origin.z + ray.direction.z * distance,
        ),
    normal: originInside ? vec3(0, 0, 0) : enterNormal,
  };
}

export class ProximityZoneTracker {
  private readonly states = new Map<string, boolean>();

  update(source: ProximityTarget, target: ProximityTarget, radius: number): ProximityZoneEvent | null {
    assertFiniteVec3(source.position, "source position");
    assertFiniteVec3(target.position, "target position");
    assertFiniteNonNegative(radius, "radius");
    const key = [source.id, target.id].sort().join("::");
    const distance = euclideanDistance(source.position, target.position);
    const inside = distance <= radius;
    const previous = this.states.get(key) ?? false;
    if (inside === previous) {
      return null;
    }
    this.states.set(key, inside);
    return {
      type: inside ? "enter" : "exit",
      sourceId: source.id,
      targetId: target.id,
      distance,
      radius,
    };
  }

  isInside(sourceId: string, targetId: string): boolean {
    return this.states.get([sourceId, targetId].sort().join("::")) ?? false;
  }

  clear(): void {
    this.states.clear();
  }
}

/** Alice3 Y-up direction constants. */
export const Direction = Object.freeze({
  FORWARD: Object.freeze<Vec3>({ x: 0, y: 0, z: -1 }),
  BACKWARD: Object.freeze<Vec3>({ x: 0, y: 0, z: 1 }),
  LEFT: Object.freeze<Vec3>({ x: -1, y: 0, z: 0 }),
  RIGHT: Object.freeze<Vec3>({ x: 1, y: 0, z: 0 }),
  UP: Object.freeze<Vec3>({ x: 0, y: 1, z: 0 }),
  DOWN: Object.freeze<Vec3>({ x: 0, y: -1, z: 0 }),
});
