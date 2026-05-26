import type {
  AliceFieldDefinition,
  AliceMethod,
  AliceProject,
  AliceStatement,
  AliceTypeDefinition,
} from "./a3p-parser.js";
import {
  createCurriculumProgress,
  getMissingConceptsForLesson,
  isLessonUnlocked,
} from "./curriculum.js";
import type { CurriculumMetadata } from "./curriculum.js";

export interface MethodDocumentation {
  name: string;
  ownerType: string;
  kind: "procedure" | "function";
  signature: string;
  statementCount: number;
  statementKinds: string[];
  summary: string;
}

export interface FieldDocumentation {
  name: string;
  ownerType: string;
  kind: "scene-object" | "custom-field";
  typeName: string;
  resourceType: string | null;
  initializer: string | null;
  summary: string;
}

export interface LessonPlanEntry {
  lessonId: string;
  lessonName: string;
  unlocked: boolean;
  recommended: boolean;
  coveredConceptIds: string[];
  missingConceptIds: string[];
  objectives: string[];
}

export interface LessonPlan {
  coveredConceptIds: string[];
  recommendedLessonIds: string[];
  entries: LessonPlanEntry[];
}

export interface ProjectDocumentation {
  methods: MethodDocumentation[];
  fields: FieldDocumentation[];
  readme: string;
  apiReference: string;
  lessonPlan: LessonPlan;
}

function walkStatements(
  statements: readonly AliceStatement[],
  visitor: (statement: AliceStatement) => void,
): void {
  for (const statement of statements) {
    visitor(statement);
    for (const nested of [
      statement.body,
      statement.ifBody,
      statement.elseBody,
      statement.tryBody,
      statement.catchBody,
      statement.defaultCase ?? undefined,
    ]) {
      if (nested) {
        walkStatements(nested, visitor);
      }
    }
    for (const entry of statement.cases ?? []) {
      walkStatements(entry.body, visitor);
    }
  }
}

function countStatements(statements: readonly AliceStatement[]): number {
  let count = 0;
  walkStatements(statements, () => {
    count += 1;
  });
  return count;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function collectStatementKinds(statements: readonly AliceStatement[]): string[] {
  const kinds: string[] = [];
  walkStatements(statements, (statement) => {
    kinds.push(statement.kind);
  });
  return uniqueSorted(kinds);
}

function methodSignature(method: AliceMethod): string {
  const parameterList = method.parameters.map((parameter) => `${parameter.name}: ${parameter.type}`).join(", ");
  const prefix = method.isFunction ? `${method.returnType} ` : "void ";
  return `${prefix}${method.name}(${parameterList})`;
}

function summarizeMethod(method: AliceMethod): string {
  const statementKinds = collectStatementKinds(method.statements);
  const statementCount = countStatements(method.statements);
  const role = method.isFunction ? "Function" : "Procedure";
  const parameterCount = method.parameters.length;
  const parameterText = parameterCount === 1 ? "1 parameter" : `${parameterCount} parameters`;
  const statementText = statementCount === 1 ? "1 statement" : `${statementCount} statements`;
  const constructsText = statementKinds.length > 0 ? statementKinds.join(", ") : "no executable statements";
  return `${role} ${method.name} uses ${statementText}, accepts ${parameterText}, and covers ${constructsText}.`;
}

function documentMethod(ownerType: string, method: AliceMethod): MethodDocumentation {
  return {
    name: method.name,
    ownerType,
    kind: method.isFunction ? "function" : "procedure",
    signature: methodSignature(method),
    statementCount: countStatements(method.statements),
    statementKinds: collectStatementKinds(method.statements),
    summary: summarizeMethod(method),
  };
}

function summarizeSceneObjectField(project: AliceProject, typeName: string, resourceType: string | null): string {
  const resourceText = resourceType ? ` backed by ${resourceType}` : "";
  return `Scene field in ${project.projectName} uses ${typeName}${resourceText}.`;
}

function summarizeCustomField(typeName: string, initializer: string | null): string {
  return initializer
    ? `Custom field of type ${typeName} initialized with ${initializer}.`
    : `Custom field of type ${typeName} without an initializer.`;
}

function documentCustomTypeFields(type: AliceTypeDefinition): FieldDocumentation[] {
  return (type.fields ?? []).map((field: AliceFieldDefinition) => {
    const resolvedTypeName = field.typeName ?? "unknown";
    return {
      name: field.name,
      ownerType: type.name,
      kind: "custom-field",
      typeName: resolvedTypeName,
      resourceType: field.resourceType ?? null,
      initializer: field.initializer ?? null,
      summary: summarizeCustomField(resolvedTypeName, field.initializer ?? null),
    };
  });
}

export function documentMethods(project: AliceProject): MethodDocumentation[] {
  const projectMethods = project.methods.map((method) => documentMethod(project.projectName, method));
  const customTypeMethods = (project.types ?? []).flatMap((type) => [
    ...(type.constructors ?? []).map((method) => documentMethod(type.name, { ...method, isFunction: false, returnType: "void" })),
    ...(type.methods ?? []).map((method) => documentMethod(type.name, method)),
  ]);
  return [...projectMethods, ...customTypeMethods];
}

export function documentFields(project: AliceProject): FieldDocumentation[] {
  const sceneFields: FieldDocumentation[] = project.sceneObjects.map((sceneObject) => ({
    name: sceneObject.name,
    ownerType: project.projectName,
    kind: "scene-object",
    typeName: sceneObject.typeName,
    resourceType: sceneObject.resourceType,
    initializer: null,
    summary: summarizeSceneObjectField(project, sceneObject.typeName, sceneObject.resourceType),
  }));
  const customFields = (project.types ?? []).flatMap(documentCustomTypeFields);
  return [...sceneFields, ...customFields];
}

function collectCoveredConceptIds(project: AliceProject): string[] {
  const statementKinds = new Set<string>();
  for (const method of documentMethods(project)) {
    for (const kind of method.statementKinds) {
      statementKinds.add(kind);
    }
  }

  const covered = new Set<string>();
  if (project.sceneObjects.length > 0) {
    covered.add("scene");
    covered.add("object");
  }
  if (project.methods.length > 0 || (project.types ?? []).some((type) => (type.methods?.length ?? 0) > 0)) {
    covered.add("method");
  }
  if (statementKinds.has("DoInOrder") || statementKinds.has("DoTogether")) {
    covered.add("sequence");
  }
  if ([...statementKinds].some((kind) => kind.includes("Loop") || kind.includes("Each"))) {
    covered.add("loop");
  }
  if (statementKinds.has("IfElse") || statementKinds.has("Switch")) {
    covered.add("condition");
  }
  if ([...statementKinds].some((kind) => kind.includes("Variable"))) {
    covered.add("variable");
  }
  if (project.methods.some((method) => method.isFunction) || (project.types ?? []).some((type) =>
    (type.methods ?? []).some((method) => method.isFunction))) {
    covered.add("function");
  }
  return [...covered].sort((left, right) => left.localeCompare(right));
}

export function generateLessonPlan(
  project: AliceProject,
  curriculum: CurriculumMetadata,
): LessonPlan {
  const coveredConceptIds = collectCoveredConceptIds(project);
  const progress = createCurriculumProgress(coveredConceptIds);
  const entries: LessonPlanEntry[] = curriculum.lessons.map((lesson) => {
    const missingConceptIds = getMissingConceptsForLesson(curriculum, progress, lesson.id)
      .map((concept) => concept.id);
    const coveredForLesson = lesson.requiredConcepts.filter((conceptId) => coveredConceptIds.includes(conceptId));
    const unlocked = isLessonUnlocked(curriculum, progress, lesson.id);
    return {
      lessonId: lesson.id,
      lessonName: lesson.name,
      unlocked,
      recommended: unlocked && missingConceptIds.length > 0,
      coveredConceptIds: coveredForLesson,
      missingConceptIds,
      objectives: [...lesson.objectives],
    };
  });

  return {
    coveredConceptIds,
    recommendedLessonIds: entries.filter((entry) => entry.recommended).map((entry) => entry.lessonId),
    entries,
  };
}

export function generateProjectReadme(
  project: AliceProject,
  curriculum?: CurriculumMetadata,
): string {
  const methods = documentMethods(project);
  const fields = documentFields(project);
  const lines = [
    `# ${project.projectName}`,
    "",
    "## Overview",
    `- Alice version: ${project.version}`,
    `- Scene objects: ${project.sceneObjects.length}`,
    `- Documented fields: ${fields.length}`,
    `- Documented methods: ${methods.length}`,
    `- Custom types: ${(project.types ?? []).length}`,
    "",
    "## Project Structure",
    ...project.sceneObjects.map((sceneObject) => `- ${sceneObject.name}: ${sceneObject.typeName}`),
    ...(project.types ?? []).map((type) => `- Custom type ${type.name}`),
    "",
    "## Methods",
    ...methods.map((method) => `- ${method.signature}`),
  ];

  if (curriculum) {
    const lessonPlan = generateLessonPlan(project, curriculum);
    lines.push(
      "",
      "## Curriculum Alignment",
      `- Covered concepts: ${lessonPlan.coveredConceptIds.join(", ") || "none"}`,
      `- Recommended lessons: ${lessonPlan.recommendedLessonIds.join(", ") || "none"}`,
    );
  }

  return lines.join("\n");
}

export function exportCustomTypeApiReference(project: AliceProject): string {
  const lines = ["# API Reference", ""];
  const customTypes = project.types ?? [];
  if (customTypes.length === 0) {
    lines.push("No custom types defined.");
    return lines.join("\n");
  }

  for (const type of customTypes) {
    lines.push(`## ${type.name}`);
    if (type.superTypeName) {
      lines.push(`Extends: ${type.superTypeName}`);
    }
    lines.push("");
    lines.push("### Fields");
    if ((type.fields ?? []).length === 0) {
      lines.push("- None");
    } else {
      for (const field of documentCustomTypeFields(type)) {
        lines.push(`- ${field.name}: ${field.typeName}${field.initializer ? ` = ${field.initializer}` : ""}`);
      }
    }
    lines.push("");
    lines.push("### Methods");
    const methods = [
      ...(type.constructors ?? []).map((method) => documentMethod(type.name, { ...method, isFunction: false, returnType: "void" })),
      ...(type.methods ?? []).map((method) => documentMethod(type.name, method)),
    ];
    if (methods.length === 0) {
      lines.push("- None");
    } else {
      for (const method of methods) {
        lines.push(`- ${method.signature}`);
        lines.push(`  - ${method.summary}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function generateProjectDocumentation(
  project: AliceProject,
  curriculum: CurriculumMetadata,
): ProjectDocumentation {
  const methods = documentMethods(project);
  const fields = documentFields(project);
  return {
    methods,
    fields,
    readme: generateProjectReadme(project, curriculum),
    apiReference: exportCustomTypeApiReference(project),
    lessonPlan: generateLessonPlan(project, curriculum),
  };
}
