import type { AliceProject, AliceObject } from "../a3p-parser";
import type { Position, Orientation } from "./types";
import {
  SThing,
  SGround,
  SScene,
  STurnable,
  SMovableTurnable,
  SCamera,
  SModel,
  SJointedModel,
  SBiped,
  SFlyer,
  SQuadruped,
  SProp,
} from "./entities";

/** Type mapping entries checked in order — first match wins. */
const TYPE_MAP: Array<[substring: string, factory: () => SThing]> = [
  ["SBiped", () => new SBiped()],
  ["SFlyer", () => new SFlyer()],
  ["SQuadruped", () => new SQuadruped()],
  ["SProp", () => new SProp()],
  ["SGround", () => new SGround()],
  ["SCamera", () => new SCamera()],
  ["SScene", () => new SScene()],
  ["SJointedModel", () => new SJointedModel()],
  ["SModel", () => new SModel()],
];

function createEntityForType(typeName: string): SThing {
  for (const [substring, factory] of TYPE_MAP) {
    if (typeName.includes(substring)) return factory();
  }
  return new SProp();
}

function validateFinite(label: string, values: Record<string, number>): void {
  for (const [key, val] of Object.entries(values)) {
    if (!Number.isFinite(val)) {
      throw new TypeError(`${label} ${key} must be a finite number`);
    }
  }
}

/** Runtime container for scene entities (analogous to Java's SceneImp). */
export class Scene {
  private readonly _entities = new Map<string, SThing>();

  atmosphereColor: string | undefined;
  fogDensity: number | undefined;
  ambientLightColor: string | undefined;

  get entities(): ReadonlyMap<string, SThing> {
    return this._entities;
  }

  addEntity(name: string, entity: SThing): void {
    if (!name.trim()) {
      throw new TypeError("entity name must be a non-empty string");
    }
    if (this._entities.has(name)) {
      throw new TypeError(`entity "${name}" already exists in scene`);
    }
    this._entities.set(name, entity);
  }

  removeEntity(name: string): boolean {
    return this._entities.delete(name);
  }

  getEntity(name: string): SThing | undefined {
    return this._entities.get(name);
  }

  setEntityPosition(name: string, position: Position): void {
    const entity = this._entities.get(name);
    if (!entity) {
      throw new TypeError(`entity "${name}" not found`);
    }
    if (!(entity instanceof SMovableTurnable)) {
      throw new TypeError(
        `entity "${name}" (${entity.constructor.name}) does not support position`,
      );
    }
    validateFinite("position", { x: position.x, y: position.y, z: position.z });
    entity.position = position;
  }

  setEntityOrientation(name: string, orientation: Orientation): void {
    const entity = this._entities.get(name);
    if (!entity) {
      throw new TypeError(`entity "${name}" not found`);
    }
    if (!(entity instanceof STurnable)) {
      throw new TypeError(
        `entity "${name}" (${entity.constructor.name}) does not support orientation`,
      );
    }
    validateFinite("orientation", {
      x: orientation.x,
      y: orientation.y,
      z: orientation.z,
      w: orientation.w,
    });
    entity.orientation = orientation;
  }

  /** Bridge from parser output to typed entity model. */
  static fromProject(project: AliceProject): Scene {
    const scene = new Scene();

    for (const obj of project.sceneObjects) {
      const entity = createEntityForType(obj.typeName);
      scene.addEntity(obj.name, entity);
      applyTransforms(entity, obj);
    }

    return scene;
  }
}

function applyTransforms(entity: SThing, obj: AliceObject): void {
  if (entity instanceof SMovableTurnable && obj.position) {
    entity.position = obj.position;
  }
  if (entity instanceof STurnable && obj.orientation) {
    entity.orientation = obj.orientation;
  }
  if (entity instanceof SModel && obj.size) {
    entity.size = obj.size;
  }
}
