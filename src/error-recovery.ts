import {
  createStructuredErrorReport,
  generateBugReport,
  type ErrorContext,
  type StructuredErrorReport,
} from "./error-handling.js";

export interface BoundaryFailure {
  message: string;
  report: StructuredErrorReport;
  context: ErrorContext;
}

export class ErrorBoundary {
  private _lastFailure: BoundaryFailure | null = null;
  private _history: BoundaryFailure[] = [];

  get lastFailure(): BoundaryFailure | null {
    return this._lastFailure ? clone(this._lastFailure) : null;
  }

  get history(): BoundaryFailure[] {
    return clone(this._history);
  }

  execute<T>(operation: () => T, context: ErrorContext = {}): T | null {
    try {
      return operation();
    } catch (error) {
      const report = createStructuredErrorReport(error, context);
      const failure = {
        message: report.userMessage,
        report,
        context,
      } satisfies BoundaryFailure;
      this._lastFailure = failure;
      this._history.push(failure);
      return null;
    }
  }

  reset(): void {
    this._lastFailure = null;
  }
}

export interface RecoveryHooks {
  autoSave?: () => boolean;
  rollback?: () => boolean;
  retry?: () => boolean;
}

export interface RecoveryOptions {
  allowRetry?: boolean;
  enterSafeMode?: boolean;
}

export interface RecoveryResult {
  recovered: boolean;
  actions: string[];
  retries: number;
  safeMode: boolean;
}

export class RecoveryStrategy {
  constructor(private readonly hooks: RecoveryHooks = {}, private readonly maxRetries = 1) {
  }

  recover(_error: unknown, options: RecoveryOptions = {}): RecoveryResult {
    const actions: string[] = [];
    let recovered = false;
    let retries = 0;

    if (this.hooks.autoSave) {
      actions.push("auto-save");
      recovered = this.hooks.autoSave() || recovered;
    }

    if (!recovered && this.hooks.rollback) {
      actions.push("rollback");
      recovered = this.hooks.rollback() || recovered;
    }

    if (!recovered && options.allowRetry && this.hooks.retry) {
      while (!recovered && retries < this.maxRetries) {
        retries += 1;
        actions.push("retry");
        recovered = this.hooks.retry();
      }
    }

    if (options.enterSafeMode) {
      actions.push("safe-mode");
    }

    return {
      recovered,
      actions,
      retries,
      safeMode: Boolean(options.enterSafeMode),
    };
  }
}

export interface CrashReport {
  timestamp: string;
  userMessage: string;
  draftTitle: string;
  report: StructuredErrorReport;
  body: string;
}

export class CrashReporter {
  private _reports: CrashReport[] = [];

  get reports(): CrashReport[] {
    return clone(this._reports);
  }

  get latest(): CrashReport | null {
    return this._reports.length > 0 ? clone(this._reports.at(-1)!) : null;
  }

  capture(error: unknown, context: ErrorContext = {}): CrashReport {
    const draft = generateBugReport(error, context);
    const report = {
      timestamp: new Date().toISOString(),
      userMessage: draft.structuredError.userMessage,
      draftTitle: draft.title,
      report: draft.structuredError,
      body: draft.body,
    } satisfies CrashReport;
    this._reports.push(report);
    return clone(report);
  }

  clear(): void {
    this._reports = [];
  }
}

export interface ErrorLogEntry {
  timestamp: string;
  name: string;
  message: string;
  occurrences: number;
}

export class ErrorLog {
  private _entries: ErrorLogEntry[] = [];

  get entries(): ErrorLogEntry[] {
    return clone(this._entries);
  }

  append(error: unknown): ErrorLogEntry {
    const normalized = normalizeError(error);
    const timestamp = new Date().toISOString();
    const last = this._entries.at(-1);
    if (last && last.name === normalized.name && last.message === normalized.message) {
      last.occurrences += 1;
      last.timestamp = timestamp;
      return clone(last);
    }

    const entry = {
      timestamp,
      name: normalized.name,
      message: normalized.message,
      occurrences: 1,
    } satisfies ErrorLogEntry;
    this._entries.push(entry);
    return clone(entry);
  }

  last(): ErrorLogEntry | null {
    return this._entries.length > 0 ? clone(this._entries.at(-1)!) : null;
  }

  clear(): void {
    this._entries = [];
  }

  serialize(): string {
    return JSON.stringify(this._entries);
  }

  static deserialize(serialized: string): ErrorLog {
    const log = new ErrorLog();
    const parsed = JSON.parse(serialized) as ErrorLogEntry[];
    log._entries = parsed.map((entry) => ({ ...entry }));
    return log;
  }
}

export class SafeMode {
  private _active = false;
  private readonly _disabledFeatures = new Set<string>();

  activate(disabledFeatures: string[] = ["extensions", "animations", "webgl-overlays"]): void {
    this._active = true;
    this._disabledFeatures.clear();
    for (const feature of disabledFeatures) {
      this._disabledFeatures.add(feature);
    }
  }

  deactivate(): void {
    this._active = false;
    this._disabledFeatures.clear();
  }

  get active(): boolean {
    return this._active;
  }

  get disabledFeatures(): string[] {
    return [...this._disabledFeatures];
  }

  isFeatureEnabled(feature: string): boolean {
    return !this._active || !this._disabledFeatures.has(feature);
  }
}

export interface FeedbackPrompt {
  id: string;
  label: string;
}

export class UserFeedback {
  private _prompts: FeedbackPrompt[] = [];
  private readonly _responses = new Map<string, string>();

  get prompts(): FeedbackPrompt[] {
    return clone(this._prompts);
  }

  prompt(label: string): FeedbackPrompt {
    const prompt = {
      id: `prompt-${this._prompts.length + 1}`,
      label,
    } satisfies FeedbackPrompt;
    this._prompts.push(prompt);
    return { ...prompt };
  }

  respond(promptId: string, response: string): void {
    if (!this._prompts.some((prompt) => prompt.id === promptId)) {
      throw new Error(`Unknown prompt ${promptId}`);
    }
    this._responses.set(promptId, response.trim());
  }

  summarize(): string {
    return this._prompts
      .map((prompt) => `${prompt.label}: ${this._responses.get(prompt.id) ?? ""}`.trim())
      .join("\n")
      .trim();
  }

  toContext(): Record<string, string> {
    const context: Record<string, string> = {};
    for (const prompt of this._prompts) {
      const response = this._responses.get(prompt.id);
      if (response) {
        context[prompt.id] = response;
      }
    }
    return context;
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
