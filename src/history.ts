import type { ActionTrigger } from "./croquet";

export type ActivityStatus = "pending" | "finished" | "cancelled";

export interface UserActivityOptions {
  readonly id?: string;
  readonly kind?: string;
  readonly label: string;
  readonly model?: string;
  readonly trigger?: ActionTrigger;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp?: number;
  readonly status?: ActivityStatus;
  readonly finishedAt?: number | null;
}

export interface SerializedUserActivity {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly model?: string;
  readonly triggerType?: string;
  readonly startedAt: number;
  readonly finishedAt: number | null;
  readonly status: ActivityStatus;
  readonly metadata: Record<string, unknown>;
  readonly children: readonly SerializedUserActivity[];
}

let nextActivityId = 0;

function createActivityId(): string {
  nextActivityId += 1;
  return `activity-${nextActivityId}`;
}

function cloneMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  return metadata ? { ...metadata } : {};
}

export class UserActivity {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly model?: string;
  readonly trigger?: ActionTrigger;
  readonly startedAt: number;
  readonly metadata: Record<string, unknown>;

  private _parent: UserActivity | null;
  private _children: UserActivity[] = [];
  private _status: ActivityStatus;
  private _finishedAt: number | null;

  constructor(options: UserActivityOptions, parent: UserActivity | null = null) {
    this.id = options.id ?? createActivityId();
    this.kind = options.kind ?? "user";
    this.label = options.label;
    this.model = options.model;
    this.trigger = options.trigger;
    this.startedAt = options.timestamp ?? options.trigger?.timestamp ?? Date.now();
    this.metadata = cloneMetadata(options.metadata);
    this._parent = parent;
    this._status = options.status ?? "pending";
    this._finishedAt = options.finishedAt ?? null;
  }

  get parent(): UserActivity | null {
    return this._parent;
  }

  get children(): readonly UserActivity[] {
    return this._children;
  }

  get status(): ActivityStatus {
    return this._status;
  }

  get finishedAt(): number | null {
    return this._finishedAt;
  }

  get isPending(): boolean {
    return this._status === "pending";
  }

  get isFinished(): boolean {
    return this._status === "finished";
  }

  get isCancelled(): boolean {
    return this._status === "cancelled";
  }

  get depth(): number {
    let depth = 0;
    let current = this._parent;
    while (current) {
      depth += 1;
      current = current.parent;
    }
    return depth;
  }

  get root(): UserActivity {
    let current: UserActivity = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  startChild(options: UserActivityOptions): UserActivity {
    const child = new UserActivity(options, this);
    this._children.push(child);
    return child;
  }

  finish(timestamp = Date.now()): this {
    this._status = "finished";
    this._finishedAt = Math.max(timestamp, this.startedAt);
    return this;
  }

  cancel(timestamp = Date.now()): this {
    this._status = "cancelled";
    this._finishedAt = Math.max(timestamp, this.startedAt);
    return this;
  }

  latest(): UserActivity {
    const lastChild = this._children.at(-1);
    return lastChild ? lastChild.latest() : this;
  }

  flatten(): UserActivity[] {
    const activities: UserActivity[] = [this];
    for (const child of this._children) {
      activities.push(...child.flatten());
    }
    return activities;
  }

  toJSON(): SerializedUserActivity {
    return {
      id: this.id,
      kind: this.kind,
      label: this.label,
      model: this.model,
      triggerType: this.trigger?.type,
      startedAt: this.startedAt,
      finishedAt: this._finishedAt,
      status: this._status,
      metadata: cloneMetadata(this.metadata),
      children: this._children.map((child) => child.toJSON()),
    };
  }

  static fromJSON(serialized: SerializedUserActivity, parent: UserActivity | null = null): UserActivity {
    const activity = new UserActivity(
      {
        id: serialized.id,
        kind: serialized.kind,
        label: serialized.label,
        model: serialized.model,
        metadata: serialized.metadata,
        timestamp: serialized.startedAt,
        status: serialized.status,
        finishedAt: serialized.finishedAt,
      },
      parent,
    );
    for (const child of serialized.children) {
      activity._children.push(UserActivity.fromJSON(child, activity));
    }
    return activity;
  }
}

export class HistoryNavigator {
  private readonly timeline: UserActivity[] = [];
  private currentIndex = -1;

  constructor(private readonly rootActivity: UserActivity) {
    this.rebuild();
  }

  get root(): UserActivity {
    return this.rootActivity;
  }

  get current(): UserActivity {
    return this.timeline[this.currentIndex] ?? this.rootActivity;
  }

  get canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  get canGoForward(): boolean {
    return this.currentIndex >= 0 && this.currentIndex < this.timeline.length - 1;
  }

  get entries(): readonly UserActivity[] {
    return this.timeline;
  }

  visit(activity: UserActivity): UserActivity {
    const existingIndex = this.timeline.indexOf(activity);
    if (existingIndex >= 0) {
      this.currentIndex = existingIndex;
      return this.current;
    }
    this.timeline.push(activity);
    this.currentIndex = this.timeline.length - 1;
    return activity;
  }

  back(): UserActivity {
    if (this.canGoBack) {
      this.currentIndex -= 1;
    }
    return this.current;
  }

  forward(): UserActivity {
    if (this.canGoForward) {
      this.currentIndex += 1;
    }
    return this.current;
  }

  rebuild(): void {
    const activities = this.rootActivity
      .flatten()
      .filter((activity) => activity !== this.rootActivity)
      .sort((left, right) => left.startedAt - right.startedAt);
    this.timeline.splice(0, this.timeline.length, ...activities);
    this.currentIndex = this.timeline.length - 1;
  }
}

export interface ActivityHistoryOptions {
  readonly root?: UserActivity;
  readonly rootLabel?: string;
  readonly timestamp?: number;
}

export class ActivityHistory {
  readonly root: UserActivity;
  readonly navigator: HistoryNavigator;

  constructor(options: ActivityHistoryOptions = {}) {
    this.root =
      options.root ??
      new UserActivity({
        kind: "history-root",
        label: options.rootLabel ?? "History",
        timestamp: options.timestamp,
        status: "finished",
        finishedAt: options.timestamp ?? Date.now(),
      });
    this.navigator = new HistoryNavigator(this.root);
  }

  beginActivity(label: string, options: Omit<UserActivityOptions, "label"> & { readonly parent?: UserActivity } = {}): UserActivity {
    const { parent = this.root, ...rest } = options;
    const activity = parent.startChild({ ...rest, label });
    this.navigator.visit(activity);
    return activity;
  }

  complete(activity: UserActivity, timestamp = Date.now()): UserActivity {
    activity.finish(timestamp);
    this.navigator.rebuild();
    this.navigator.visit(activity);
    return activity;
  }

  cancel(activity: UserActivity, timestamp = Date.now()): UserActivity {
    activity.cancel(timestamp);
    this.navigator.rebuild();
    this.navigator.visit(activity);
    return activity;
  }

  serialize(): SerializedUserActivity {
    return this.root.toJSON();
  }

  static replay(serialized: SerializedUserActivity): ActivityHistory {
    return new ActivityHistory({ root: UserActivity.fromJSON(serialized) });
  }
}

export function serializeActivityTree(activity: UserActivity): string {
  return JSON.stringify(activity.toJSON());
}

export function deserializeActivityTree(serialized: string): UserActivity {
  return UserActivity.fromJSON(JSON.parse(serialized) as SerializedUserActivity);
}
