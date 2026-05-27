import type { AliceProject } from "../a3p-parser.js";
import type { CriterionResult, DimensionGradeResult, ProjectAstSummary } from "./types.js";

function countPassed(criteria: readonly CriterionResult[]): number {
  return criteria.filter((criterion) => criterion.passed).length;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCriterionList(criteria: readonly CriterionResult[]): string {
  return criteria
    .map(
      (criterion) => `<li class="criterion ${criterion.passed ? "pass" : "fail"}">`
        + `<strong>${escapeHtml(criterion.name)}</strong>: ${escapeHtml(criterion.message)}`
        + "</li>",
    )
    .join("");
}

function renderSummaryItem(label: string, value: number): string {
  return `<li><strong>${escapeHtml(label)}:</strong> ${value}</li>`;
}

export function renderGradingReport(
  project: AliceProject,
  ast: ProjectAstSummary,
  results: readonly DimensionGradeResult[],
): string {
  const passedDimensions = results.filter((result) => result.passed).length;
  const summaryItems = [
    renderSummaryItem("Methods", ast.methodCount),
    renderSummaryItem("Functions", ast.functionCount),
    renderSummaryItem("Parameters", ast.parameterCount),
    renderSummaryItem("Variables", ast.variableCount),
    renderSummaryItem("Loops", ast.loopCount),
    renderSummaryItem("Events", ast.eventCount),
    renderSummaryItem("Statements", ast.statementCount),
  ].join("");

  const rows = results
    .map((result) => {
      const passedCriteria = countPassed(result.criteria);
      return `<tr>`
        + `<td>${escapeHtml(result.dimension)}</td>`
        + `<td class="${result.passed ? "pass" : "fail"}">${result.passed ? "passed" : "failed"}</td>`
        + `<td>${passedCriteria}/${result.criteria.length}</td>`
        + `<td>${Math.round(result.score * 100)}%</td>`
        + `</tr>`;
    })
    .join("");

  const sections = results
    .map(
      (result) => `<section class="dimension">`
        + `<h2>${escapeHtml(result.dimension)}</h2>`
        + `<ul>${renderCriterionList(result.criteria)}</ul>`
        + `</section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Grading report – ${escapeHtml(project.projectName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; color: #1f2937; }
    h1, h2 { margin-bottom: 0.5rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .summary-card, .dimension { border: 1px solid #d1d5db; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; }
    th { background: #f3f4f6; }
    .pass { color: #166534; }
    .fail { color: #991b1b; }
    ul { margin: 0; padding-left: 1.2rem; }
  </style>
</head>
<body>
  <h1>Grading report for ${escapeHtml(project.projectName)}</h1>
  <p>Version ${escapeHtml(project.version)} · ${passedDimensions}/${results.length} dimensions passed</p>
  <div class="summary">
    <section class="summary-card">
      <h2>AST summary</h2>
      <ul>${summaryItems}</ul>
    </section>
  </div>
  <table>
    <thead>
      <tr>
        <th>Dimension</th>
        <th>Status</th>
        <th>Criteria</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${sections}
</body>
</html>`;
}
