import type { BoundingBox, JointId, Orientation, Position, Size, Vec3 } from "../story-api/types";
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
} from "../story-api/expanded-math";

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
    if (!box) continue;
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
    min: { x: center.x - halfWidth, y: center.y - halfHeight, z: center.z - halfDepth },
    max: { x: center.x + halfWidth, y: center.y + halfHeight, z: center.z + halfDepth },
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

export function assertFinitePositive(value: number, label: string): void {
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

  get name(): string | null { return this.#name; }
  set name(value: string | null) { this.#name = value; }

  get position(): Position { return clonePosition(this.#position); }
  set position(value: Position) {
    assertPosition(value);
    this.#position = clonePosition(value);
  }

  get orientation(): Orientation { return cloneOrientation(this.#orientation); }
  set orientation(value: Orientation) {
    assertOrientation(value);
    this.#orientation = normalizeQuaternion(value);
  }

  get parent(): EntityImp | null { return this.#parent; }
  get children(): EntityImp[] { return [...this.#children]; }

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
    return { position: this.position, orientation: this.orientation };
  }

  getWorldPosition(): Position {
    if (!this.#parent) {
      return this.position;
    }
    return addVec3(this.#parent.getWorldPosition(), rotateOffset(this.#parent.getWorldOrientation(), this.#position));
  }

  setWorldPosition(value: Position): void {
    assertPosition(value);
    if (!this.#parent) {
      this.position = value;
      return;
    }
    const parentOrientation = this.#parent.getWorldOrientation();
    this.position = rotateVector(
      quaternionConjugate(parentOrientation),
      subtractVec3(value, this.#parent.getWorldPosition()),
    );
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
    this.orientation = quaternionMultiply(quaternionConjugate(this.#parent.getWorldOrientation()), value);
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

type JointEntity = ModelImp & { readonly jointId: JointId };

export class ModelImp extends EntityImp {
  #size: Size;
  #scale: Size;
  #paint = "WHITE";
  #opacity = 1;
  #resourceId: string | null = null;
  #subMeshes: SubMesh[] = [];
  readonly #joints = new Set<JointEntity>();

  constructor(name: string | null = null, size: Size = UNIT_SIZE) {
    super(name);
    assertSize(size);
    this.#size = cloneSize(size);
    this.#scale = cloneSize(UNIT_SIZE);
  }

  get size(): Size { return cloneSize(this.#size); }
  set size(value: Size) {
    assertSize(value);
    this.#size = cloneSize(value);
  }

  get scale(): Size { return cloneSize(this.#scale); }
  set scale(value: Size) {
    assertSize(value);
    this.#scale = cloneSize(value);
  }

  get paint(): string { return this.#paint; }
  set paint(value: string) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError("paint must be a non-empty string");
    }
    this.#paint = value;
  }

  get opacity(): number { return this.#opacity; }
  set opacity(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new TypeError("opacity must be between 0 and 1");
    }
    this.#opacity = value;
  }

  get resourceId(): string | null { return this.#resourceId; }

  bindResource(resourceId: string, subMeshes: readonly SubMesh[] = []): void {
    if (typeof resourceId !== "string" || resourceId.trim().length === 0) {
      throw new TypeError("resourceId must be a non-empty string");
    }
    this.#resourceId = resourceId;
    this.#subMeshes = subMeshes.map((subMesh) => ({ name: subMesh.name, bounds: cloneBoundingBox(subMesh.bounds) }));
  }

  setSubMeshes(subMeshes: readonly SubMesh[]): void {
    this.#subMeshes = subMeshes.map((subMesh) => ({ name: subMesh.name, bounds: cloneBoundingBox(subMesh.bounds) }));
  }

  getSubMeshes(): SubMesh[] {
    return this.#subMeshes.map((subMesh) => ({ name: subMesh.name, bounds: cloneBoundingBox(subMesh.bounds) }));
  }

  registerJoint(joint: JointEntity): void { this.#joints.add(joint); }
  unregisterJoint(joint: JointEntity): void { this.#joints.delete(joint); }
  enumerateJoints(): JointEntity[] {
    return [...this.#joints].sort((left, right) => left.jointId.name.localeCompare(right.jointId.name));
  }
  findJoint(name: string): JointEntity | null {
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
    const translatedMeshes = this.#subMeshes.map((subMesh) => translateBounds(subMesh.bounds, this.getWorldPosition()));
    return unionBoundingBoxes([
      boxFromCenter(this.getWorldPosition(), this.getScaledSize()),
      ...translatedMeshes,
      ...this.enumerateJoints().map((joint) => joint.getBoundingBox()),
    ]) ?? boxFromCenter(this.getWorldPosition(), this.getScaledSize());
  }
}
