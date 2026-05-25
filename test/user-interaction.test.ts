// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContextMenuManager,
  DragDropManager,
  DragSource,
  DropTarget,
  KeyboardShortcutManager,
  normalizeShortcut,
  shortcutFromKeyboardEvent,
} from "../src/user-interaction.js";

describe("user-interaction", () => {
  describe("drag and drop", () => {
    it("round-trips transfer data from source to compatible target", () => {
      const drops: Array<{ itemId: number; targetId: string | null }> = [];
      const manager = new DragDropManager<{ itemId: number }>();
      manager.registerSource(new DragSource({
        id: "gallery-item",
        createTransferData: () => ({ type: "scene-object", payload: { itemId: 7 } }),
      }));
      manager.registerTarget(new DropTarget({
        id: "scene-canvas",
        accepts: (data) => data.type === "scene-object",
        onDrop: (data, session) => drops.push({ itemId: data.payload.itemId, targetId: session.currentTargetId }),
      }));

      const session = manager.beginDrag("gallery-item");
      expect(session).toEqual({
        sourceId: "gallery-item",
        data: { type: "scene-object", payload: { itemId: 7 } },
        currentTargetId: null,
      });
      expect(manager.hover("scene-canvas")).toBe(true);
      expect(manager.activeSession?.currentTargetId).toBe("scene-canvas");
      expect(manager.drop()).toBe(true);
      expect(drops).toEqual([{ itemId: 7, targetId: "scene-canvas" }]);
      expect(manager.activeSession).toBeNull();
    });

    it("rejects incompatible targets and cancellable drags", () => {
      const manager = new DragDropManager<string>();
      manager.registerSource(new DragSource({
        id: "asset",
        createTransferData: () => ({ type: "texture", payload: "brick" }),
      }));
      manager.registerTarget(new DropTarget({
        id: "code-editor",
        accepts: (data) => data.type === "statement",
      }));

      expect(manager.beginDrag("asset")).not.toBeNull();
      expect(manager.hover("code-editor")).toBe(false);
      expect(manager.drop("code-editor")).toBe(false);
      manager.cancel();
      expect(manager.activeSession).toBeNull();
    });
  });

  describe("context menus", () => {
    let manager: ContextMenuManager;
    let element: HTMLDivElement;

    beforeEach(() => {
      manager = new ContextMenuManager();
      document.body.innerHTML = '<div id="scene-canvas"></div>';
      element = document.getElementById("scene-canvas") as HTMLDivElement;
    });

    it("opens a dynamic right-click menu and executes enabled items", () => {
      const actions: string[] = [];
      manager.bind(element, (context) => [
        {
          id: "rename",
          label: `Rename ${context.targetId}`,
          action: () => actions.push("rename"),
        },
        {
          id: "delete",
          label: "Delete",
          enabled: false,
          action: () => actions.push("delete"),
        },
      ]);

      element.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 24,
        clientY: 48,
      }));

      expect(manager.currentMenu).toEqual({
        context: { x: 24, y: 48, button: 2, targetId: "scene-canvas" },
        items: [
          { id: "rename", label: "Rename scene-canvas", action: expect.any(Function), children: undefined },
          { id: "delete", label: "Delete", enabled: false, action: expect.any(Function), children: undefined },
        ],
      });
      expect(manager.select("delete")).toBe(false);
      expect(manager.select("rename")).toBe(true);
      expect(actions).toEqual(["rename"]);
      expect(manager.currentMenu).toBeNull();
    });
  });

  describe("keyboard shortcuts", () => {
    it("normalizes shortcuts consistently", () => {
      expect(normalizeShortcut("shift+ctrl+s")).toBe("Ctrl+Shift+S");
      expect(shortcutFromKeyboardEvent(new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
      }))).toBe("Ctrl+Shift+S");
    });

    it("dispatches registered shortcuts with context and supports unsubscribe", () => {
      const manager = new KeyboardShortcutManager();
      const triggered = vi.fn();
      const unsubscribe = manager.register({
        id: "save-project",
        chord: "ctrl+s",
        description: "Save project",
        when: (context) => context.mode === "editor",
        handler: (event, context) => triggered(event.key, context.mode),
      });
      const unbound = manager.bind(window, { mode: "editor" });

      window.dispatchEvent(new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }));

      expect(triggered).toHaveBeenCalledWith("s", "editor");
      expect(manager.listShortcuts()).toEqual([
        { id: "save-project", chord: "Ctrl+S", description: "Save project" },
      ]);

      unsubscribe();
      window.dispatchEvent(new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }));
      expect(triggered).toHaveBeenCalledTimes(1);
      unbound();
    });
  });
});
