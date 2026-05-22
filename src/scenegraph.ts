import * as THREE from "three";

export interface GeometryBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface VisualAppearance {
  color: number;
  opacity: number;
  visible: boolean;
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

  get absoluteMatrix(): THREE.Matrix4 {
    return this.parent ? this.parent.absoluteMatrix.clone() : new THREE.Matrix4();
  }

  get inverseAbsoluteMatrix(): THREE.Matrix4 {
    return this.absoluteMatrix.clone().invert();
  }

  getTransformation(asSeenBy: Component | null): THREE.Matrix4 {
    if (!asSeenBy) {
      return this.absoluteMatrix;
    }
    return asSeenBy.inverseAbsoluteMatrix.multiply(this.absoluteMatrix);
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
}

export class Transformable extends Composite {
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  readonly scale = new THREE.Vector3(1, 1, 1);

  setTranslation(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }

  setQuaternion(x: number, y: number, z: number, w: number): this {
    this.quaternion.set(x, y, z, w).normalize();
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }

  get localMatrix(): THREE.Matrix4 {
    return new THREE.Matrix4().compose(this.position, this.quaternion, this.scale);
  }

  override get absoluteMatrix(): THREE.Matrix4 {
    const local = this.localMatrix;
    return this.parent ? this.parent.absoluteMatrix.clone().multiply(local) : local;
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
    return {
      min: this.#bounds.min.clone(),
      max: this.#bounds.max.clone(),
    };
  }

  markDirty(): void {
    this.#bounds = null;
  }

  abstract toThreeGeometry(): THREE.BufferGeometry;
}

export class BoxGeometry extends Geometry {
  constructor(
    public width: number,
    public height: number,
    public depth: number,
  ) {
    super("box");
  }

  protected override computeBounds(): GeometryBounds {
    return {
      min: new THREE.Vector3(-this.width / 2, -this.height / 2, -this.depth / 2),
      max: new THREE.Vector3(this.width / 2, this.height / 2, this.depth / 2),
    };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(this.width, this.height, this.depth);
  }
}

export class SphereGeometry extends Geometry {
  constructor(public radius: number) {
    super("sphere");
  }

  protected override computeBounds(): GeometryBounds {
    return {
      min: new THREE.Vector3(-this.radius, -this.radius, -this.radius),
      max: new THREE.Vector3(this.radius, this.radius, this.radius),
    };
  }

  override toThreeGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry(this.radius, 16, 16);
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
    return new THREE.PlaneGeometry(this.width, this.depth);
  }
}

export class Visual extends Component {
  readonly geometries: Geometry[] = [];
  readonly appearance: VisualAppearance = {
    color: 0xffffff,
    opacity: 1,
    visible: true,
  };

  addGeometry(geometry: Geometry): void {
    this.geometries.push(geometry);
  }

  clearGeometries(): void {
    this.geometries.length = 0;
  }

  get bounds(): GeometryBounds | null {
    if (this.geometries.length === 0) {
      return null;
    }
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const geometry of this.geometries) {
      const bounds = geometry.bounds;
      min.min(bounds.min);
      max.max(bounds.max);
    }
    return { min, max };
  }

  toThreeObject(): THREE.Group {
    const group = new THREE.Group();
    group.name = this.name;
    for (const geometry of this.geometries) {
      const mesh = new THREE.Mesh(
        geometry.toThreeGeometry(),
        new THREE.MeshLambertMaterial({
          color: this.appearance.color,
          opacity: this.appearance.opacity,
          transparent: this.appearance.opacity < 1,
        }),
      );
      mesh.visible = this.appearance.visible;
      group.add(mesh);
    }
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

  override get absoluteMatrix(): THREE.Matrix4 {
    return super.absoluteMatrix;
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
  model.visual.appearance.color = descriptor.color;
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
