import { describe, expect, it } from "vitest";
import { createCurriculumMetadata } from "../src/curriculum";
import { IdeAnalytics } from "../src/analytics";

describe("analytics", () => {
  it("tracks the most-used Alice features with counts, actions, and durations", () => {
    const analytics = new IdeAnalytics({ sessionStartedAt: 1_000 });

    analytics.recordFeatureUse({
      featureId: "drag-object",
      featureArea: "scene-editor",
      action: "drop",
      durationMs: 4_000,
      timestamp: 2_000,
    });
    analytics.recordFeatureUse({
      featureId: "drag-object",
      featureArea: "scene-editor",
      action: "drop",
      durationMs: 3_000,
      timestamp: 3_500,
    });
    analytics.recordFeatureUse({
      featureId: "add-loop",
      featureArea: "code-editor",
      action: "insert",
      durationMs: 1_500,
      timestamp: 4_000,
    });

    expect(analytics.getFeatureUsageSummary()).toEqual([
      {
        featureId: "drag-object",
        featureArea: "scene-editor",
        count: 2,
        totalDurationMs: 7_000,
        lastUsedAt: 3_500,
        actions: ["drop"],
        errorCount: 0,
      },
      {
        featureId: "add-loop",
        featureArea: "code-editor",
        count: 1,
        totalDurationMs: 1_500,
        lastUsedAt: 4_000,
        actions: ["insert"],
        errorCount: 0,
      },
    ]);
  });

  it("calculates session duration and engagement metrics from interaction timing", () => {
    const analytics = new IdeAnalytics({ sessionStartedAt: 0, idleThresholdMs: 60_000 });

    analytics.recordFeatureUse({ featureId: "drag-object", featureArea: "scene-editor", timestamp: 5_000 });
    analytics.recordFeatureUse({ featureId: "camera-pan", featureArea: "scene-editor", timestamp: 15_000 });
    analytics.recordError({
      featureArea: "scene-editor",
      featureId: "camera-pan",
      message: "camera target missing",
      timestamp: 180_000,
    });
    analytics.endSession(240_000);

    expect(analytics.getEngagementMetrics()).toEqual({
      sessionDurationMs: 240_000,
      activeDurationMs: 130_000,
      idleDurationMs: 110_000,
      interactions: 3,
      featureUses: 2,
      errorCount: 1,
      lessonsTouched: 0,
      engagementScore: 37,
    });
  });

  it("aggregates error frequency by feature area and links errors back to features", () => {
    const analytics = new IdeAnalytics({ sessionStartedAt: 0 });

    analytics.recordFeatureUse({ featureId: "add-loop", featureArea: "code-editor", timestamp: 1_000 });
    analytics.recordError({
      featureArea: "code-editor",
      featureId: "add-loop",
      code: "PARSE_ERROR",
      message: "unexpected token",
      timestamp: 2_000,
    });
    analytics.recordError({
      featureArea: "code-editor",
      featureId: "add-loop",
      code: "TYPE_ERROR",
      message: "expected boolean",
      timestamp: 3_000,
    });
    analytics.recordError({
      featureArea: "scene-editor",
      featureId: "drag-object",
      code: "COLLISION",
      message: "target occupied",
      timestamp: 4_000,
    });

    expect(analytics.getErrorFrequencyByArea()).toEqual([
      {
        featureArea: "code-editor",
        count: 2,
        lastOccurredAt: 3_000,
        featureIds: ["add-loop"],
        codes: ["PARSE_ERROR", "TYPE_ERROR"],
      },
      {
        featureArea: "scene-editor",
        count: 1,
        lastOccurredAt: 4_000,
        featureIds: ["drag-object"],
        codes: ["COLLISION"],
      },
    ]);

    expect(analytics.getFeatureUsageSummary()[0]?.errorCount).toBe(2);
  });

  it("tracks lesson progress across the curriculum", () => {
    const curriculum = createCurriculumMetadata();
    const analytics = new IdeAnalytics({ sessionStartedAt: 0, curriculum });

    analytics.startLesson("first-world", 1_000);
    analytics.recordLessonConcept({ lessonId: "first-world", conceptId: "scene", timestamp: 2_000 });
    analytics.recordLessonConcept({ lessonId: "first-world", conceptId: "object", timestamp: 3_000 });
    analytics.completeLesson("first-world", 4_000);
    analytics.startLesson("control-flow", 5_000);
    analytics.recordLessonConcept({ lessonId: "control-flow", conceptId: "loop", timestamp: 6_000 });

    expect(analytics.getLessonProgressSummary()).toEqual([
      {
        lessonId: "first-world",
        lessonName: "Build a first world",
        status: "completed",
        startedAt: 1_000,
        completedAt: 4_000,
        progressPercent: 100,
        demonstratedConcepts: ["scene", "object"],
        remainingConcepts: [],
        requiredConcepts: ["scene", "object"],
        interactionCount: 2,
      },
      {
        lessonId: "first-animation",
        lessonName: "Animate with methods",
        status: "not-started",
        startedAt: null,
        completedAt: null,
        progressPercent: 0,
        demonstratedConcepts: [],
        remainingConcepts: ["method", "sequence"],
        requiredConcepts: ["method", "sequence"],
        interactionCount: 0,
      },
      {
        lessonId: "control-flow",
        lessonName: "React with loops and conditions",
        status: "in-progress",
        startedAt: 5_000,
        completedAt: null,
        progressPercent: 50,
        demonstratedConcepts: ["loop"],
        remainingConcepts: ["condition"],
        requiredConcepts: ["loop", "condition"],
        interactionCount: 1,
      },
      {
        lessonId: "abstractions",
        lessonName: "Track state and build helpers",
        status: "not-started",
        startedAt: null,
        completedAt: null,
        progressPercent: 0,
        demonstratedConcepts: [],
        remainingConcepts: ["variable", "function"],
        requiredConcepts: ["variable", "function"],
        interactionCount: 0,
      },
    ]);
  });
});
