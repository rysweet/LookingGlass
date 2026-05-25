import { describe, expect, it } from "vitest";
import {
  InstanceProperty,
  ListProperty,
  PropertyOwnerBase,
  PropertyValidationError,
  SetProperty,
} from "../src/project-properties";

class TestOwner extends PropertyOwnerBase {
  readonly title = new InstanceProperty(this, "title", "starter");
  readonly steps = new ListProperty(this, "steps", ["wake up"]);
  readonly tags = new SetProperty(this, "tags", ["lesson"]);
}

describe("project property binding framework", () => {
  it("registers properties with their owner and supports lookup by name", () => {
    const owner = new TestOwner();

    expect(owner.getPropertyNamed("title")).toBe(owner.title);
    expect(owner.getPropertyNamed("steps")).toBe(owner.steps);
    expect(owner.lookupNameFor(owner.tags)).toBe("tags");
    expect([...owner.getProperties()].map((property) => property.name)).toEqual([
      "title",
      "steps",
      "tags",
    ]);
  });

  it("validates, normalizes, and notifies instance property listeners", () => {
    const owner = new PropertyOwnerBase();
    const score = new InstanceProperty<number>(owner, "score", 5, {
      normalize: (value) => Math.max(0, Math.min(10, value)),
      validate: Number.isFinite,
      constraints: [
        (value) => Number.isInteger(value) || "score must be an integer",
      ],
    });
    const changes: Array<{ previousValue: number; value: number }> = [];

    score.addListener((event) => {
      changes.push({
        previousValue: event.previousValue,
        value: event.value,
      });
    });

    expect(score.setValue(12)).toBe(true);
    expect(score.value).toBe(10);
    expect(changes).toEqual([{ previousValue: 5, value: 10 }]);

    expect(() => score.setValue(4.5)).toThrowError(PropertyValidationError);
    expect(score.value).toBe(10);
  });

  it("emits indexed list events for add set remove and clear", () => {
    const owner = new PropertyOwnerBase();
    const steps = new ListProperty(owner, "steps", ["wake up"], {
      itemConstraints: [(value) => value.length > 0 || "steps cannot be blank"],
    });
    const changes: string[] = [];
    const indexedEvents: Array<{ kind: string; index: number; added: string[]; removed: string[] }> = [];

    steps.addListener((event) => {
      changes.push(`${event.previousValue.join("|")} -> ${event.value.join("|")}`);
    });
    steps.addIndexedListener((event) => {
      indexedEvents.push({
        kind: event.kind,
        index: event.index,
        added: [...event.added],
        removed: [...event.removed],
      });
    });

    expect(steps.add("open world", "run world")).toBe(3);
    expect(steps.set(1, "open editor")).toBe(true);
    expect(steps.removeAt(0)).toEqual(["wake up"]);
    expect(steps.clear()).toBe(true);
    expect(steps.toArray()).toEqual([]);

    expect(changes).toEqual([
      "wake up -> wake up|open world|run world",
      "wake up|open world|run world -> wake up|open editor|run world",
      "wake up|open editor|run world -> open editor|run world",
      "open editor|run world -> ",
    ]);
    expect(indexedEvents).toEqual([
      {
        kind: "add",
        index: 1,
        added: ["open world", "run world"],
        removed: [],
      },
      {
        kind: "set",
        index: 1,
        added: ["open editor"],
        removed: ["open world"],
      },
      {
        kind: "remove",
        index: 0,
        added: [],
        removed: ["wake up"],
      },
      {
        kind: "clear",
        index: 0,
        added: [],
        removed: ["open editor", "run world"],
      },
    ]);

    expect(() => steps.add("")).toThrowError(PropertyValidationError);
  });

  it("maintains set uniqueness and emits add remove and clear events", () => {
    const owner = new PropertyOwnerBase();
    const tags = new SetProperty(owner, "tags", ["lesson"], {
      itemConstraints: [(value) => value.trim().length > 0 || "tags cannot be blank"],
    });
    const events: Array<{ kind: string; values: string[] }> = [];

    tags.addSetListener((event) => {
      events.push({ kind: event.kind, values: [...event.values] });
    });

    expect(tags.add("lesson", "review")).toBe(2);
    expect(tags.toArray()).toEqual(["lesson", "review"]);
    expect(tags.remove("missing", "lesson")).toEqual(["lesson"]);
    expect(tags.has("review")).toBe(true);
    expect(tags.clear()).toBe(true);
    expect(tags.toArray()).toEqual([]);

    expect(events).toEqual([
      { kind: "add", values: ["review"] },
      { kind: "remove", values: ["lesson"] },
      { kind: "clear", values: ["review"] },
    ]);

    expect(() => tags.add("   ")).toThrowError(PropertyValidationError);
  });
});
