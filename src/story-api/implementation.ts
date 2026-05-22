import type { JointId, JointNode, Orientation, Position, Size } from "./types";

export interface SceneLifecycleHost {
  readonly isActive: boolean;
}

export interface PropertyChange<T> {
  readonly property: Property<T>;
  readonly previousValue: T;
  readonly value: T;
}

export type PropertyListener<T> = (change: PropertyChange<T>) => void;
export type ActivationListener = (imp: EntityImp, isActive: boolean) => void;
export type BindingSyncDirection = "self" | "other" | "none";

export interface PropertyOptions<T> {
  validate?: (value: T) => boolean;
  clone?: (value: T) => T;
  equals?: (left: T, right: T) => boolean;
}

export interface ImplementableEntity {
  readonly imp: EntityImp;
}

export interface EntityMarker {
  readonly position?: Position;
  readonly orientation?: Orientation;
  readonly size?: Size;
}

const identityClone = <T>(value: T): T => value;

export class Property<T> {
  private readonly _listeners = new Set<PropertyListener<T>>();
  private readonly _bindings = new Set<Property<T>>();
  private _value: T;
  private readonly _validate: (value: T) => boolean;
  private readonly _clone: (value: T) => T;
  private readonly _equals: (left: T, right: T) => boolean;

  constructor(
    private readonly _owner: EntityImp,
    private readonly _name: string,
    initialValue: T,
    options: PropertyOptions<T> = {},
  ) {
    this._validate = options.validate ?? (() => true);
    this._clone = options.clone ?? identityClone;
    this._equals = options.equals ?? Object.is;
    this._value = this._clone(initialValue);
  }

  get owner(): EntityImp {
    return this._owner;
  }

  get name(): string {
    return this._name;
  }

  get value(): T {
    return this._clone(this._value);
  }

  set value(nextValue: T) {
    this.setValue(nextValue);
  }

  addListener(listener: PropertyListener<T>): void {
    this._listeners.add(listener);
  }

  removeListener(listener: PropertyListener<T>): void {
    this._listeners.delete(listener);
  }

  bindBidirectional(other: Property<T>, initialSync: BindingSyncDirection = "self"): void {
    if (other === this || this._bindings.has(other)) {
      return;
    }
    this._bindings.add(other);
    other._bindings.add(this);

    if (initialSync === "self") {
      other._commit(this._clone(this._value), true, new Set([this]));
    } else if (initialSync === "other") {
      this._commit(other.value, true, new Set([other]));
    }
  }

  unbindBidirectional(other: Property<T>): void {
    this._bindings.delete(other);
    other._bindings.delete(this);
  }

  isBoundTo(other: Property<T>): boolean {
    return this._bindings.has(other);
  }

  setValue(nextValue: T): boolean {
    return this._commit(nextValue, true, new Set());
  }

  setValueSilently(nextValue: T): boolean {
    return this._commit(nextValue, false, new Set());
  }

  private _commit(nextValue: T, notify: boolean, visited: Set<Property<unknown>>): boolean {
    if (visited.has(this)) {
      return false;
    }
    visited.add(this);

    if (!this._validate(nextValue)) {
      return false;
    }

    const normalizedNextValue = this._clone(nextValue);
    const previousValue = this._clone(this._value);
    const changed = !this._equals(this._value, normalizedNextValue);

    if (changed) {
      this._value = normalizedNextValue;
      if (notify) {
        const change: PropertyChange<T> = {
          property: this,
          previousValue,
          value: this._clone(normalizedNextValue),
        };
        for (const listener of this._listeners) {
          listener(change);
        }
      }
    }

    let propagated = false;
    for (const binding of this._bindings) {
      propagated = binding._commit(this._clone(normalizedNextValue), notify, visited) || propagated;
    }

    return changed || propagated;
  }
}

export class EntityImp {
  private readonly _properties = new Map<string, Property<unknown>>();
  private readonly _activationListeners = new Set<ActivationListener>();
  private readonly _children = new Set<EntityImp>();
  private _scene: SceneLifecycleHost | null = null;
  private _vehicle: EntityImp | null = null;
  private _isActive = false;

  constructor(private readonly _owner: ImplementableEntity) {}

  get owner(): ImplementableEntity {
    return this._owner;
  }

  get scene(): SceneLifecycleHost | null {
    return this._scene ?? this._vehicle?.scene ?? null;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get vehicle(): EntityImp | null {
    return this._vehicle;
  }

  get properties(): ReadonlyMap<string, Property<unknown>> {
    return this._properties;
  }

  createProperty<T>(name: string, initialValue: T, options: PropertyOptions<T> = {}): Property<T> {
    if (this._properties.has(name)) {
      throw new TypeError(`property "${name}" already exists`);
    }

    const property = new Property<T>(this, name, initialValue, options);
    this._properties.set(name, property as Property<unknown>);
    return property;
  }

  getProperty<T>(name: string): Property<T> | undefined {
    return this._properties.get(name) as Property<T> | undefined;
  }

  bindProperty<T>(name: string, other: EntityImp, otherName: string, initialSync: BindingSyncDirection = "self"): boolean {
    const property = this.getProperty<T>(name);
    const otherProperty = other.getProperty<T>(otherName);
    if (!property || !otherProperty) {
      return false;
    }
    property.bindBidirectional(otherProperty, initialSync);
    return true;
  }

  unbindProperty<T>(name: string, other: EntityImp, otherName: string): boolean {
    const property = this.getProperty<T>(name);
    const otherProperty = other.getProperty<T>(otherName);
    if (!property || !otherProperty) {
      return false;
    }
    property.unbindBidirectional(otherProperty);
    return true;
  }

  addActivationListener(listener: ActivationListener): void {
    this._activationListeners.add(listener);
  }

  removeActivationListener(listener: ActivationListener): void {
    this._activationListeners.delete(listener);
  }

  attachToScene(scene: SceneLifecycleHost): void {
    this._scene = scene;
    if (scene.isActive) {
      this.activate();
    }
  }

  detachFromScene(): void {
    this.deactivate();
    this._scene = null;
  }

  activate(): void {
    if (this._isActive) {
      return;
    }

    this._isActive = true;
    this._fireActivationChanged();

    for (const child of this._children) {
      child.activate();
    }
  }

  deactivate(): void {
    if (!this._isActive) {
      return;
    }

    for (const child of this._children) {
      child.deactivate();
    }

    this._isActive = false;
    this._fireActivationChanged();
  }

  setVehicle(vehicle: EntityImp | null): void {
    if (vehicle === this) {
      throw new TypeError("entity cannot be its own vehicle");
    }
    if (vehicle && vehicle.isDescendantOf(this)) {
      throw new TypeError("vehicle assignment would create a cycle");
    }
    if (this._vehicle === vehicle) {
      return;
    }

    this._vehicle?._children.delete(this);
    this._vehicle = vehicle;
    vehicle?._children.add(this);

    if (vehicle?.scene) {
      this._scene = vehicle.scene;
    }

    if (vehicle?.isActive) {
      this.activate();
    }
  }

  isDescendantOf(candidateAncestor: EntityImp): boolean {
    let current = this._vehicle;
    while (current) {
      if (current === candidateAncestor) {
        return true;
      }
      current = current._vehicle;
    }
    return false;
  }

  createMarker(): EntityMarker {
    const marker: EntityMarker = {};
    const position = this.getProperty<Position>("position");
    const orientation = this.getProperty<Orientation>("orientation");
    const size = this.getProperty<Size>("size");

    return {
      ...(position ? { position: position.value } : {}),
      ...(orientation ? { orientation: orientation.value } : {}),
      ...(size ? { size: size.value } : {}),
    };
  }

  applyMarker(marker: EntityMarker): void {
    if (marker.position) {
      this.getProperty<Position>("position")?.setValue(marker.position);
    }
    if (marker.orientation) {
      this.getProperty<Orientation>("orientation")?.setValue(marker.orientation);
    }
    if (marker.size) {
      this.getProperty<Size>("size")?.setValue(marker.size);
    }
  }

  private _fireActivationChanged(): void {
    for (const listener of this._activationListeners) {
      listener(this, this._isActive);
    }
  }
}

export class JointedModelImp extends EntityImp {
  private readonly _jointIds = new Map<string, JointId>();
  private _jointHierarchy: JointNode[] = [];

  setJointHierarchy(jointHierarchy: JointNode[]): void {
    this._jointIds.clear();
    this._jointHierarchy = cloneJointHierarchy(jointHierarchy);

    const visit = (node: JointNode): void => {
      this._jointIds.set(node.name.toUpperCase(), {
        name: node.name,
        ...(node.parentName ? { parent: node.parentName } : {}),
      });
      for (const child of node.children) {
        visit(child);
      }
    };

    for (const root of this._jointHierarchy) {
      visit(root);
    }
  }

  getJoint(name: string): JointId | undefined {
    const joint = this._jointIds.get(name.toUpperCase());
    return joint ? { ...joint } : undefined;
  }

  get jointHierarchy(): JointNode[] {
    return cloneJointHierarchy(this._jointHierarchy);
  }
}

function cloneJointHierarchy(joints: JointNode[]): JointNode[] {
  return joints.map((joint) => ({
    name: joint.name,
    parentName: joint.parentName,
    children: cloneJointHierarchy(joint.children),
    localTransform: {
      position: { ...joint.localTransform.position },
      orientation: { ...joint.localTransform.orientation },
    },
  }));
}
