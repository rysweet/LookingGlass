import { rayAabbIntersection } from "./collision-detection";
import type { Ray, Sphere } from "./collision-detection";
import type { BoundingBox, Vec3 } from "./story-api/types";

const EPSILON = 1e-9;
const DEPTH_EPSILON = 1e-6;

export interface Triangle {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly c: Vec3;
}

export interface RayHit {
  readonly distance: number;
  readonly point: Vec3;
  readonly normal: Vec3;
}

export interface MeshRayHit extends RayHit {
  readonly faceIndex: number;
}

export type PickableGeometry =
  | { readonly kind: "mesh"; readonly triangles: readonly Triangle[] }
  | { readonly kind: "sphere"; readonly sphere: Sphere }
  | { readonly kind: "box"; readonly box: BoundingBox };

export interface PickableObject<TMetadata = unknown> {
  readonly id: string;
  readonly geometry: PickableGeometry;
  readonly metadata?: TMetadata;
  readonly depthBias?: number;
}

export interface PickingHit<TMetadata = unknown> extends RayHit {
  readonly objectId: string;
  readonly geometryKind: PickableGeometry["kind"];
  readonly depth: number;
  readonly faceIndex?: number;
  readonly metadata?: TMetadata;
}

export interface DepthBufferSample {
  readonly objectId: string;
  readonly depth: number;
  readonly point: Vec3;
}

export interface PickFrontMostOptions {
  readonly depthReadback?: number | null;
  readonly epsilon?: number;
}

function assertFiniteVec3(value: Vec3, label: string): void {
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
    throw new TypeError(`${label} coordinates must be finite numbers`);
  }
}

function assertFiniteNonNegative(value: number | undefined, label: string): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative finite number`);
  }
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(value: Vec3, factor: number): Vec3 {
  return { x: value.x * factor, y: value.y * factor, z: value.z * factor };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function magnitude(value: Vec3): number {
  return Math.sqrt(dot(value, value));
}

function normalize(value: Vec3): Vec3 {
  const length = magnitude(value);
  if (length < EPSILON) {
    return { x: 0, y: 0, z: 0 };
  }
  return scale(value, 1 / length);
}

function pointAt(ray: Ray, distance: number): Vec3 {
  return add(ray.origin, scale(ray.direction, distance));
}

function assertRay(ray: Ray): void {
  assertFiniteVec3(ray.origin, "ray origin");
  assertFiniteVec3(ray.direction, "ray direction");
  assertFiniteNonNegative(ray.maxDistance, "ray maxDistance");
  if (Math.abs(ray.direction.x) < EPSILON && Math.abs(ray.direction.y) < EPSILON && Math.abs(ray.direction.z) < EPSILON) {
    throw new TypeError("ray direction must not be the zero vector");
  }
}

export function rayTriangleIntersection(ray: Ray, triangle: Triangle): RayHit | null {
  assertRay(ray);
  assertFiniteVec3(triangle.a, "triangle vertex a");
  assertFiniteVec3(triangle.b, "triangle vertex b");
  assertFiniteVec3(triangle.c, "triangle vertex c");

  const edge1 = subtract(triangle.b, triangle.a);
  const edge2 = subtract(triangle.c, triangle.a);
  const p = cross(ray.direction, edge2);
  const determinant = dot(edge1, p);
  if (Math.abs(determinant) < EPSILON) {
    return null;
  }

  const inverseDeterminant = 1 / determinant;
  const tVector = subtract(ray.origin, triangle.a);
  const u = dot(tVector, p) * inverseDeterminant;
  if (u < 0 || u > 1) {
    return null;
  }

  const q = cross(tVector, edge1);
  const v = dot(ray.direction, q) * inverseDeterminant;
  if (v < 0 || (u + v) > 1) {
    return null;
  }

  const distance = dot(edge2, q) * inverseDeterminant;
  const maxDistance = ray.maxDistance ?? Number.POSITIVE_INFINITY;
  if (distance < 0 || distance > maxDistance) {
    return null;
  }

  return {
    distance,
    point: pointAt(ray, distance),
    normal: normalize(cross(edge1, edge2)),
  };
}

export function rayMeshIntersection(ray: Ray, triangles: readonly Triangle[]): MeshRayHit | null {
  let closest: MeshRayHit | null = null;
  triangles.forEach((triangle, index) => {
    const hit = rayTriangleIntersection(ray, triangle);
    if (!hit) {
      return;
    }
    if (!closest || hit.distance < closest.distance) {
      closest = { ...hit, faceIndex: index };
    }
  });
  return closest;
}

export function raySphereIntersection(ray: Ray, sphere: Sphere): RayHit | null {
  assertRay(ray);
  assertFiniteVec3(sphere.center, "sphere center");
  assertFiniteNonNegative(sphere.radius, "sphere radius");

  const offset = subtract(ray.origin, sphere.center);
  const a = dot(ray.direction, ray.direction);
  const b = 2 * dot(offset, ray.direction);
  const c = dot(offset, offset) - (sphere.radius * sphere.radius);
  const discriminant = (b * b) - (4 * a * c);
  if (discriminant < 0) {
    return null;
  }

  const maxDistance = ray.maxDistance ?? Number.POSITIVE_INFINITY;
  if (c <= 0) {
    return {
      distance: 0,
      point: { ...ray.origin },
      normal: { x: 0, y: 0, z: 0 },
    };
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const near = (-b - sqrtDiscriminant) / (2 * a);
  const far = (-b + sqrtDiscriminant) / (2 * a);
  const distance = near >= 0 ? near : far >= 0 ? far : null;
  if (distance === null || distance > maxDistance) {
    return null;
  }

  const point = pointAt(ray, distance);
  return {
    distance,
    point,
    normal: normalize(subtract(point, sphere.center)),
  };
}

export function rayBoxIntersection(ray: Ray, box: BoundingBox): RayHit | null {
  return rayAabbIntersection(ray, box);
}

function hitForObject<TMetadata>(object: PickableObject<TMetadata>, ray: Ray): PickingHit<TMetadata> | null {
  const depthBias = object.depthBias ?? 0;

  if (object.geometry.kind === "mesh") {
    const rawHit = rayMeshIntersection(ray, object.geometry.triangles);
    if (!rawHit) {
      return null;
    }
    return {
      objectId: object.id,
      geometryKind: object.geometry.kind,
      distance: rawHit.distance,
      depth: rawHit.distance + depthBias,
      point: rawHit.point,
      normal: rawHit.normal,
      faceIndex: rawHit.faceIndex,
      metadata: object.metadata,
    };
  }

  const rawHit = object.geometry.kind === "sphere"
    ? raySphereIntersection(ray, object.geometry.sphere)
    : rayBoxIntersection(ray, object.geometry.box);
  if (!rawHit) {
    return null;
  }

  return {
    objectId: object.id,
    geometryKind: object.geometry.kind,
    distance: rawHit.distance,
    depth: rawHit.distance + depthBias,
    point: rawHit.point,
    normal: rawHit.normal,
    metadata: object.metadata,
  };
}

export class RenderPickingSystem<TMetadata = unknown> {
  private readonly objects = new Map<string, PickableObject<TMetadata>>();

  constructor(objects: readonly PickableObject<TMetadata>[] = []) {
    objects.forEach((object) => this.registerObject(object));
  }

  registerObject(object: PickableObject<TMetadata>): void {
    this.objects.set(object.id, object);
  }

  unregisterObject(id: string): boolean {
    return this.objects.delete(id);
  }

  clear(): void {
    this.objects.clear();
  }

  pickAll(ray: Ray): PickingHit<TMetadata>[] {
    const hits: PickingHit<TMetadata>[] = [];
    for (const object of this.objects.values()) {
      const hit = hitForObject(object, ray);
      if (hit) {
        hits.push(hit);
      }
    }
    return hits.sort((left, right) => {
      if (left.depth === right.depth) {
        return left.objectId.localeCompare(right.objectId);
      }
      return left.depth - right.depth;
    });
  }

  simulateDepthBufferReadback(ray: Ray): DepthBufferSample | null {
    const hit = this.pickFrontMost(ray);
    return hit
      ? { objectId: hit.objectId, depth: hit.depth, point: { ...hit.point } }
      : null;
  }

  pickFrontMost(ray: Ray, options: PickFrontMostOptions = {}): PickingHit<TMetadata> | null {
    const hits = this.pickAll(ray);
    if (hits.length === 0) {
      return null;
    }
    if (options.depthReadback === undefined || options.depthReadback === null) {
      return hits[0] ?? null;
    }

    const epsilon = options.epsilon ?? DEPTH_EPSILON;
    return hits.find((hit) => Math.abs(hit.depth - options.depthReadback!) <= epsilon) ?? null;
  }
}
