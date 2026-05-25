import * as THREE from "three";

export interface GeometryBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface VisualAppearance {
  color: number;
  opacity: number;
  visible: boolean;
}

function cloneBounds(bounds: GeometryBounds): GeometryBounds {
  return {
    min: bounds.min.clone(),
    max: bounds.max.clone(),
  };
}

function combineBounds(boundsList: readonly GeometryBounds[]): GeometryBounds | null {
  if (boundsList.length === 0) {
    return null;
  }
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const bounds of boundsList) {
    min.min(bounds.min);
    max.max(bounds.max);
  }
  return { min, max };
}

function transformedBounds(bounds: GeometryBounds, matrix: THREE.Matrix4): GeometryBounds {
  const corners = [
    new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
    new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
    new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
    new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
    new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
    new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
    new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
    new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z),
  ].map((corner) => corner.applyMatrix4(matrix));
  const box = new THREE.Box3().setFromPoints(corners);
  return { min: box.min.clone(), max: box.max.clone() };
}

function toVector3(value: Vector3Like): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function toQuaternion(value: QuaternionLike): THREE.Quaternion {
  return new THREE.Quaternion(value.x, value.y, value.z, value.w).normalize();
}

const REASONABLE_EPSILON = 1e-9;

function wrapPositive(value: number, period: number): number {
  const wrapped = value % period;
  return wrapped < 0 ? wrapped + period : wrapped;
}

function wrapSigned(value: number, period: number): number {
  return wrapPositive(value + period * 0.5, period) - period * 0.5;
}

function toAngle(value: Angle | number): Angle {
  return value instanceof Angle ? value : Angle.fromRadians(value);
}

function toMathVector3(value: Vector3Like): Vector3 {
  return value instanceof Vector3 ? value : new Vector3(value.x, value.y, value.z);
}

function normalizeAxis(value: Vector3Like): Vector3 {
  const axis = Vector3.createNormalized(value.x, value.y, value.z);
  return axis.isNaN() ? Vector3.POSITIVE_X_AXIS : axis;
}

export class Angle {
  static readonly NaN = new Angle(Number.NaN);
  static readonly ZERO = new Angle(0);
  static readonly PI = new Angle(Math.PI);
  static readonly TAU = new Angle(Math.PI * 2);

  constructor(public readonly radians: number) {}

  static fromRadians(radians: number): Angle {
    return new Angle(radians);
  }

  static fromDegrees(degrees: number): Angle {
    return new Angle((degrees * Math.PI) / 180);
  }

  isNaN(): boolean {
    return Number.isNaN(this.radians);
  }

  isZero(): boolean {
    return this.radians === 0;
  }

  isCloseTo(other: Angle, epsilon = REASONABLE_EPSILON): boolean {
    return this === other || (this.isNaN() && other.isNaN()) || Math.abs(this.radians - other.radians) <= epsilon;
  }

  getAsRadians(): number {
    return this.radians;
  }

  getAsDegrees(): number {
    return (this.radians * 180) / Math.PI;
  }

  wrapped(): Angle {
    return new Angle(wrapSigned(this.radians, Angle.TAU.radians));
  }

  wrappedPositive(): Angle {
    return new Angle(wrapPositive(this.radians, Angle.TAU.radians));
  }

  negated(): Angle {
    return new Angle(-this.radians);
  }

  minus(other: Angle): Angle {
    return other.isZero() ? this : new Angle(this.radians - other.radians);
  }

  times(factor: number): Angle {
    return new Angle(this.radians * factor);
  }

  interpolateToward(other: Angle, portion: number): Angle {
    return new Angle(this.radians + ((other.radians - this.radians) * portion));
  }
}

export class Vector3 implements Vector3Like {
  static readonly ZERO = new Vector3(0, 0, 0);
  static readonly NaN = new Vector3(Number.NaN, Number.NaN, Number.NaN);
  static readonly POSITIVE_X_AXIS = new Vector3(1, 0, 0);
  static readonly POSITIVE_Y_AXIS = new Vector3(0, 1, 0);
  static readonly POSITIVE_Z_AXIS = new Vector3(0, 0, 1);
  static readonly NEGATIVE_X_AXIS = new Vector3(-1, 0, 0);
  static readonly NEGATIVE_Y_AXIS = new Vector3(0, -1, 0);
  static readonly NEGATIVE_Z_AXIS = new Vector3(0, 0, -1);

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  static from(value: Vector3Like): Vector3 {
    return value instanceof Vector3 ? value : new Vector3(value.x, value.y, value.z);
  }

  static magnitudeSquared(x: number, y: number, z: number): number {
    return (x * x) + (y * y) + (z * z);
  }

  static magnitude(x: number, y: number, z: number): number {
    const magnitudeSquared = Vector3.magnitudeSquared(x, y, z);
    return magnitudeSquared === 1 ? 1 : Math.sqrt(magnitudeSquared);
  }

  static createNormalized(x: number, y: number, z: number): Vector3 {
    const magnitudeSquared = Vector3.magnitudeSquared(x, y, z);
    if (magnitudeSquared === 0 || !Number.isFinite(magnitudeSquared)) {
      return Vector3.NaN;
    }
    if (magnitudeSquared === 1) {
      return new Vector3(x, y, z);
    }
    const magnitude = Math.sqrt(magnitudeSquared);
    return new Vector3(x / magnitude, y / magnitude, z / magnitude);
  }

  isNaN(): boolean {
    return Number.isNaN(this.x) || Number.isNaN(this.y) || Number.isNaN(this.z);
  }

  plus(other: Vector3Like): Vector3 {
    const value = Vector3.from(other);
    return new Vector3(this.x + value.x, this.y + value.y, this.z + value.z);
  }

  minus(other: Vector3Like): Vector3 {
    const value = Vector3.from(other);
    return new Vector3(this.x - value.x, this.y - value.y, this.z - value.z);
  }

  times(factor: number): Vector3 {
    return new Vector3(this.x * factor, this.y * factor, this.z * factor);
  }

  dividedBy(divisor: number): Vector3 {
    return new Vector3(this.x / divisor, this.y / divisor, this.z / divisor);
  }

  negate(): Vector3 {
    return new Vector3(-this.x, -this.y, -this.z);
  }

  dotProduct(other: Vector3Like): number {
    const value = Vector3.from(other);
    return (this.x * value.x) + (this.y * value.y) + (this.z * value.z);
  }

  dot(other: Vector3Like): number {
    return this.dotProduct(other);
  }

  crossProduct(other: Vector3Like): Vector3 {
    const value = Vector3.from(other);
    return new Vector3(
      (this.y * value.z) - (this.z * value.y),
      (value.x * this.z) - (value.z * this.x),
      (this.x * value.y) - (this.y * value.x),
    );
  }

  cross(other: Vector3Like): Vector3 {
    return this.crossProduct(other);
  }

  magnitudeSquared(): number {
    return Vector3.magnitudeSquared(this.x, this.y, this.z);
  }

  magnitude(): number {
    return Vector3.magnitude(this.x, this.y, this.z);
  }

  normalized(): Vector3 {
    return Vector3.createNormalized(this.x, this.y, this.z);
  }

  normalize(): Vector3 {
    return this.normalized();
  }

  distanceTo(other: Vector3Like): number {
    return this.minus(other).magnitude();
  }

  isWithinEpsilonOf(other: Vector3Like, epsilon = REASONABLE_EPSILON): boolean {
    const value = Vector3.from(other);
    return (
      Math.abs(this.x - value.x) <= epsilon &&
      Math.abs(this.y - value.y) <= epsilon &&
      Math.abs(this.z - value.z) <= epsilon
    );
  }

  asPoint(): Point3 {
    return new Point3(this.x, this.y, this.z);
  }

  asScaleMatrix(): OrthogonalMatrix3x3 {
    return new OrthogonalMatrix3x3(
      new Vector3(this.x, 0, 0),
      new Vector3(0, this.y, 0),
      new Vector3(0, 0, this.z),
    );
  }

  projectedOnto(target: Vector3Like): Vector3 {
    const unitTarget = Vector3.from(target).normalized();
    return unitTarget.times(this.dotProduct(unitTarget));
  }

  toThreeVector3(): THREE.Vector3 {
    return new THREE.Vector3(this.x, this.y, this.z);
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }
}

export class Point3 implements Vector3Like {
  static readonly ORIGIN = new Point3(0, 0, 0);
  static readonly NaN = new Point3(Number.NaN, Number.NaN, Number.NaN);

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  static from(value: Vector3Like): Point3 {
    return value instanceof Point3 ? value : new Point3(value.x, value.y, value.z);
  }

  isNaN(): boolean {
    return Number.isNaN(this.x) || Number.isNaN(this.y) || Number.isNaN(this.z);
  }

  plus(vector: Vector3Like): Point3 {
    const value = Vector3.from(vector);
    return new Point3(this.x + value.x, this.y + value.y, this.z + value.z);
  }

  minus(value: Point3): Vector3;
  minus(value: Vector3Like): Point3;
  minus(value: Point3 | Vector3Like): Point3 | Vector3 {
    if (value instanceof Point3) {
      return new Vector3(this.x - value.x, this.y - value.y, this.z - value.z);
    }
    const vector = Vector3.from(value);
    return new Point3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
  }

  times(factor: number): Point3 {
    return new Point3(this.x * factor, this.y * factor, this.z * factor);
  }

  distanceSquaredFrom(other: Point3): number {
    const delta = other.minus(this) as Vector3;
    return delta.magnitudeSquared();
  }

  distanceFrom(other: Point3): number {
    return Math.sqrt(this.distanceSquaredFrom(other));
  }

  isWithinEpsilonOf(other: Vector3Like, epsilon = REASONABLE_EPSILON): boolean {
    return this.asVector().isWithinEpsilonOf(other, epsilon);
  }

  asVector(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  toThreeVector3(): THREE.Vector3 {
    return new THREE.Vector3(this.x, this.y, this.z);
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }
}

export class OrthogonalMatrix3x3 {
  static readonly IDENTITY = new OrthogonalMatrix3x3(
    Vector3.POSITIVE_X_AXIS,
    Vector3.POSITIVE_Y_AXIS,
    Vector3.POSITIVE_Z_AXIS,
  );

  static readonly NaN = new OrthogonalMatrix3x3(Vector3.NaN, Vector3.NaN, Vector3.NaN);

  constructor(
    public readonly right: Vector3 = Vector3.POSITIVE_X_AXIS,
    public readonly up: Vector3 = Vector3.POSITIVE_Y_AXIS,
    public readonly backward: Vector3 = Vector3.POSITIVE_Z_AXIS,
  ) {}

  static fromQuaternion(value: QuaternionLike): OrthogonalMatrix3x3 {
    const quaternion = toQuaternion(value);
    const { x, y, z, w } = quaternion;
    return new OrthogonalMatrix3x3(
      new Vector3(1 - (2 * ((y * y) + (z * z))), 2 * ((x * y) + (z * w)), 2 * ((x * z) - (y * w))),
      new Vector3(2 * ((x * y) - (z * w)), 1 - (2 * ((x * x) + (z * z))), 2 * ((y * z) + (x * w))),
      new Vector3(2 * ((x * z) + (y * w)), 2 * ((y * z) - (x * w)), 1 - (2 * ((x * x) + (y * y)))),
    );
  }

  static fromAxisAngle(axis: Vector3Like, angle: Angle | number): OrthogonalMatrix3x3 {
    return new AxisRotation(normalizeAxis(axis), toAngle(angle)).asMatrix3x3();
  }

  static fromEulerAngles(pitch: Angle | number, yaw: Angle | number, roll: Angle | number): OrthogonalMatrix3x3 {
    const theta = toAngle(yaw).getAsRadians();
    const phi = toAngle(pitch).getAsRadians();
    const psi = toAngle(roll).getAsRadians();
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const cosPsi = Math.cos(psi);
    const sinPsi = Math.sin(psi);
    const right = new Vector3(cosPsi * cosTheta, sinPsi * cosTheta, -sinTheta);
    const up = new Vector3(
      (cosPsi * sinTheta * sinPhi) - (sinPsi * cosPhi),
      (sinPsi * sinTheta * sinPhi) + (cosPsi * cosPhi),
      cosTheta * sinPhi,
    );
    const backward = new Vector3(
      (cosPsi * sinTheta * cosPhi) + (sinPsi * sinPhi),
      (sinPsi * sinTheta * cosPhi) - (cosPsi * sinPhi),
      cosTheta * cosPhi,
    );
    return new OrthogonalMatrix3x3(right, up, backward);
  }

  static fromRowMajorElements(
    e11: number, e12: number, e13: number,
    e21: number, e22: number, e23: number,
    e31: number, e32: number, e33: number,
  ): OrthogonalMatrix3x3 {
    return new OrthogonalMatrix3x3(
      new Vector3(e11, e21, e31),
      new Vector3(e12, e22, e32),
      new Vector3(e13, e23, e33),
    );
  }

  isNaN(): boolean {
    return this.right.isNaN() || this.up.isNaN() || this.backward.isNaN();
  }

  isIdentity(epsilon = REASONABLE_EPSILON): boolean {
    return this.isWithinEpsilonOf(OrthogonalMatrix3x3.IDENTITY, epsilon);
  }

  isWithinEpsilonOf(other: OrthogonalMatrix3x3, epsilon = REASONABLE_EPSILON): boolean {
    return (
      this.right.isWithinEpsilonOf(other.right, epsilon) &&
      this.up.isWithinEpsilonOf(other.up, epsilon) &&
      this.backward.isWithinEpsilonOf(other.backward, epsilon)
    );
  }

  plus(other: OrthogonalMatrix3x3): OrthogonalMatrix3x3 {
    return new OrthogonalMatrix3x3(
      this.right.plus(other.right),
      this.up.plus(other.up),
      this.backward.plus(other.backward),
    );
  }

  times(other: number): OrthogonalMatrix3x3;
  times(other: OrthogonalMatrix3x3): OrthogonalMatrix3x3;
  times(other: number | OrthogonalMatrix3x3): OrthogonalMatrix3x3 {
    if (typeof other === "number") {
      return new OrthogonalMatrix3x3(
        this.right.times(other),
        this.up.times(other),
        this.backward.times(other),
      );
    }
    return new OrthogonalMatrix3x3(
      this.transformVector(other.right),
      this.transformVector(other.up),
      this.transformVector(other.backward),
    );
  }

  multiply(other: OrthogonalMatrix3x3): OrthogonalMatrix3x3 {
    return this.times(other);
  }

  transformVector(vector: Vector3Like): Vector3 {
    const source = toMathVector3(vector);
    return new Vector3(
      (this.e11() * source.x) + (this.e12() * source.y) + (this.e13() * source.z),
      (this.e21() * source.x) + (this.e22() * source.y) + (this.e23() * source.z),
      (this.e31() * source.x) + (this.e32() * source.y) + (this.e33() * source.z),
    );
  }

  determinant(): number {
    return (
      (this.e11() * ((this.e22() * this.e33()) - (this.e23() * this.e32()))) -
      (this.e12() * ((this.e21() * this.e33()) - (this.e23() * this.e31()))) +
      (this.e13() * ((this.e21() * this.e32()) - (this.e22() * this.e31())))
    );
  }

  inverse(): OrthogonalMatrix3x3 {
    const a = this.e11();
    const b = this.e12();
    const c = this.e13();
    const d = this.e21();
    const e = this.e22();
    const f = this.e23();
    const g = this.e31();
    const h = this.e32();
    const i = this.e33();
    const determinant = this.determinant();
    if (Math.abs(determinant) <= REASONABLE_EPSILON) {
      throw new Error("Matrix is not invertible");
    }
    return OrthogonalMatrix3x3.fromRowMajorElements(
      ((e * i) - (f * h)) / determinant,
      ((c * h) - (b * i)) / determinant,
      ((b * f) - (c * e)) / determinant,
      ((f * g) - (d * i)) / determinant,
      ((a * i) - (c * g)) / determinant,
      ((c * d) - (a * f)) / determinant,
      ((d * h) - (e * g)) / determinant,
      ((b * g) - (a * h)) / determinant,
      ((a * e) - (b * d)) / determinant,
    );
  }

  normalized(): OrthogonalMatrix3x3 {
    return new OrthogonalMatrix3x3(
      this.right.normalized(),
      this.up.normalized(),
      this.backward.normalized(),
    );
  }

  unitAxes(): OrthogonalMatrix3x3 {
    const xScale = this.right.magnitude();
    const yScale = this.up.magnitude();
    const zScale = this.backward.magnitude();
    return new OrthogonalMatrix3x3(
      xScale === 0 ? Vector3.POSITIVE_X_AXIS : this.right.dividedBy(xScale),
      yScale === 0 ? Vector3.POSITIVE_Y_AXIS : this.up.dividedBy(yScale),
      zScale === 0 ? Vector3.POSITIVE_Z_AXIS : this.backward.dividedBy(zScale),
    );
  }

  withScale(scale: number | Vector3Like): OrthogonalMatrix3x3 {
    const factor = typeof scale === "number"
      ? new Vector3(scale, scale, scale)
      : Vector3.from(scale);
    const basis = this.unitAxes();
    return new OrthogonalMatrix3x3(
      basis.right.times(factor.x),
      basis.up.times(factor.y),
      basis.backward.times(factor.z),
    );
  }

  scaleFactors(): Vector3 {
    return new Vector3(
      this.right.magnitude(),
      this.up.magnitude(),
      this.backward.magnitude(),
    );
  }

  toQuaternion(): THREE.Quaternion {
    const basis = this.unitAxes();
    return new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().fromArray([
        basis.e11(), basis.e21(), basis.e31(), 0,
        basis.e12(), basis.e22(), basis.e32(), 0,
        basis.e13(), basis.e23(), basis.e33(), 0,
        0, 0, 0, 1,
      ]),
    ).normalize();
  }

  e11(): number { return this.right.x; }
  e21(): number { return this.right.y; }
  e31(): number { return this.right.z; }
  e12(): number { return this.up.x; }
  e22(): number { return this.up.y; }
  e32(): number { return this.up.z; }
  e13(): number { return this.backward.x; }
  e23(): number { return this.backward.y; }
  e33(): number { return this.backward.z; }
}

export class AxisRotation {
  static readonly NaN = new AxisRotation(Vector3.NaN, Angle.NaN);
  static readonly IDENTITY = new AxisRotation(Vector3.POSITIVE_X_AXIS, Angle.ZERO);

  constructor(
    public readonly axis: Vector3 = Vector3.POSITIVE_X_AXIS,
    public readonly angle: Angle = Angle.ZERO,
  ) {}

  static createXAxisRotation(angle: Angle | number): AxisRotation {
    return new AxisRotation(Vector3.POSITIVE_X_AXIS, toAngle(angle));
  }

  static createYAxisRotation(angle: Angle | number): AxisRotation {
    return new AxisRotation(Vector3.POSITIVE_Y_AXIS, toAngle(angle));
  }

  static createZAxisRotation(angle: Angle | number): AxisRotation {
    return new AxisRotation(Vector3.POSITIVE_Z_AXIS, toAngle(angle));
  }

  isNaN(): boolean {
    return this.axis.isNaN() || this.angle.isNaN();
  }

  isIdentity(): boolean {
    return this.angle.isZero();
  }

  asMatrix3x3(): OrthogonalMatrix3x3 {
    if (this.isNaN()) {
      return OrthogonalMatrix3x3.NaN;
    }
    const axis = normalizeAxis(this.axis);
    const theta = this.angle.getAsRadians();
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const t = 1 - c;
    const xyt = axis.x * axis.y * t;
    const zs = axis.z * s;
    const xzt = axis.x * axis.z * t;
    const ys = axis.y * s;
    const yzt = axis.y * axis.z * t;
    const xs = axis.x * s;
    const right = new Vector3(c + (axis.x * axis.x * t), xyt + zs, xzt - ys);
    const up = new Vector3(xyt - zs, c + (axis.y * axis.y * t), yzt + xs);
    const backward = new Vector3(xzt + ys, yzt - xs, c + (axis.z * axis.z * t));
    return new OrthogonalMatrix3x3(right, up, backward);
  }
}

export class AffineMatrix4x4 {
  static readonly IDENTITY = new AffineMatrix4x4();

  constructor(
    public readonly orientation: OrthogonalMatrix3x3 = OrthogonalMatrix3x3.IDENTITY,
    public readonly translation: Point3 = Point3.ORIGIN,
  ) {}

  static fromTranslation(x: number, y: number, z: number): AffineMatrix4x4 {
    return new AffineMatrix4x4(OrthogonalMatrix3x3.IDENTITY, new Point3(x, y, z));
  }

  static createTranslation(x: number, y: number, z: number): AffineMatrix4x4 {
    return AffineMatrix4x4.fromTranslation(x, y, z);
  }

  static createOrientation(orientation: QuaternionLike | AxisRotation | OrthogonalMatrix3x3): AffineMatrix4x4 {
    const matrix = orientation instanceof OrthogonalMatrix3x3
      ? orientation
      : orientation instanceof AxisRotation
        ? orientation.asMatrix3x3()
        : OrthogonalMatrix3x3.fromQuaternion(orientation);
    return new AffineMatrix4x4(matrix, Point3.ORIGIN);
  }

  static fromScale(scale: number | Vector3Like): AffineMatrix4x4 {
    const diagonal = typeof scale === "number"
      ? new Vector3(scale, scale, scale)
      : Vector3.from(scale);
    return new AffineMatrix4x4(diagonal.asScaleMatrix(), Point3.ORIGIN);
  }

  static createWithDiagonal(diagonal: Vector3Like): AffineMatrix4x4 {
    return new AffineMatrix4x4(Vector3.from(diagonal).asScaleMatrix(), Point3.ORIGIN);
  }

  static fromAxisAngle(axis: Vector3Like, angle: Angle | number): AffineMatrix4x4 {
    return AffineMatrix4x4.createOrientation(OrthogonalMatrix3x3.fromAxisAngle(axis, angle));
  }

  static fromEulerAngles(pitch: Angle | number, yaw: Angle | number, roll: Angle | number): AffineMatrix4x4 {
    return AffineMatrix4x4.createOrientation(OrthogonalMatrix3x3.fromEulerAngles(pitch, yaw, roll));
  }

  static fromRotationX(radians: number): AffineMatrix4x4 {
    return AffineMatrix4x4.createOrientation(AxisRotation.createXAxisRotation(radians));
  }

  static fromRotationY(radians: number): AffineMatrix4x4 {
    return AffineMatrix4x4.createOrientation(AxisRotation.createYAxisRotation(radians));
  }

  static fromRotationZ(radians: number): AffineMatrix4x4 {
    return AffineMatrix4x4.createOrientation(AxisRotation.createZAxisRotation(radians));
  }

  static compose(
    translation: Vector3Like,
    rotation: QuaternionLike | AxisRotation | OrthogonalMatrix3x3,
    scale: number | Vector3Like = 1,
  ): AffineMatrix4x4 {
    const factor = typeof scale === "number"
      ? new Vector3(scale, scale, scale)
      : Vector3.from(scale);
    const orientation = rotation instanceof OrthogonalMatrix3x3
      ? rotation.withScale(factor)
      : rotation instanceof AxisRotation
        ? rotation.asMatrix3x3().withScale(factor)
        : OrthogonalMatrix3x3.fromQuaternion(rotation).withScale(factor);
    return new AffineMatrix4x4(orientation, Point3.from(translation));
  }

  static fromThreeMatrix(matrix: THREE.Matrix4): AffineMatrix4x4 {
    const elements = matrix.elements;
    return new AffineMatrix4x4(
      new OrthogonalMatrix3x3(
        new Vector3(elements[0], elements[1], elements[2]),
        new Vector3(elements[4], elements[5], elements[6]),
        new Vector3(elements[8], elements[9], elements[10]),
      ),
      new Point3(elements[12], elements[13], elements[14]),
    );
  }

  static fromColumnMajorArray12(values: readonly number[]): AffineMatrix4x4 {
    if (values.length !== 12) {
      throw new TypeError(`expected 12 values, received ${values.length}`);
    }
    return new AffineMatrix4x4(
      new OrthogonalMatrix3x3(
        new Vector3(values[0], values[1], values[2]),
        new Vector3(values[3], values[4], values[5]),
        new Vector3(values[6], values[7], values[8]),
      ),
      new Point3(values[9], values[10], values[11]),
    );
  }

  clone(): AffineMatrix4x4 {
    return new AffineMatrix4x4(this.orientation, this.translation);
  }

  isAffine(): boolean {
    return true;
  }

  isNaN(): boolean {
    return this.orientation.isNaN() || this.translation.isNaN();
  }

  isIdentity(epsilon = REASONABLE_EPSILON): boolean {
    return this.isWithinEpsilonOf(AffineMatrix4x4.IDENTITY, epsilon);
  }

  isWithinEpsilonOf(other: AffineMatrix4x4, epsilon = REASONABLE_EPSILON): boolean {
    return (
      this.orientation.isWithinEpsilonOf(other.orientation, epsilon) &&
      this.translation.isWithinEpsilonOf(other.translation, epsilon)
    );
  }

  invert(): AffineMatrix4x4 {
    const inverseOrientation = this.orientation.inverse();
    const inverseTranslation = inverseOrientation.transformVector(this.translation.asVector()).negate().asPoint();
    return new AffineMatrix4x4(inverseOrientation, inverseTranslation);
  }

  times(other: AffineMatrix4x4): AffineMatrix4x4 {
    return new AffineMatrix4x4(
      this.orientation.times(other.orientation),
      this.transformPoint(other.translation),
    );
  }

  multiply(other: AffineMatrix4x4): AffineMatrix4x4 {
    return this.times(other);
  }

  plusPreservingAffine(other: AffineMatrix4x4): AffineMatrix4x4 {
    if (this.isNaN()) {
      return other;
    }
    return new AffineMatrix4x4(
      this.orientation.plus(other.orientation),
      this.translation.plus(other.translation.asVector()),
    );
  }

  scaleTranslation(scale: number | Vector3Like): AffineMatrix4x4 {
    const factor = typeof scale === "number"
      ? new Vector3(scale, scale, scale)
      : Vector3.from(scale);
    return new AffineMatrix4x4(
      this.orientation,
      new Point3(
        this.translation.x * factor.x,
        this.translation.y * factor.y,
        this.translation.z * factor.z,
      ),
    );
  }

  transformPoint(point: Vector3Like): Point3 {
    const transformed = this.orientation.transformVector(point);
    return new Point3(
      transformed.x + this.translation.x,
      transformed.y + this.translation.y,
      transformed.z + this.translation.z,
    );
  }

  transformVector(vector: Vector3Like): Vector3 {
    return this.orientation.transformVector(vector);
  }

  toThreeMatrix4(): THREE.Matrix4 {
    return new THREE.Matrix4().fromArray([
      this.e11(), this.e21(), this.e31(), 0,
      this.e12(), this.e22(), this.e32(), 0,
      this.e13(), this.e23(), this.e33(), 0,
      this.e14(), this.e24(), this.e34(), 1,
    ]);
  }

  toArray(): number[] {
    return [...this.toThreeMatrix4().elements];
  }

  decompose(): {
    translation: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  } {
    return {
      translation: this.translation.toThreeVector3(),
      quaternion: this.orientation.toQuaternion(),
      scale: this.orientation.scaleFactors().toThreeVector3(),
    };
  }

  get quaternion(): THREE.Quaternion {
    return this.decompose().quaternion;
  }

  get scale(): THREE.Vector3 {
    return this.decompose().scale;
  }

  rowX(): THREE.Vector4 {
    return new THREE.Vector4(this.e11(), this.e12(), this.e13(), this.e14());
  }

  rowY(): THREE.Vector4 {
    return new THREE.Vector4(this.e21(), this.e22(), this.e23(), this.e24());
  }

  rowZ(): THREE.Vector4 {
    return new THREE.Vector4(this.e31(), this.e32(), this.e33(), this.e34());
  }

  rowW(): THREE.Vector4 {
    return new THREE.Vector4(0, 0, 0, 1);
  }

  columnRight(): THREE.Vector4 {
    return new THREE.Vector4(this.e11(), this.e21(), this.e31(), 0);
  }

  columnUp(): THREE.Vector4 {
    return new THREE.Vector4(this.e12(), this.e22(), this.e32(), 0);
  }

  columnBackward(): THREE.Vector4 {
    return new THREE.Vector4(this.e13(), this.e23(), this.e33(), 0);
  }

  columnTranslation(): THREE.Vector4 {
    return new THREE.Vector4(this.e14(), this.e24(), this.e34(), 1);
  }

  withTranslation(newTranslation: Vector3Like): AffineMatrix4x4 {
    return new AffineMatrix4x4(this.orientation, Point3.from(newTranslation));
  }

  withOrientation(newOrientation: OrthogonalMatrix3x3): AffineMatrix4x4 {
    return new AffineMatrix4x4(newOrientation, this.translation);
  }

  rotateAboutXAxis(angle: Angle | number): AffineMatrix4x4 {
    return this.times(AffineMatrix4x4.createOrientation(AxisRotation.createXAxisRotation(angle)));
  }

  rotateAboutYAxis(angle: Angle | number): AffineMatrix4x4 {
    return this.times(AffineMatrix4x4.createOrientation(AxisRotation.createYAxisRotation(angle)));
  }

  e11(): number { return this.orientation.right.x; }
  e21(): number { return this.orientation.right.y; }
  e31(): number { return this.orientation.right.z; }
  e41(): number { return 0; }
  e12(): number { return this.orientation.up.x; }
  e22(): number { return this.orientation.up.y; }
  e32(): number { return this.orientation.up.z; }
  e42(): number { return 0; }
  e13(): number { return this.orientation.backward.x; }
  e23(): number { return this.orientation.backward.y; }
  e33(): number { return this.orientation.backward.z; }
  e43(): number { return 0; }
  e14(): number { return this.translation.x; }
  e24(): number { return this.translation.y; }
  e34(): number { return this.translation.z; }
  e44(): number { return 1; }
}

let nextComponentId = 0;

export class Component {
  #parent: Composite | null = null;
  readonly id = `sg-${nextComponentId++}`;

  constructor(public name: string) {}

  get parent(): Composite | null {
    return this.#parent;
  }

  setParent(parent: Composite | null): void {
    this.#parent = parent;
  }

  getRoot(): Component {
    let current: Component = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  get localAffineMatrix(): AffineMatrix4x4 {
    return AffineMatrix4x4.IDENTITY;
  }

  getWorldTransform(): AffineMatrix4x4 {
    const chain: AffineMatrix4x4[] = [];
    let current: Component | null = this;
    while (current) {
      chain.push(current.localAffineMatrix);
      current = current.parent;
    }
    let world = AffineMatrix4x4.IDENTITY;
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      world = world.multiply(chain[index]);
    }
    return world;
  }

  get absoluteAffineMatrix(): AffineMatrix4x4 {
    return this.getWorldTransform();
  }

  get absoluteMatrix(): THREE.Matrix4 {
    return this.absoluteAffineMatrix.toThreeMatrix4();
  }

  get inverseAbsoluteMatrix(): THREE.Matrix4 {
    return this.absoluteMatrix.clone().invert();
  }

  get inverseAbsoluteAffineMatrix(): AffineMatrix4x4 {
    return this.absoluteAffineMatrix.invert();
  }

  getTransformation(asSeenBy: Component | null): THREE.Matrix4 {
    return this.getAffineTransformation(asSeenBy).toThreeMatrix4();
  }

  getAffineTransformation(asSeenBy: Component | null): AffineMatrix4x4 {
    if (!asSeenBy) {
      return this.absoluteAffineMatrix;
    }
    return asSeenBy.inverseAbsoluteAffineMatrix.multiply(this.absoluteAffineMatrix);
  }

  isDescendantOf(possibleAncestor: Composite | null): boolean {
    if (!possibleAncestor) {
      return false;
    }
    let current = this.parent;
    while (current) {
      if (current === possibleAncestor) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  toThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }
}

export class Composite extends Component {
  #children: Component[] = [];

  get children(): readonly Component[] {
    return [...this.#children];
  }

  add(child: Component): void {
    if (child === this) {
      throw new Error("Cannot add a component as its own child");
    }
    if (this.isDescendantOf(child as Composite) || child.isDescendantOf(this)) {
      throw new Error("Cannot create a scenegraph cycle");
    }
    if (child.parent) {
      child.parent.remove(child);
    }
    this.#children.push(child);
    child.setParent(this);
  }

  remove(child: Component): boolean {
    const index = this.#children.indexOf(child);
    if (index === -1) {
      return false;
    }
    this.#children.splice(index, 1);
    child.setParent(null);
    return true;
  }

  hasChild(child: Component): boolean {
    return this.#children.includes(child);
  }

  traverse(visitor: (component: Component) => void): void {
    visitor(this);
    for (const child of this.#children) {
      if (child instanceof Composite) {
        child.traverse(visitor);
      } else {
        visitor(child);
      }
    }
  }

  protected populateThreeObject(object: THREE.Object3D): void {
    for (const child of this.#children) {
      object.add(child.toThreeObject());
    }
  }

  override toThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = this.name;
    this.populateThreeObject(group);
    return group;
  }
}

export class Transformable extends Composite {
  localTransform = AffineMatrix4x4.IDENTITY;

  get position(): THREE.Vector3 {
    return this.localTransform.translation.toThreeVector3();
  }

  get quaternion(): THREE.Quaternion {
    return this.localTransform.quaternion;
  }

  get scale(): THREE.Vector3 {
    return this.localTransform.scale;
  }

  setTranslation(x: number, y: number, z: number): this {
    this.localTransform = this.localTransform.withTranslation(new Point3(x, y, z));
    return this;
  }

  translateBy(x: number, y: number, z: number): this {
    this.localTransform = this.localTransform.withTranslation(
      this.localTransform.translation.plus(new Vector3(x, y, z)),
    );
    return this;
  }

  setQuaternion(x: number, y: number, z: number, w: number): this {
    const scale = Vector3.from(this.localTransform.scale);
    const orientation = OrthogonalMatrix3x3.fromQuaternion({ x, y, z, w }).withScale(scale);
    this.localTransform = new AffineMatrix4x4(orientation, this.localTransform.translation);
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    const orientation = this.localTransform.orientation.withScale(new Vector3(x, y, z));
    this.localTransform = new AffineMatrix4x4(orientation, this.localTransform.translation);
    return this;
  }

  applyRotation(rotation: AxisRotation | QuaternionLike | OrthogonalMatrix3x3): this {
    this.localTransform = this.localTransform.multiply(AffineMatrix4x4.createOrientation(rotation));
    return this;
  }

  rotateAroundAxis(axis: Vector3Like, radians: number): this {
    return this.applyRotation(new AxisRotation(normalizeAxis(axis), Angle.fromRadians(radians)));
  }

  lookAt(target: Vector3Like): this {
    const matrix = new THREE.Matrix4().lookAt(this.position, toVector3(target), new THREE.Vector3(0, 1, 0));
    const orientation = AffineMatrix4x4.fromThreeMatrix(matrix).orientation.withScale(Vector3.from(this.scale));
    this.localTransform = new AffineMatrix4x4(orientation, this.localTransform.translation);
    return this;
  }

  get localMatrix(): THREE.Matrix4 {
    return this.localTransform.toThreeMatrix4();
  }

  override get localAffineMatrix(): AffineMatrix4x4 {
    return this.localTransform;
  }

  protected applyTransform(object: THREE.Object3D): void {
    const { translation, quaternion, scale } = this.localTransform.decompose();
    object.position.copy(translation);
    object.quaternion.copy(quaternion);
    object.scale.copy(scale);
  }

  override toThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = this.name;
    this.applyTransform(group);
    this.populateThreeObject(group);
    return group;
  }
}

export abstract class Geometry {
  #bounds: GeometryBounds | null = null;

  constructor(public readonly kind: string) {}

  protected abstract computeBounds(): GeometryBounds;

  get bounds(): GeometryBounds {
    if (!this.#bounds) {
      this.#bounds = this.computeBounds();
    }
    return cloneBounds(this.#bounds);
  }

  markDirty(): void {
    this.#bounds = null;
  }

  abstract toThreeGeometry(): THREE.BufferGeometry;
}

export class Box extends Geometry {
  readonly minimum = new THREE.Vector3(-0.5, -0.5, -0.5);
  readonly maximum = new THREE.Vector3(0.5, 0.5, 0.5);

  constructor(width = 1, height = 1, depth = 1) {
    super("box");
    this.setSize(width, height, depth);
  }

  get width(): number {
    return this.maximum.x - this.minimum.x;
  }

  get height(): number {
    return this.maximum.y - this.minimum.y;
  }

  get depth(): number {
    return this.maximum.z - this.minimum.z;
  }

  setSize(width: number, height: number, depth: number): this {
    this.minimum.set(-width / 2, -height / 2, -depth / 2);
    this.maximum.set(width / 2, height / 2, depth / 2);
    this.markDirty();
    return this;
  }

  setMinimum(x: number, y: number, z: number): this {
    this.minimum.set(x, y, z);
    this.markDirty();
    return this;
  }

  setMaximum(x: number, y: number, z: number): this {
    this.maximum.set(x, y, z);
    this.markDirty();
    return this;
  }

  protected override computeBounds(): GeometryBounds {
    return { min: this.minimum.clone(), max: this.maximum.clone() };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(this.width, this.height, this.depth);
  }
}

export class Sphere extends Geometry {
  constructor(public radius = 0.5) {
    super("sphere");
  }

  protected override computeBounds(): GeometryBounds {
    return {
      min: new THREE.Vector3(-this.radius, -this.radius, -this.radius),
      max: new THREE.Vector3(this.radius, this.radius, this.radius),
    };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry(this.radius, 24, 16);
  }
}

export type CylinderOriginAlignment = "top" | "center" | "bottom";
export type CylinderBottomToTopAxis =
  | "positiveX"
  | "positiveY"
  | "positiveZ"
  | "negativeX"
  | "negativeY"
  | "negativeZ";

function cylinderAxisVector(axis: CylinderBottomToTopAxis): THREE.Vector3 {
  switch (axis) {
    case "positiveX": return new THREE.Vector3(1, 0, 0);
    case "positiveY": return new THREE.Vector3(0, 1, 0);
    case "positiveZ": return new THREE.Vector3(0, 0, 1);
    case "negativeX": return new THREE.Vector3(-1, 0, 0);
    case "negativeY": return new THREE.Vector3(0, -1, 0);
    case "negativeZ": return new THREE.Vector3(0, 0, -1);
  }
}

export class Cylinder extends Geometry {
  originAlignment: CylinderOriginAlignment = "bottom";
  bottomToTopAxis: CylinderBottomToTopAxis = "positiveY";
  hasBottomCap = true;
  hasTopCap = true;

  constructor(
    public length = 1,
    public bottomRadius = 1,
    public topRadius = 1,
  ) {
    super("cylinder");
  }

  get actualTopRadius(): number {
    return Number.isNaN(this.topRadius) ? this.bottomRadius : this.topRadius;
  }

  private get maxRadius(): number {
    return Math.max(this.bottomRadius, this.actualTopRadius);
  }

  private getTop(): number {
    switch (this.originAlignment) {
      case "bottom": return this.length;
      case "center": return this.length * 0.5;
      case "top": return 0;
    }
  }

  private getBottom(): number {
    switch (this.originAlignment) {
      case "bottom": return 0;
      case "center": return -this.length * 0.5;
      case "top": return -this.length;
    }
  }

  getCenterOfTop(): THREE.Vector3 {
    return this.offsetPoint(this.getTop());
  }

  getCenterOfBottom(): THREE.Vector3 {
    return this.offsetPoint(this.getBottom());
  }

  private offsetPoint(offset: number): THREE.Vector3 {
    return cylinderAxisVector(this.bottomToTopAxis).multiplyScalar(offset);
  }

  protected override computeBounds(): GeometryBounds {
    const top = this.getTop();
    const bottom = this.getBottom();
    const radius = this.maxRadius;
    switch (this.bottomToTopAxis) {
      case "positiveX":
        return { min: new THREE.Vector3(bottom, -radius, -radius), max: new THREE.Vector3(top, radius, radius) };
      case "positiveY":
        return { min: new THREE.Vector3(-radius, bottom, -radius), max: new THREE.Vector3(radius, top, radius) };
      case "positiveZ":
        return { min: new THREE.Vector3(-radius, -radius, bottom), max: new THREE.Vector3(radius, radius, top) };
      case "negativeX":
        return { min: new THREE.Vector3(top, -radius, -radius), max: new THREE.Vector3(bottom, radius, radius) };
      case "negativeY":
        return { min: new THREE.Vector3(-radius, top, -radius), max: new THREE.Vector3(radius, bottom, radius) };
      case "negativeZ":
        return { min: new THREE.Vector3(-radius, -radius, top), max: new THREE.Vector3(radius, radius, bottom) };
    }
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(
      this.actualTopRadius,
      this.bottomRadius,
      this.length,
      32,
      1,
      !(this.hasBottomCap && this.hasTopCap),
    );
    const axis = cylinderAxisVector(this.bottomToTopAxis).normalize();
    const baseAxis = new THREE.Vector3(0, 1, 0);
    const rotation = new THREE.Quaternion().setFromUnitVectors(baseAxis, axis);
    geometry.applyQuaternion(rotation);
    const centerOffset = this.getTop() - this.length * 0.5;
    geometry.translate(axis.x * centerOffset, axis.y * centerOffset, axis.z * centerOffset);
    return geometry;
  }
}

export type DiscAxis = "x" | "y" | "z";

export class Disc extends Geometry {
  axis: DiscAxis = "y";
  isFrontFaceVisible = true;
  isBackFaceVisible = true;

  constructor(
    public outerRadius = 1,
    public innerRadius = 0,
  ) {
    super("disc");
  }

  protected override computeBounds(): GeometryBounds {
    const radius = this.outerRadius;
    switch (this.axis) {
      case "x": return { min: new THREE.Vector3(0, -radius, -radius), max: new THREE.Vector3(0, radius, radius) };
      case "y": return { min: new THREE.Vector3(-radius, 0, -radius), max: new THREE.Vector3(radius, 0, radius) };
      case "z": return { min: new THREE.Vector3(-radius, -radius, 0), max: new THREE.Vector3(radius, radius, 0) };
    }
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.RingGeometry(this.innerRadius, this.outerRadius, 32);
    if (this.axis === "x") {
      geometry.rotateZ(Math.PI / 2);
    } else if (this.axis === "y") {
      geometry.rotateX(-Math.PI / 2);
    }
    return geometry;
  }
}

export type TorusCoordinatePlane = "xy" | "xz" | "yz";

export class Torus extends Geometry {
  coordinatePlane: TorusCoordinatePlane = "xz";

  constructor(
    public majorRadius = 0.9,
    public minorRadius = 0.1,
  ) {
    super("torus");
  }

  protected override computeBounds(): GeometryBounds {
    const yesRadius = this.majorRadius + this.minorRadius;
    const noRadius = this.minorRadius;
    switch (this.coordinatePlane) {
      case "xy":
        return { min: new THREE.Vector3(-yesRadius, -yesRadius, -noRadius), max: new THREE.Vector3(yesRadius, yesRadius, noRadius) };
      case "xz":
        return { min: new THREE.Vector3(-yesRadius, -noRadius, -yesRadius), max: new THREE.Vector3(yesRadius, noRadius, yesRadius) };
      case "yz":
        return { min: new THREE.Vector3(-noRadius, -yesRadius, -yesRadius), max: new THREE.Vector3(noRadius, yesRadius, yesRadius) };
    }
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.TorusGeometry(this.majorRadius, this.minorRadius, 16, 48);
    if (this.coordinatePlane === "xy") {
      geometry.rotateX(Math.PI / 2);
    } else if (this.coordinatePlane === "yz") {
      geometry.rotateY(Math.PI / 2);
    }
    return geometry;
  }
}

export class IndexedTriangleArray extends Geometry {
  readonly vertices: number[];
  readonly indices: number[];
  readonly normals: number[];
  readonly uvs: number[];

  constructor(options: {
    readonly vertices: readonly number[];
    readonly indices: readonly number[];
    readonly normals?: readonly number[];
    readonly uvs?: readonly number[];
  }) {
    super("indexedTriangleArray");
    if (options.indices.length % 3 !== 0) {
      throw new TypeError("IndexedTriangleArray requires triangle indices");
    }
    this.vertices = [...options.vertices];
    this.indices = [...options.indices];
    this.normals = [...(options.normals ?? [])];
    this.uvs = [...(options.uvs ?? [])];
  }

  get indicesPerPolygon(): number {
    return 3;
  }

  protected override computeBounds(): GeometryBounds {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index < this.vertices.length; index += 3) {
      points.push(new THREE.Vector3(this.vertices[index], this.vertices[index + 1], this.vertices[index + 2]));
    }
    const box = new THREE.Box3().setFromPoints(points);
    return { min: box.min.clone(), max: box.max.clone() };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.vertices, 3),
    );
    geometry.setIndex(this.indices);
    if (this.normals.length > 0) {
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
    if (this.uvs.length > 0) {
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    }
    return geometry;
  }
}

export class Mesh extends IndexedTriangleArray {
  textureId = -1;
  textureIdArray: number[] = [];
  cullBackfaces = true;
  useAlphaTest = false;

  constructor(options: ConstructorParameters<typeof IndexedTriangleArray>[0]) {
    super(options);
  }

  createCopy(): Mesh {
    const copy = new Mesh({
      vertices: this.vertices,
      indices: this.indices,
      normals: this.normals,
      uvs: this.uvs,
    });
    copy.textureId = this.textureId;
    copy.textureIdArray = [...this.textureIdArray];
    copy.cullBackfaces = this.cullBackfaces;
    copy.useAlphaTest = this.useAlphaTest;
    return copy;
  }

  transform(matrix: AffineMatrix4x4 | THREE.Matrix4): void {
    const affine = matrix instanceof AffineMatrix4x4 ? matrix.toThreeMatrix4() : matrix.clone();
    for (let index = 0; index < this.vertices.length; index += 3) {
      const point = new THREE.Vector3(
        this.vertices[index],
        this.vertices[index + 1],
        this.vertices[index + 2],
      ).applyMatrix4(affine);
      this.vertices[index] = point.x;
      this.vertices[index + 1] = point.y;
      this.vertices[index + 2] = point.z;
    }
    this.markDirty();
  }

  scale(scale: number): void {
    for (let index = 0; index < this.vertices.length; index += 1) {
      this.vertices[index] *= scale;
    }
    this.markDirty();
  }

  invertNormals(): void {
    for (let index = 0; index < this.normals.length; index += 1) {
      this.normals[index] *= -1;
    }
  }

  invertIndices(): void {
    for (let index = 0; index < this.indices.length; index += 3) {
      const temp = this.indices[index + 1];
      this.indices[index + 1] = this.indices[index + 2];
      this.indices[index + 2] = temp;
    }
  }

  getReferencedTextureIds(): number[] {
    if (this.textureIdArray.length === 0) {
      return this.textureId >= 0 ? [this.textureId] : [];
    }
    return [...new Set(this.textureIdArray)];
  }
}

export class PlaneGeometry extends Geometry {
  constructor(public width: number, public depth: number) {
    super("plane");
  }

  protected override computeBounds(): GeometryBounds {
    return {
      min: new THREE.Vector3(-this.width / 2, 0, -this.depth / 2),
      max: new THREE.Vector3(this.width / 2, 0, this.depth / 2),
    };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(this.width, this.depth);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }
}

export abstract class Appearance {
  visible = true;
  abstract toThreeMaterial(side?: THREE.Side): THREE.Material;
}

export class SingleAppearance extends Appearance implements VisualAppearance {
  color = 0xffffff;
  opacity = 1;
  ambientColor: number | null = null;
  fillingStyle: "solid" | "wireframe" = "solid";
  shadingStyle: "smooth" | "flat" = "smooth";
  specularHighlightColor = 0x000000;
  emissiveColor = 0x000000;
  specularHighlightExponent = 0;
  isEthereal = false;

  clone(): SingleAppearance {
    const copy = new SingleAppearance();
    Object.assign(copy, this);
    return copy;
  }

  toThreeMaterial(side: THREE.Side = THREE.FrontSide): THREE.Material {
    return new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.emissiveColor,
      specular: this.specularHighlightColor,
      shininess: this.specularHighlightExponent,
      opacity: this.opacity,
      transparent: this.opacity < 1 || this.isEthereal,
      wireframe: this.fillingStyle === "wireframe",
      flatShading: this.shadingStyle === "flat",
      side,
      depthWrite: !this.isEthereal,
    });
  }
}

export class TexturedAppearance extends SingleAppearance {
  texture: THREE.Texture | null = null;
  diffuseColorTexture: THREE.Texture | null = null;
  bumpTexture: THREE.Texture | null = null;
  textureId = -1;
  isDiffuseColorTextureAlphaBlended = false;
  isDiffuseColorTextureClamped = false;

  override clone(): TexturedAppearance {
    const copy = new TexturedAppearance();
    Object.assign(copy, this);
    return copy;
  }

  setDiffuseColorTextureAlphaBlended(isDiffuseColorTextureAlphaBlended: boolean): void {
    this.isDiffuseColorTextureAlphaBlended = isDiffuseColorTextureAlphaBlended;
  }

  setDiffuseColorTextureClamped(isDiffuseColorTextureClamped: boolean): void {
    this.isDiffuseColorTextureClamped = isDiffuseColorTextureClamped;
  }

  setDiffuseColorTexture(diffuseColorTexture: THREE.Texture | null): void {
    this.diffuseColorTexture = diffuseColorTexture;
  }

  setDiffuseColorTextureAndInferAlphaBlend(diffuseColorTexture: THREE.Texture | null): void {
    this.diffuseColorTexture = diffuseColorTexture;
    const inferredAlphaBlend = diffuseColorTexture
      ? ((diffuseColorTexture.userData?.isPotentiallyAlphaBlended as boolean | undefined)
          ?? (diffuseColorTexture.format === THREE.RGBAFormat || diffuseColorTexture.format === THREE.AlphaFormat))
      : false;
    this.isDiffuseColorTextureAlphaBlended = inferredAlphaBlend;
  }

  setBumpTexture(bumpTexture: THREE.Texture | null): void {
    this.bumpTexture = bumpTexture;
  }

  override toThreeMaterial(side: THREE.Side = THREE.FrontSide): THREE.Material {
    const material = super.toThreeMaterial(side) as THREE.MeshPhongMaterial;
    const texture = this.diffuseColorTexture ?? this.texture;
    if (texture) {
      texture.wrapS = this.isDiffuseColorTextureClamped
        ? THREE.ClampToEdgeWrapping
        : THREE.RepeatWrapping;
      texture.wrapT = texture.wrapS;
      material.map = texture;
    }
    if (this.bumpTexture) {
      material.bumpMap = this.bumpTexture;
    }
    material.transparent = this.isDiffuseColorTextureAlphaBlended || material.transparent;
    return material;
  }
}

export class Visual extends Component {
  readonly geometries: Geometry[] = [];
  frontFacingAppearance: SingleAppearance | TexturedAppearance = new SingleAppearance();
  backFacingAppearance: SingleAppearance | TexturedAppearance | null = null;
  readonly appearance = this.frontFacingAppearance;
  readonly geometryScale = new THREE.Vector3(1, 1, 1);
  isShowing = true;
  isPickable = true;

  addGeometry(geometry: Geometry): void {
    this.geometries.push(geometry);
  }

  clearGeometries(): void {
    this.geometries.length = 0;
  }

  setGeometryScale(x: number, y: number, z: number): this {
    this.geometryScale.set(x, y, z);
    return this;
  }

  get bounds(): GeometryBounds | null {
    const bounds = combineBounds(this.geometries.map((geometry) => geometry.bounds));
    if (!bounds) {
      return null;
    }
    const scaleMatrix = new THREE.Matrix4().makeScale(
      this.geometryScale.x,
      this.geometryScale.y,
      this.geometryScale.z,
    );
    return transformedBounds(bounds, scaleMatrix);
  }

  protected createMesh(geometry: Geometry): THREE.Object3D {
    const threeGeometry = geometry.toThreeGeometry();
    if (this.backFacingAppearance) {
      const group = new THREE.Group();
      const front = new THREE.Mesh(
        threeGeometry,
        this.frontFacingAppearance.toThreeMaterial(THREE.FrontSide),
      );
      const back = new THREE.Mesh(
        threeGeometry.clone(),
        this.backFacingAppearance.toThreeMaterial(THREE.BackSide),
      );
      front.scale.copy(this.geometryScale);
      back.scale.copy(this.geometryScale);
      front.visible = this.isShowing && this.frontFacingAppearance.visible;
      back.visible = this.isShowing && this.backFacingAppearance.visible;
      group.add(front, back);
      return group;
    }
    const mesh = new THREE.Mesh(
      threeGeometry,
      this.frontFacingAppearance.toThreeMaterial(THREE.FrontSide),
    );
    mesh.scale.copy(this.geometryScale);
    mesh.visible = this.isShowing && this.frontFacingAppearance.visible;
    return mesh;
  }

  override toThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = this.name;
    for (const geometry of this.geometries) {
      group.add(this.createMesh(geometry));
    }
    return group;
  }
}

export class TextVisual extends Visual {
  constructor(
    name: string,
    public text = "",
    public fontSize = 1,
    public fontFamily = "sans-serif",
    public padding = 0.1,
  ) {
    super(name);
  }

  private textSize(): { width: number; height: number } {
    return {
      width: Math.max(this.fontSize * 0.6 * this.text.length, this.fontSize * 0.5),
      height: this.fontSize * 1.2,
    };
  }

  override get bounds(): GeometryBounds {
    const size = this.textSize();
    return {
      min: new THREE.Vector3(-size.width / 2 - this.padding, -size.height / 2 - this.padding, 0),
      max: new THREE.Vector3(size.width / 2 + this.padding, size.height / 2 + this.padding, 0),
    };
  }

  override toThreeObject(): THREE.Object3D {
    const size = this.textSize();
    const geometry = new THREE.PlaneGeometry(size.width + this.padding * 2, size.height + this.padding * 2);
    const mesh = new THREE.Mesh(
      geometry,
      this.frontFacingAppearance.toThreeMaterial(THREE.DoubleSide),
    );
    mesh.visible = this.isShowing && this.frontFacingAppearance.visible;
    const group = new THREE.Group();
    group.name = this.name;
    group.add(mesh);
    return group;
  }
}

export class Model extends Transformable {
  readonly visual: Visual;

  constructor(name: string, visual?: Visual) {
    super(name);
    this.visual = visual ?? new Visual(`${name}.visual`);
    this.add(this.visual);
  }
}

export class Background {
  constructor(public color = 0xffffff) {}
}

export abstract class Light extends Transformable {
  constructor(
    name: string,
    public color = 0xffffff,
    public brightness = 1,
  ) {
    super(name);
  }

  abstract override toThreeObject(): THREE.Object3D;
}

export class AmbientLight extends Light {
  constructor(name = "ambientLight", color = 0xffffff, brightness = 1) {
    super(name, color, brightness);
  }

  override toThreeObject(): THREE.Object3D {
    const light = new THREE.AmbientLight(this.color, this.brightness);
    light.name = this.name;
    return light;
  }
}

export class DirectionalLight extends Light {
  constructor(name = "directionalLight", color = 0xffffff, brightness = 1) {
    super(name, color, brightness);
  }

  override toThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = this.name;
    this.applyTransform(group);
    const light = new THREE.DirectionalLight(this.color, this.brightness);
    const target = new THREE.Object3D();
    target.position.set(0, 0, -1);
    light.target = target;
    group.add(light, target);
    return group;
  }
}

export class PointLight extends Light {
  constantAttenuation = 1;
  linearAttenuation = 0;
  quadraticAttenuation = 0;

  constructor(name = "pointLight", color = 0xffffff, brightness = 1) {
    super(name, color, brightness);
  }

  protected createPointLight(): THREE.PointLight {
    const decay = this.quadraticAttenuation > 0 ? 2 : this.linearAttenuation > 0 ? 1 : 0;
    return new THREE.PointLight(this.color, this.brightness, 0, decay);
  }

  override toThreeObject(): THREE.Object3D {
    const light = this.createPointLight();
    light.name = this.name;
    light.position.copy(this.position);
    return light;
  }
}

export class SpotLight extends PointLight {
  innerBeamAngle = 0.4;
  outerBeamAngle = 0.5;
  falloff = 1;

  constructor(name = "spotLight", color = 0xffffff, brightness = 1) {
    super(name, color, brightness);
  }

  override toThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    group.name = this.name;
    this.applyTransform(group);
    const light = new THREE.SpotLight(this.color, this.brightness);
    light.angle = this.outerBeamAngle;
    light.penumbra = Math.max(0, Math.min(1, 1 - this.innerBeamAngle / this.outerBeamAngle));
    light.decay = this.falloff;
    const target = new THREE.Object3D();
    target.position.set(0, 0, -1);
    light.target = target;
    group.add(light, target);
    return group;
  }
}

export abstract class AbstractCamera extends Transformable {
  background: Background | null = null;
  readonly postRenderLayers: string[] = [];

  getMovableParent(): Transformable | null {
    return this.parent instanceof Transformable ? this.parent : null;
  }

  abstract toThreeCamera(): THREE.Camera;
}

export abstract class AbstractNearPlaneAndFarPlaneCamera extends AbstractCamera {
  nearClippingPlaneDistance = 0.125;
  farClippingPlaneDistance = 256;
}

export class SymmetricPerspectiveCamera extends AbstractNearPlaneAndFarPlaneCamera {
  static readonly DEFAULT_VERTICAL_VIEW_ANGLE = 0.5;
  static readonly DEFAULT_WIDTH_TO_HEIGHT_RATIO = 16 / 9;

  verticalViewingAngle = SymmetricPerspectiveCamera.DEFAULT_VERTICAL_VIEW_ANGLE;
  horizontalViewingAngle = Number.NaN;
  widthToHeightRatio = SymmetricPerspectiveCamera.DEFAULT_WIDTH_TO_HEIGHT_RATIO;

  get effectiveVerticalViewingAngle(): number {
    return Number.isNaN(this.horizontalViewingAngle)
      ? this.verticalViewingAngle
      : 2 * Math.atan(Math.tan(this.horizontalViewingAngle / 2) / this.widthToHeightRatio);
  }

  get effectiveHorizontalViewingAngle(): number {
    return Number.isNaN(this.horizontalViewingAngle)
      ? 2 * Math.atan(Math.tan(this.verticalViewingAngle / 2) * this.widthToHeightRatio)
      : this.horizontalViewingAngle;
  }

  toThreeCamera(): THREE.PerspectiveCamera {
    const fovDegrees = THREE.MathUtils.radToDeg(this.effectiveVerticalViewingAngle);
    const camera = new THREE.PerspectiveCamera(
      fovDegrees,
      this.widthToHeightRatio,
      this.nearClippingPlaneDistance,
      this.farClippingPlaneDistance,
    );
    camera.position.copy(this.position);
    camera.quaternion.copy(this.quaternion);
    camera.scale.copy(this.scale);
    return camera;
  }
}

export class OrthographicCamera extends AbstractNearPlaneAndFarPlaneCamera {
  picturePlane = { left: -1, right: 1, top: 1, bottom: -1 };

  toThreeCamera(): THREE.OrthographicCamera {
    const camera = new THREE.OrthographicCamera(
      this.picturePlane.left,
      this.picturePlane.right,
      this.picturePlane.top,
      this.picturePlane.bottom,
      this.nearClippingPlaneDistance,
      this.farClippingPlaneDistance,
    );
    camera.position.copy(this.position);
    camera.quaternion.copy(this.quaternion);
    camera.scale.copy(this.scale);
    return camera;
  }
}

export class Scene extends Composite {
  background: Background | null = null;
  globalBrightness = 1;

  override get absoluteAffineMatrix(): AffineMatrix4x4 {
    return AffineMatrix4x4.IDENTITY;
  }

  override get absoluteMatrix(): THREE.Matrix4 {
    return new THREE.Matrix4().identity();
  }

  override get inverseAbsoluteMatrix(): THREE.Matrix4 {
    return new THREE.Matrix4().identity();
  }

  isSceneOf(other: Component): boolean {
    return other.getRoot() === this;
  }

  toThreeScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.name = this.name;
    if (this.background) {
      scene.background = new THREE.Color(this.background.color);
    }
    this.populateThreeObject(scene);
    return scene;
  }

  override toThreeObject(): THREE.Object3D {
    return this.toThreeScene();
  }
}

export interface ModelDescriptor {
  name: string;
  geometry: Geometry;
  color: number;
  position?: { x: number; y: number; z: number } | null;
  orientation?: { x: number; y: number; z: number; w: number } | null;
}

export function createModel(descriptor: ModelDescriptor): Model {
  const model = new Model(descriptor.name);
  model.visual.frontFacingAppearance.color = descriptor.color;
  model.visual.addGeometry(descriptor.geometry);
  if (descriptor.position) {
    model.setTranslation(
      descriptor.position.x,
      descriptor.position.y,
      descriptor.position.z,
    );
  }
  if (descriptor.orientation) {
    model.setQuaternion(
      descriptor.orientation.x,
      descriptor.orientation.y,
      descriptor.orientation.z,
      descriptor.orientation.w,
    );
  }
  return model;
}

export { Box as BoxGeometry, Sphere as SphereGeometry };
