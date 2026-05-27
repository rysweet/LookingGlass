import type { SThing } from "./story-api/entities.js";
import { Scene } from "./story-api/expanded-scene.js";
import {
  EntityCreator,
  EntityFactory,
  EntityRegistry,
  EntitySerializer,
  type EntityResource,
  type EntityState,
} from "./entity-lifecycle.js";

export const CURRENT_SCENE_VERSION = 2;

export interface SceneEntityResource extends EntityResource {
  readonly parentName?: string | null;
}

export interface SceneStateEntity extends EntityState {
  readonly parentName: string | null;
}

export interface SceneState {
  readonly version: number;
  readonly entities: SceneStateEntity[];
}

export interface SceneValidationIssue {
  readonly code: "duplicate-name" | "orphan" | "cycle";
  readonly entityName: string;
  readonly message: string;
}

export interface SceneDiff {
  readonly added: string[];
  readonly removed: string[];
  readonly changed: string[];
  readonly unchanged: string[];
  readonly versionChanged: boolean;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sortEntities(entities: readonly SceneStateEntity[]): SceneStateEntity[] {
  return [...entities].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeParentName(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export class SceneBuilder {
  private readonly scene = new Scene();
  private readonly registry = new EntityRegistry();
  private readonly serializer: EntitySerializer;
  private readonly creator: EntityCreator;
  private readonly nodes = new Map<string, { parentName: string | null; typeName: string }>();

  constructor(private readonly factory = new EntityFactory()) {
    this.serializer = new EntitySerializer(factory);
    this.creator = new EntityCreator(factory, this.registry);
  }

  getScene(): Scene {
    return this.scene;
  }

  getRegistry(): EntityRegistry {
    return this.registry;
  }

  addEntity(resource: SceneEntityResource): SThing {
    const entity = this.creator.createEntity(this.scene, resource);
    const name = entity.getName()!;
    this.nodes.set(name, {
      parentName: normalizeParentName(resource.parentName),
      typeName: resource.typeName,
    });
    return entity;
  }

  removeEntity(name: string): boolean {
    const entity = this.scene.getEntity(name);
    if (!entity) {
      return false;
    }
    this.scene.removeEntity(name);
    this.registry.unregister(name);
    this.nodes.delete(name);
    for (const node of this.nodes.values()) {
      if (node.parentName === name) {
        node.parentName = null;
      }
    }
    return true;
  }

  setParent(name: string, parentName: string | null): void {
    const node = this.nodes.get(name);
    if (!node) {
      throw new Error(`Entity "${name}" does not exist`);
    }
    node.parentName = normalizeParentName(parentName);
  }

  captureState(version = CURRENT_SCENE_VERSION): SceneState {
    const entities = [...this.scene.entities.entries()].map(([name, entity]) => {
      const node = this.nodes.get(name);
      return {
        ...this.serializer.serializeEntity(entity, name, node?.typeName),
        parentName: node?.parentName ?? null,
      } satisfies SceneStateEntity;
    });
    return {
      version,
      entities: sortEntities(entities).map((entity) => deepClone(entity)),
    };
  }

  build(): { scene: Scene; registry: EntityRegistry; state: SceneState } {
    return {
      scene: this.scene,
      registry: this.registry,
      state: this.captureState(),
    };
  }
}

export class SceneValidator {
  validate(state: SceneState): SceneValidationIssue[] {
    const issues: SceneValidationIssue[] = [];
    const entityMap = new Map<string, SceneStateEntity>();
    const duplicates = new Set<string>();

    for (const entity of state.entities) {
      if (entityMap.has(entity.name)) {
        duplicates.add(entity.name);
      }
      entityMap.set(entity.name, entity);
    }

    for (const name of duplicates) {
      issues.push({
        code: "duplicate-name",
        entityName: name,
        message: `Entity "${name}" appears more than once in the scene state`,
      });
    }

    for (const entity of state.entities) {
      if (entity.parentName !== null && !entityMap.has(entity.parentName)) {
        issues.push({
          code: "orphan",
          entityName: entity.name,
          message: `Entity "${entity.name}" references missing parent "${entity.parentName}"`,
        });
      }
    }

    const cycleMembers = new Set<string>();
    for (const entity of state.entities) {
      const stack: string[] = [];
      const seen = new Set<string>();
      let current: string | null = entity.name;
      while (current !== null) {
        if (seen.has(current)) {
          const cycleStart = stack.indexOf(current);
          stack.slice(cycleStart).forEach((name) => cycleMembers.add(name));
          break;
        }
        seen.add(current);
        stack.push(current);
        current = entityMap.get(current)?.parentName ?? null;
      }
    }

    for (const name of [...cycleMembers].sort()) {
      issues.push({
        code: "cycle",
        entityName: name,
        message: `Entity "${name}" is part of a parent cycle`,
      });
    }

    return issues;
  }

  isValid(state: SceneState): boolean {
    return this.validate(state).length === 0;
  }
}

export class SceneSerializer {
  constructor(
    private readonly migration = new SceneMigration(),
    private readonly factory = new EntityFactory(),
  ) {}

  serialize(state: SceneState, pretty = true): string {
    return JSON.stringify(state, null, pretty ? 2 : 0);
  }

  deserialize(json: string): SceneState {
    return this.migration.upgrade(JSON.parse(json));
  }

  hydrate(state: SceneState): { scene: Scene; registry: EntityRegistry; state: SceneState } {
    const upgraded = this.migration.upgrade(state);
    const builder = new SceneBuilder(this.factory);
    for (const entity of upgraded.entities) {
      builder.addEntity(entity);
      builder.setParent(entity.name, entity.parentName);
    }
    return builder.build();
  }
}

export class SceneSnapshot {
  capture(source: SceneState | SceneBuilder): SceneState {
    return deepClone(source instanceof SceneBuilder ? source.captureState() : source);
  }
}

export class SceneComparator {
  diff(left: SceneState, right: SceneState): SceneDiff {
    const leftMap = new Map(left.entities.map((entity) => [entity.name, entity]));
    const rightMap = new Map(right.entities.map((entity) => [entity.name, entity]));
    const names = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();

    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];
    const unchanged: string[] = [];

    for (const name of names) {
      const before = leftMap.get(name);
      const after = rightMap.get(name);
      if (!before && after) {
        added.push(name);
      } else if (before && !after) {
        removed.push(name);
      } else if (before && after) {
        if (JSON.stringify(before) === JSON.stringify(after)) {
          unchanged.push(name);
        } else {
          changed.push(name);
        }
      }
    }

    return {
      added,
      removed,
      changed,
      unchanged,
      versionChanged: left.version !== right.version,
    };
  }
}

export class SceneMigration {
  upgrade(input: unknown, targetVersion = CURRENT_SCENE_VERSION): SceneState {
    const record = (input ?? {}) as {
      version?: number;
      entities?: Array<Record<string, unknown>>;
    };
    const version = Number.isFinite(record.version) ? Number(record.version) : 1;
    const entities = Array.isArray(record.entities) ? record.entities : [];

    return {
      version: Math.max(version, targetVersion),
      entities: sortEntities(
        entities.map((entity, index) => ({
          name: typeof entity.name === "string" && entity.name.trim()
            ? entity.name
            : `entity${index + 1}`,
          typeName: typeof entity.typeName === "string"
            ? entity.typeName
            : (typeof entity.className === "string" ? entity.className : "SProp"),
          resourceType: typeof entity.resourceType === "string" ? entity.resourceType : null,
          isShowing: typeof entity.isShowing === "boolean"
            ? entity.isShowing
            : (typeof entity.visible === "boolean" ? entity.visible : true),
          position: (entity.position as SceneStateEntity["position"]) ?? null,
          orientation: (entity.orientation as SceneStateEntity["orientation"]) ?? null,
          size: (entity.size as SceneStateEntity["size"]) ?? null,
          extras: typeof entity.extras === "object" && entity.extras !== null
            ? (deepClone(entity.extras) as Record<string, unknown>)
            : {},
          parentName: normalizeParentName(entity.parentName),
        } satisfies SceneStateEntity))),
    };
  }
}
