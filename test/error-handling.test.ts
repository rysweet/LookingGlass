import { describe, expect, it } from "vitest";
import {
  AliceStructuredError,
  classifyError,
  createStructuredErrorReport,
  formatStackTrace,
  generateBugReport,
  generateUserFriendlyMessage,
  parseStackTrace,
} from "../src/error-handling.js";
import { VersionNotSupportedError } from "../src/version-management.js";

describe("error-handling", () => {
  it("classifies compatibility errors from version failures", () => {
    expect(classifyError(new VersionNotSupportedError("3.1.8.0.0", "3.1.7.0.0"))).toEqual({
      category: "compatibility",
      severity: "error",
      code: "VERSION_UNSUPPORTED",
    });
  });

  it("creates user-facing runtime messages", () => {
    const message = generateUserFriendlyMessage(new TypeError("left operand is null."), { subsystem: "vm" });
    expect(message).toContain("vm:");
    expect(message).toContain("runtime problem");
  });

  it("parses V8 stack traces into structured frames", () => {
    const frames = parseStackTrace("TypeError: boom\n    at helper (/src/file.ts:12:4)\n    at main (/src/main.ts:20:1)");
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({ functionName: "helper", fileName: "/src/file.ts", line: 12, column: 4 });
  });

  it("formats stack traces for bug reports", () => {
    const error = new Error("broken");
    error.name = "ExampleError";
    error.stack = "ExampleError: broken\n    at helper (/src/file.ts:12:4)";
    expect(formatStackTrace(error)).toContain("helper /src/file.ts:12:4");
  });

  it("captures nested causes in a structured report", () => {
    const root = new Error("root cause");
    const wrapped = new AliceStructuredError("outer", { category: "runtime", severity: "error", code: "RUNTIME_FAILURE" }, {}, root);
    const report = createStructuredErrorReport(wrapped);
    expect(report.cause?.message).toBe("root cause");
  });

  it("generates bug report drafts with context sections", () => {
    const report = generateBugReport(new Error("unable to save"), {
      subsystem: "project-io",
      userDescription: "Save failed while writing the archive.",
      reproductionSteps: ["Open a project", "Choose Save"],
      environment: { browser: "vitest" },
    });
    expect(report.title).toContain("Alice");
    expect(report.body).toContain("Description");
    expect(report.body).toContain("Steps");
    expect(report.body).toContain("Environment");
  });
});
