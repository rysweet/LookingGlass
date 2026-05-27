import {
  IDENTITY_ORIENTATION,
  ZERO_POSITION,
  addVec3,
  distanceBetween,
  quaternionConjugate,
  quaternionMultiply,
  subtractVec3,
} from "./expanded-math";
import type { BoundingBox, Orientation, Position, Size } from "./expanded-types";
import {
  BooleanProperty,
  Property,
  type PropertyOptions,
  PropertyOwnerImp,
  ReferenceProperty,
  StringProperty,
  type ActivationListener,
  type BindingSyncDirection,
  type EntityMarker,
  type ImplementableEntity,
  type SceneLifecycleHost,
} from "./expanded-implementation-properties";
import type { ProgramImp } from "./expanded-implementation-entities-scene";

const nonEmptyString = (value: string): boolean => typeof value === "string" && value.trim().length > 0;

export class EntityImp extends PropertyOwnerImp {
  readonly #properties = new Map<string, Property<unknown>>();
  readonly #activationListeners = new Set<ActivationListener>();
  readonly #children = new Set<EntityImp>();
  #scene: SceneLifecycleHost | null = null;
  #vehicle: EntityImp | null = null;
  #isActive = false;

  readonly nameProperty = this.registerProperty(new StringProperty<string | null>(this, "name", null, true));
  readonly isShowingProperty = this.registerProperty(new BooleanProperty(this, "isShowing", true));
  readonly vehicleProperty = this.registerProperty(new ReferenceProperty<EntityImp | null>(this, "vehicle", null));

  constructor(readonly owner: ImplementableEntity) {
    super();
  }

  protected registerProperty<T>(property: Property<T>): Property<T> {
    if (this.#properties.has(property.name)) {
      throw new TypeError(`property "${property.name}" already exists`);
    }
    this.#properties.set(property.name, property as Property<unknown>);
    return property;
  }

  createProperty<T>(name: string, initialValue: T, options: PropertyOptions<T> = {}): Property<T> {
    return this.registerProperty(new Property<T>(this, name, initialValue, options));
  }

  get properties(): ReadonlyMap<string, Property<unknown>> {
    return this.#properties;
  }

  getProperty<T>(name: string): Property<T> | undefined {
    return this.#properties.get(name) as Property<T> | undefined;
  }

  get scene(): SceneLifecycleHost | null {
    return this.#scene ?? this.#vehicle?.scene ?? null;
  }

  override get program(): ProgramImp | null {
    return this.scene?.program ?? this.#vehicle?.program ?? null;
  }

  get isActive(): boolean {
    return this.#isActive;
  }

  get vehicle(): EntityImp | null {
    return this.#vehicle;
  }

  get name(): string | null {
    return this.nameProperty.value;
  }

  set name(value: string | null) {
    if (value === null || nonEmptyString(value)) {
      this.nameProperty.setValue(value);
    }
  }

  addActivationListener(listener: ActivationListener): void {
    this.#activationListeners.add(listener);
  }

  removeActivationListener(listener: ActivationListener): void {
    this.#activationListeners.delete(listener);
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

  attachToScene(scene: SceneLifecycleHost): void {
    this.#scene = scene;
    if (scene.isActive) {
      this.activate();
    }
  }

  detachFromScene(): void {
    this.deactivate();
    this.#scene = null;
  }

  activate(): void {
    if (this.#isActive) {
      return;
    }
    this.#isActive = true;
    this.#fireActivationChanged();
    for (const child of this.#children) {
      child.activate();
    }
  }

  deactivate(): void {
    if (!this.#isActive) {
      return;
    }
    for (const child of this.#children) {
      child.deactivate();
    }
    this.#isActive = false;
    this.#fireActivationChanged();
  }

  setVehicle(vehicle: EntityImp | null): void {
    if (vehicle === this) {
      throw new TypeError("entity cannot be its own vehicle");
    }
    if (vehicle && vehicle.isDescendantOf(this)) {
      throw new TypeError("vehicle assignment would create a cycle");
    }
    if (this.#vehicle === vehicle) {
      return;
    }

    if (this.#vehicle) {
      this.#vehicle.#children.delete(this);
    }
    this.#vehicle = vehicle;
    this.vehicleProperty.setValueSilently(vehicle);
    if (vehicle) {
      vehicle.#children.add(this);
    }

    if (vehicle?.scene) {
      this.#scene = vehicle.scene;
    }

    const shouldBeActive = Boolean(vehicle?.isActive || this.#scene?.isActive);
    if (shouldBeActive) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  isDescendantOf(candidateAncestor: EntityImp): boolean {
    let current = this.#vehicle;
    while (current) {
      if (current === candidateAncestor) {
        return true;
      }
      current = current.#vehicle;
    }
    return false;
  }

  getAbsolutePosition(): Position {
    const localPosition = this.getProperty<Position>("position")?.value ?? ZERO_POSITION;
    if (!this.#vehicle) {
      return localPosition;
    }
    return addVec3(this.#vehicle.getAbsolutePosition(), localPosition);
  }

  getAbsoluteOrientation(): Orientation {
    const localOrientation = this.getProperty<Orientation>("orientation")?.value ?? IDENTITY_ORIENTATION;
    if (!this.#vehicle) {
      return localOrientation;
    }
    return quaternionMultiply(this.#vehicle.getAbsoluteOrientation(), localOrientation);
  }

  setAbsolutePosition(position: Position): boolean {
    const base = this.#vehicle?.getAbsolutePosition() ?? ZERO_POSITION;
    return this.getProperty<Position>("position")?.setValue(subtractVec3(position, base)) ?? false;
  }

  setAbsoluteOrientation(orientation: Orientation): boolean {
    const parentOrientation = this.#vehicle?.getAbsoluteOrientation();
    const localOrientation = parentOrientation
      ? quaternionMultiply(quaternionConjugate(parentOrientation), orientation)
      : orientation;
    return this.getProperty<Orientation>("orientation")?.setValue(localOrientation) ?? false;
  }

  getBoundingBox(): BoundingBox | null {
    const size = this.getProperty<Size>("size")?.value;
    if (!size) {
      return null;
    }
    const center = this.getAbsolutePosition();
    return {
      min: {
        x: center.x - size.width / 2,
        y: center.y - size.height / 2,
        z: center.z - size.depth / 2,
      },
      max: {
        x: center.x + size.width / 2,
        y: center.y + size.height / 2,
        z: center.z + size.depth / 2,
      },
    };
  }

  isCollidingWith(other: EntityImp): boolean {
    const left = this.getBoundingBox();
    const right = other.getBoundingBox();
    if (!left || !right) {
      return false;
    }
    return !(
      left.max.x < right.min.x ||
      left.min.x > right.max.x ||
      left.max.y < right.min.y ||
      left.min.y > right.max.y ||
      left.max.z < right.min.z ||
      left.min.z > right.max.z
    );
  }

  getDistanceTo(other: EntityImp): number {
    return distanceBetween(this.getAbsolutePosition(), other.getAbsolutePosition());
  }

  getDistanceAbove(other: EntityImp): number {
    return this.getAbsolutePosition().y - other.getAbsolutePosition().y;
  }

  getDistanceBelow(other: EntityImp): number {
    return other.getAbsolutePosition().y - this.getAbsolutePosition().y;
  }

  getDistanceToTheRightOf(other: EntityImp): number {
    return this.getAbsolutePosition().x - other.getAbsolutePosition().x;
  }

  getDistanceToTheLeftOf(other: EntityImp): number {
    return other.getAbsolutePosition().x - this.getAbsolutePosition().x;
  }

  getDistanceInFrontOf(other: EntityImp): number {
    return other.getAbsolutePosition().z - this.getAbsolutePosition().z;
  }

  getDistanceBehind(other: EntityImp): number {
    return this.getAbsolutePosition().z - other.getAbsolutePosition().z;
  }

  createMarker(): EntityMarker {
    const position = this.getProperty<Position>("position")?.value;
    const orientation = this.getProperty<Orientation>("orientation")?.value;
    const size = this.getProperty<Size>("size")?.value;
    const scale = this.getProperty<Size>("scale")?.value;
    const paint = this.getProperty<string>("paint")?.value;
    const color = this.getProperty<string>("color")?.value;
    const opacity = this.getProperty<number>("opacity")?.value;
    return {
      ...(position ? { position } : {}),
      ...(orientation ? { orientation } : {}),
      ...(size ? { size } : {}),
      ...(scale ? { scale } : {}),
      ...(paint ? { paint } : {}),
      ...(color ? { color } : {}),
      ...(opacity !== undefined ? { opacity } : {}),
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
    if (marker.scale) {
      this.getProperty<Size>("scale")?.setValue(marker.scale);
    }
    if (marker.paint) {
      this.getProperty<string>("paint")?.setValue(marker.paint);
    }
    if (marker.color) {
      this.getProperty<string>("color")?.setValue(marker.color);
    }
    if (marker.opacity !== undefined) {
      this.getProperty<number>("opacity")?.setValue(marker.opacity);
    }
  }

  delay(duration: number): void {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("duration must be a non-negative finite number");
    }
  }

  playAudio(audioSource: string): void {
    if (!nonEmptyString(audioSource)) {
      throw new TypeError("audio source must be a non-empty string");
    }
    const property = this.getProperty<string>("lastAudioSource") ?? this.createProperty<string>("lastAudioSource", audioSource);
    property.setValue(audioSource);
  }

  getBooleanFromUser(_message: string): boolean {
    return false;
  }

  getStringFromUser(_message: string): string {
    return "";
  }

  getDoubleFromUser(_message: string): number {
    return 0;
  }

  getIntegerFromUser(_message: string): number {
    return 0;
  }

  #fireActivationChanged(): void {
    for (const listener of this.#activationListeners) {
      listener(this, this.#isActive);
    }
  }
}
