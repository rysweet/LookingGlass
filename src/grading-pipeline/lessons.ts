import type { CriterionResult, GradeInput, GradeResult } from "./types.js";
import { countNonDefaultEntities } from "./analysis.js";

const BUILTIN_METHODS: ReadonlySet<string> = new Set([
  "move",
  "turn",
  "roll",
  "say",
  "think",
  "resize",
  "setOpacity",
  "setColor",
  "delay",
  "myFirstMethod",
  "run",
  "setVehicle",
]);
const RE_METHOD_NAME = /this\.(\w+)\(/;
const RE_MOVEMENT = /\b(?:move|turn)\b/;

function extractMethodName(detail: string): string | null {
  const match = RE_METHOD_NAME.exec(detail);
  return match ? match[1] : null;
}

function hasCustomMethodCall(log: readonly GradeInput["executionLog"][number][]): boolean {
  for (const entry of log) {
    if (entry.kind !== "MethodCall") continue;
    const name = extractMethodName(entry.detail);
    if (name !== null && !BUILTIN_METHODS.has(name)) return true;
  }
  return false;
}

function hasLogKind(log: readonly GradeInput["executionLog"][number][], kind: string): boolean {
  return log.some((entry) => entry.kind === kind);
}

function hasMovementStatement(log: readonly GradeInput["executionLog"][number][]): boolean {
  return log.some((entry) => entry.kind === "MethodCall" && RE_MOVEMENT.test(entry.detail));
}

function buildResult(lesson: number, criteria: CriterionResult[]): GradeResult {
  const passed = criteria.every((criterion) => criterion.passed);
  const score = criteria.length > 0 ? criteria.filter((criterion) => criterion.passed).length / criteria.length : 0;
  return { lesson, passed, criteria, score };
}

function gradeL1(input: GradeInput): CriterionResult[] {
  const count = countNonDefaultEntities(input.scene);
  return [{
    name: "entity-added",
    passed: count >= 1,
    message: count >= 1 ? `${count} non-default entity(s) found` : "no non-default entities found in scene",
  }];
}

function gradeL2(input: GradeInput): CriterionResult[] {
  const found = hasMovementStatement(input.executionLog);
  return [{
    name: "movement-statement",
    passed: found,
    message: found ? "move/turn statement found in execution log" : "no move or turn statement found",
  }];
}

function gradeL3(input: GradeInput): CriterionResult[] {
  const count = input.eventRegistrations.length;
  return [{
    name: "event-listener",
    passed: count >= 1,
    message: count >= 1 ? `${count} event listener(s) registered` : "no event listeners registered",
  }];
}

function gradeL4(input: GradeInput): CriterionResult[] {
  const found = hasLogKind(input.executionLog, "CountLoop");
  return [{
    name: "count-loop",
    passed: found,
    message: found ? "CountLoop found in execution log" : "no CountLoop found in execution log",
  }];
}

function gradeL5(input: GradeInput): CriterionResult[] {
  const found = hasLogKind(input.executionLog, "IfElse");
  return [{
    name: "if-else",
    passed: found,
    message: found ? "IfElse found in execution log" : "no IfElse found in execution log",
  }];
}

function gradeL6(input: GradeInput): CriterionResult[] {
  const found = hasCustomMethodCall(input.executionLog);
  return [{
    name: "custom-method",
    passed: found,
    message: found ? "custom method call found beyond built-ins" : "no custom method calls found (only built-ins)",
  }];
}

function gradeL7(input: GradeInput): CriterionResult[] {
  const count = input.declaredMethods.length;
  return [{
    name: "multiple-methods",
    passed: count >= 2,
    message: count >= 2 ? `${count} methods declared` : `only ${count} method(s) declared (need ≥2)`,
  }];
}

function gradeL8(input: GradeInput): CriterionResult[] {
  const entityCount = countNonDefaultEntities(input.scene);
  let hasLoop = false;
  let hasConditional = false;
  let hasCustom = false;
  for (const entry of input.executionLog) {
    if (entry.kind === "CountLoop") hasLoop = true;
    else if (entry.kind === "IfElse") hasConditional = true;
    else if (entry.kind === "MethodCall") {
      const name = extractMethodName(entry.detail);
      if (name !== null && !BUILTIN_METHODS.has(name)) hasCustom = true;
    }
    if (hasLoop && hasConditional && hasCustom) break;
  }

  return [
    {
      name: "entities-3plus",
      passed: entityCount >= 3,
      message: entityCount >= 3 ? `${entityCount} non-default entities found` : `only ${entityCount} non-default entity(s) (need ≥3)`,
    },
    {
      name: "has-loop",
      passed: hasLoop,
      message: hasLoop ? "CountLoop found" : "no CountLoop found in execution log",
    },
    {
      name: "has-conditional",
      passed: hasConditional,
      message: hasConditional ? "IfElse found" : "no IfElse found in execution log",
    },
    {
      name: "has-custom-method",
      passed: hasCustom,
      message: hasCustom ? "custom method call found" : "no custom method calls found",
    },
  ];
}

const GRADERS: Record<number, (input: GradeInput) => CriterionResult[]> = {
  1: gradeL1,
  2: gradeL2,
  3: gradeL3,
  4: gradeL4,
  5: gradeL5,
  6: gradeL6,
  7: gradeL7,
  8: gradeL8,
};

export function gradeLesson(lesson: number, input: GradeInput): GradeResult {
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 8) {
    throw new TypeError("lesson must be an integer between 1 and 8");
  }
  const criteria = GRADERS[lesson](input);
  return buildResult(lesson, criteria);
}
