// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import type { AliceProject } from "../src/a3p-parser";
import {
  SceneManager,
  type SceneTransitionCallback,
} from "../src/scene-manager.js";

// ═══════════════════════════════════════════════════════════════════════════
// SceneManager — TDD tests (written before implementation)
//
// Tests cover: creation, addScene, removeScene, getScene, setActive,
//              transition callbacks, first-scene-auto-active, edge cases
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(name: string): AliceProject {
  return {
    version: "3.6",
    projectName: name,
    sceneObjects: [],
    methods: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SceneManager – construction", () => {
  it("exports SceneManager as a class", () => {
    expect(SceneManager).toBeDefined();
    expect(typeof SceneManager).toBe("function");
  });

  it("starts with no scenes", () => {
    const mgr = new SceneManager();
    expect(mgr.sceneNames).toEqual([]);
    expect(mgr.activeSceneName).toBeNull();
  });

  it("sceneCount starts at zero", () => {
    const mgr = new SceneManager();
    expect(mgr.sceneCount).toBe(0);
  });
});

describe("SceneManager – addScene", () => {
  it("adds a scene by name from a project", () => {
    const mgr = new SceneManager();
    const project = makeProject("MyScene");
    mgr.addScene("scene1", project);
    expect(mgr.sceneNames).toContain("scene1");
    expect(mgr.sceneCount).toBe(1);
  });

  it("first added scene becomes active automatically", () => {
    const mgr = new SceneManager();
    mgr.addScene("first", makeProject("First"));
    expect(mgr.activeSceneName).toBe("first");
  });

  it("second added scene does NOT change active", () => {
    const mgr = new SceneManager();
    mgr.addScene("first", makeProject("A"));
    mgr.addScene("second", makeProject("B"));
    expect(mgr.activeSceneName).toBe("first");
  });

  it("throws if adding duplicate scene name", () => {
    const mgr = new SceneManager();
    mgr.addScene("dup", makeProject("A"));
    expect(() => mgr.addScene("dup", makeProject("B"))).toThrow();
  });

  it("getScene returns the built scene result", () => {
    const mgr = new SceneManager();
    mgr.addScene("s1", makeProject("S1"));
    const result = mgr.getScene("s1");
    expect(result).toBeDefined();
    expect(result!.scene).toBeInstanceOf(THREE.Scene);
    expect(result!.camera).toBeInstanceOf(THREE.PerspectiveCamera);
  });

  it("addScene accepts optional build options", () => {
    const mgr = new SceneManager();
    mgr.addScene("s1", makeProject("S1"), { showGroundGrid: true });
    const result = mgr.getScene("s1");
    expect(result).toBeDefined();
  });
});

describe("SceneManager – removeScene", () => {
  it("removes an existing scene", () => {
    const mgr = new SceneManager();
    mgr.addScene("s1", makeProject("S1"));
    mgr.addScene("s2", makeProject("S2"));
    const removed = mgr.removeScene("s1");
    expect(removed).toBe(true);
    expect(mgr.sceneNames).not.toContain("s1");
    expect(mgr.sceneCount).toBe(1);
  });

  it("returns false when removing non-existent scene", () => {
    const mgr = new SceneManager();
    expect(mgr.removeScene("nope")).toBe(false);
  });

  it("clears active when active scene is removed", () => {
    const mgr = new SceneManager();
    mgr.addScene("only", makeProject("Only"));
    expect(mgr.activeSceneName).toBe("only");
    mgr.removeScene("only");
    expect(mgr.activeSceneName).toBeNull();
  });

  it("does not change active when non-active scene is removed", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    mgr.addScene("b", makeProject("B"));
    mgr.removeScene("b");
    expect(mgr.activeSceneName).toBe("a");
  });
});

describe("SceneManager – getScene", () => {
  it("returns null for unknown scene name", () => {
    const mgr = new SceneManager();
    expect(mgr.getScene("missing")).toBeNull();
  });
});

describe("SceneManager – setActive", () => {
  it("switches active scene", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    mgr.addScene("b", makeProject("B"));
    mgr.setActive("b");
    expect(mgr.activeSceneName).toBe("b");
  });

  it("throws when setting active to non-existent scene", () => {
    const mgr = new SceneManager();
    expect(() => mgr.setActive("ghost")).toThrow();
  });

  it("setActive to current scene is a no-op (no error)", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    mgr.setActive("a");
    expect(mgr.activeSceneName).toBe("a");
  });

  it("getActiveScene returns current active scene result", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    const active = mgr.getActiveScene();
    expect(active).toBeDefined();
    expect(active!.scene).toBeInstanceOf(THREE.Scene);
  });

  it("getActiveScene returns null when no scenes exist", () => {
    const mgr = new SceneManager();
    expect(mgr.getActiveScene()).toBeNull();
  });
});

describe("SceneManager – transition callbacks", () => {
  it("fires onTransition callback when switching scenes", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    mgr.addScene("b", makeProject("B"));

    const callback = vi.fn();
    mgr.onTransition(callback);

    mgr.setActive("b");
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith("a", "b");
  });

  it("fires multiple registered callbacks", () => {
    const mgr = new SceneManager();
    mgr.addScene("x", makeProject("X"));
    mgr.addScene("y", makeProject("Y"));

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    mgr.onTransition(cb1);
    mgr.onTransition(cb2);

    mgr.setActive("y");
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not fire callback when setActive to same scene", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));

    const callback = vi.fn();
    mgr.onTransition(callback);

    mgr.setActive("a");
    expect(callback).not.toHaveBeenCalled();
  });

  it("offTransition removes a callback", () => {
    const mgr = new SceneManager();
    mgr.addScene("a", makeProject("A"));
    mgr.addScene("b", makeProject("B"));

    const callback = vi.fn();
    mgr.onTransition(callback);
    mgr.offTransition(callback);

    mgr.setActive("b");
    expect(callback).not.toHaveBeenCalled();
  });
});
