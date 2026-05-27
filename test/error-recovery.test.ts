import { describe, expect, it } from "vitest";
import {
  CrashReporter,
  ErrorBoundary,
  ErrorLog,
  RecoveryStrategy,
  SafeMode,
  UserFeedback,
} from "../src/error-recovery.js";

describe("error-recovery", () => {
  it("captures runtime errors inside an error boundary", () => {
    const boundary = new ErrorBoundary();
    const result = boundary.execute(() => {
      throw new TypeError("broken world");
    }, { subsystem: "vm" });

    expect(result).toBeNull();
    expect(boundary.lastFailure?.report.category).toBe("runtime");
    expect(boundary.history).toHaveLength(1);
  });

  it("runs recovery hooks in order until work is recovered", () => {
    const calls: string[] = [];
    const strategy = new RecoveryStrategy({
      autoSave: () => {
        calls.push("auto-save");
        return false;
      },
      rollback: () => {
        calls.push("rollback");
        return false;
      },
      retry: () => {
        calls.push("retry");
        return true;
      },
    }, 2);

    const result = strategy.recover(new Error("boom"), { allowRetry: true, enterSafeMode: true });

    expect(result).toEqual({
      recovered: true,
      actions: ["auto-save", "rollback", "retry", "safe-mode"],
      retries: 1,
      safeMode: true,
    });
    expect(calls).toEqual(["auto-save", "rollback", "retry"]);
  });

  it("captures crash reports suitable for bug filing", () => {
    const reporter = new CrashReporter();
    const report = reporter.capture(new Error("save failed"), {
      subsystem: "project-io",
      userDescription: "Pressed save in the editor.",
    });

    expect(report.draftTitle).toContain("Alice");
    expect(report.body).toContain("project-io");
    expect(reporter.latest?.report.message).toBe("save failed");
  });

  it("persists and restores an error log with repeated failures", () => {
    const log = new ErrorLog();
    log.append(new Error("offline"));
    log.append(new Error("offline"));
    log.append(new TypeError("wrong shape"));

    const restored = ErrorLog.deserialize(log.serialize());

    expect(restored.entries).toHaveLength(2);
    expect(restored.entries[0]).toMatchObject({ message: "offline", occurrences: 2 });
    expect(restored.last()?.name).toBe("TypeError");
  });

  it("activates safe mode with a minimal feature set", () => {
    const safeMode = new SafeMode();
    safeMode.activate(["extensions", "performance-overlay"]);

    expect(safeMode.active).toBe(true);
    expect(safeMode.isFeatureEnabled("extensions")).toBe(false);
    expect(safeMode.isFeatureEnabled("editor")).toBe(true);

    safeMode.deactivate();
    expect(safeMode.active).toBe(false);
  });

  it("collects user feedback for crash context", () => {
    const feedback = new UserFeedback();
    const prompt = feedback.prompt("What were you doing?");
    feedback.respond(prompt.id, "Editing a method");

    expect(feedback.summarize()).toContain("Editing a method");
    expect(feedback.toContext()).toEqual({ [prompt.id]: "Editing a method" });
  });
});
