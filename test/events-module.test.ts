import { describe, expect, it } from "vitest";
import { EventSystem, EventSystemError } from "../src/events.js";

const positions = new Map<string, { x: number; y: number; z: number }>([
  ["bunny", { x: 0, y: 0, z: 0 }],
  ["cat", { x: 1, y: 0, z: 1 }],
  ["hawk", { x: 50, y: 0, z: 0 }],
]);

function createEventSystem(): EventSystem {
  return new EventSystem({
    hasObject: (name) => positions.has(name),
    getObjectPosition: (name) => positions.get(name) ?? null,
  });
}

describe("EventSystem", () => {
  it("registers scene activation handlers and fires them", () => {
    const events = createEventSystem();

    const registration = events.register({
      eventType: "sceneActivated",
      handlerName: "onStart",
    });

    expect(registration.id).toBe("evt-1");
    expect(events.totalRegistrations).toBe(1);
    expect(events.fire("sceneActivated").triggered).toEqual([
      { id: "evt-1", eventType: "sceneActivated", handlerName: "onStart" },
    ]);
  });

  it("filters keyPress handlers by payload key", () => {
    const events = createEventSystem();
    events.register({ eventType: "keyPress", handlerName: "jump", key: "Space" });
    events.register({ eventType: "keyPress", handlerName: "duck", key: "ArrowDown" });

    const fired = events.fire("keyPress", { key: "Space" });
    expect(fired.registrationsEvaluated).toBe(2);
    expect(fired.triggered).toEqual([
      { id: "evt-1", eventType: "keyPress", handlerName: "jump" },
    ]);
  });

  it("validates proximity registrations against known scene objects", () => {
    const events = createEventSystem();

    expect(() =>
      events.register({
        eventType: "proximity",
        handlerName: "onMeet",
        targetObjects: ["bunny", "ghost"],
      }),
    ).toThrowError(new EventSystemError("unknown object: ghost"));
  });

  it("fires proximity handlers when tracked objects are within threshold", () => {
    const events = createEventSystem();
    events.register({
      eventType: "proximity",
      handlerName: "onMeet",
      targetObjects: ["bunny", "cat"],
      threshold: 2,
    });
    events.register({
      eventType: "proximity",
      handlerName: "tooFar",
      targetObjects: ["bunny", "hawk"],
      threshold: 2,
    });

    const fired = events.fire("proximity", { sourceObject: "bunny" });
    expect(fired.registrationsEvaluated).toBe(2);
    expect(fired.triggered).toEqual([
      { id: "evt-1", eventType: "proximity", handlerName: "onMeet" },
    ]);
  });

  it("reset clears registrations and restarts ids", () => {
    const events = createEventSystem();
    events.register({ eventType: "sceneActivated", handlerName: "first" });
    events.reset();

    const registration = events.register({ eventType: "sceneActivated", handlerName: "second" });
    expect(registration.id).toBe("evt-1");
    expect(events.fire("sceneActivated").triggered).toHaveLength(1);
  });
});
