import type { BoundingBox, JointNode, Orientation, Position } from "../story-api";
import type { MaterialDefinition } from "../materials";
import {
  MODEL_CLASS_DATA,
  type KnownModelClassKey,
  type LoadedModelResource,
  type ModelClassData,
  type ModelClassInfo,
  type ModelClassInfoSource,
  type ModelGeometryData,
  type ModelJointDefinition,
  type ModelResourceDefinition,
  type ModelResourceSummary,
} from "./definitions.js";

const ARRAY_PATTERN = /(_\d*$)/i;
const ZERO_POSITION: Position = { x: 0, y: 0, z: 0 };
const IDENTITY_ORIENTATION: Orientation = { x: 0, y: 0, z: 0, w: 1 };

function clonePosition(position: Position): Position {
  return { ...position };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { ...orientation };
}

export function cloneBoundingBox(bounds: BoundingBox | null | undefined): BoundingBox | null {
  if (!bounds) {
    return null;
  }
  return {
    min: { ...bounds.min },
    max: { ...bounds.max },
  };
}

export function cloneGeometry(geometry: ModelGeometryData): ModelGeometryData {
  return {
    vertices: [...geometry.vertices],
    indices: [...geometry.indices],
    ...(geometry.normals ? { normals: [...geometry.normals] } : {}),
    ...(geometry.uvs ? { uvs: [...geometry.uvs] } : {}),
    ...(geometry.bounds !== undefined ? { bounds: cloneBoundingBox(geometry.bounds) } : {}),
  };
}

export function cloneJointDefinition(joint: ModelJointDefinition): ModelJointDefinition {
  return {
    name: joint.name,
    parentName: joint.parentName,
    ...(joint.localTransform
      ? {
        localTransform: {
          position: clonePosition(joint.localTransform.position),
          orientation: cloneOrientation(joint.localTransform.orientation),
        },
      }
      : {}),
    ...(joint.bounds !== undefined ? { bounds: cloneBoundingBox(joint.bounds) } : {}),
  };
}

function cloneJointNode(node: JointNode): JointNode {
  return {
    name: node.name,
    parentName: node.parentName,
    localTransform: {
      position: clonePosition(node.localTransform.position),
      orientation: cloneOrientation(node.localTransform.orientation),
    },
    children: node.children.map(cloneJointNode),
  };
}

export function cloneMaterialDefinitions(materials: readonly MaterialDefinition[]): MaterialDefinition[] {
  return materials.map((material) => ({ ...material }));
}

export function cloneTextureRecord(textures: Readonly<Record<string, Uint8Array>>): Record<string, Uint8Array> {
  const result: Record<string, Uint8Array> = {};
  for (const [key, value] of Object.entries(textures)) {
    result[key] = new Uint8Array(value);
  }
  return result;
}

export function cloneSummary(summary: ModelResourceSummary): ModelResourceSummary {
  return {
    ...summary,
    tags: [...summary.tags],
    treePath: [...summary.treePath],
    modelClass: { ...summary.modelClass },
  };
}

export function cloneLoadedResource(resource: LoadedModelResource): LoadedModelResource {
  return {
    ...cloneSummary(resource),
    geometry: cloneGeometry(resource.geometry),
    materials: cloneMaterialDefinitions(resource.materials),
    textures: cloneTextureRecord(resource.textures),
    thumbnail: resource.thumbnail ? new Uint8Array(resource.thumbnail) : null,
    classInfo: {
      modelClass: { ...resource.classInfo.modelClass },
      joints: resource.classInfo.joints.map(cloneJointDefinition),
      hierarchy: resource.classInfo.hierarchy.map(cloneJointNode),
      jointArrays: Object.fromEntries(
        Object.entries(resource.classInfo.jointArrays).map(([name, entries]) => [name, [...entries]]),
      ),
      boundingBox: cloneBoundingBox(resource.classInfo.boundingBox),
    },
  };
}

export function resolveModelClass(modelClass: KnownModelClassKey | ModelClassData): ModelClassData {
  if (typeof modelClass === "string") {
    return { ...MODEL_CLASS_DATA[modelClass] };
  }
  return { ...modelClass };
}

export function normalizeTreePath(definition: ModelResourceDefinition): string[] {
  return definition.treePath && definition.treePath.length > 0
    ? definition.treePath.map((segment) => segment.trim()).filter(Boolean)
    : [definition.category];
}

export function computeBoundsFromGeometry(geometry: ModelGeometryData): BoundingBox | null {
  if (geometry.bounds !== undefined) {
    return cloneBoundingBox(geometry.bounds);
  }
  if (geometry.vertices.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < geometry.vertices.length; index += 3) {
    const x = geometry.vertices[index];
    const y = geometry.vertices[index + 1];
    const z = geometry.vertices[index + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

function defaultJointTransform(joint: ModelJointDefinition): { position: Position; orientation: Orientation } {
  return {
    position: clonePosition(joint.localTransform?.position ?? ZERO_POSITION),
    orientation: cloneOrientation(joint.localTransform?.orientation ?? IDENTITY_ORIENTATION),
  };
}

export function enumToCamelCase(enumName: string, startWithLowerCase = false): string {
  let result = "";
  for (let index = 0; index < enumName.length; index += 1) {
    if (index === 0) {
      result += startWithLowerCase
        ? enumName[index].toLowerCase()
        : enumName[index].toUpperCase();
    } else if (enumName[index - 1] === "_") {
      result += enumName[index].toUpperCase();
    } else if (enumName[index] !== "_") {
      result += enumName[index].toLowerCase();
    }
  }
  return result;
}

export function camelCaseToEnum(name: string): string {
  let result = "";
  for (let index = 0; index < name.length; index += 1) {
    if (index !== 0 && /[A-Z]/.test(name[index])) {
      result += "_";
    }
    result += name[index].toUpperCase();
  }
  return result;
}

export function isEnumName(name: string): boolean {
  return [...name].every((character) => character === "_" || /[A-Z0-9]/.test(character));
}

export function makeEnumName(name: string): string {
  if (isEnumName(name)) {
    return name;
  }
  return name.includes("_") ? name.toUpperCase() : camelCaseToEnum(name);
}

export function getDefaultTextureEnumName(_resourceName: string | null | undefined): string {
  return "DEFAULT";
}

function createTextureBaseName(modelName: string | null, textureName: string | null): string | null {
  if (modelName === null) {
    return null;
  }
  let normalizedTextureName = textureName;
  if (normalizedTextureName === null) {
    normalizedTextureName = "_cls";
  } else if (
    normalizedTextureName.toUpperCase() === getDefaultTextureEnumName(modelName)
    || modelName.toLowerCase() === enumToCamelCase(normalizedTextureName).toLowerCase()
    || normalizedTextureName.toUpperCase() === makeEnumName(modelName)
  ) {
    normalizedTextureName = "";
  } else if (normalizedTextureName !== "") {
    normalizedTextureName = `_${makeEnumName(normalizedTextureName)}`;
  }
  return `${modelName.toLowerCase()}${normalizedTextureName}`;
}

export function getThumbnailResourceFileName(modelName: string | null, textureName: string | null): string | null {
  const baseName = createTextureBaseName(modelName, textureName);
  return baseName ? `${baseName}.png` : null;
}

export function getTextureResourceFileName(modelName: string, textureName: string | null, extension = "a3t"): string {
  return `${createTextureBaseName(modelName, textureName)}.${extension}`;
}

export function getVisualResourceFileNameFromModelName(modelName: string, extension = "a3r"): string {
  return `${modelName.toLowerCase()}.${extension}`;
}

export function getArrayIndexForJoint(jointName: string): number {
  if (!ARRAY_PATTERN.test(jointName)) {
    return -1;
  }
  const indexString = jointName.slice(jointName.lastIndexOf("_") + 1).replace(/^0+/, "");
  if (indexString.length === 0) {
    return 0;
  }
  const parsed = Number.parseInt(indexString, 10);
  return Number.isNaN(parsed) ? -1 : parsed;
}

export function getArrayNameForJoint(
  jointName: string,
  customArrayNameMap: Readonly<Record<string, string>> = {},
  namesToSkip: readonly string[] = [],
): string | null {
  if (!ARRAY_PATTERN.test(jointName)) {
    return null;
  }
  let name = jointName.slice(0, jointName.lastIndexOf("_"));
  if (name in customArrayNameMap) {
    name = customArrayNameMap[name]!;
  }
  return namesToSkip.some((candidate) => candidate.toLowerCase() === name.toLowerCase())
    ? null
    : name;
}

export function hasArray(
  arrayName: string,
  joints: readonly ModelJointDefinition[],
  customArrayNameMap: Readonly<Record<string, string>> = {},
  namesToSkip: readonly string[] = [],
): boolean {
  return joints.some((joint) => getArrayNameForJoint(joint.name, customArrayNameMap, namesToSkip) === arrayName);
}

export function getArrayEntries(
  jointNames: readonly string[],
  customArrayNameMap: Readonly<Record<string, string>> = {},
  jointsToSuppress: readonly string[] = [],
  arrayNamesToSkip: readonly string[] = [],
): Record<string, string[]> {
  const suppressed = new Set(jointsToSuppress.map((name) => name.toLowerCase()));
  const entries: Record<string, string[]> = {};

  for (const jointName of jointNames) {
    if (suppressed.has(jointName.toLowerCase())) {
      continue;
    }
    const arrayName = getArrayNameForJoint(jointName, customArrayNameMap, arrayNamesToSkip);
    if (!arrayName) {
      continue;
    }
    (entries[arrayName] ??= []).push(jointName);
  }

  for (const [arrayName, names] of Object.entries(entries)) {
    names.sort((left, right) => {
      const leftIndex = getArrayIndexForJoint(left);
      const rightIndex = getArrayIndexForJoint(right);
      if (leftIndex === rightIndex) {
        throw new Error(`Duplicate array index detected for ${arrayName}: ${left} and ${right}`);
      }
      return leftIndex - rightIndex;
    });
  }

  return entries;
}

export function isRootJoint(jointName: string): boolean {
  return jointName.toLowerCase() === "root";
}

function hasParent(sorted: readonly ModelJointDefinition[], parentName: string | null): boolean {
  if (!parentName) {
    return true;
  }
  return sorted.some((entry) => entry.name.toLowerCase() === parentName.toLowerCase());
}

export function makeCodeReadyJointDefinitions(
  source: readonly ModelJointDefinition[],
  removeRootJoints = false,
): ModelJointDefinition[] {
  const cleaned: ModelJointDefinition[] = [];
  for (const entry of source) {
    const cloned = cloneJointDefinition(entry);
    if (removeRootJoints) {
      if (isRootJoint(cloned.name) && !cloned.parentName) {
        continue;
      }
      if (cloned.parentName && isRootJoint(cloned.parentName)) {
        cleaned.push({ ...cloned, parentName: null });
        continue;
      }
    }
    cleaned.push(cloned);
  }

  const sorted: ModelJointDefinition[] = [];
  while (sorted.length !== cleaned.length) {
    const before = sorted.length;
    for (const entry of cleaned) {
      if (!sorted.includes(entry) && hasParent(sorted, entry.parentName)) {
        sorted.push(entry);
      }
    }
    if (before === sorted.length) {
      const unresolved = cleaned
        .filter((entry) => !sorted.includes(entry))
        .map((entry) => `${entry.name} -> ${entry.parentName}`)
        .join(", ");
      throw new Error(`Joint tree cannot be ordered because one or more parents are missing or cyclic: ${unresolved}`);
    }
  }

  return sorted;
}

export function buildJointHierarchy(joints: readonly ModelJointDefinition[]): JointNode[] {
  const ordered = makeCodeReadyJointDefinitions(joints);
  const nodeMap = new Map<string, JointNode>();
  const roots: JointNode[] = [];

  for (const joint of ordered) {
    const node: JointNode = {
      name: joint.name,
      parentName: joint.parentName,
      localTransform: defaultJointTransform(joint),
      children: [],
    };
    nodeMap.set(joint.name.toUpperCase(), node);
    if (joint.parentName) {
      const parent = nodeMap.get(joint.parentName.toUpperCase());
      if (!parent) {
        throw new Error(`Missing parent joint '${joint.parentName}' for '${joint.name}'`);
      }
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.map(cloneJointNode);
}

export function normalizeClassInfo(
  modelClass: ModelClassData,
  geometry: ModelGeometryData,
  classInfo: ModelClassInfoSource | undefined,
): ModelClassInfo {
  const joints = makeCodeReadyJointDefinitions(classInfo?.joints ?? [], classInfo?.removeRootJoints ?? false);
  return {
    modelClass: { ...modelClass },
    joints,
    hierarchy: buildJointHierarchy(joints),
    jointArrays: getArrayEntries(
      joints.map((joint) => joint.name),
      classInfo?.customArrayNameMap,
      classInfo?.suppressedJoints,
      classInfo?.arrayNamesToSkip,
    ),
    boundingBox: cloneBoundingBox(classInfo?.boundingBox) ?? computeBoundsFromGeometry(geometry),
  };
}

export function cloneClassInfoSource(source: ModelClassInfoSource): ModelClassInfoSource {
  return {
    ...source,
    ...(source.joints ? { joints: source.joints.map(cloneJointDefinition) } : {}),
    ...(source.boundingBox !== undefined ? { boundingBox: cloneBoundingBox(source.boundingBox) } : {}),
    ...(source.customArrayNameMap ? { customArrayNameMap: { ...source.customArrayNameMap } } : {}),
    ...(source.suppressedJoints ? { suppressedJoints: [...source.suppressedJoints] } : {}),
    ...(source.arrayNamesToSkip ? { arrayNamesToSkip: [...source.arrayNamesToSkip] } : {}),
  };
}

