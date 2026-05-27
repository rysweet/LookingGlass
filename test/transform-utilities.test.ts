import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  ConstrainedTransform,
  LookAtTransform,
  OrbitTransform,
  TransformComposer,
  TransformDecomposer,
  TransformInterpolator,
  TransformStack,
  type Transform,
} from "../src/transform-utilities.js";
import type { Matrix4, Quaternion, Vector3 } from "../src/geometry-operations.js";

function expectVectorClose(
  actual: { x: number; y: number; z: number },
  expected: { x: number; y: number; z: number },
  precision = 8,
): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

function expectQuaternionClose(
  actual: Quaternion,
  expected: Quaternion,
  precision = 8,
): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
  expect(actual.w).toBeCloseTo(expected.w, precision);
}

function expectMatrixClose(
  actual: Matrix4,
  expected: Matrix4,
  precision = 8,
): void {
  expect(actual.elements).toHaveLength(16);
  expected.elements.forEach((value, index) => {
    expect(actual.elements[index]).toBeCloseTo(value, precision);
  });
}

function quaternionFromEuler(x: number, y: number, z: number): Quaternion {
  const quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(x, y, z, "XYZ"),
  );
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

function rotateVector(quaternion: Quaternion, vector: Vector3): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z).applyQuaternion(
    new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
  );
}

describe("transform-utilities", () => {
  it("round-trips translation rotation and scale through compose and decompose", () => {
    const transform: Transform = {
      translation: { x: 3, y: -2, z: 7 },
      rotation: quaternionFromEuler(Math.PI / 6, Math.PI / 4, -Math.PI / 8),
      scale: { x: 2, y: 3, z: 4 },
    };

    const matrix = TransformComposer.compose(transform);
    const roundTrip = TransformDecomposer.decompose(matrix);

    expectVectorClose(roundTrip.translation, transform.translation);
    expectQuaternionClose(roundTrip.rotation, transform.rotation, 6);
    expectVectorClose(roundTrip.scale, transform.scale);
    expectMatrixClose(matrix, TransformComposer.fromParts(
      transform.translation,
      transform.rotation,
      transform.scale,
    ));
  });

  it("interpolates transforms and matrices coherently", () => {
    const start: Transform = {
      translation: { x: 0, y: 0, z: 0 },
      rotation: quaternionFromEuler(0, 0, 0),
      scale: { x: 1, y: 1, z: 1 },
    };
    const end: Transform = {
      translation: { x: 10, y: 4, z: -2 },
      rotation: quaternionFromEuler(0, Math.PI, 0),
      scale: { x: 3, y: 5, z: 7 },
    };

    const halfway = TransformInterpolator.interpolate(start, end, 0.5);
    const halfwayMatrix = TransformInterpolator.interpolateMatrix(start, end, 0.5);

    expectVectorClose(halfway.translation, { x: 5, y: 2, z: -1 });
    expectVectorClose(halfway.scale, { x: 2, y: 3, z: 4 });
    expect(
      rotateVector(halfway.rotation, { x: 0, y: 0, z: 1 }).distanceTo(
        new THREE.Vector3(1, 0, 0),
      ),
    ).toBeLessThan(1e-8);
    expectMatrixClose(halfwayMatrix, TransformComposer.compose(halfway), 6);
  });

  it("maintains a hierarchical transform stack and preserves the root frame", () => {
    const stack = new TransformStack();

    expect(stack.depth()).toBe(1);

    stack.push({
      translation: { x: 2, y: 0, z: 0 },
      rotation: quaternionFromEuler(0, 0, 0),
      scale: { x: 1, y: 1, z: 1 },
    });
    stack.push({
      translation: { x: 0, y: 0, z: 3 },
      rotation: quaternionFromEuler(0, Math.PI / 2, 0),
      scale: { x: 1, y: 1, z: 1 },
    });

    expect(stack.depth()).toBe(3);
    expectVectorClose(stack.peekTransform().translation, { x: 2, y: 0, z: 3 });

    const child = stack.pop();
    expectVectorClose(TransformDecomposer.decompose(child).translation, {
      x: 2,
      y: 0,
      z: 3,
    });
    expect(stack.depth()).toBe(2);
    expectVectorClose(stack.peekTransform().translation, { x: 2, y: 0, z: 0 });

    stack.reset();
    expect(stack.depth()).toBe(1);
    expect(() => stack.pop()).toThrow("Cannot pop the root transform");
  });

  it("applies constraints and builds look-at and orbit transforms", () => {
    const constrained = ConstrainedTransform.apply(
      {
        translation: { x: 10, y: -4, z: 2 },
        rotation: quaternionFromEuler(0, Math.PI / 2, 0),
        scale: { x: 0.25, y: 6, z: 8 },
      },
      {
        translation: {
          x: { max: 5 },
          y: { value: 0 },
        },
        rotation: {
          y: { max: Math.PI / 4 },
        },
        scale: {
          x: { min: 1 },
          y: { max: 4 },
        },
      },
    );
    const lookAt = LookAtTransform.create(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    );
    const orbit = OrbitTransform.create(
      { x: 0, y: 0, z: 0 },
      10,
      Math.PI / 2,
      { elevationRadians: 0 },
    );

    expectVectorClose(constrained.translation, { x: 5, y: 0, z: 2 });
    expectVectorClose(constrained.scale, { x: 1, y: 4, z: 8 });
    expect(
      rotateVector(constrained.rotation, { x: 0, y: 0, z: 1 }).angleTo(
        new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2),
      ),
    ).toBeLessThan(1e-8);

    expect(
      rotateVector(lookAt.rotation, { x: 0, y: 0, z: 1 }).distanceTo(
        new THREE.Vector3(1, 0, 0),
      ),
    ).toBeLessThan(1e-8);
    expectMatrixClose(
      LookAtTransform.matrix({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }),
      TransformComposer.compose(lookAt),
      6,
    );

    expectVectorClose(orbit.translation, { x: 10, y: 0, z: 0 }, 6);
    expect(
      rotateVector(orbit.rotation, { x: 0, y: 0, z: 1 }).distanceTo(
        new THREE.Vector3(-1, 0, 0),
      ),
    ).toBeLessThan(1e-8);
    expectMatrixClose(
      OrbitTransform.matrix({ x: 0, y: 0, z: 0 }, 10, Math.PI / 2),
      TransformComposer.compose(orbit),
      6,
    );
  });
});
