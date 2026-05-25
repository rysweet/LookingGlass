import { AliceVersion, VersionNotSupportedError, getCurrentProjectVersion } from "./version-management.js";

export type ErrorCategory = "runtime" | "ast" | "compatibility" | "io" | "network" | "validation" | "internal" | "unknown";
export type ErrorSeverity = "warning" | "error" | "fatal";

export interface ErrorContext {
  readonly subsystem?: string;
  readonly operation?: string;
  readonly userDescription?: string;
  readonly reproductionSteps?: string[];
  readonly environment?: Record<string, string | number | boolean | null | undefined>;
  readonly metadata?: Record<string, unknown>;
}

export interface ErrorClassification {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly code: string;
}

export interface StackFrame {
  readonly functionName: string | null;
  readonly fileName: string | null;
  readonly line: number | null;
  readonly column: number | null;
  readonly raw: string;
}

export interface StructuredErrorReport {
  readonly name: string;
  readonly message: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly code: string;
  readonly userMessage: string;
  readonly stackFrames: StackFrame[];
  readonly rawStack: string;
  readonly cause: StructuredErrorReport | null;
  readonly context: ErrorContext;
}

export interface BugReportDraft {
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly structuredError: StructuredErrorReport;
}

export class AliceStructuredError extends Error {
  readonly classification: ErrorClassification;
  readonly context: ErrorContext;
  readonly causeError: Error | null;

  constructor(message: string, classification: ErrorClassification, context: ErrorContext = {}, cause?: unknown) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = "AliceStructuredError";
    this.classification = classification;
    this.context = context;
    this.causeError = cause instanceof Error ? cause : null;
  }
}

export function classifyError(error: unknown): ErrorClassification {
  const normalized = normalizeError(error);
  const name = normalized.name.toLowerCase();
  const message = normalized.message.toLowerCase();

  if (normalized instanceof VersionNotSupportedError || name.includes("version") || message.includes("unsupported version")) {
    return { category: "compatibility", severity: "error", code: "VERSION_UNSUPPORTED" };
  }
  if (name.includes("parse") || name.includes("serialization") || name.includes("ast")) {
    return { category: "ast", severity: "error", code: "AST_INVALID" };
  }
  if (normalized instanceof SyntaxError || name.includes("syntax") || message.includes("invalid identifier")) {
    return { category: "validation", severity: "error", code: "INPUT_INVALID" };
  }
  if (message.includes("enoent") || message.includes("eacces") || message.includes("read") || message.includes("write") || name.includes("io")) {
    return { category: "io", severity: "error", code: "IO_FAILURE" };
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("socket") || message.includes("econn")) {
    return { category: "network", severity: "error", code: "NETWORK_FAILURE" };
  }
  if (normalized instanceof RangeError || message.includes("out of memory")) {
    return { category: "internal", severity: "fatal", code: "RESOURCE_EXHAUSTED" };
  }
  if (normalized instanceof TypeError || normalized instanceof ReferenceError || name.includes("nullpointer") || message.includes("return statement required")) {
    return { category: "runtime", severity: "error", code: "RUNTIME_FAILURE" };
  }
  return { category: "unknown", severity: "error", code: "UNKNOWN_FAILURE" };
}

export function generateUserFriendlyMessage(error: unknown, context: ErrorContext = {}): string {
  const normalized = normalizeError(error);
  const classification = classifyError(normalized);
  const prefix = context.subsystem ? `${context.subsystem}: ` : "";
  switch (classification.category) {
    case "compatibility":
      return `${prefix}This project was created with an Alice version this prototype cannot open directly. Try migrating it before loading again.`;
    case "ast":
      return `${prefix}Alice could not understand part of the project structure. Check the source for incomplete or malformed code.`;
    case "validation":
      return `${prefix}Alice rejected the requested change because some input is not valid.`;
    case "io":
      return `${prefix}Alice could not read or write one of the project files. Verify the path, permissions, and archive contents.`;
    case "network":
      return `${prefix}Alice could not reach a required network service. Check your connection and try again.`;
    case "internal":
      return `${prefix}Alice ran out of resources or hit an internal limit. Saving work and restarting is recommended.`;
    case "runtime":
      return `${prefix}Alice hit a runtime problem while executing code${normalized.message ? `: ${normalized.message}` : "."}`;
    case "unknown":
      return `${prefix}Alice hit an unexpected error${normalized.message ? `: ${normalized.message}` : "."}`;
  }
}

export function parseStackTrace(stack: string | null | undefined): StackFrame[] {
  if (!stack) {
    return [];
  }
  const lines = stack
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const frames: StackFrame[] = [];
  for (const line of lines.slice(1)) {
    const v8Match = line.match(/^at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/u);
    if (v8Match) {
      frames.push({
        functionName: emptyToNull(v8Match[1]),
        fileName: emptyToNull(v8Match[2]),
        line: Number.parseInt(v8Match[3], 10),
        column: Number.parseInt(v8Match[4], 10),
        raw: line,
      });
      continue;
    }

    const firefoxMatch = line.match(/^(.*?)@(.+?):(\d+):(\d+)$/u);
    if (firefoxMatch) {
      frames.push({
        functionName: emptyToNull(firefoxMatch[1]),
        fileName: emptyToNull(firefoxMatch[2]),
        line: Number.parseInt(firefoxMatch[3], 10),
        column: Number.parseInt(firefoxMatch[4], 10),
        raw: line,
      });
      continue;
    }

    frames.push({ functionName: null, fileName: null, line: null, column: null, raw: line });
  }
  return frames;
}

export function formatStackTrace(error: unknown): string {
  const normalized = normalizeError(error);
  const frames = parseStackTrace(normalized.stack);
  const header = `${normalized.name}: ${normalized.message}`.trim();
  if (frames.length === 0) {
    return header;
  }
  return [
    header,
    ...frames.map((frame) => {
      const location = frame.fileName
        ? `${frame.fileName}${frame.line !== null ? `:${frame.line}` : ""}${frame.column !== null ? `:${frame.column}` : ""}`
        : frame.raw;
      return `  at ${frame.functionName ? `${frame.functionName} ` : ""}${location}`.trimEnd();
    }),
  ].join("\n");
}

export function createStructuredErrorReport(error: unknown, context: ErrorContext = {}): StructuredErrorReport {
  const normalized = normalizeError(error);
  const classification = normalized instanceof AliceStructuredError
    ? normalized.classification
    : classifyError(normalized);
  const mergedContext = normalized instanceof AliceStructuredError
    ? { ...normalized.context, ...context }
    : context;
  const cause = extractCause(normalized);

  return {
    name: normalized.name || "Error",
    message: normalized.message || "Unknown error",
    category: classification.category,
    severity: classification.severity,
    code: classification.code,
    userMessage: generateUserFriendlyMessage(normalized, mergedContext),
    stackFrames: parseStackTrace(normalized.stack),
    rawStack: normalized.stack ?? `${normalized.name}: ${normalized.message}`,
    cause: cause ? createStructuredErrorReport(cause, mergedContext) : null,
    context: mergedContext,
  };
}

export function generateBugReport(error: unknown, context: ErrorContext = {}): BugReportDraft {
  const structuredError = createStructuredErrorReport(error, context);
  const version = getCurrentProjectVersion();
  const title = `Alice ${version} ${structuredError.code} ${truncate(structuredError.message, 72)}`;
  const summary = `${structuredError.userMessage}\n\nTechnical summary: ${structuredError.name}: ${structuredError.message}`;
  const bodyParts = [
    `Version\n\n${version}`,
    `Category\n\n${structuredError.category}`,
    `Severity\n\n${structuredError.severity}`,
    `User message\n\n${structuredError.userMessage}`,
    `Technical message\n\n${structuredError.name}: ${structuredError.message}`,
    `Stack trace\n\n${formatStackTrace(normalizeError(error))}`,
  ];

  const steps = context.reproductionSteps?.filter((step) => step.trim().length > 0) ?? [];
  if (context.userDescription) {
    bodyParts.splice(1, 0, `Description\n\n${context.userDescription}`);
  }
  if (steps.length > 0) {
    bodyParts.splice(2, 0, `Steps\n\n${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`);
  }
  if (context.environment) {
    const environment = Object.entries(context.environment)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
    bodyParts.push(`Environment\n\n${environment}`);
  }
  if (structuredError.cause) {
    bodyParts.push(`Cause\n\n${structuredError.cause.name}: ${structuredError.cause.message}`);
  }

  return {
    title,
    summary,
    body: bodyParts.join("\n\n"),
    structuredError,
  };
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

function extractCause(error: Error): Error | null {
  const withCause = error as Error & { cause?: unknown; causeError?: Error | null };
  if (withCause.causeError instanceof Error) {
    return withCause.causeError;
  }
  return withCause.cause instanceof Error ? withCause.cause : null;
}

function emptyToNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function formatCompatibilityError(version: string | AliceVersion): StructuredErrorReport {
  return createStructuredErrorReport(
    new VersionNotSupportedError(getCurrentProjectVersion(), version),
    { subsystem: "version-management" },
  );
}
