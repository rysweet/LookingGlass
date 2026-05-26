import { parseTweedle, type ClassDecl } from "./tweedle-parser.js";
import { TweedleVM, type ExecutionResult, type LogEntry } from "./tweedle-vm.js";

export type TestStatus = "passed" | "failed";
export type TestKind = "unit" | "property" | "snapshot";

export interface TweedleUnitAssertionContext {
  readonly declaration: ClassDecl;
  readonly execution: ExecutionResult;
}

export interface TweedleUnitTestCase {
  readonly name: string;
  readonly source: string;
  readonly declarations?: readonly ClassDecl[];
  readonly entryMethod?: string;
  readonly instanceName?: string;
  readonly arguments?: readonly string[];
  readonly constructorArguments?: readonly string[];
  readonly assert?: (context: TweedleUnitAssertionContext) => void;
}

export interface PropertyTestCase<T> {
  readonly name: string;
  readonly seed?: number;
  readonly iterations?: number;
  readonly generate: (random: PropertyRandom, iteration: number) => T;
  readonly property: (candidate: T, iteration: number) => void | boolean;
}

export interface SnapshotTestCase<T> {
  readonly name: string;
  readonly sceneState: T;
  readonly expected: string;
  readonly serialize?: (sceneState: T) => string;
}

export interface BaseTestResult {
  readonly kind: TestKind;
  readonly name: string;
  readonly status: TestStatus;
  readonly durationMs: number;
  readonly error?: string;
}

export interface TweedleUnitTestResult extends BaseTestResult {
  readonly kind: "unit";
  readonly executionLog: readonly LogEntry[];
  readonly returnValueEntries: readonly [string, unknown][];
}

export interface PropertyTestResult extends BaseTestResult {
  readonly kind: "property";
  readonly iterations: number;
  readonly seed: number;
}

export interface SnapshotTestResult extends BaseTestResult {
  readonly kind: "snapshot";
  readonly expected: string;
  readonly actual: string;
}

export type AliceProjectTestResult =
  | TweedleUnitTestResult
  | PropertyTestResult
  | SnapshotTestResult;

export interface AliceProjectTestSuite {
  readonly unitTests?: readonly TweedleUnitTestCase[];
  readonly propertyTests?: readonly PropertyTestCase<any>[];
  readonly snapshotTests?: readonly SnapshotTestCase<any>[];
}

export interface AliceProjectTestReport {
  readonly generatedAt: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: readonly AliceProjectTestResult[];
}

const DEFAULT_PROPERTY_SEED = 0x1a2b3c4d;
const DEFAULT_PROPERTY_ITERATIONS = 100;

export class PropertyRandom {
  private state: number;

  constructor(seed = DEFAULT_PROPERTY_SEED) {
    this.state = (seed >>> 0) || DEFAULT_PROPERTY_SEED;
  }

  nextUint32(): number {
    this.state = ((1664525 * this.state) + 1013904223) >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive) || minInclusive > maxInclusive) {
      throw new RangeError("nextInt requires an ordered integer range.");
    }
    const span = (maxInclusive - minInclusive) + 1;
    return minInclusive + Math.floor(this.nextFloat() * span);
  }

  nextBoolean(trueProbability = 0.5): boolean {
    if (!(trueProbability >= 0 && trueProbability <= 1)) {
      throw new RangeError("trueProbability must be between 0 and 1.");
    }
    return this.nextFloat() < trueProbability;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new RangeError("pick requires at least one value.");
    }
    return values[this.nextInt(0, values.length - 1)] as T;
  }
}

export function runTweedleUnitTests(testCases: readonly TweedleUnitTestCase[]): TweedleUnitTestResult[] {
  return testCases.map((testCase) => {
    const startedAt = Date.now();
    try {
      const declaration = parseTweedle(testCase.source);
      const vm = new TweedleVM();
      const execution = vm.execute(declaration, {
        declarations: testCase.declarations ? [...testCase.declarations] : undefined,
        entryMethod: testCase.entryMethod,
        instanceName: testCase.instanceName,
        arguments: testCase.arguments ? [...testCase.arguments] : undefined,
        constructorArguments: testCase.constructorArguments ? [...testCase.constructorArguments] : undefined,
      });
      testCase.assert?.({ declaration, execution });
      return {
        kind: "unit",
        name: testCase.name,
        status: "passed",
        durationMs: Date.now() - startedAt,
        executionLog: [...execution.execution_log],
        returnValueEntries: [...execution.returnValues.entries()],
      } satisfies TweedleUnitTestResult;
    } catch (error) {
      return {
        kind: "unit",
        name: testCase.name,
        status: "failed",
        durationMs: Date.now() - startedAt,
        executionLog: [],
        returnValueEntries: [],
        error: toErrorMessage(error),
      } satisfies TweedleUnitTestResult;
    }
  });
}

export function runPropertyTests<T>(testCases: readonly PropertyTestCase<T>[]): PropertyTestResult[] {
  return testCases.map((testCase) => {
    const startedAt = Date.now();
    const seed = testCase.seed ?? DEFAULT_PROPERTY_SEED;
    const iterations = testCase.iterations ?? DEFAULT_PROPERTY_ITERATIONS;
    try {
      const random = new PropertyRandom(seed);
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const candidate = testCase.generate(random, iteration);
        const verdict = testCase.property(candidate, iteration);
        if (verdict === false) {
          throw new Error(`Property returned false at iteration ${iteration}.`);
        }
      }
      return {
        kind: "property",
        name: testCase.name,
        status: "passed",
        durationMs: Date.now() - startedAt,
        iterations,
        seed,
      } satisfies PropertyTestResult;
    } catch (error) {
      return {
        kind: "property",
        name: testCase.name,
        status: "failed",
        durationMs: Date.now() - startedAt,
        iterations,
        seed,
        error: toErrorMessage(error),
      } satisfies PropertyTestResult;
    }
  });
}

export function snapshotSceneState(sceneState: unknown): string {
  return JSON.stringify(normalizeSnapshotValue(sceneState), null, 2);
}

export function runSceneSnapshotTests<T>(testCases: readonly SnapshotTestCase<T>[]): SnapshotTestResult[] {
  return testCases.map((testCase) => {
    const startedAt = Date.now();
    try {
      const actual = (testCase.serialize ?? snapshotSceneState)(testCase.sceneState);
      if (actual !== testCase.expected) {
        throw new Error("Snapshot mismatch.");
      }
      return {
        kind: "snapshot",
        name: testCase.name,
        status: "passed",
        durationMs: Date.now() - startedAt,
        expected: testCase.expected,
        actual,
      } satisfies SnapshotTestResult;
    } catch (error) {
      return {
        kind: "snapshot",
        name: testCase.name,
        status: "failed",
        durationMs: Date.now() - startedAt,
        expected: testCase.expected,
        actual: (testCase.serialize ?? snapshotSceneState)(testCase.sceneState),
        error: toErrorMessage(error),
      } satisfies SnapshotTestResult;
    }
  });
}

export function generateTestReport(results: readonly AliceProjectTestResult[]): AliceProjectTestReport {
  const passed = results.filter((result) => result.status === "passed").length;
  return {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed,
    failed: results.length - passed,
    results: [...results],
  };
}

export function formatTestReport(report: AliceProjectTestReport): string {
  const lines = [`Alice project tests: ${report.passed}/${report.total} passed`];
  for (const result of report.results) {
    const status = result.status === "passed" ? "PASS" : "FAIL";
    const suffix = result.error ? ` — ${result.error}` : "";
    lines.push(`- [${status}] ${result.kind}:${result.name} (${result.durationMs}ms)${suffix}`);
  }
  return lines.join("\n");
}

export function runAliceProjectTestSuite(suite: AliceProjectTestSuite): AliceProjectTestReport {
  const unitResults = runTweedleUnitTests(suite.unitTests ?? []);
  const propertyResults = runPropertyTests(suite.propertyTests ?? []);
  const snapshotResults = runSceneSnapshotTests(suite.snapshotTests ?? []);
  return generateTestReport([...unitResults, ...propertyResults, ...snapshotResults]);
}

export class AliceProjectTestingFramework {
  runUnitTests(testCases: readonly TweedleUnitTestCase[]): TweedleUnitTestResult[] {
    return runTweedleUnitTests(testCases);
  }

  runPropertyTests<T>(testCases: readonly PropertyTestCase<T>[]): PropertyTestResult[] {
    return runPropertyTests(testCases);
  }

  runSnapshotTests<T>(testCases: readonly SnapshotTestCase<T>[]): SnapshotTestResult[] {
    return runSceneSnapshotTests(testCases);
  }

  runSuite(suite: AliceProjectTestSuite): AliceProjectTestReport {
    return runAliceProjectTestSuite(suite);
  }

  generateReport(results: readonly AliceProjectTestResult[]): AliceProjectTestReport {
    return generateTestReport(results);
  }

  formatReport(report: AliceProjectTestReport): string {
    return formatTestReport(report);
  }
}

function normalizeSnapshotValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSnapshotValue(entry, seen));
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()]
        .map(([key, entryValue]) => [String(key), normalizeSnapshotValue(entryValue, seen)] as const)
        .sort(([left], [right]) => left.localeCompare(right)),
    );
  }
  if (value instanceof Set) {
    return [...value]
      .map((entry) => normalizeSnapshotValue(entry, seen))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      throw new TypeError("Scene snapshots do not support circular references.");
    }
    seen.add(value);
    const jsonLike = hasToJson(value) ? value.toJSON() : value;
    const normalized = Object.fromEntries(
      Object.entries(jsonLike as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, normalizeSnapshotValue(entryValue, seen)]),
    );
    seen.delete(value);
    return normalized;
  }
  return String(value);
}

function hasToJson(value: object): value is { toJSON(): unknown } {
  return typeof (value as { toJSON?: unknown }).toJSON === "function";
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
