/**
 * Open-Source Model Provider — Pluggable model source that produces
 * ModelResourceDefinition[] for registration with ModelResourceCatalog.
 *
 * Uses lazy loaders: geometry is only generated when load() is called.
 * Falls back to procedural placeholders when no external asset is available.
 */

import type { ModelResourceDefinition, KnownModelClassKey } from "../model-resources/definitions.js";
import { MODEL_CLASS_DATA } from "../model-resources/definitions.js";
import type { ModelProviderOptions, ModelProviderSource, EntityCategory, AssetLicense } from "./types.js";
import { PROCEDURAL_LICENSE } from "./types.js";
import { generateProceduralModel, getCanonicalJoints } from "./procedural-generators.js";
import {
  BipedResource,
  FlyerResource,
  QuadrupedResource,
  SwimmerResource,
  FishResource,
  SlithererResource,
  PropResource,
  AutomobileResource,
} from "../model-resources/individual-resources.js";
import type { IndividualModelResource } from "../model-resources/individual-resources.js";

// ── Category → ModelClass mapping ──────────────────────────────────

const CATEGORY_TO_MODEL_CLASS: Record<EntityCategory, KnownModelClassKey> = {
  BIPED: "BIPED",
  QUADRUPED: "QUADRUPED",
  FLYER: "FLYER",
  SWIMMER: "SWIMMER",
  SLITHERER: "SLITHERER",
  PROP: "PROP",
  VEHICLE: "AUTOMOBILE",
};

// ── Resource catalog entries for each category ─────────────────────

const CATEGORY_RESOURCES: Record<EntityCategory, Readonly<Record<string, IndividualModelResource>>> = {
  BIPED: BipedResource,
  QUADRUPED: QuadrupedResource,
  FLYER: FlyerResource,
  SWIMMER: SwimmerResource,
  SLITHERER: SlithererResource,
  PROP: PropResource,
  VEHICLE: AutomobileResource,
};

// ── Color palette for procedural models ────────────────────────────

const CATEGORY_COLORS: Record<EntityCategory, number> = {
  BIPED: 0x8CA6D9,
  QUADRUPED: 0xB8946B,
  FLYER: 0xD9BF66,
  SWIMMER: 0x66B3D9,
  SLITHERER: 0x80BF73,
  PROP: 0xA6A6A6,
  VEHICLE: 0xBF5959,
};

// ── Definition builders ────────────────────────────────────────────

function buildProceduralDefinition(
  resource: IndividualModelResource,
  category: EntityCategory,
  license: AssetLicense,
): ModelResourceDefinition {
  const modelClass = CATEGORY_TO_MODEL_CLASS[category];
  const color = CATEGORY_COLORS[category];

  return {
    id: `open-source/${category.toLowerCase()}/${resource.id}`,
    name: resource.name,
    modelName: resource.modelName,
    category: MODEL_CLASS_DATA[modelClass].category,
    modelClass,
    tags: ["open-source", "procedural", license.spdxId],
    treePath: ["Open Source", category, resource.name],
    classInfo: {
      joints: [...getCanonicalJoints(category)],
    },
    loader: () => {
      const result = generateProceduralModel({
        category,
        id: resource.id,
        name: resource.name,
        modelName: resource.modelName,
        color,
      });
      return {
        geometry: result.geometry,
        materials: result.materials,
        classInfo: { joints: result.joints },
      };
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Creates procedural model definitions for all known resources in a category.
 */
export function createProceduralDefinitions(
  category: EntityCategory,
  license: AssetLicense = PROCEDURAL_LICENSE,
): ModelResourceDefinition[] {
  const resources = CATEGORY_RESOURCES[category];
  return Object.values(resources).map(r => buildProceduralDefinition(r, category, license));
}

/**
 * Creates procedural model definitions for ALL categories,
 * providing a complete set of open-source replacement models.
 */
export function createAllProceduralDefinitions(): ModelResourceDefinition[] {
  const categories: EntityCategory[] = [
    "BIPED", "QUADRUPED", "FLYER", "SWIMMER", "SLITHERER", "PROP", "VEHICLE",
  ];
  return categories.flatMap(cat => createProceduralDefinitions(cat));
}

/**
 * Creates model definitions from the given provider options,
 * falling back to procedural generation for any missing sources.
 */
export function createModelDefinitions(options: ModelProviderOptions = {}): ModelResourceDefinition[] {
  const fallback = options.fallbackToProcedural ?? true;
  const sourcesByCategory = new Map<EntityCategory, ModelProviderSource[]>();

  for (const source of options.sources ?? []) {
    const list = sourcesByCategory.get(source.category) ?? [];
    list.push(source);
    sourcesByCategory.set(source.category, list);
  }

  const definitions: ModelResourceDefinition[] = [];

  if (fallback) {
    // Generate procedural definitions for all categories not covered by sources
    const allCategories: EntityCategory[] = [
      "BIPED", "QUADRUPED", "FLYER", "SWIMMER", "SLITHERER", "PROP", "VEHICLE",
    ];
    for (const cat of allCategories) {
      if (!sourcesByCategory.has(cat)) {
        definitions.push(...createProceduralDefinitions(cat));
      }
    }
  }

  return definitions;
}

/**
 * Returns summary statistics about what the open-source pipeline provides.
 */
export function getOpenSourcePipelineSummary(): {
  totalDefinitions: number;
  byCategory: Record<string, number>;
  license: string;
} {
  const allDefs = createAllProceduralDefinitions();
  const byCategory: Record<string, number> = {};
  for (const def of allDefs) {
    byCategory[def.category] = (byCategory[def.category] ?? 0) + 1;
  }
  return {
    totalDefinitions: allDefs.length,
    byCategory,
    license: PROCEDURAL_LICENSE.spdxId,
  };
}
