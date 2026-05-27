import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  BoundingBoxOperations,
  Matrix4Operations,
  PlaneOperations,
  Point3Operations,
  QuaternionOperations,
  RayOperations,
  Vector3Operations,
  type Matrix4,
  type Quaternion,
} from "../src/geometry-operations";

function expectVectorClose(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }, precision = 8): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

function expectQuaternionClose(actual: Quaternion, expected: Quaternion, precision = 8): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
  expect(actual.w).toBeCloseTo(expected.w, precision);
}

function applyQuaternion(quaternion: Quaternion, vector: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z).applyQuaternion(
    new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
  );
}

function expectMatrixClose(actual: Matrix4, expected: Matrix4, precision = 8): void {
  expect(actual.elements).toHaveLength(16);
  expected.elements.forEach((value, index) => {
    expect(actual.elements[index]).toBeCloseTo(value, precision);
  });
}

describe("geometry-operations", () => {
  it("supports point and vector arithmetic", () => {
    const start = { x: 1, y: 2, z: 3 };
    const end = { x: 5, y: 6, z: 7 };
    const vector = Point3Operations.subtract(end, start);
    const normalized = Vector3Operations.normalize({ x: 3, y: 0, z: 4 });
    const reflection = Vector3Operations.reflect({ x: 1, y: -1, z: 0 }, { x: 0, y: 1, z: 0 });
    const projection = Vector3Operations.project({ x: 3, y: 4, z: 0 }, { x: 1, y: 0, z: 0 });

    expectVectorClose(vector, { x: 4, y: 4, z: 4 });
    expect(Point3Operations.distance(start, end)).toBeCloseTo(Math.sqrt(48), 8);
    expect(Point3Operations.midpoint(start, end)).toEqual({ x: 3, y: 4, z: 5 });
    expect(Point3Operations.lerp(start, end, 0.25)).toEqual({ x: 2, y: 3, z: 4 });
    expectVectorClose(Point3Operations.add(start, vector), end);
    expectVectorClose(normalized, { x: 0.6, y: 0, z: 0.8 });
    expect(Vector3Operations.dot({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 })).toBe(12);
    expectVectorClose(Vector3Operations.cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), { x: 0, y: 0, z: 1 });
    expectVectorClose(reflection, { x: 1, y: 1, z: 0 });
    expectVectorClose(projection, { x: 3, y: 0, z: 0 });
  });

  it("supports quaternion rotation, interpolation, and look rotation", () => {
    const quarterTurn = QuaternionOperations.fromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2);
    const halfTurn = QuaternionOperations.multiply(quarterTurn, quarterTurn);
    const blended = QuaternionOperations.slerp({ x: 0, y: 0, z: 0, w: 1 }, halfTurn, 0.5);
    const euler = QuaternionOperations.toEuler(quarterTurn);
    const look = QuaternionOperations.lookRotation({ x: 1, y: 0, z: 0 });

    expect(applyQuaternion(quarterTurn, { x: 0, y: 0, z: 1 }).distanceTo(new THREE.Vector3(1, 0, 0))).toBeLessThan(1e-8);
    expect(applyQuaternion(halfTurn, { x: 0, y: 0, z: 1 }).distanceTo(new THREE.Vector3(0, 0, -1))).toBeLessThan(1e-8);
    expectQuaternionClose(blended, quarterTurn, 6);
    expect(euler.pitch).toBeCloseTo(0, 6);
    expect(euler.yaw).toBeCloseTo(Math.PI / 2, 6);
    expect(euler.roll).toBeCloseTo(0, 6);
    expect(applyQuaternion(look, { x: 0, y: 0, z: 1 }).distanceTo(new THREE.Vector3(1, 0, 0))).toBeLessThan(1e-8);
  });

  it("keeps matrices, rays, planes, and bounds coherent", () => {
    const translation = { x: 3, y: 4, z: 5 };
    const quaternion = QuaternionOperations.fromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2);
    const scale = { x: 2, y: 3, z: 4 };
    const matrix = Matrix4Operations.compose(translation, quaternion, scale);
    const inverse = Matrix4Operations.invert(matrix);
    const identity = Matrix4Operations.multiply(matrix, inverse);
    const transpose = Matrix4Operations.transpose(matrix);
    const decomposition = Matrix4Operations.decompose(matrix);

    const ray = RayOperations.create({ x: 2, y: 10, z: 4 }, { x: 0, y: -1, z: 0 });
    const plane = PlaneOperations.create({ x: 0, y: 1, z: 0 }, 4);
    const hit = PlaneOperations.rayIntersect(plane, ray);
    const closest = RayOperations.closestPoint(ray, { x: 4, y: 2, z: 6 });
    const projected = PlaneOperations.projectPoint(plane, { x: 8, y: 10, z: -2 });

    const left = { min: { x: 0, y: 0, z: 0 }, max: { x: 4, y: 4, z: 4 } };
    const right = { min: { x: 2, y: 1, z: -1 }, max: { x: 6, y: 3, z: 2 } };

    expectMatrixClose(identity, Matrix4Operations.compose({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, 1), 6);
    expect(transpose.elements[1]).toBeCloseTo(matrix.elements[4], 8);
    expectVectorClose(decomposition.translation, translation);
    expectQuaternionClose(decomposition.quaternion, quaternion, 6);
    expectVectorClose(decomposition.scale, scale);

    expect(hit).toEqual({ x: 2, y: 4, z: 4 });
    expect(closest).toEqual({ x: 2, y: 2, z: 4 });
    expect(projected).toEqual({ x: 8, y: 4, z: -2 });

    expect(BoundingBoxOperations.union(left, right)).toEqual({
      min: { x: 0, y: 0, z: -1 },
      max: { x: 6, y: 4, z: 4 },
    });
    expect(BoundingBoxOperations.intersection(left, right)).toEqual({
      min: { x: 2, y: 1, z: 0 },
      max: { x: 4, y: 3, z: 2 },
    });
    expect(BoundingBoxOperations.contains(left, { x: 1, y: 1, z: 1 })).toBe(true);
    expect(BoundingBoxOperations.contains(left, { x: -1, y: 1, z: 1 })).toBe(false);
    expect(BoundingBoxOperations.expand(left, 2)).toEqual({
      min: { x: -2, y: -2, z: -2 },
      max: { x: 6, y: 6, z: 6 },
    });
  });
});
