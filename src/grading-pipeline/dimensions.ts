import { countNonDefaultEntities } from "./analysis.js";
import {
  DEFAULT_GRADING_DIMENSIONS,
  type CriterionResult,
  type DimensionGradeResult,
  type GradingDimension,
  type PipelineGradeInput,
} from "./types.js";

function buildDimensionResult(dimension: GradingDimension, criteria: CriterionResult[]): DimensionGradeResult {
  const passed = criteria.every((criterion) => criterion.passed);
  const score = criteria.length === 0
    ? 0
    : criteria.filter((criterion) => criterion.passed).length / criteria.length;
  return { dimension, passed, criteria, score };
}

function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function gradeFirstLessonDimension(input: PipelineGradeInput): CriterionResult[] {
  const entityCount = countNonDefaultEntities(input.scene);
  return [{
    name: "scene-entities",
    passed: entityCount >= 1,
    message: entityCount >= 1 ? `${pluralize(entityCount, "non-default entity")} ready for the first lesson` : "no non-default scene entities found",
  }];
}

function gradeEventsDimension(input: PipelineGradeInput): CriterionResult[] {
  const eventCount = input.eventRegistrations.length;
  return [{
    name: "event-handlers",
    passed: eventCount >= 1,
    message: eventCount >= 1 ? `${pluralize(eventCount, "event handler")} found in the AST` : "no event handlers found in the AST",
  }];
}

function gradeVariablesDimension(input: PipelineGradeInput): CriterionResult[] {
  const variableCount = input.ast.variableCount;
  return [{
    name: "variable-declarations",
    passed: variableCount >= 1,
    message: variableCount >= 1 ? `${pluralize(variableCount, "variable declaration")} found in the AST` : "no variable declarations found in the AST",
  }];
}

function gradeLoopsDimension(input: PipelineGradeInput): CriterionResult[] {
  const loopCount = input.ast.loopCount;
  return [{
    name: "loop-statements",
    passed: loopCount >= 1,
    message: loopCount >= 1 ? `${pluralize(loopCount, "loop statement")} found in the AST` : "no loop statements found in the AST",
  }];
}

function gradeFunctionsDimension(input: PipelineGradeInput): CriterionResult[] {
  const functionCount = input.ast.functionCount;
  return [{
    name: "functions",
    passed: functionCount >= 1,
    message: functionCount >= 1 ? `${pluralize(functionCount, "function")} found in the AST` : "no functions found in the AST",
  }];
}

function gradeParametersDimension(input: PipelineGradeInput): CriterionResult[] {
  const parameterCount = input.ast.parameterCount;
  return [{
    name: "parameters",
    passed: parameterCount >= 1,
    message: parameterCount >= 1 ? `${pluralize(parameterCount, "parameter")} found in the AST` : "no parameters found in the AST",
  }];
}

const DIMENSION_GRADERS: Record<GradingDimension, (input: PipelineGradeInput) => CriterionResult[]> = {
  "first-lesson": gradeFirstLessonDimension,
  events: gradeEventsDimension,
  variables: gradeVariablesDimension,
  loops: gradeLoopsDimension,
  functions: gradeFunctionsDimension,
  parameters: gradeParametersDimension,
};

export function gradeDimension(dimension: GradingDimension, input: PipelineGradeInput): DimensionGradeResult {
  const grader = DIMENSION_GRADERS[dimension];
  if (!grader) {
    throw new TypeError(`unsupported grading dimension: ${dimension}`);
  }
  return buildDimensionResult(dimension, grader(input));
}

export function gradeDimensions(
  input: PipelineGradeInput,
  dimensions: readonly GradingDimension[] = DEFAULT_GRADING_DIMENSIONS,
): DimensionGradeResult[] {
  return dimensions.map((dimension) => gradeDimension(dimension, input));
}
