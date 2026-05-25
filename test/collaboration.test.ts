import { describe, expect, it } from "vitest";
import { CollaborationManager } from "../src/collaboration";

describe("CollaborationManager", () => {
  it("creates sessions and manages peer membership", () => {
    const manager = new CollaborationManager();
    const session = manager.createSession({
      name: "Shared world",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 10,
    });

    manager.joinSession(session.id, { id: "bob", name: "Bob", timestamp: 20 });
    const removed = manager.leaveSession(session.id, "bob");
    const snapshot = manager.getSessionSnapshot(session.id);

    expect(removed?.id).toBe("bob");
    expect(snapshot.name).toBe("Shared world");
    expect(snapshot.createdBy).toBe("alice");
    expect(snapshot.peers.map((peer) => peer.id)).toEqual(["alice"]);
  });

  it("broadcasts accepted edits to other peers", () => {
    const manager = new CollaborationManager();
    const session = manager.createSession({
      name: "Shared world",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    session.join({ id: "bob", name: "Bob", timestamp: 2 });
    session.join({ id: "charlie", name: "Charlie", timestamp: 3 });

    const result = session.applyChange({
      peerId: "alice",
      resourceId: "methods/main",
      content: 'say("hello")',
      timestamp: 4,
    });

    expect(result.applied).toBe(true);
    expect(result.recipients).toEqual(["bob", "charlie"]);
    expect(session.pullPendingChanges("bob")).toEqual([result.change]);
    expect(session.pullPendingChanges("charlie")).toEqual([result.change]);
    expect(session.pullPendingChanges("alice")).toEqual([]);
  });

  it("uses last-write-wins conflict resolution with tombstones", () => {
    const manager = new CollaborationManager();
    const session = manager.createSession({
      name: "Shared world",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    session.join({ id: "bob", name: "Bob", timestamp: 2 });

    const initial = session.applyChange({
      peerId: "alice",
      resourceId: "scene/camera",
      content: "camera.move()",
      timestamp: 10,
      changeId: "c1",
    });
    const deletion = session.applyChange({
      peerId: "bob",
      resourceId: "scene/camera",
      operation: "delete",
      timestamp: 30,
      changeId: "c2",
    });
    const staleRewrite = session.applyChange({
      peerId: "alice",
      resourceId: "scene/camera",
      content: "camera.turn()",
      timestamp: 20,
      changeId: "c3",
    });
    const recovery = session.applyChange({
      peerId: "bob",
      resourceId: "scene/camera",
      content: "camera.pointAt(target)",
      timestamp: 40,
      changeId: "c4",
    });

    expect(initial.document.tombstone).toBe(false);
    expect(deletion.document.tombstone).toBe(true);
    expect(deletion.document.content).toBeNull();
    expect(staleRewrite.applied).toBe(false);
    expect(staleRewrite.document.tombstone).toBe(true);
    expect(recovery.applied).toBe(true);
    expect(recovery.document.tombstone).toBe(false);
    expect(recovery.document.content).toBe("camera.pointAt(target)");
  });

  it("tracks which peers are editing which resources", () => {
    const manager = new CollaborationManager();
    const session = manager.createSession({
      name: "Shared world",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    session.join({ id: "bob", name: "Bob", timestamp: 2 });

    session.updatePresence("alice", {
      resourceId: "methods/main",
      selection: [5, 12],
      timestamp: 10,
    });
    session.updatePresence("bob", {
      resourceId: "scene/main",
      status: "idle",
      timestamp: 11,
    });

    expect(session.getPresence()).toEqual([
      {
        peerId: "alice",
        resourceId: "methods/main",
        selection: [5, 12],
        status: "active",
        updatedAt: 10,
      },
      {
        peerId: "bob",
        resourceId: "scene/main",
        selection: null,
        status: "idle",
        updatedAt: 11,
      },
    ]);

    session.leave("bob");
    expect(session.getPresence()).toEqual([
      {
        peerId: "alice",
        resourceId: "methods/main",
        selection: [5, 12],
        status: "active",
        updatedAt: 10,
      },
    ]);
  });
});
