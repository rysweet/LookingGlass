import type { AliceProject, AliceTypeDefinition } from "./a3p-parser.js";
import type { AliceProjectArchive } from "./project-io.js";
import { getCurrentAliceVersion, type ProjectVersionInfo } from "./project-migration.js";
import { localizeUiString } from "./localization.js";

export interface ProjectTemplateOptions {
  projectName?: string;
  locale?: string | null;
}

export interface ProjectTemplateDescriptor {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface ProjectTemplateDefinition extends ProjectTemplateDescriptor {
  createProject(options?: ProjectTemplateOptions): AliceProject;
}

function defaultVersionInfo(): ProjectVersionInfo {
  const version = getCurrentAliceVersion();
  return {
    originalAliceVersion: version,
    detectedAliceVersion: version,
    manifestVersion: null,
    xmlVersion: null,
    versionSource: "default",
    migrated: false,
    migrationSteps: [],
  };
}

function createProgramType(): AliceTypeDefinition {
  return {
    name: "Program",
    superTypeName: "org.lgna.story.SProgram",
    fields: [{ name: "myScene", typeName: "Scene", resourceType: null, initializer: null }],
    methods: [],
    constructors: [],
  };
}

function createSceneType(): AliceTypeDefinition {
  return {
    name: "Scene",
    superTypeName: "org.lgna.story.SScene",
    fields: [],
    methods: [],
    constructors: [],
  };
}

export function createEmptyWorldProject(options: ProjectTemplateOptions = {}): AliceProject {
  return {
    version: getCurrentAliceVersion(),
    projectName: options.projectName ?? "Untitled",
    sceneObjects: [],
    methods: [],
    types: [createProgramType(), createSceneType()],
    jointHierarchy: [],
    boundingBoxes: {},
    textureRefs: [],
  };
}

export const EMPTY_WORLD_TEMPLATE: ProjectTemplateDefinition = {
  id: "empty-world",
  name: "Empty World",
  description: "Blank starter project with Program and Scene types but no scene objects.",
  createProject(options: ProjectTemplateOptions = {}): AliceProject {
    return createEmptyWorldProject(options);
  },
};

const TEMPLATE_REGISTRY: readonly ProjectTemplateDefinition[] = [EMPTY_WORLD_TEMPLATE];

export function listProjectTemplates(locale: string | null = null): ProjectTemplateDescriptor[] {
  return TEMPLATE_REGISTRY.map((template) => ({
    id: template.id,
    name: template.id === "empty-world" ? localizeUiString("emptyWorld", locale) : template.name,
    description: template.description,
  }));
}

export function getProjectTemplate(id: string): ProjectTemplateDefinition | null {
  return TEMPLATE_REGISTRY.find((template) => template.id === id) ?? null;
}

export function createProjectFromTemplate(
  id: string,
  options: ProjectTemplateOptions = {},
): AliceProjectArchive {
  const template = getProjectTemplate(id);
  if (!template) {
    throw new Error(`Unknown project template: ${id}`);
  }

  return {
    project: template.createProject(options),
    manifest: null,
    resources: new Map(),
    resourceEntries: [],
    thumbnail: null,
    versionInfo: defaultVersionInfo(),
  };
}
