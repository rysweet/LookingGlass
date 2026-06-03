import {
  AircraftResource,
  AutomobileResource,
  BipedResource,
  FishResource,
  FlyerResource,
  MarineMammalResource,
  PropResource,
  QuadrupedResource,
  SlithererResource,
  SwimmerResource,
  TrainResource,
  WatercraftResource,
} from "../model-resources/individual-resources.js";
import type { IndividualModelResource } from "../model-resources/individual-resources.js";
import { getModelProfile, type ModelProfile } from "../open-asset-pipeline/model-profiles.js";
import type { ProceduralModelConfig } from "../open-asset-pipeline/types.js";

export type GalleryCategoryName =
  | "biped"
  | "quadruped"
  | "flyer"
  | "swimmer"
  | "fish"
  | "marine_mammal"
  | "slitherer"
  | "prop"
  | "automobile"
  | "aircraft"
  | "watercraft"
  | "train";

export interface GalleryCategory {
  readonly name: GalleryCategoryName;
  readonly icon: string;
  readonly description: string;
  readonly modelCount: number;
}

export interface GalleryItem {
  readonly resourceId: string;
  readonly displayName: string;
  readonly category: GalleryCategoryName;
  readonly profile: ModelProfile;
  readonly thumbnailUrl?: string;
}

export interface GalleryCatalog {
  readonly items: readonly GalleryItem[];
  readonly itemsByCategory: Readonly<Record<GalleryCategoryName, readonly GalleryItem[]>>;
}

interface GalleryCategoryConfig {
  readonly icon: string;
  readonly description: string;
  readonly resources: Readonly<Record<string, IndividualModelResource>>;
}

export const GALLERY_CATEGORY_ORDER = [
  "biped",
  "quadruped",
  "flyer",
  "swimmer",
  "fish",
  "marine_mammal",
  "slitherer",
  "prop",
  "automobile",
  "aircraft",
  "watercraft",
  "train",
] as const satisfies readonly GalleryCategoryName[];

const CATEGORY_CONFIGS: Record<GalleryCategoryName, GalleryCategoryConfig> = {
  biped: {
    icon: "🧍",
    description: "Standing characters and humanoid creatures.",
    resources: BipedResource,
  },
  quadruped: {
    icon: "🐾",
    description: "Four-legged animals and creatures.",
    resources: QuadrupedResource,
  },
  flyer: {
    icon: "🪽",
    description: "Birds and other flying creatures.",
    resources: FlyerResource,
  },
  swimmer: {
    icon: "🐋",
    description: "Large swimmers and aquatic creatures.",
    resources: SwimmerResource,
  },
  fish: {
    icon: "🐟",
    description: "Freshwater and saltwater fish models.",
    resources: FishResource,
  },
  marine_mammal: {
    icon: "🐬",
    description: "Marine mammals and sea life.",
    resources: MarineMammalResource,
  },
  slitherer: {
    icon: "🐍",
    description: "Snakes and slithering creatures.",
    resources: SlithererResource,
  },
  prop: {
    icon: "🪑",
    description: "Set dressing, furniture, and scene props.",
    resources: PropResource,
  },
  automobile: {
    icon: "🚗",
    description: "Cars, trucks, and road vehicles.",
    resources: AutomobileResource,
  },
  aircraft: {
    icon: "✈️",
    description: "Aircraft and flying vehicles.",
    resources: AircraftResource,
  },
  watercraft: {
    icon: "⛵",
    description: "Boats, ships, and submarines.",
    resources: WatercraftResource,
  },
  train: {
    icon: "🚂",
    description: "Rail cars and locomotives.",
    resources: TrainResource,
  },
};

function buildCategoryItems(category: GalleryCategoryName): GalleryItem[] {
  return Object.values(CATEGORY_CONFIGS[category].resources).map((resource) => {
    const profile = getModelProfile(resource.id);
    if (!profile) {
      throw new Error(`Missing model profile for resource '${resource.id}'`);
    }
    return {
      resourceId: resource.id,
      displayName: resource.name,
      category,
      profile,
    };
  });
}

function createCatalog(): GalleryCatalog {
  const itemsByCategory: Record<GalleryCategoryName, readonly GalleryItem[]> = {
    biped: buildCategoryItems("biped"),
    quadruped: buildCategoryItems("quadruped"),
    flyer: buildCategoryItems("flyer"),
    swimmer: buildCategoryItems("swimmer"),
    fish: buildCategoryItems("fish"),
    marine_mammal: buildCategoryItems("marine_mammal"),
    slitherer: buildCategoryItems("slitherer"),
    prop: buildCategoryItems("prop"),
    automobile: buildCategoryItems("automobile"),
    aircraft: buildCategoryItems("aircraft"),
    watercraft: buildCategoryItems("watercraft"),
    train: buildCategoryItems("train"),
  };

  return {
    items: GALLERY_CATEGORY_ORDER.flatMap((category) => itemsByCategory[category]),
    itemsByCategory,
  };
}

const GALLERY_CATALOG = createCatalog();

function cloneItemsByCategory(itemsByCategory: GalleryCatalog["itemsByCategory"]): Record<GalleryCategoryName, readonly GalleryItem[]> {
  return {
    biped: [...itemsByCategory.biped],
    quadruped: [...itemsByCategory.quadruped],
    flyer: [...itemsByCategory.flyer],
    swimmer: [...itemsByCategory.swimmer],
    fish: [...itemsByCategory.fish],
    marine_mammal: [...itemsByCategory.marine_mammal],
    slitherer: [...itemsByCategory.slitherer],
    prop: [...itemsByCategory.prop],
    automobile: [...itemsByCategory.automobile],
    aircraft: [...itemsByCategory.aircraft],
    watercraft: [...itemsByCategory.watercraft],
    train: [...itemsByCategory.train],
  };
}

export function buildGalleryCatalog(): GalleryCatalog {
  return {
    items: [...GALLERY_CATALOG.items],
    itemsByCategory: cloneItemsByCategory(GALLERY_CATALOG.itemsByCategory),
  };
}

export function getGalleryItems(): readonly GalleryItem[] {
  return [...GALLERY_CATALOG.items];
}

export function getGalleryItem(resourceId: string): GalleryItem | undefined {
  return GALLERY_CATALOG.items.find((item) => item.resourceId === resourceId);
}

export function searchGallery(query: string): GalleryItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...GALLERY_CATALOG.items];
  }
  return GALLERY_CATALOG.items.filter((item) => item.displayName.toLowerCase().includes(needle));
}

export function filterGalleryItems(query = "", category: GalleryCategoryName | "all" = "all"): GalleryItem[] {
  const baseItems = category === "all"
    ? GALLERY_CATALOG.items
    : GALLERY_CATALOG.itemsByCategory[category];
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...baseItems];
  }
  return baseItems.filter((item) => item.displayName.toLowerCase().includes(needle));
}

export function getGalleryCategories(): GalleryCategory[] {
  return GALLERY_CATEGORY_ORDER.map((name) => ({
    name,
    icon: CATEGORY_CONFIGS[name].icon,
    description: CATEGORY_CONFIGS[name].description,
    modelCount: GALLERY_CATALOG.itemsByCategory[name].length,
  }));
}

export function getGalleryCategoryLabel(category: GalleryCategoryName): string {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatGalleryColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function toProceduralModelConfig(item: GalleryItem): ProceduralModelConfig {
  return {
    category: item.profile.category,
    id: item.resourceId,
    name: item.displayName,
    modelName: item.displayName.replace(/[^A-Za-z0-9]+/g, "") || item.resourceId,
  };
}
