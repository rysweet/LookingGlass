import type { AliceMethod, AliceProject, AliceStatement } from "../a3p-parser.js";
import type { Scene } from "../story-api/scene";

export interface ExecutionLogEntry {
  readonly step: number;
  readonly kind: string;
  readonly detail: string;
}

export interface EventRegistration {
  readonly eventType: string;
  readonly handlerName: string;
}

export interface GradeInput {
  readonly scene: Scene;
  readonly executionLog: readonly ExecutionLogEntry[];
  readonly eventRegistrations: readonly EventRegistration[];
  readonly declaredMethods: readonly string[];
}

export interface CriterionResult {
  readonly name: string;
  readonly passed: boolean;
  readonly message: string;
}

export interface GradeResult {
  readonly lesson: number;
  readonly passed: boolean;
  readonly criteria: readonly CriterionResult[];
  readonly score: number;
}

export type GradingDimension =
  | "first-lesson"
  | "events"
  | "variables"
  | "loops"
  | "functions"
  | "parameters";

export interface AstStatementEntry {
  readonly methodName: string;
  readonly depth: number;
  readonly statement: AliceStatement;
}

export interface ProjectAstSummary {
  readonly methods: readonly AliceMethod[];
  readonly statements: readonly AstStatementEntry[];
  readonly methodCount: number;
  readonly functionCount: number;
  readonly parameterCount: number;
  readonly variableCount: number;
  readonly loopCount: number;
  readonly eventCount: number;
  readonly methodCallCount: number;
  readonly statementCount: number;
}

export interface PipelineGradeInput extends GradeInput {
  readonly project: AliceProject;
  readonly ast: ProjectAstSummary;
}

export interface DimensionGradeResult {
  readonly dimension: GradingDimension;
  readonly passed: boolean;
  readonly criteria: readonly CriterionResult[];
  readonly score: number;
}

export interface GradingPipelineResult {
  readonly project: AliceProject;
  readonly ast: ProjectAstSummary;
  readonly input: PipelineGradeInput;
  readonly results: readonly DimensionGradeResult[];
  readonly reportHtml: string;
}

export const DEFAULT_GRADING_DIMENSIONS: readonly GradingDimension[] = [
  "first-lesson",
  "events",
  "variables",
  "loops",
  "functions",
  "parameters",
];
