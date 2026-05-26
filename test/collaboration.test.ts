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

  it("isolates mailboxes, peers, and documents across simultaneous sessions", () => {
    const manager = new CollaborationManager();
    const alpha = manager.createSession({
      name: "Alpha",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    const beta = manager.createSession({
      name: "Beta",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 2,
    });

    alpha.join({ id: "bob", name: "Bob", timestamp: 3 });
    beta.join({ id: "bob", name: "Bob", timestamp: 4 });

    const alphaChange = alpha.applyChange({
      peerId: "alice",
      resourceId: "methods/main",
      content: 'say("alpha")',
      timestamp: 5,
      changeId: "alpha-1",
    });

    beta.updatePresence("bob", {
      resourceId: "scene/camera",
      status: "idle",
      timestamp: 6,
    });

    expect(alpha.pullPendingChanges("bob")).toEqual([alphaChange.change]);
    expect(beta.pullPendingChanges("bob")).toEqual([]);
    expect(alpha.getDocument("methods/main")?.content).toBe('say("alpha")');
    expect(beta.getDocument("methods/main")).toBeNull();

    alpha.leave("bob");
    expect(alpha.createSnapshot().peers.map((peer) => peer.id)).toEqual(["alice"]);
    expect(beta.createSnapshot().peers.map((peer) => peer.id)).toEqual(["alice", "bob"]);
    expect(manager.listSessions().map((session) => session.name)).toEqual(["Alpha", "Beta"]);
  });

  it("breaks same-timestamp conflicts by change id and only broadcasts accepted edits", () => {
    const manager = new CollaborationManager();
    const session = manager.createSession({
      name: "Shared world",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    session.join({ id: "bob", name: "Bob", timestamp: 2 });

    const accepted = session.applyChange({
      peerId: "alice",
      resourceId: "scene/camera",
      content: "camera.move()",
      timestamp: 10,
      changeId: "change-b",
    });
    const rejected = session.applyChange({
      peerId: "bob",
      resourceId: "scene/camera",
      content: "camera.turn()",
      timestamp: 10,
      changeId: "change-a",
    });
    const tieBreakerWinner = session.applyChange({
      peerId: "bob",
      resourceId: "scene/camera",
      content: "camera.pointAt(target)",
      timestamp: 10,
      changeId: "change-c",
    });

    expect(accepted.applied).toBe(true);
    expect(rejected.applied).toBe(false);
    expect(rejected.recipients).toEqual([]);
    expect(tieBreakerWinner.applied).toBe(true);
    expect(session.getDocument("scene/camera")).toEqual({
      resourceId: "scene/camera",
      content: "camera.pointAt(target)",
      tombstone: false,
      version: 2,
      updatedAt: 10,
      lastAuthorId: "bob",
      lastChangeId: "change-c",
    });
    expect(session.pullPendingChanges("bob").map((change) => change.changeId)).toEqual(["change-b"]);
    expect(session.pullPendingChanges("alice").map((change) => change.changeId)).toEqual(["change-c"]);
  });

  it("tracks presence updates that clear selections without leaking across sessions", () => {
    const manager = new CollaborationManager();
    const alpha = manager.createSession({
      name: "Alpha",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 1,
    });
    const beta = manager.createSession({
      name: "Beta",
      createdBy: { id: "alice", name: "Alice" },
      timestamp: 2,
    });

    alpha.join({ id: "bob", name: "Bob", timestamp: 3 });
    beta.join({ id: "bob", name: "Bob", timestamp: 4 });

    alpha.updatePresence("bob", {
      resourceId: "methods/main",
      selection: [0, 4],
      timestamp: 5,
    });
    alpha.updatePresence("bob", {
      resourceId: null,
      selection: null,
      timestamp: 6,
    });
    beta.updatePresence("bob", {
      resourceId: "scene/main",
      status: "idle",
      timestamp: 7,
    });

    expect(alpha.getPresence()).toEqual([
      {
        peerId: "bob",
        resourceId: "methods/main",
        selection: null,
        status: "active",
        updatedAt: 6,
      },
    ]);
    expect(beta.getPresence()).toEqual([
      {
        peerId: "bob",
        resourceId: "scene/main",
        selection: null,
        status: "idle",
        updatedAt: 7,
      },
    ]);
  });
});
