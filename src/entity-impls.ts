import type { BoundingBox, JointId, Orientation, Position, Size, Vec3 } from "./story-api/types";
import {
  IDENTITY_ORIENTATION,
  UNIT_SIZE,
  ZERO_POSITION,
  addVec3,
  cloneOrientation,
  clonePosition,
  cloneSize,
  distanceBetween,
  isFiniteOrientation,
  isFinitePosition,
  isFiniteSize,
  normalizeQuaternion,
  quaternionConjugate,
  quaternionMultiply,
  rotateVector,
  subtractVec3,
} from "./story-api/expanded-math";

export interface TransformSnapshot {
  readonly position: Position;
  readonly orientation: Orientation;
}

export interface SubMesh {
  readonly name: string;
  readonly bounds: BoundingBox;
}

function cloneBoundingBox(bounds: BoundingBox): BoundingBox {
  return {
    min: clonePosition(bounds.min),
    max: clonePosition(bounds.max),
  };
}

function unionBoundingBoxes(boxes: readonly (BoundingBox | null | undefined)[]): BoundingBox | null {
  let current: BoundingBox | null = null;
  for (const box of boxes) {
    if (!box) {
      continue;
    }
    if (!current) {
      current = cloneBoundingBox(box);
      continue;
    }
    current = {
      min: {
        x: Math.min(current.min.x, box.min.x),
        y: Math.min(current.min.y, box.min.y),
        z: Math.min(current.min.z, box.min.z),
      },
      max: {
        x: Math.max(current.max.x, box.max.x),
        y: Math.max(current.max.y, box.max.y),
        z: Math.max(current.max.z, box.max.z),
      },
    };
  }
  return current;
}

function boxFromCenter(center: Position, size: Size): BoundingBox {
  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;
  const halfDepth = size.depth / 2;
  return {
    min: {
      x: center.x - halfWidth,
      y: center.y - halfHeight,
      z: center.z - halfDepth,
    },
    max: {
      x: center.x + halfWidth,
      y: center.y + halfHeight,
      z: center.z + halfDepth,
    },
  };
}

function rotateOffset(orientation: Orientation, value: Vec3): Vec3 {
  const magnitude = Math.hypot(value.x, value.y, value.z);
  if (magnitude === 0) {
    return ZERO_POSITION;
  }
  const rotated = rotateVector(orientation, {
    x: value.x / magnitude,
    y: value.y / magnitude,
    z: value.z / magnitude,
  });
  return {
    x: rotated.x * magnitude,
    y: rotated.y * magnitude,
    z: rotated.z * magnitude,
  };
}

function translateBounds(bounds: BoundingBox, delta: Position): BoundingBox {
  return {
    min: addVec3(bounds.min, delta),
    max: addVec3(bounds.max, delta),
  };
}

function assertPosition(value: Position): void {
  if (!isFinitePosition(value)) {
    throw new TypeError("position must contain finite coordinates");
  }
}

function assertOrientation(value: Orientation): void {
  if (!isFiniteOrientation(value)) {
    throw new TypeError("orientation must contain finite components");
  }
}

function assertSize(value: Size): void {
  if (!isFiniteSize(value) || value.width <= 0 || value.height <= 0 || value.depth <= 0) {
    throw new TypeError("size must contain positive finite dimensions");
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive finite number`);
  }
}

export class EntityImp {
  #name: string | null;
  #position: Position;
  #orientation: Orientation;
  #parent: EntityImp | null = null;
  readonly #children = new Set<EntityImp>();

  constructor(name: string | null = null) {
    this.#name = name;
    this.#position = clonePosition(ZERO_POSITION);
    this.#orientation = cloneOrientation(IDENTITY_ORIENTATION);
  }

  get name(): string | null {
    return this.#name;
  }

  set name(value: string | null) {
    this.#name = value;
  }

  get position(): Position {
    return clonePosition(this.#position);
  }

  set position(value: Position) {
    assertPosition(value);
    this.#position = clonePosition(value);
  }

  get orientation(): Orientation {
    return cloneOrientation(this.#orientation);
  }

  set orientation(value: Orientation) {
    assertOrientation(value);
    this.#orientation = normalizeQuaternion(value);
  }

  get parent(): EntityImp | null {
    return this.#parent;
  }

  get children(): EntityImp[] {
    return [...this.#children];
  }

  setParent(parent: EntityImp | null): void {
    if (parent === this) {
      throw new TypeError("entity cannot parent itself");
    }
    let current = parent;
    while (current) {
      if (current === this) {
        throw new TypeError("parent assignment would create a cycle");
      }
      current = current.parent;
    }
    if (this.#parent === parent) {
      return;
    }
    if (this.#parent) {
      this.#parent.#children.delete(this);
    }
    this.#parent = parent;
    if (parent) {
      parent.#children.add(this);
    }
  }

  getLocalTransform(): TransformSnapshot {
    return {
      position: this.position,
      orientation: this.orientation,
    };
  }

  getWorldPosition(): Position {
    if (!this.#parent) {
      return this.position;
    }
    return addVec3(
      this.#parent.getWorldPosition(),
      rotateOffset(this.#parent.getWorldOrientation(), this.#position),
    );
  }

  setWorldPosition(value: Position): void {
    assertPosition(value);
    if (!this.#parent) {
      this.position = value;
      return;
    }
    const parentOrientation = this.#parent.getWorldOrientation();
    const relative = rotateVector(
      quaternionConjugate(parentOrientation),
      subtractVec3(value, this.#parent.getWorldPosition()),
    );
    this.position = relative;
  }

  getWorldOrientation(): Orientation {
    if (!this.#parent) {
      return this.orientation;
    }
    return quaternionMultiply(this.#parent.getWorldOrientation(), this.#orientation);
  }

  setWorldOrientation(value: Orientation): void {
    assertOrientation(value);
    if (!this.#parent) {
      this.orientation = value;
      return;
    }
    this.orientation = quaternionMultiply(
      quaternionConjugate(this.#parent.getWorldOrientation()),
      value,
    );
  }

  translate(delta: Vec3): void {
    assertPosition(delta);
    this.position = addVec3(this.#position, delta);
  }

  moveToward(target: EntityImp | Position, amount: number): void {
    assertFinitePositive(Math.abs(amount), "amount");
    const destination = target instanceof EntityImp ? target.getWorldPosition() : target;
    const delta = subtractVec3(destination, this.getWorldPosition());
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    if (distance === 0) {
      return;
    }
    const scale = amount / distance;
    this.setWorldPosition(addVec3(this.getWorldPosition(), {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    }));
  }

  distanceTo(target: EntityImp | Position): number {
    const destination = target instanceof EntityImp ? target.getWorldPosition() : target;
    return distanceBetween(this.getWorldPosition(), destination);
  }

  getBoundingBox(): BoundingBox | null {
    return null;
  }
}

export class ModelImp extends EntityImp {
  #size: Size;
  #scale: Size;
  #paint = "WHITE";
  #opacity = 1;
  #resourceId: string | null = null;
  #subMeshes: SubMesh[] = [];
  readonly #joints = new Set<JointImp>();

  constructor(name: string | null = null, size: Size = UNIT_SIZE) {
    super(name);
    assertSize(size);
    this.#size = cloneSize(size);
    this.#scale = cloneSize(UNIT_SIZE);
  }

  get size(): Size {
    return cloneSize(this.#size);
  }

  set size(value: Size) {
    assertSize(value);
    this.#size = cloneSize(value);
  }

  get scale(): Size {
    return cloneSize(this.#scale);
  }

  set scale(value: Size) {
    assertSize(value);
    this.#scale = cloneSize(value);
  }

  get paint(): string {
    return this.#paint;
  }

  set paint(value: string) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError("paint must be a non-empty string");
    }
    this.#paint = value;
  }

  get opacity(): number {
    return this.#opacity;
  }

  set opacity(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new TypeError("opacity must be between 0 and 1");
    }
    this.#opacity = value;
  }

  get resourceId(): string | null {
    return this.#resourceId;
  }

  bindResource(resourceId: string, subMeshes: readonly SubMesh[] = []): void {
    if (typeof resourceId !== "string" || resourceId.trim().length === 0) {
      throw new TypeError("resourceId must be a non-empty string");
    }
    this.#resourceId = resourceId;
    this.#subMeshes = subMeshes.map((subMesh) => ({
      name: subMesh.name,
      bounds: cloneBoundingBox(subMesh.bounds),
    }));
  }

  setSubMeshes(subMeshes: readonly SubMesh[]): void {
    this.#subMeshes = subMeshes.map((subMesh) => ({
      name: subMesh.name,
      bounds: cloneBoundingBox(subMesh.bounds),
    }));
  }

  getSubMeshes(): SubMesh[] {
    return this.#subMeshes.map((subMesh) => ({
      name: subMesh.name,
      bounds: cloneBoundingBox(subMesh.bounds),
    }));
  }

  registerJoint(joint: JointImp): void {
    this.#joints.add(joint);
  }

  unregisterJoint(joint: JointImp): void {
    this.#joints.delete(joint);
  }

  enumerateJoints(): JointImp[] {
    return [...this.#joints].sort((left, right) => left.jointId.name.localeCompare(right.jointId.name));
  }

  findJoint(name: string): JointImp | null {
    return this.enumerateJoints().find((joint) => joint.jointId.name === name) ?? null;
  }

  getScaledSize(): Size {
    return {
      width: this.#size.width * this.#scale.width,
      height: this.#size.height * this.#scale.height,
      depth: this.#size.depth * this.#scale.depth,
    };
  }

  override getBoundingBox(): BoundingBox {
    const translatedMeshes = this.#subMeshes.map((subMesh) =>
      translateBounds(subMesh.bounds, this.getWorldPosition()),
    );
    return unionBoundingBoxes([
      boxFromCenter(this.getWorldPosition(), this.getScaledSize()),
      ...translatedMeshes,
      ...this.enumerateJoints().map((joint) => joint.getBoundingBox()),
    ]) ?? boxFromCenter(this.getWorldPosition(), this.getScaledSize());
  }
}

export class BoxImp extends ModelImp {
  get width(): number {
    return this.size.width;
  }

  set width(value: number) {
    assertFinitePositive(value, "width");
    this.size = { ...this.size, width: value };
  }

  get height(): number {
    return this.size.height;
  }

  set height(value: number) {
    assertFinitePositive(value, "height");
    this.size = { ...this.size, height: value };
  }

  get depth(): number {
    return this.size.depth;
  }

  set depth(value: number) {
    assertFinitePositive(value, "depth");
    this.size = { ...this.size, depth: value };
  }
}

export class SphereImp extends ModelImp {
  #radius = 0.5;

  constructor(name: string | null = null, radius = 0.5) {
    super(name, { width: radius * 2, height: radius * 2, depth: radius * 2 });
    this.radius = radius;
  }

  get radius(): number {
    return this.#radius;
  }

  set radius(value: number) {
    assertFinitePositive(value, "radius");
    this.#radius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: diameter, depth: diameter };
  }
}

export class CylinderImp extends ModelImp {
  #radius = 0.5;
  #length = 1;

  constructor(name: string | null = null, radius = 0.5, length = 1) {
    super(name);
    this.radius = radius;
    this.length = length;
  }

  get radius(): number {
    return this.#radius;
  }

  set radius(value: number) {
    assertFinitePositive(value, "radius");
    this.#radius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: this.#length, depth: diameter };
  }

  get length(): number {
    return this.#length;
  }

  set length(value: number) {
    assertFinitePositive(value, "length");
    this.#length = value;
    const diameter = this.#radius * 2;
    this.size = { width: diameter, height: value, depth: diameter };
  }
}

export class ConeImp extends ModelImp {
  #baseRadius = 0.5;
  #length = 1;

  constructor(name: string | null = null, baseRadius = 0.5, length = 1) {
    super(name);
    this.baseRadius = baseRadius;
    this.length = length;
  }

  get baseRadius(): number {
    return this.#baseRadius;
  }

  set baseRadius(value: number) {
    assertFinitePositive(value, "baseRadius");
    this.#baseRadius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: this.#length, depth: diameter };
  }

  get length(): number {
    return this.#length;
  }

  set length(value: number) {
    assertFinitePositive(value, "length");
    this.#length = value;
    const diameter = this.#baseRadius * 2;
    this.size = { width: diameter, height: value, depth: diameter };
  }
}

export class TorusImp extends ModelImp {
  #innerRadius = 0.25;
  #outerRadius = 0.5;

  constructor(name: string | null = null, innerRadius = 0.25, outerRadius = 0.5) {
    super(name);
    assertFinitePositive(innerRadius, "innerRadius");
    assertFinitePositive(outerRadius, "outerRadius");
    if (innerRadius >= outerRadius) {
      throw new TypeError("innerRadius must be smaller than outerRadius");
    }
    this.#innerRadius = innerRadius;
    this.#outerRadius = outerRadius;
    this.#syncSize();
  }

  get innerRadius(): number {
    return this.#innerRadius;
  }

  set innerRadius(value: number) {
    assertFinitePositive(value, "innerRadius");
    if (value >= this.#outerRadius) {
      throw new TypeError("innerRadius must be smaller than outerRadius");
    }
    this.#innerRadius = value;
    this.#syncSize();
  }

  get outerRadius(): number {
    return this.#outerRadius;
  }

  set outerRadius(value: number) {
    assertFinitePositive(value, "outerRadius");
    if (value <= this.#innerRadius) {
      throw new TypeError("outerRadius must be larger than innerRadius");
    }
    this.#outerRadius = value;
    this.#syncSize();
  }

  #syncSize(): void {
    const tubeRadius = (this.#outerRadius - this.#innerRadius) / 2;
    const diameter = this.#outerRadius * 2;
    this.size = {
      width: diameter,
      height: Math.max(tubeRadius * 2, 0.01),
      depth: diameter,
    };
  }
}

export class MarkerImp extends ModelImp {
  readonly #defaultSize: Size;

  constructor(name: string | null = null, size: Size = { width: 0.2, height: 0.2, depth: 0.2 }) {
    super(name, size);
    this.#defaultSize = cloneSize(size);
    this.paint = "YELLOW";
    this.opacity = 0.75;
  }

  capture(entity: EntityImp): void {
    this.setWorldPosition(entity.getWorldPosition());
    this.setWorldOrientation(entity.getWorldOrientation());
    if (entity instanceof ModelImp) {
      this.size = entity.getScaledSize();
      this.paint = entity.paint;
      this.opacity = entity.opacity;
    } else {
      this.size = this.#defaultSize;
    }
  }

  applyTo(entity: EntityImp): void {
    entity.setWorldPosition(this.getWorldPosition());
    entity.setWorldOrientation(this.getWorldOrientation());
    if (entity instanceof ModelImp) {
      entity.size = this.size;
      entity.paint = this.paint;
      entity.opacity = this.opacity;
    }
  }
}

export class JointImp extends ModelImp {
  readonly #jointId: JointId;
  #jointParent: JointImp | ModelImp | null = null;
  readonly #jointChildren = new Set<JointImp>();

  constructor(jointId: string | JointId, name: string | null = null) {
    const resolvedJointId = typeof jointId === "string" ? { name: jointId } : { ...jointId };
    super(name ?? resolvedJointId.name, { width: 0.15, height: 0.15, depth: 0.15 });
    this.#jointId = resolvedJointId;
  }

  get jointId(): JointId {
    return { ...this.#jointId };
  }

  get jointParent(): JointImp | ModelImp | null {
    return this.#jointParent;
  }

  get jointChildren(): JointImp[] {
    return [...this.#jointChildren].sort((left, right) => left.jointId.name.localeCompare(right.jointId.name));
  }

  setJointParent(parent: JointImp | ModelImp | null): void {
    if (parent === this) {
      throw new TypeError("joint cannot parent itself");
    }
    let current: JointImp | ModelImp | null = parent;
    while (current instanceof JointImp) {
      if (current === this) {
        throw new TypeError("joint assignment would create a cycle");
      }
      current = current.jointParent;
    }

    if (this.#jointParent instanceof JointImp) {
      this.#jointParent.#jointChildren.delete(this);
    } else if (this.#jointParent instanceof ModelImp) {
      this.#jointParent.unregisterJoint(this);
    }

    this.#jointParent = parent;
    if (parent instanceof JointImp) {
      parent.#jointChildren.add(this);
      parent.getModelRoot()?.registerJoint(this);
    } else if (parent instanceof ModelImp) {
      parent.registerJoint(this);
    }
    this.setParent(parent);
  }

  getModelRoot(): ModelImp | null {
    let current: JointImp | ModelImp | null = this.#jointParent;
    while (current instanceof JointImp) {
      current = current.jointParent;
    }
    return current instanceof ModelImp ? current : null;
  }

  getJointChain(): JointImp[] {
    const chain: JointImp[] = [this];
    let current = this.#jointParent;
    while (current instanceof JointImp) {
      chain.unshift(current);
      current = current.jointParent;
    }
    return chain;
  }

  enumerateSubtree(): JointImp[] {
    return [this, ...this.jointChildren.flatMap((child) => child.enumerateSubtree())];
  }
}

export class ModelJointImp extends JointImp {}
export class ObjectMarkerImp extends MarkerImp {}
