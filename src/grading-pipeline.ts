import { parseA3P, type AliceProject } from "./a3p-parser.js";
import { buildGradeInputFromProject, looksLikeEventHandlerName } from "./grading-pipeline/analysis.js";
import { gradeDimension, gradeDimensions } from "./grading-pipeline/dimensions.js";
import { DEFAULT_GRADING_DIMENSIONS, type GradingDimension, type GradingPipelineResult } from "./grading-pipeline/types.js";
import { renderGradingReport } from "./grading-pipeline/report.js";

export {
  buildGradeInputFromProject,
  looksLikeEventHandlerName,
} from "./grading-pipeline/analysis.js";
export {
  gradeDimension,
  gradeDimensions,
} from "./grading-pipeline/dimensions.js";
export { gradeLesson } from "./grading-pipeline/lessons.js";
export { renderGradingReport } from "./grading-pipeline/report.js";
export {
  DEFAULT_GRADING_DIMENSIONS,
  type AstStatementEntry,
  type CriterionResult,
  type DimensionGradeResult,
  type EventRegistration,
  type ExecutionLogEntry,
  type GradeInput,
  type GradeResult,
  type GradingDimension,
  type GradingPipelineResult,
  type PipelineGradeInput,
  type ProjectAstSummary,
} from "./grading-pipeline/types.js";

export function runGradingPipeline(
  project: AliceProject,
  dimensions: readonly GradingDimension[] = DEFAULT_GRADING_DIMENSIONS,
): GradingPipelineResult {
  const input = buildGradeInputFromProject(project);
  const results = gradeDimensions(input, dimensions);
  return {
    project,
    ast: input.ast,
    input,
    results,
    reportHtml: renderGradingReport(project, input.ast, results),
  };
}

export async function gradeA3P(
  data: ArrayBuffer | Uint8Array,
  dimensions: readonly GradingDimension[] = DEFAULT_GRADING_DIMENSIONS,
): Promise<GradingPipelineResult> {
  const project = await parseA3P(data);
  return runGradingPipeline(project, dimensions);
}
