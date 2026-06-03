import type { ProceduralModelResult } from "../open-asset-pipeline/types.js";
import { generateProceduralModel } from "../open-asset-pipeline/procedural-generators.js";
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

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
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
