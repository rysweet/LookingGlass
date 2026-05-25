import { describe, expect, it } from "vitest";
import { SimulatedActionTrigger } from "../src/croquet";
import {
  ActivityHistory,
  UserActivity,
  deserializeActivityTree,
  serializeActivityTree,
} from "../src/history";

describe("ActivityHistory", () => {
  it("tracks user activities with trigger timestamps", () => {
    const history = new ActivityHistory({ timestamp: 1 });
    const trigger = new SimulatedActionTrigger("toolbar", 10);

    const activity = history.beginActivity("rename field", {
      trigger,
      model: "FieldMenuModel",
    });

    expect(activity.startedAt).toBe(10);
    expect(activity.model).toBe("FieldMenuModel");
    expect(history.navigator.current).toBe(activity);
  });

  it("preserves parent-child activity trees", () => {
    const history = new ActivityHistory({ timestamp: 1 });
    const parent = history.beginActivity("edit method", { timestamp: 20 });
    const child = history.beginActivity("rename parameter", {
      parent,
      timestamp: 25,
    });

    history.complete(parent, 30);
    history.complete(child, 35);

    expect(child.parent).toBe(parent);
    expect(parent.children).toEqual([child]);
    expect(parent.latest()).toBe(child);
    expect(child.depth).toBe(2);
  });

  it("navigates backward and forward through recorded activities", () => {
    const history = new ActivityHistory({ timestamp: 1 });
    const open = history.beginActivity("open project", { timestamp: 10 });
    history.complete(open, 11);
    const edit = history.beginActivity("edit method", { timestamp: 20 });
    history.complete(edit, 21);
    const run = history.beginActivity("run world", { timestamp: 30 });
    history.complete(run, 31);

    expect(history.navigator.current).toBe(run);
    expect(history.navigator.back()).toBe(edit);
    expect(history.navigator.back()).toBe(open);
    expect(history.navigator.canGoBack).toBe(false);
    expect(history.navigator.forward()).toBe(edit);
    expect(history.navigator.forward()).toBe(run);
  });

  it("serializes and replays activity trees for later replay", () => {
    const history = new ActivityHistory({ timestamp: 1 });
    const parent = history.beginActivity("create object", { timestamp: 100 });
    const child = history.beginActivity("set color", { parent, timestamp: 110 });
    history.complete(parent, 120);
    history.complete(child, 130);

    const serialized = history.serialize();
    const replayed = ActivityHistory.replay(serialized);

    expect(replayed.root.children).toHaveLength(1);
    expect(replayed.root.children[0].label).toBe("create object");
    expect(replayed.root.children[0].children[0].label).toBe("set color");
    expect(replayed.navigator.current.label).toBe("set color");
  });

  it("round-trips standalone activity JSON", () => {
    const root = new UserActivity({ label: "root", kind: "history-root", timestamp: 1 });
    const activity = root.startChild({ label: "undo", timestamp: 5 });
    activity.finish(8);

    const encoded = serializeActivityTree(root);
    const decoded = deserializeActivityTree(encoded);

    expect(decoded.children).toHaveLength(1);
    expect(decoded.children[0].label).toBe("undo");
    expect(decoded.children[0].finishedAt).toBe(8);
  });
});
