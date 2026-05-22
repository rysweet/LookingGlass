import type { Size } from "./story-api/types.js";

export interface GalleryModel {
  id: string;
  name: string;
  className: string;
  category: string;
  tags: string[];
  resourceType: string | null;
  placeOnGround: boolean;
  defaultSize?: Size;
}

export interface GallerySearchOptions {
  category?: string;
  tags?: string[];
}

const DEFAULT_MODELS: GalleryModel[] = [
  {
    id: "people/biped",
    name: "Biped",
    className: "org.lgna.story.SBiped",
    category: "people",
    tags: ["person", "character", "walker"],
    resourceType: null,
    placeOnGround: true,
    defaultSize: { width: 1, height: 1.8, depth: 1 },
  },
  {
    id: "animals/flyer",
    name: "Flyer",
    className: "org.lgna.story.SFlyer",
    category: "animals",
    tags: ["bird", "animal", "flying"],
    resourceType: null,
    placeOnGround: false,
    defaultSize: { width: 1.2, height: 0.8, depth: 1.2 },
  },
  {
    id: "animals/quadruped",
    name: "Quadruped",
    className: "org.lgna.story.SQuadruped",
    category: "animals",
    tags: ["animal", "four-legged", "pet"],
    resourceType: null,
    placeOnGround: true,
    defaultSize: { width: 1.5, height: 1.1, depth: 2 },
  },
  {
    id: "props/prop",
    name: "Prop",
    className: "org.lgna.story.SProp",
    category: "props",
    tags: ["object", "prop", "scenery"],
    resourceType: null,
    placeOnGround: true,
    defaultSize: { width: 1, height: 1, depth: 1 },
  },
  {
    id: "scene/camera",
    name: "Camera",
    className: "org.lgna.story.SCamera",
    category: "scene",
    tags: ["camera", "view", "scene"],
    resourceType: null,
    placeOnGround: false,
  },
];

export class GalleryCatalog {
  private readonly models = new Map<string, GalleryModel>();

  constructor(seed: GalleryModel[] = DEFAULT_MODELS) {
    for (const model of seed) {
      this.add(model);
    }
  }

  list(): GalleryModel[] {
    return [...this.models.values()].map(cloneModel);
  }

  get(id: string): GalleryModel | null {
    const model = this.models.get(id);
    return model ? cloneModel(model) : null;
  }

  add(model: GalleryModel): void {
    if (!model.id.trim()) {
      throw new TypeError("gallery model id must be a non-empty string");
    }
    if (this.models.has(model.id)) {
      throw new TypeError(`gallery model \"${model.id}\" already exists`);
    }
    if (!model.name.trim()) {
      throw new TypeError("gallery model name must be a non-empty string");
    }
    if (!model.className.trim()) {
      throw new TypeError("gallery model className must be a non-empty string");
    }
    this.models.set(model.id, cloneModel(model));
  }

  remove(id: string): boolean {
    return this.models.delete(id);
  }

  byCategory(category: string): GalleryModel[] {
    return this.search("", { category });
  }

  search(query: string, options: GallerySearchOptions = {}): GalleryModel[] {
    const queryText = query.trim().toLowerCase();
    const requiredTags = new Set((options.tags ?? []).map((tag) => tag.toLowerCase()));
    const category = options.category?.trim().toLowerCase();

    return this.list().filter((model) => {
      if (category && model.category.toLowerCase() !== category) {
        return false;
      }
      const modelTags = new Set(model.tags.map((tag) => tag.toLowerCase()));
      for (const tag of requiredTags) {
        if (!modelTags.has(tag)) {
          return false;
        }
      }
      if (!queryText) {
        return true;
      }
      return (
        model.id.toLowerCase().includes(queryText) ||
        model.name.toLowerCase().includes(queryText) ||
        model.className.toLowerCase().includes(queryText) ||
        model.tags.some((tag) => tag.toLowerCase().includes(queryText))
      );
    });
  }
}

function cloneModel(model: GalleryModel): GalleryModel {
  return {
    ...model,
    tags: [...model.tags],
    ...(model.defaultSize ? { defaultSize: { ...model.defaultSize } } : {}),
  };
}
