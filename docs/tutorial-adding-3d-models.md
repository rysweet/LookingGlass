# Tutorial: Adding Open-Source 3D Models

This guide explains how to add 3D models to the Alice web prototype using
the open-asset pipeline. Three approaches are available, from simplest to
most flexible.

## Before You Start

You need:

- A working local build (see [Getting Started](./getting-started.md))
- For Option B/C: Blender 3.0+ (for model conversion)
- For Option B: A `.glb` or `.gltf` model file

## Option A: Use Procedural Models (No External Files)

The simplest path — procedural generators create shaped silhouettes for all
seven Alice entity categories. No model files needed.

```typescript
import { createAllProceduralDefinitions } from "./open-asset-pipeline/model-provider.js";
import { ModelResourceCatalog } from "./model-resources/catalog.js";

const catalog = new ModelResourceCatalog();
const definitions = createAllProceduralDefinitions();

for (const def of definitions) {
  catalog.register(def);
}
```

Procedural models use capsules, ellipsoids, and cylinders with correct joint
hierarchies. They work for development and testing but lack visual detail.

### What You Get

- Capsule-bodied bipeds with sphere heads and cylinder limbs
- Elongated quadrupeds with four legs
- Ellipsoid flyers with flat wing planes
- Fish-shaped swimmers with fins
- Segmented slitherers
- Box props and wheeled vehicles
- Full joint hierarchies matching Alice's canonical skeleton definitions

## Option B: Load glTF Models

### Step 1 — Obtain a Model

Download a CC0-licensed model from one of these sources:

| Source | URL | Best For |
| --- | --- | --- |
| Kenney | <https://kenney.nl/assets> | All categories (CC0) |
| Quaternius | <https://quaternius.com> | Characters and animals (CC0) |
| Poly Pizza | <https://poly.pizza> | Searchable CC0 library |
| Sketchfab | <https://sketchfab.com> | Filter by CC0 license |

Download as `.glb` if available. If the model is `.fbx` or `.obj`, convert it
in Blender:

1. File → Import → FBX / OBJ
2. File → Export → glTF 2.0 (`.glb`)

### Step 2 — Ensure Correct Bone Names

Alice expects uppercase joint names following its canonical convention. You
have two options:

**Option 2a:** Rename bones in Blender's Armature edit mode:

| Blender Bone | Alice Joint |
| --- | --- |
| `Root` or `Hips` | `ROOT` |
| `Spine` | `SPINE_BASE` |
| `Head` | `HEAD` |
| `UpperArm.L` | `LEFT_SHOULDER` |
| `UpperLeg.R` | `RIGHT_HIP` |

**Option 2b:** Use our Blender export script, which renames automatically:

```bash
blender --background model.blend \
  --python scripts/blender/export-alice-gltf.py \
  -- --output ./assets/gltf --format glb
```

**Option 2c:** Provide a custom joint mapping in code (see Step 4).

### Step 3 — Place the File

Save the `.glb` file in a location accessible to your build:

```
assets/models/my-character.glb
```

Or use the Vite public directory for development:

```
public/models/my-character.glb
```

### Step 4 — Register with the Pipeline

```typescript
import { createModelDefinitions } from "./open-asset-pipeline/model-provider.js";
import { CC0_LICENSE } from "./open-asset-pipeline/types.js";
import { ModelResourceCatalog } from "./model-resources/catalog.js";

const definitions = createModelDefinitions({
  sources: [
    {
      type: "gltf",
      category: "BIPED",
      url: "/models/my-character.glb",
      license: CC0_LICENSE,
    },
  ],
  fallbackToProcedural: true, // other categories use procedural
});

const catalog = new ModelResourceCatalog();
for (const def of definitions) {
  catalog.register(def);
}
```

### Step 5 — Load the Geometry

For glTF models that need runtime loading, use the glTF loader:

```typescript
import { importGltfData, mapJointName } from "./open-asset-pipeline/gltf-loader.js";

// After parsing glTF with Three.js GLTFLoader or other parser:
const result = importGltfData(meshPrimitives, skeleton, {
  url: "/models/my-character.glb",
  scale: 1.0,
  flipZ: false,
  // Custom mapping if bones don't use Mixamo/Blender convention
  jointNameMap: {
    "MyBone_Hips": "ROOT",
    "MyBone_Spine": "SPINE_BASE",
  },
});

// result.geometry — ModelGeometryData (vertices, indices, normals)
// result.joints — ModelJointDefinition[] (name, parentName)
// result.materials — MaterialDefinition[]
```

### Step 6 — Verify

```bash
npm run dev
```

Open the browser and verify the model loads correctly. Use the browser
console to check for errors.

## Option C: Bulk Export from Blender

For multiple models in `.blend` files:

```bash
# Single file
blender --background characters.blend \
  --python scripts/blender/export-alice-gltf.py \
  -- --output ./assets/gltf --format glb

# Batch — all .blend files in a directory
for f in models/*.blend; do
  blender --background "$f" \
    --python scripts/blender/export-alice-gltf.py \
    -- --output ./assets/gltf --format glb
done
```

The export script:
1. Renames bones to Alice's canonical names (e.g., `UpperArm.L` → `LEFT_SHOULDER`)
2. Applies all mesh modifiers
3. Exports as glTF 2.0 or GLB

### Customizing the Export

Generate a custom export script programmatically:

```typescript
import { generateBlenderExportScript } from "./open-asset-pipeline/blender-pipeline.js";

const script = generateBlenderExportScript({
  outputDir: "./assets/gltf",
  format: "glb",
  applyModifiers: true,
  exportAnimations: true,
  targetCategory: "BIPED",
});

// Write script to disk, then run with Blender
```

## Adding Models to the Gallery

After registering models with the catalog, they appear in the gallery browser:

```typescript
import { createAllProceduralDefinitions } from "./open-asset-pipeline/model-provider.js";
import { ModelResourceCatalog } from "./model-resources/catalog.js";

const catalog = new ModelResourceCatalog();
for (const def of createAllProceduralDefinitions()) {
  catalog.register(def);
}

// Search the catalog
const bipeds = catalog.search({ modelClass: "BIPED" });
const openSource = catalog.search({ tags: ["open-source"] });
```

## Troubleshooting

**Model doesn't appear:**
Check the browser console for 404 errors. The `.glb` file must be accessible
at the URL specified in `url`.

**Model is too large / too small:**
Alice models are typically 1–2 units tall. Set the `scale` option when importing,
or scale your model in Blender before exporting (Apply → Scale).

**Joints don't match:**
Use `getCanonicalJoints(category)` to see the expected joint hierarchy for a
category. Compare with your model's bone names using `mapJointName()`.

```typescript
import { getCanonicalJoints } from "./open-asset-pipeline/procedural-generators.js";

const expected = getCanonicalJoints("BIPED");
console.log(expected.map(j => `${j.name} → parent: ${j.parentName}`));
```

**Wrong coordinate system:**
Set `flipZ: true` in `GltfImportOptions` if the model appears mirrored or
facing the wrong direction.

## What's Next

- [Open-Asset Pipeline reference](./open-asset-pipeline.md) — full API docs
- [Open-Source 3D Alternatives](./open-source-3d-alternatives.md) — research
  on available tools and model repositories
- [Model Resources](./model-resources.md) — catalog system internals
- [Scene Rendering](./scene-rendering.md) — camera, lights, debug visualization
