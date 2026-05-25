import {
  createCurriculumMetadata,
  createCurriculumProgress,
  getLessonById,
  getMissingConceptsForLesson,
  hasDemonstratedConcept,
  type CurriculumMetadata,
  type CurriculumProgress,
} from "./curriculum.js";

export interface FeatureUsageEvent {
  readonly featureId: string;
  readonly featureArea: string;
  readonly action?: string;
  readonly lessonId?: string;
  readonly durationMs?: number;
  readonly timestamp?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface ErrorAnalyticsEvent {
  readonly featureArea: string;
  readonly featureId?: string;
  readonly lessonId?: string;
  readonly code?: string;
  readonly message: string;
  readonly timestamp?: number;
}

export interface LessonConceptEvent {
  readonly lessonId: string;
  readonly conceptId: string;
  readonly timestamp?: number;
}

export interface FeatureUsageSummary {
  readonly featureId: string;
  readonly featureArea: string;
  readonly count: number;
  readonly totalDurationMs: number;
  readonly lastUsedAt: number;
  readonly actions: readonly string[];
  readonly errorCount: number;
}

export interface ErrorAreaSummary {
  readonly featureArea: string;
  readonly count: number;
  readonly lastOccurredAt: number;
  readonly featureIds: readonly string[];
  readonly codes: readonly string[];
}

export type LessonAnalyticsStatus = "not-started" | "in-progress" | "completed";

export interface LessonProgressSummary {
  readonly lessonId: string;
  readonly lessonName: string;
  readonly status: LessonAnalyticsStatus;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  readonly progressPercent: number;
  readonly demonstratedConcepts: readonly string[];
  readonly remainingConcepts: readonly string[];
  readonly requiredConcepts: readonly string[];
  readonly interactionCount: number;
}

export interface EngagementMetrics {
  readonly sessionDurationMs: number;
  readonly activeDurationMs: number;
  readonly idleDurationMs: number;
  readonly interactions: number;
  readonly featureUses: number;
  readonly errorCount: number;
  readonly lessonsTouched: number;
  readonly engagementScore: number;
}

export interface AnalyticsSnapshot {
  readonly sessionId: string;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly featureUsage: readonly FeatureUsageSummary[];
  readonly errorsByArea: readonly ErrorAreaSummary[];
  readonly lessons: readonly LessonProgressSummary[];
  readonly engagement: EngagementMetrics;
}

export interface IdeAnalyticsOptions {
  readonly sessionId?: string;
  readonly sessionStartedAt?: number;
  readonly idleThresholdMs?: number;
  readonly curriculum?: CurriculumMetadata;
}

interface MutableFeatureUsage {
  count: number;
  totalDurationMs: number;
  lastUsedAt: number;
  actions: Set<string>;
  errorCount: number;
}

interface MutableErrorArea {
  count: number;
  lastOccurredAt: number;
  featureIds: Set<string>;
  codes: Set<string>;
}

interface MutableLessonProgress {
  startedAt: number | null;
  completedAt: number | null;
  demonstratedConcepts: Set<string>;
  interactionCount: number;
}

let nextSessionId = 0;

function createSessionId(): string {
  nextSessionId += 1;
  return `analytics-session-${nextSessionId}`;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function toSortedArray(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function lessonSortIndex(curriculum: CurriculumMetadata, lessonId: string): number {
  const index = curriculum.lessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

export class IdeAnalytics {
  readonly sessionId: string;
  readonly startedAt: number;
  readonly idleThresholdMs: number;
  readonly curriculum: CurriculumMetadata;

  private endedAt: number | null = null;
  private readonly featureUsage = new Map<string, MutableFeatureUsage>();
  private readonly errorAreas = new Map<string, MutableErrorArea>();
  private readonly lessonProgress = new Map<string, MutableLessonProgress>();
  private readonly interactionTimestamps: number[] = [];
  private featureUseCount = 0;
  private errorCount = 0;

  constructor(options: IdeAnalyticsOptions = {}) {
    this.sessionId = options.sessionId ?? createSessionId();
    this.startedAt = options.sessionStartedAt ?? Date.now();
    this.idleThresholdMs = clampNonNegative(options.idleThresholdMs ?? 5 * 60_000);
    this.curriculum = options.curriculum ?? createCurriculumMetadata();
  }

  recordFeatureUse(event: FeatureUsageEvent): void {
    const timestamp = this.normalizeTimestamp(event.timestamp);
    const key = this.featureKey(event.featureArea, event.featureId);
    const usage = this.featureUsage.get(key) ?? {
      count: 0,
      totalDurationMs: 0,
      lastUsedAt: timestamp,
      actions: new Set<string>(),
      errorCount: 0,
    };
    usage.count += 1;
    usage.totalDurationMs += clampNonNegative(event.durationMs ?? 0);
    usage.lastUsedAt = Math.max(usage.lastUsedAt, timestamp);
    if (event.action) {
      usage.actions.add(event.action);
    }
    this.featureUsage.set(key, usage);
    this.featureUseCount += 1;
    this.noteInteraction(timestamp);
    if (event.lessonId) {
      this.touchLesson(event.lessonId, timestamp);
    }
  }

  recordError(event: ErrorAnalyticsEvent): void {
    const timestamp = this.normalizeTimestamp(event.timestamp);
    const summary = this.errorAreas.get(event.featureArea) ?? {
      count: 0,
      lastOccurredAt: timestamp,
      featureIds: new Set<string>(),
      codes: new Set<string>(),
    };
    summary.count += 1;
    summary.lastOccurredAt = Math.max(summary.lastOccurredAt, timestamp);
    if (event.featureId) {
      summary.featureIds.add(event.featureId);
      const usage = this.featureUsage.get(this.featureKey(event.featureArea, event.featureId));
      if (usage) {
        usage.errorCount += 1;
      }
    }
    if (event.code) {
      summary.codes.add(event.code);
    }
    this.errorAreas.set(event.featureArea, summary);
    this.errorCount += 1;
    this.noteInteraction(timestamp);
    if (event.lessonId) {
      this.touchLesson(event.lessonId, timestamp);
    }
  }

  startLesson(lessonId: string, timestamp?: number): void {
    const resolved = this.normalizeTimestamp(timestamp);
    const progress = this.requireLessonProgress(lessonId, resolved);
    if (progress.startedAt === null) {
      progress.startedAt = resolved;
    }
    this.noteInteraction(resolved);
  }

  recordLessonConcept(event: LessonConceptEvent): void {
    const resolved = this.normalizeTimestamp(event.timestamp);
    const lesson = this.requireLesson(event.lessonId);
    const progress = this.requireLessonProgress(event.lessonId, resolved);
    if (!lesson.requiredConcepts.includes(event.conceptId) && !this.curriculum.concepts[event.conceptId]) {
      throw new Error(`Unknown concept id: ${event.conceptId}`);
    }
    progress.demonstratedConcepts.add(event.conceptId);
    progress.interactionCount += 1;
    if (progress.startedAt === null) {
      progress.startedAt = resolved;
    }
    this.noteInteraction(resolved);
  }

  completeLesson(lessonId: string, timestamp?: number): void {
    const resolved = this.normalizeTimestamp(timestamp);
    const progress = this.requireLessonProgress(lessonId, resolved);
    if (progress.startedAt === null) {
      progress.startedAt = resolved;
    }
    progress.completedAt = Math.max(progress.completedAt ?? resolved, resolved);
    this.noteInteraction(resolved);
  }

  endSession(timestamp?: number): number {
    const resolved = this.normalizeTimestamp(timestamp);
    this.endedAt = Math.max(resolved, this.startedAt);
    return this.endedAt;
  }

  getFeatureUsageSummary(): FeatureUsageSummary[] {
    return [...this.featureUsage.entries()]
      .map(([key, usage]) => {
        const [featureArea, featureId] = key.split("::", 2);
        return {
          featureId,
          featureArea,
          count: usage.count,
          totalDurationMs: usage.totalDurationMs,
          lastUsedAt: usage.lastUsedAt,
          actions: toSortedArray(usage.actions),
          errorCount: usage.errorCount,
        } satisfies FeatureUsageSummary;
      })
      .sort((left, right) => right.count - left.count || left.featureArea.localeCompare(right.featureArea) || left.featureId.localeCompare(right.featureId));
  }

  getErrorFrequencyByArea(): ErrorAreaSummary[] {
    return [...this.errorAreas.entries()]
      .map(([featureArea, summary]) => ({
        featureArea,
        count: summary.count,
        lastOccurredAt: summary.lastOccurredAt,
        featureIds: toSortedArray(summary.featureIds),
        codes: toSortedArray(summary.codes),
      }))
      .sort((left, right) => right.count - left.count || left.featureArea.localeCompare(right.featureArea));
  }

  getLessonProgressSummary(): LessonProgressSummary[] {
    const lessonIds = new Set<string>([
      ...this.curriculum.lessons.map((lesson) => lesson.id),
      ...this.lessonProgress.keys(),
    ]);
    return [...lessonIds]
      .map((lessonId) => {
        const lesson = getLessonById(this.curriculum, lessonId);
        const state = this.lessonProgress.get(lessonId) ?? {
          startedAt: null,
          completedAt: null,
          demonstratedConcepts: new Set<string>(),
          interactionCount: 0,
        };
        const progress = createCurriculumProgress(state.demonstratedConcepts);
        const requiredConcepts = lesson?.requiredConcepts ?? [];
        const remainingConcepts = lesson
          ? getMissingConceptsForLesson(this.curriculum, progress, lessonId).map((concept) => concept.id)
          : [];
        const demonstratedConcepts = lesson
          ? requiredConcepts.filter((conceptId) => hasDemonstratedConcept(progress, conceptId))
          : toSortedArray(state.demonstratedConcepts);
        const completed = state.completedAt !== null || (lesson !== null && remainingConcepts.length === 0 && requiredConcepts.length > 0);
        const status: LessonAnalyticsStatus = completed
          ? "completed"
          : state.startedAt !== null || state.interactionCount > 0
            ? "in-progress"
            : "not-started";
        const progressPercent = requiredConcepts.length === 0
          ? status === "completed" ? 100 : 0
          : Math.round((demonstratedConcepts.length / requiredConcepts.length) * 100);
        return {
          lessonId,
          lessonName: lesson?.name ?? lessonId,
          status,
          startedAt: state.startedAt,
          completedAt: completed ? state.completedAt ?? state.startedAt : null,
          progressPercent,
          demonstratedConcepts: [...demonstratedConcepts],
          remainingConcepts,
          requiredConcepts: [...requiredConcepts],
          interactionCount: state.interactionCount,
        } satisfies LessonProgressSummary;
      })
      .sort((left, right) => lessonSortIndex(this.curriculum, left.lessonId) - lessonSortIndex(this.curriculum, right.lessonId) || left.lessonId.localeCompare(right.lessonId));
  }

  getEngagementMetrics(now = this.currentSessionTimestamp()): EngagementMetrics {
    const sessionDurationMs = Math.max(0, now - this.startedAt);
    const activeDurationMs = this.calculateActiveDuration(now);
    const idleDurationMs = Math.max(0, sessionDurationMs - activeDurationMs);
    const lessonsTouched = this.getLessonProgressSummary().filter((lesson) => lesson.status !== "not-started").length;
    const interactions = this.interactionTimestamps.length;
    const engagementScore = interactions === 0 || sessionDurationMs === 0
      ? 0
      : Math.round(((activeDurationMs / sessionDurationMs) * 0.6 + Math.min(interactions / 25, 1) * 0.4) * 100);
    return {
      sessionDurationMs,
      activeDurationMs,
      idleDurationMs,
      interactions,
      featureUses: this.featureUseCount,
      errorCount: this.errorCount,
      lessonsTouched,
      engagementScore,
    };
  }

  getSnapshot(now = this.currentSessionTimestamp()): AnalyticsSnapshot {
    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      featureUsage: this.getFeatureUsageSummary(),
      errorsByArea: this.getErrorFrequencyByArea(),
      lessons: this.getLessonProgressSummary(),
      engagement: this.getEngagementMetrics(now),
    };
  }

  private featureKey(featureArea: string, featureId: string): string {
    return `${featureArea}::${featureId}`;
  }

  private normalizeTimestamp(timestamp?: number): number {
    const resolved = timestamp ?? Date.now();
    return Math.max(resolved, this.startedAt);
  }

  private requireLesson(lessonId: string) {
    const lesson = getLessonById(this.curriculum, lessonId);
    if (!lesson) {
      throw new Error(`Unknown lesson id: ${lessonId}`);
    }
    return lesson;
  }

  private requireLessonProgress(lessonId: string, timestamp: number): MutableLessonProgress {
    this.requireLesson(lessonId);
    const existing = this.lessonProgress.get(lessonId);
    if (existing) {
      return existing;
    }
    const created: MutableLessonProgress = {
      startedAt: timestamp,
      completedAt: null,
      demonstratedConcepts: new Set<string>(),
      interactionCount: 0,
    };
    this.lessonProgress.set(lessonId, created);
    return created;
  }

  private touchLesson(lessonId: string, timestamp: number): void {
    const progress = this.requireLessonProgress(lessonId, timestamp);
    progress.interactionCount += 1;
    if (progress.startedAt === null) {
      progress.startedAt = timestamp;
    }
  }

  private noteInteraction(timestamp: number): void {
    this.interactionTimestamps.push(timestamp);
  }

  private calculateActiveDuration(now: number): number {
    if (this.interactionTimestamps.length === 0) {
      return 0;
    }
    const timestamps = [...this.interactionTimestamps].sort((left, right) => left - right);
    let activeDurationMs = 0;
    for (let index = 1; index < timestamps.length; index += 1) {
      activeDurationMs += Math.min(timestamps[index] - timestamps[index - 1], this.idleThresholdMs);
    }
    activeDurationMs += Math.min(Math.max(0, now - timestamps[timestamps.length - 1]), this.idleThresholdMs);
    return activeDurationMs;
  }

  private currentSessionTimestamp(): number {
    return this.endedAt ?? Date.now();
  }
}

export function createAnalyticsSnapshot(options: IdeAnalyticsOptions = {}): AnalyticsSnapshot {
  return new IdeAnalytics(options).getSnapshot(options.sessionStartedAt ?? Date.now());
}
