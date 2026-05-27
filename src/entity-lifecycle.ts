import { type AliceObject } from "./a3p-parser.js";
import { Scene, createEntityForType } from "./story-api/expanded-scene.js";
import {
  SBiped,
  SCamera,
  SFlyer,
  SGround,
  SModel,
  SProp,
  SQuadruped,
  SScene,
  STextModel,
  SThing,
  STurnable,
  SMovableTurnable,
} from "./story-api/entities.js";
import type { Orientation, Position, Size } from "./story-api/types.js";

export interface EntityResource extends Partial<AliceObject> {
  readonly typeName: string;
  readonly name?: string;
  readonly isShowing?: boolean;
}

export interface EntityState {
  readonly name: string;
  readonly typeName: string;
  readonly resourceType: string | null;
  readonly isShowing: boolean;
  readonly position: Position | null;
  readonly orientation: Orientation | null;
  readonly size: Size | null;
  readonly extras: Readonly<Record<string, unknown>>;
}

export interface EntityRegistryEntry {
  readonly name: string;
  readonly typeName: string;
  readonly entity: SThing;
}

function clonePosition(position: Position | null | undefined): Position | null {
  return position ? { ...position } : null;
}

function cloneOrientation(orientation: Orientation | null | undefined): Orientation | null {
  return orientation ? { ...orientation } : null;
}

function cloneSize(size: Size | null | undefined): Size | null {
  return size ? { ...size } : null;
}

function copyExtras(extras: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> {
  return extras ? { ...extras } : {};
}

function suffixOf(typeName: string): string {
  const lastDot = typeName.lastIndexOf(".");
  return lastDot >= 0 ? typeName.slice(lastDot + 1) : typeName;
}

function defaultEntityBaseName(typeName: string): string {
  const suffix = suffixOf(typeName);
  const trimmed = suffix.startsWith("S") && suffix.length > 1 ? suffix.slice(1) : suffix;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function typeNameOf(entity: SThing, fallback?: string): string {
  return fallback ?? entity.constructor.name;
}

function captureExtras(entity: SThing): Record<string, unknown> {
  if (entity instanceof SScene) {
    return {
      atmosphereColor: entity.getAtmosphereColor(),
      ambientLightColor: entity.getAmbientLightColor(),
      fromAboveLightColor: entity.getFromAboveLightColor(),
      fromBelowLightColor: entity.getFromBelowLightColor(),
      fogDensity: entity.getFogDensity(),
    };
  }
  return {};
}

function applyExtras(entity: SThing, extras: Readonly<Record<string, unknown>>): void {
  if (!(entity instanceof SScene)) {
    return;
  }
  const atmosphereColor = extras.atmosphereColor;
  if (typeof atmosphereColor === "string" || atmosphereColor === null) {
    entity.setAtmosphereColor(atmosphereColor);
  }
  const ambientLightColor = extras.ambientLightColor;
  if (typeof ambientLightColor === "string" || ambientLightColor === null) {
    entity.setAmbientLightColor(ambientLightColor);
  }
  const fromAboveLightColor = extras.fromAboveLightColor;
  if (typeof fromAboveLightColor === "string" || fromAboveLightColor === null) {
    entity.setFromAboveLightColor(fromAboveLightColor);
  }
  const fromBelowLightColor = extras.fromBelowLightColor;
  if (typeof fromBelowLightColor === "string" || fromBelowLightColor === null) {
    entity.setFromBelowLightColor(fromBelowLightColor);
  }
  if (typeof extras.fogDensity === "number") {
    entity.setFogDensity(extras.fogDensity);
  }
}

function applyEntityState(entity: SThing, state: EntityState): SThing {
  entity.setName(state.name);
  entity.isShowing = state.isShowing;
  if (entity instanceof SMovableTurnable && state.position) {
    entity.position = { ...state.position };
  }
  if (entity instanceof STurnable && state.orientation) {
    entity.orientation = { ...state.orientation };
  }
  if (entity instanceof SModel && state.size) {
    entity.size = { ...state.size };
  }
  applyExtras(entity, state.extras);
  return entity;
}

export class EntityFactory {
  private named<T extends SThing>(entity: T, name?: string): T {
    if (name !== undefined) {
      entity.setName(name);
    }
    return entity;
  }

  create(typeName: string, name?: string): SThing {
    return this.named(createEntityForType(typeName), name);
  }

  createBiped(name?: string): SBiped {
    return this.named(new SBiped(), name);
  }

  createFlyer(name?: string): SFlyer {
    return this.named(new SFlyer(), name);
  }

  createQuadruped(name?: string): SQuadruped {
    return this.named(new SQuadruped(), name);
  }

  createProp(name?: string): SProp {
    return this.named(new SProp(), name);
  }

  createCamera(name?: string): SCamera {
    return this.named(new SCamera(), name);
  }

  createGround(name?: string): SGround {
    return this.named(new SGround(), name);
  }

  createScene(name?: string): SScene {
    return this.named(new SScene(name), name);
  }

  createTextModel(name?: string): STextModel {
    return this.named(new STextModel(), name);
  }
}

export class EntityRegistry {
  private readonly byName = new Map<string, EntityRegistryEntry>();
  private readonly namesByType = new Map<string, Set<string>>();

  has(name: string): boolean {
    return this.byName.has(name);
  }

  generateName(typeName: string): string {
    const base = defaultEntityBaseName(typeName) || "entity";
    let index = 1;
    let candidate = `${base}${index}`;
    while (this.byName.has(candidate)) {
      index += 1;
      candidate = `${base}${index}`;
    }
    return candidate;
  }

  register(name: string, entity: SThing, typeName = entity.constructor.name): EntityRegistryEntry {
    const existing = this.byName.get(name);
    if (existing) {
      this.unregister(name);
    }
    const entry: EntityRegistryEntry = { name, typeName, entity };
    this.byName.set(name, entry);
    const names = this.namesByType.get(typeName) ?? new Set<string>();
    names.add(name);
    this.namesByType.set(typeName, names);
    return entry;
  }

  unregister(name: string): boolean {
    const existing = this.byName.get(name);
    if (!existing) {
      return false;
    }
    this.byName.delete(name);
    const names = this.namesByType.get(existing.typeName);
    if (names) {
      names.delete(name);
      if (names.size === 0) {
        this.namesByType.delete(existing.typeName);
      }
    }
    return true;
  }

  get(name: string): SThing | null {
    return this.byName.get(name)?.entity ?? null;
  }

  getByType(typeName: string): SThing[] {
    const names = [...(this.namesByType.get(typeName) ?? [])].sort();
    return names.map((name) => this.byName.get(name)!.entity);
  }

  entries(): EntityRegistryEntry[] {
    return [...this.byName.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  clear(): void {
    this.byName.clear();
    this.namesByType.clear();
  }

  syncScene(scene: Scene): void {
    this.clear();
    for (const [name, entity] of scene.entities.entries()) {
      this.register(name, entity, entity.constructor.name);
    }
  }
}

export class EntitySerializer {
  constructor(private readonly factory = new EntityFactory()) {}

  serializeEntity(entity: SThing, nameOverride?: string, typeNameOverride?: string): EntityState {
    return {
      name: nameOverride ?? entity.getName() ?? defaultEntityBaseName(entity.constructor.name),
      typeName: typeNameOf(entity, typeNameOverride),
      resourceType: null,
      isShowing: entity.isShowing,
      position: entity instanceof SMovableTurnable ? clonePosition(entity.position) : null,
      orientation: entity instanceof STurnable ? cloneOrientation(entity.orientation) : null,
      size: entity instanceof SModel ? cloneSize(entity.size) : null,
      extras: captureExtras(entity),
    };
  }

  deserializeEntity(state: EntityState): SThing {
    const entity = this.factory.create(state.typeName, state.name);
    return applyEntityState(entity, {
      ...state,
      position: clonePosition(state.position),
      orientation: cloneOrientation(state.orientation),
      size: cloneSize(state.size),
      extras: copyExtras(state.extras),
    });
  }

  toJson(state: EntityState | readonly EntityState[]): string {
    return JSON.stringify(state, null, 2);
  }

  fromJson(json: string): EntityState | EntityState[] {
    return JSON.parse(json) as EntityState | EntityState[];
  }
}

export class EntityCreator {
  constructor(
    private readonly factory = new EntityFactory(),
    private readonly registry = new EntityRegistry(),
  ) {}

  createEntity(scene: Scene, resource: EntityResource): SThing {
    const name = resource.name?.trim() || this.registry.generateName(resource.typeName);
    const entity = this.factory.create(resource.typeName, name);
    entity.isShowing = resource.isShowing ?? true;
    if (entity instanceof SMovableTurnable && resource.position) {
      entity.position = { ...resource.position };
    }
    if (entity instanceof STurnable && resource.orientation) {
      entity.orientation = { ...resource.orientation };
    }
    if (entity instanceof SModel && resource.size) {
      entity.size = { ...resource.size };
    }
    scene.addEntity(name, entity);
    this.registry.register(name, entity, resource.typeName);
    return entity;
  }
}

export class EntityDestroyer {
  constructor(
    private readonly registry = new EntityRegistry(),
    private readonly serializer = new EntitySerializer(),
  ) {}

  destroyEntity(scene: Scene, name: string): EntityState | null {
    const entity = scene.getEntity(name);
    if (!entity) {
      return null;
    }
    const snapshot = this.serializer.serializeEntity(entity, name);
    entity.imp.deactivate();
    scene.removeEntity(name);
    this.registry.unregister(name);
    return snapshot;
  }
}

export class EntityCloner {
  constructor(
    private readonly factory = new EntityFactory(),
    private readonly registry = new EntityRegistry(),
    private readonly serializer = new EntitySerializer(factory),
  ) {}

  cloneDetached(entity: SThing, cloneName?: string, typeNameOverride?: string): SThing {
    const snapshot = this.serializer.serializeEntity(entity, cloneName, typeNameOverride);
    return this.serializer.deserializeEntity({
      ...snapshot,
      name: cloneName ?? snapshot.name,
      position: clonePosition(snapshot.position),
      orientation: cloneOrientation(snapshot.orientation),
      size: cloneSize(snapshot.size),
      extras: copyExtras(snapshot.extras),
    });
  }

  cloneEntity(
    scene: Scene,
    sourceName: string,
    cloneName: string,
    typeNameOverride?: string,
  ): SThing {
    const source = scene.getEntity(sourceName);
    if (!source) {
      throw new Error(`Entity "${sourceName}" not found`);
    }
    const clone = this.cloneDetached(source, cloneName, typeNameOverride);
    scene.addEntity(cloneName, clone);
    this.registry.register(cloneName, clone, typeNameOf(clone, typeNameOverride));
    return clone;
  }
}
