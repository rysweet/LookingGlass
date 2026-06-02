# Sample 3D Assets

Minimal proof-of-concept glTF 2.0 files demonstrating the asset format and
joint naming conventions used by the Alice web prototype's open-asset pipeline.

## Files

| File | Category | Description |
| --- | --- | --- |
| `biped-placeholder.gltf` | Biped | Humanoid skeleton: ROOT → SPINE → NECK → HEAD + arms and legs (18 joints) |
| `quadruped-placeholder.gltf` | Quadruped | Four-legged animal: ROOT → SPINE → NECK → HEAD + 4 legs + tail (22 joints) |
| `prop-placeholder.gltf` | Prop | Simple object with ROOT joint only |

## Format

All files use glTF 2.0 with embedded binary data (base64 data URIs). Each file
contains:

- A mesh with position and normal attributes
- A skin with named joints following Alice's canonical naming convention
- A PBR material with category-appropriate colors

## Usage

These files can be:

1. **Loaded directly** by any glTF 2.0 viewer (e.g., Three.js, Babylon.js,
   [glTF Viewer](https://gltf-viewer.donmccurdy.com/))
2. **Parsed by the open-asset pipeline** using `importGltfData()` from
   `src/open-asset-pipeline/gltf-loader.ts`
3. **Used as templates** for creating production-quality replacement assets

## License

CC0-1.0 (Public Domain)

## See Also

- [Open-Asset Pipeline docs](../../docs/open-asset-pipeline.md)
- [Tutorial: Adding 3D Models](../../docs/tutorial-adding-3d-models.md)
- [Open-Source 3D Alternatives](../../docs/open-source-3d-alternatives.md)
