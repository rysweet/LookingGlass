import type { AliceProject } from "./a3p-parser.js";
import type { AliceProjectArchive } from "./project-io.js";
import {
  collectAvailableResources,
  collectUserTypes,
  extractXmlText,
  indexNodes,
  parseXmlString,
  type ProjectValidationOptions,
  type ProjectValidationResult,
} from "./project-validation/shared.js";
import { validateMethodInvocations } from "./project-validation/invocation-rules.js";
import { validateResourceReferences } from "./project-validation/resource-rules.js";
import { validateCircularHierarchies, validateTypeReferences } from "./project-validation/type-rules.js";

export type {
  ProjectValidationError,
  ProjectValidationOptions,
  ProjectValidationResult,
  ValidationCode,
} from "./project-validation/shared.js";

export async function validateProject(
  project: AliceProject,
  options: ProjectValidationOptions = {},
): Promise<ProjectValidationResult> {
  const xmlText = extractXmlText(project, options);
  if (!xmlText) {
    return {
      valid: false,
      errors: [{
        code: "missing-source-xml",
        message: "Project validation requires the original Alice project XML source.",
        line: 1,
        column: 1,
      }],
    };
  }

  const doc = await parseXmlString(xmlText);
  const keyMap = indexNodes(doc.documentElement);
  const context = {
    xmlText,
    doc,
    keyMap,
    userTypes: collectUserTypes(doc, keyMap),
    availableResources: collectAvailableResources(options.archive ?? null),
    hasResourceInventory: options.archive != null,
  };

  const errors = [] as ProjectValidationResult["errors"];
  validateTypeReferences(context, errors);
  validateMethodInvocations(context, errors);
  validateCircularHierarchies(context, errors);
  validateResourceReferences(context, errors);

  return {
    valid: errors.length === 0,
    errors: errors.sort((left, right) => left.line - right.line || left.column - right.column),
  };
}

export async function validateProjectArchive(archive: AliceProjectArchive): Promise<ProjectValidationResult> {
  return validateProject(archive.project, { archive });
}
