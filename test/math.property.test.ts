import { describe, expect, it } from "vitest";

import {
  AffineMatrix4x4,
  Angle,
  AxisRotation,
  Point3,
  Vector3,
} from "../src/scenegraph";

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function randomBetween(random: () => number, min: number, max: number): number {
  return min + ((max - min) * random());
}

function randomSigned(random: () => number, minAbs: number, maxAbs: number): number {
  const magnitude = randomBetween(random, minAbs, maxAbs);
  return random() < 0.5 ? -magnitude : magnitude;
}

function randomPoint(random: () => number): Point3 {
  return new Point3(
    randomBetween(random, -25, 25),
    randomBetween(random, -25, 25),
    randomBetween(random, -25, 25),
  );
}

function randomVector(random: () => number): Vector3 {
  return new Vector3(
    randomBetween(random, -25, 25),
    randomBetween(random, -25, 25),
    randomBetween(random, -25, 25),
  );
}

function randomNonZeroVector(random: () => number): Vector3 {
  let vector = randomVector(random);
  while (vector.magnitudeSquared() < 1e-6) {
    vector = randomVector(random);
  }
  return vector;
}

function randomAffineMatrix(random: () => number): AffineMatrix4x4 {
  return AffineMatrix4x4.compose(
    randomPoint(random),
    new AxisRotation(
      randomNonZeroVector(random),
      Angle.fromRadians(randomBetween(random, -Math.PI, Math.PI)),
    ),
    new Vector3(
      randomSigned(random, 0.25, 4),
      randomSigned(random, 0.25, 4),
      randomSigned(random, 0.25, 4),
    ),
  );
}

describe("scenegraph math properties", () => {
  it("preserves identity and inverse properties for affine matrices", () => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const random = createRandom(seed);
      const matrix = randomAffineMatrix(random);

      expect(AffineMatrix4x4.IDENTITY.times(matrix).isWithinEpsilonOf(matrix, 1e-8)).toBe(true);
      expect(matrix.times(matrix.invert()).isIdentity(1e-7)).toBe(true);
    }
  });

  it("preserves point reconstruction and distance symmetry", () => {
    for (let seed = 101; seed <= 228; seed += 1) {
      const random = createRandom(seed);
      const a = randomPoint(random);
      const b = randomPoint(random);
      const offset = b.minus(a) as Vector3;

      expect(a.plus(offset).isWithinEpsilonOf(b, 1e-9)).toBe(true);
      expect(a.distanceFrom(b)).toBeCloseTo(b.distanceFrom(a), 12);
    }
  });

  it("preserves normalization and cross-product antisymmetry", () => {
    for (let seed = 301; seed <= 428; seed += 1) {
      const random = createRandom(seed);
      const v = randomNonZeroVector(random);
      const a = randomVector(random);
      const b = randomVector(random);

      expect(v.normalize().magnitude()).toBeCloseTo(1, 12);
      expect(a.cross(b).isWithinEpsilonOf(b.cross(a).negate(), 1e-9)).toBe(true);
    }
  });
});
