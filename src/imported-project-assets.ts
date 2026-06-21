import type {
  AliceMaterialBinding,
  AliceObject,
  AliceProject,
  ImportedProjectAsset,
} from "./a3p-parser.js";

export type { AliceMaterialBinding, ImportedProjectAsset };

export const MAX_IMPORTED_ASSET_BYTES = 25 * 1024 * 1024;

type ImportedAssetKind = ImportedProjectAsset["kind"];

const MODEL_CONTENT_TYPES = new Map([
  [".glb", "model/gltf-binary"],
  [".gltf", "model/gltf+json"],
]);

const TEXTURE_CONTENT_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

export interface ImportProjectAssetInput {
  project: AliceProject;
  resources: Map<string, Uint8Array>;
  kind: ImportedAssetKind;
  fileName: string;
  displayName?: string;
  bytes: Uint8Array;
}

export interface ApplyTextureBindingInput {
  objectName: string;
  textureResourceId: string;
  target: string;
}

export class ImportedProjectAssetError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImportedProjectAssetError";
    this.status = status;
  }
}

export function importProjectAsset(input: ImportProjectAssetInput): ImportedProjectAsset {
  const { extension, contentType } = validateUploadedAsset(input.kind, input.fileName, input.bytes);
  const baseName = normalizedBaseName(input.fileName, input.kind);
  const importedAssets = ensureImportedAssets(input.project);
  const candidateBase = uniqueAssetBase(baseName, extension, input.kind, importedAssets, input.resources);
  const fileName = `${candidateBase}${extension}`;
  const folder = input.kind === "model" ? "models" : "textures";
  const asset: ImportedProjectAsset = {
    id: `project/${folder}/${fileName}`,
    kind: input.kind,
    name: normalizedDisplayName(input.displayName, candidateBase),
    fileName,
    resourcePath: `resources/${folder}/${fileName}`,
    contentType,
    byteLength: input.bytes.byteLength,
  };

  input.resources.set(asset.resourcePath, new Uint8Array(input.bytes));
  importedAssets.push(asset);
  return asset;
}

export function applyTextureBinding(
  project: AliceProject,
  input: ApplyTextureBindingInput,
): AliceObject {
  if (input.target !== "surface") {
    throw new ImportedProjectAssetError(`Unsupported material target: ${input.target || "(empty)"}`);
  }

  const object = project.sceneObjects.find((candidate) => candidate.name === input.objectName);
  if (!object) {
    throw new ImportedProjectAssetError(`Scene object not found: ${input.objectName}`, 404);
  }

  const texture = (project.importedAssets ?? []).find((asset) => asset.id === input.textureResourceId);
  if (!texture || texture.kind !== "texture") {
    throw new ImportedProjectAssetError(`Texture asset not found: ${input.textureResourceId}`);
  }

  const nextBinding: AliceMaterialBinding = {
    target: "surface",
    textureResourceId: texture.id,
  };
  const otherBindings = (object.materialBindings ?? [])
    .filter((binding) => binding.target !== nextBinding.target);
  object.materialBindings = [...otherBindings, nextBinding];
  return {
    ...object,
    materialBindings: object.materialBindings.map((binding) => ({ ...binding })),
  };
}

export function importedAssetName(project: AliceProject, resourceId: string): string {
  return project.importedAssets?.find((asset) => asset.id === resourceId)?.name ?? resourceId;
}

function validateUploadedAsset(
  kind: ImportedAssetKind,
  fileName: string,
  bytes: Uint8Array,
): { extension: string; contentType: string } {
  if (hasUnsafeFilenameCharacters(fileName)) {
    throw new ImportedProjectAssetError(`Unsafe filename: ${fileName}`);
  }
  if (bytes.byteLength === 0) {
    throw new ImportedProjectAssetError("Imported asset is empty.");
  }
  if (bytes.byteLength > MAX_IMPORTED_ASSET_BYTES) {
    throw new ImportedProjectAssetError(
      `Imported asset is too large. Maximum size is ${MAX_IMPORTED_ASSET_BYTES} bytes.`,
    );
  }

  const extension = extractExtension(fileName);
  const contentType = contentTypesForKind(kind).get(extension);
  if (!contentType) {
    throw new ImportedProjectAssetError(`Unsupported ${kind} file type: ${extension || "(none)"}`);
  }
  return { extension, contentType };
}

function ensureImportedAssets(project: AliceProject): ImportedProjectAsset[] {
  project.importedAssets ??= [];
  return project.importedAssets;
}

function contentTypesForKind(kind: ImportedAssetKind): Map<string, string> {
  return kind === "model" ? MODEL_CONTENT_TYPES : TEXTURE_CONTENT_TYPES;
}

function hasUnsafeFilenameCharacters(fileName: string): boolean {
  return (
    fileName.length === 0 ||
    fileName !== fileName.trim() ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName.includes("..") ||
    /[\u0000-\u001f\u007f]/.test(fileName)
  );
}

function extractExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === fileName.length - 1) return "";
  return fileName.slice(lastDot).toLowerCase();
}

function normalizedBaseName(fileName: string, kind: ImportedAssetKind): string {
  const extension = extractExtension(fileName);
  const rawBase = extension ? fileName.slice(0, -extension.length) : fileName;
  const baseName = slugify(rawBase);
  if (!baseName) {
    throw new ImportedProjectAssetError(`Empty asset name for ${kind} import.`);
  }
  return baseName;
}

function normalizedDisplayName(displayName: string | undefined, fallbackBase: string): string {
  const rawName = displayName?.trim() || fallbackBase;
  const words = rawName
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return fallbackBase;
  }
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function uniqueAssetBase(
  baseName: string,
  extension: string,
  kind: ImportedAssetKind,
  importedAssets: ImportedProjectAsset[],
  resources: Map<string, Uint8Array>,
): string {
  const folder = kind === "model" ? "models" : "textures";
  for (let index = 1; index < 10000; index += 1) {
    const candidate = index === 1 ? baseName : `${baseName}-${index}`;
    const resourcePath = `resources/${folder}/${candidate}${extension}`;
    const id = `project/${folder}/${candidate}${extension}`;
    if (!resources.has(resourcePath) && !importedAssets.some((asset) => asset.id === id || asset.resourcePath === resourcePath)) {
      return candidate;
    }
  }
  throw new ImportedProjectAssetError(`Could not create a unique ${kind} asset name for ${baseName}.`);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
