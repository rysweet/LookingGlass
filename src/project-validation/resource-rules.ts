import {
  describeNode,
  elementsByTagName,
  getProperty,
  looksLikeArchivePath,
  pushError,
  type ProjectValidationError,
  type ValidationContext,
} from "./shared.js";

function getPropertyValue(property: Element): string | null {
  const valueNode = property.getElementsByTagName("value")[0];
  return valueNode?.textContent?.trim() ?? null;
}

export function validateResourceReferences(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  if (!context.hasResourceInventory) {
    return;
  }

  for (const node of elementsByTagName(context.doc, "node")) {
    for (const propertyName of ["texturePath", "resourcePath", "audioPath"]) {
      const property = getProperty(node, propertyName);
      const value = property ? getPropertyValue(property) : null;
      if (!value || !looksLikeArchivePath(value)) {
        continue;
      }
      if (!context.availableResources.has(value)) {
        pushError(
          context,
          errors,
          property ?? node,
          "missing-resource-reference",
          `${describeNode(node)} ${propertyName} references missing resource ${value}.`,
        );
      }
    }

    for (const ref of elementsByTagName(node, "resourceReference")) {
      const resourceName = ref.getAttribute("name")?.trim() ?? "";
      if (resourceName && looksLikeArchivePath(resourceName) && !context.availableResources.has(resourceName)) {
        pushError(
          context,
          errors,
          ref,
          "missing-resource-reference",
          `resource reference points to missing resource ${resourceName}.`,
        );
      }
    }
  }
}
