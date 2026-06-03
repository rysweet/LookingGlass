import { identifierNameGenerator } from "../naming.js";
import { generateProceduralModel } from "../open-asset-pipeline/procedural-generators.js";
import type { ProceduralModelResult } from "../open-asset-pipeline/types.js";
import { SceneEditor, type ObjectPlacementOptions } from "../scene-editor.js";
import { createDefaultTransform, type Orientation, type Position } from "../story-api/types.js";
import { getGalleryItem, toProceduralModelConfig, type GalleryCategoryName } from "./gallery-data.js";

export const GALLERY_ADD_TO_SCENE_EVENT = "gallery:add-to-scene";

export interface EntityData {
  readonly resourceId: string;
  readonly name: string;
  readonly type: string;
  readonly galleryCategory: GalleryCategoryName;
  readonly position: Position;
  readonly orientation: Orientation;
  readonly model: ProceduralModelResult;
}

export interface GallerySceneIntegrationOptions {
  readonly eventTarget?: EventTarget;
}

export interface GalleryToSceneBindingOptions {
  readonly nameResolver?: (entity: EntityData, editor: SceneEditor) => string;
  readonly placementOptions?: (entity: EntityData) => ObjectPlacementOptions;
}

export interface GalleryToSceneAdapterOptions extends GalleryToSceneBindingOptions {
  readonly editor: SceneEditor;
  readonly integration: GallerySceneIntegration;
}

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
}

function defaultSceneObjectName(entity: EntityData, editor: SceneEditor): string {
  return identifierNameGenerator.suggestFieldName(entity.name, editor.listObjectNames());
}

function defaultPlacementOptions(entity: EntityData): ObjectPlacementOptions {
  return {
    position: clonePosition(entity.position),
    orientation: cloneOrientation(entity.orientation),
    placeOnGround: entity.position.y === 0 ? undefined : false,
  };
}

export class GalleryToSceneAdapter {
  private readonly detachListener: () => void;

  constructor(private readonly options: GalleryToSceneAdapterOptions) {
    this.detachListener = options.integration.onAddToScene((entity) => {
      this.place(entity);
    });
  }

  place(entity: EntityData): string {
    const name = this.options.nameResolver?.(entity, this.options.editor)
      ?? defaultSceneObjectName(entity, this.options.editor);
    const placement = this.options.placementOptions?.(entity) ?? defaultPlacementOptions(entity);
    this.options.editor.placeFromGallery(entity.resourceId, name, placement);
    return name;
  }

  dispose(): void {
    this.detachListener();
  }
}

export class GallerySceneIntegration {
  private readonly eventTarget: EventTarget;

  constructor(options: GallerySceneIntegrationOptions = {}) {
    this.eventTarget = options.eventTarget ?? (typeof document === "undefined" ? new EventTarget() : document);
  }

  onAddToScene(callback: (entity: EntityData) => void): () => void {
    const listener: EventListener = (event) => {
      callback((event as CustomEvent<EntityData>).detail);
    };
    this.eventTarget.addEventListener(GALLERY_ADD_TO_SCENE_EVENT, listener);
    return () => {
      this.eventTarget.removeEventListener(GALLERY_ADD_TO_SCENE_EVENT, listener);
    };
  }

  connectSceneEditor(editor: SceneEditor, options: GalleryToSceneBindingOptions = {}): GalleryToSceneAdapter {
    return new GalleryToSceneAdapter({
      ...options,
      editor,
      integration: this,
    });
  }

  addModelToScene(resourceId: string, position?: Position): EntityData {
    const item = getGalleryItem(resourceId);
    if (!item) {
      throw new Error(`Unknown gallery resource '${resourceId}'`);
    }

    const transform = createDefaultTransform();
    const entity: EntityData = {
      resourceId: item.resourceId,
      name: item.displayName,
      type: item.profile.category,
      galleryCategory: item.category,
      position: clonePosition(position ?? transform.position),
      orientation: cloneOrientation(transform.orientation),
      model: generateProceduralModel(toProceduralModelConfig(item)),
    };

    this.eventTarget.dispatchEvent(new CustomEvent<EntityData>(GALLERY_ADD_TO_SCENE_EVENT, {
      detail: entity,
    }));

    return entity;
  }
}
