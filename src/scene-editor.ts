import { GalleryCatalog, type GalleryModel } from "./gallery.js";
import { SCamera, SModel, SMovableTurnable, SThing, STurnable } from "./story-api/entities.js";
import { createEntityForType, Scene } from "./story-api/scene.js";
import type { Orientation, Position, Size } from "./story-api/types.js";

export interface ObjectPlacementOptions {
  position?: Position;
  orientation?: Orientation;
  size?: Size;
  placeOnGround?: boolean;
  select?: boolean;
}

export interface CameraState {
  position: Position;
  target: Position;
}

export interface SceneEditorOptions {
  scene?: Scene;
  gallery?: GalleryCatalog;
  seedDefaults?: boolean;
}

export class SceneEditor {
  readonly scene: Scene;
  readonly gallery: GalleryCatalog;
  readonly camera: SCamera;

  private selectedObjectName: string | null = null;
  private cameraTarget: Position = { x: 0, y: 0, z: 0 };

  constructor(options: SceneEditorOptions = {}) {
    this.scene = options.scene ?? new Scene();
    this.gallery = options.gallery ?? new GalleryCatalog();

    if (options.seedDefaults !== false) {
      if (!this.scene.getEntity("ground")) {
        this.scene.addEntity("ground", createEntityForType("org.lgna.story.SGround"));
      }
      if (!this.scene.getEntity("camera")) {
        this.scene.addEntity("camera", new SCamera());
      }
    }

    const cameraEntity = this.scene.getEntity("camera");
    if (!(cameraEntity instanceof SCamera)) {
      throw new TypeError('scene editor requires a camera entity named "camera"');
    }
    this.camera = cameraEntity;
  }

  get selectedName(): string | null {
    return this.selectedObjectName;
  }

  getCameraState(): CameraState {
    return {
      position: { ...this.camera.position },
      target: { ...this.cameraTarget },
    };
  }

  listObjectNames(): string[] {
    return [...this.scene.entities.keys()];
  }

  getObject(name: string): SThing | null {
    return this.scene.getEntity(name) ?? null;
  }

  selectObject(name: string | null): void {
    if (name === null) {
      this.selectedObjectName = null;
      return;
    }
    if (!this.scene.getEntity(name)) {
      throw new TypeError(`entity \"${name}\" not found`);
    }
    this.selectedObjectName = name;
  }

  placeObject(name: string, className: string, options: ObjectPlacementOptions = {}): SThing {
    if (this.scene.getEntity(name)) {
      throw new TypeError(`entity \"${name}\" already exists in scene`);
    }

    const entity = createEntityForType(className);
    this.scene.addEntity(name, entity);

    this.applyPlacement(entity, name, options);

    if (options.select !== false) {
      this.selectedObjectName = name;
    }

    return entity;
  }

  placeFromGallery(modelId: string, name: string, options: ObjectPlacementOptions = {}): SThing {
    const model = this.gallery.get(modelId);
    if (!model) {
      throw new TypeError(`gallery model \"${modelId}\" not found`);
    }
    return this.placeObject(name, model.className, {
      ...options,
      size: options.size ?? model.defaultSize,
      placeOnGround: options.placeOnGround ?? model.placeOnGround,
    });
  }

  removeObject(name: string): boolean {
    if (this.selectedObjectName === name) {
      this.selectedObjectName = null;
    }
    return this.scene.removeEntity(name);
  }

  setPosition(name: string, position: Position): void {
    this.scene.setEntityPosition(name, position);
  }

  setOrientation(name: string, orientation: Orientation): void {
    this.scene.setEntityOrientation(name, orientation);
  }

  setProperty(name: string, propertyName: string, value: unknown): void {
    const entity = this.scene.getEntity(name);
    if (!entity) {
      throw new TypeError(`entity \"${name}\" not found`);
    }

    switch (propertyName) {
      case "position":
        this.scene.setEntityPosition(name, value as Position);
        return;
      case "orientation":
        this.scene.setEntityOrientation(name, value as Orientation);
        return;
      case "size":
        if (!(entity instanceof SModel)) {
          throw new TypeError(`entity \"${name}\" does not support size`);
        }
        entity.size = value as Size;
        return;
      case "color":
        if (!(entity instanceof SModel)) {
          throw new TypeError(`entity \"${name}\" does not support color`);
        }
        entity.color = value as string;
        return;
      case "opacity":
        if (!(entity instanceof SModel)) {
          throw new TypeError(`entity \"${name}\" does not support opacity`);
        }
        entity.opacity = value as number;
        return;
      case "vehicle":
        if (!(entity instanceof SModel)) {
          throw new TypeError(`entity \"${name}\" does not support vehicle`);
        }
        if (value === null) {
          entity.vehicle = null;
          return;
        }
        if (typeof value !== "string") {
          throw new TypeError("vehicle value must be an entity name or null");
        }
        entity.vehicle = this.requireEntity(value);
        return;
      default: {
        const property = entity.imp.getProperty<unknown>(propertyName);
        if (!property) {
          throw new TypeError(`entity \"${name}\" does not support property \"${propertyName}\"`);
        }
        property.setValue(value);
      }
    }
  }

  getProperty(name: string, propertyName: string): unknown {
    const entity = this.requireEntity(name);
    switch (propertyName) {
      case "position":
        if (entity instanceof SMovableTurnable) {
          return { ...entity.position };
        }
        return undefined;
      case "orientation":
        if (entity instanceof STurnable) {
          return { ...entity.orientation };
        }
        return undefined;
      case "size":
        if (entity instanceof SModel) {
          return { ...entity.size };
        }
        return undefined;
      case "color":
        return entity instanceof SModel ? entity.color : undefined;
      case "opacity":
        return entity instanceof SModel ? entity.opacity : undefined;
      case "vehicle":
        return entity instanceof SModel && entity.vehicle
          ? this.findEntityName(entity.vehicle)
          : null;
      default:
        return entity.imp.getProperty<unknown>(propertyName)?.value;
    }
  }

  moveCamera(delta: Position): void {
    this.camera.position = {
      x: this.camera.position.x + delta.x,
      y: this.camera.position.y + delta.y,
      z: this.camera.position.z + delta.z,
    };
  }

  setCameraTarget(target: Position): void {
    this.cameraTarget = { ...target };
  }

  focusCameraOn(name: string, distance = 6): void {
    const entity = this.requireEntity(name);
    const target = entity instanceof SMovableTurnable ? entity.position : { x: 0, y: 0, z: 0 };
    const yOffset = entity instanceof SModel ? Math.max(1, entity.size.height) : 1.5;
    this.cameraTarget = { ...target };
    this.camera.position = {
      x: target.x,
      y: target.y + yOffset,
      z: target.z + Math.max(1, distance),
    };
  }

  orbitCamera(yawRadians: number, pitchRadians = 0): void {
    const relative = {
      x: this.camera.position.x - this.cameraTarget.x,
      y: this.camera.position.y - this.cameraTarget.y,
      z: this.camera.position.z - this.cameraTarget.z,
    };
    const distance = Math.max(0.001, Math.sqrt(relative.x ** 2 + relative.y ** 2 + relative.z ** 2));
    const yaw = Math.atan2(relative.x, relative.z) + yawRadians;
    const pitch = clamp(
      Math.asin(relative.y / distance) + pitchRadians,
      -Math.PI / 2 + 0.01,
      Math.PI / 2 - 0.01,
    );
    const planarDistance = Math.cos(pitch) * distance;
    this.camera.position = {
      x: this.cameraTarget.x + Math.sin(yaw) * planarDistance,
      y: this.cameraTarget.y + Math.sin(pitch) * distance,
      z: this.cameraTarget.z + Math.cos(yaw) * planarDistance,
    };
  }

  private applyPlacement(entity: SThing, name: string, options: ObjectPlacementOptions): void {
    if (entity instanceof SModel && options.size) {
      entity.size = options.size;
    }

    if (entity instanceof STurnable && options.orientation) {
      this.scene.setEntityOrientation(name, options.orientation);
    }

    if (entity instanceof SMovableTurnable) {
      const requestedPosition = options.position ?? { x: 0, y: 0, z: 0 };
      const placedPosition = { ...requestedPosition };
      const placeOnGround = options.placeOnGround ?? false;
      if (placeOnGround) {
        const size = entity instanceof SModel ? entity.size : null;
        placedPosition.y = size ? size.height / 2 : 0;
      }
      this.scene.setEntityPosition(name, placedPosition);
    }
  }

  private requireEntity(name: string): SThing {
    const entity = this.scene.getEntity(name);
    if (!entity) {
      throw new TypeError(`entity \"${name}\" not found`);
    }
    return entity;
  }

  private findEntityName(target: SThing): string | null {
    for (const [name, entity] of this.scene.entities) {
      if (entity === target) {
        return name;
      }
    }
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
