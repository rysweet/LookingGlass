/**
 * Cross-module integration tests for the "What Would Add Value" section.
 *
 * Proves the four value-add modules work together:
 * 1. Keyboard event → ShortcutManager → IDE command → UndoRedoManager
 * 2. Drag-and-drop → command → UndoRedoManager
 * 3. Dialog → FocusTrap → KeyboardNavigation
 * 4. Shortcut context conflict behavior
 * 5. Layout → Component → HTMLAdapter + ARIA attributes
 */
import { describe, expect, it } from "vitest";

// Keyboard / Shortcut system
import { ShortcutManager } from "../src/keyboard-shortcuts";
import {
  KeyboardEventBridge,
  comboFromKeyboardEvent,
  resolveDefaultShortcuts,
  type KeyboardEventLike,
} from "../src/keyboard-event-bridge";

// Command / Undo system
import { UndoRedoManager, type Command } from "../src/undo-redo";
import {
  SetVisibilityCommand,
  RenameEntityCommand,
  AddEntityToSceneCommand,
  RemoveEntityFromSceneCommand,
  SetEntityPositionCommand,
  TogglePropertyCommand,
} from "../src/ide-command-operations";

// Drag-and-drop system
import {
  DragDropCoordinator,
  EntityDragHandler,
  GalleryItemDragHandler,
  CodeBlockDragHandler,
  SceneDropHandler,
  CodeEditorDropHandler,
  type DragPayload,
} from "../src/drag-drop-bridge";

// Event system
import { EventSystem } from "../src/events";
import {
  DOMEventAdapter,
  InputMapBridge,
  AWT_KEY_CODES,
  type DOMEventLike,
  type DOMKeyboardEventLike,
  type DOMMouseEventLike,
} from "../src/event-system-bridge";

// Dialog system
import {
  DialogManager,
  InputDialog,
  ConfirmDialog,
  FileDialog,
} from "../src/dialog-system";

// Accessibility system
import {
  FocusTrapManager,
  KeyboardNavigationManager,
  AriaLiveRegion,
  AccessibilityAnnouncer,
  AriaAttributeBuilder,
  RoleMappingRegistry,
} from "../src/accessibility-bridge";

// Component / Layout system
import {
  HTMLAdapter,
  createButton,
  createPanel,
  createLabel,
  createToolbar,
  createSeparator,
  createTextField,
} from "../src/component-abstraction";
import {
  BorderLayoutBridge,
  BoxLayoutBridge,
} from "../src/layout-bridge";

// Domain types
import { Scene } from "../src/story-api/scene";
import { SModel } from "../src/story-api/entities";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function keyEvent(overrides: Partial<KeyboardEventLike> & { key: string }): KeyboardEventLike {
  return {
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    ...overrides,
  };
}

function makeDomKeyEvent(overrides: Partial<DOMKeyboardEventLike> & { key: string }): DOMKeyboardEventLike {
  return {
    type: "keydown",
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

function makeDomMouseEvent(overrides: Partial<DOMMouseEventLike> = {}): DOMMouseEventLike {
  return {
    type: "click",
    clientX: 0,
    clientY: 0,
    button: 0,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

function makeScene(...names: string[]): Scene {
  const scene = new Scene();
  for (const name of names) {
    scene.addEntity(name, new SModel());
  }
  return scene;
}

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe("value-bridge-integration", () => {
  // ==========================================================================
  // 1. Keyboard → ShortcutManager → IDE Command → Undo
  // ==========================================================================

  describe("Keyboard → Command → Undo chain", () => {
    it("keyboard event triggers shortcut that executes undoable command", () => {
      const scene = makeScene("rabbit");
      const entity = scene.getEntity("rabbit")!;
      entity.isShowing = true;

      const manager = new UndoRedoManager();
      const shortcutManager = new ShortcutManager();

      // Register a shortcut that executes an IDE command
      shortcutManager.register({
        id: "hide-selected",
        combo: "ctrl+h",
        description: "Hide selected entity",
        contexts: ["scene"],
        action: () => {
          manager.execute(new SetVisibilityCommand(scene, "rabbit", false));
        },
      });

      // Simulate keyboard event through the bridge
      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["scene"],
        platform: "windows",
      });

      const handled = bridge.handleEvent(keyEvent({ key: "h", ctrlKey: true }));
      expect(handled).toBe(true);
      expect(entity.isShowing).toBe(false);

      // Verify undo works
      manager.undo();
      expect(entity.isShowing).toBe(true);
    });

    it("Ctrl+Z triggers undo via shortcut → manager chain", () => {
      const scene = makeScene("entity");
      const entity = scene.getEntity("entity")!;
      entity.isShowing = true;

      const manager = new UndoRedoManager();
      const shortcutManager = new ShortcutManager();

      // Register undo/redo shortcuts
      shortcutManager.register({
        id: "undo",
        combo: "ctrl+z",
        description: "Undo",
        contexts: ["global"],
        action: () => manager.undo(),
      });
      shortcutManager.register({
        id: "redo",
        combo: "ctrl+y",
        description: "Redo",
        contexts: ["global"],
        action: () => manager.redo(),
      });

      // Execute a command directly
      manager.execute(new SetVisibilityCommand(scene, "entity", false));
      expect(entity.isShowing).toBe(false);

      // Trigger undo via keyboard
      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["global"],
      });
      bridge.handleEvent(keyEvent({ key: "z", ctrlKey: true }));
      expect(entity.isShowing).toBe(true);

      // Trigger redo via keyboard
      bridge.handleEvent(keyEvent({ key: "y", ctrlKey: true }));
      expect(entity.isShowing).toBe(false);
    });

    it("shortcut triggers rename command with full undo cycle", () => {
      const scene = makeScene("oldName");
      const entity = scene.getEntity("oldName")!;

      const manager = new UndoRedoManager();
      const shortcutManager = new ShortcutManager();

      shortcutManager.register({
        id: "rename",
        combo: "f2",
        description: "Rename entity",
        contexts: ["editor"],
        action: () => {
          manager.execute(new RenameEntityCommand(scene, "oldName", "newName"));
        },
      });

      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["editor"],
      });

      bridge.handleEvent(keyEvent({ key: "F2" }));
      expect(scene.getEntity("newName")).toBe(entity);
      expect(scene.getEntity("oldName")).toBeUndefined();

      manager.undo();
      expect(scene.getEntity("oldName")).toBe(entity);
    });

    it("default IDE shortcuts cover all required operations", () => {
      const resolved = resolveDefaultShortcuts("windows");
      const ids = resolved.map((s) => s.id);

      // Verify all critical operations have shortcuts
      expect(ids).toContain("undo");
      expect(ids).toContain("redo");
      expect(ids).toContain("cut");
      expect(ids).toContain("copy");
      expect(ids).toContain("paste");
      expect(ids).toContain("delete");
      expect(ids).toContain("save-project");
      expect(ids).toContain("new-project");
      expect(ids).toContain("run");
      expect(ids).toContain("help");

      // Verify no duplicate IDs
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ==========================================================================
  // 2. DnD → Command → Undo chain
  // ==========================================================================

  describe("DnD → Command → Undo chain", () => {
    it("dropping a gallery item creates an entity via undoable command", () => {
      const scene = new Scene();
      const manager = new UndoRedoManager();
      const coordinator = new DragDropCoordinator();

      // When a gallery item is dropped on the scene, create an entity
      const sceneHandler = new SceneDropHandler("scene-view", {
        onDrop: (payload, position) => {
          if (payload.type === "gallery-item") {
            const entity = new SModel();
            entity.position = { x: position.x, y: 0, z: position.y };
            manager.execute(
              new AddEntityToSceneCommand(scene, payload.displayName, entity),
            );
          }
        },
      });
      coordinator.registerTarget(sceneHandler.target);

      // Drag a gallery item
      const galleryHandler = new GalleryItemDragHandler();
      const source = galleryHandler.createSource("bunny", "bunny-001", "Animals", "Bunny");
      coordinator.beginDrag(source, { x: 0, y: 0 });
      coordinator.moveTo({ x: 100, y: 50 });

      expect(coordinator.canDrop("scene-view")).toBe(true);
      coordinator.drop("scene-view");

      // Verify entity was created
      const entity = scene.getEntity("Bunny");
      expect(entity).toBeDefined();
      expect(entity!.position).toEqual({ x: 100, y: 0, z: 50 });

      // Undo should remove the entity
      manager.undo();
      expect(scene.getEntity("Bunny")).toBeUndefined();

      // Redo should re-add it
      manager.redo();
      expect(scene.getEntity("Bunny")).toBeDefined();
    });

    it("dropping an entity drag creates a position change via command", () => {
      const scene = makeScene("rabbit");
      const entity = scene.getEntity("rabbit")!;
      entity.position = { x: 0, y: 0, z: 0 };

      const manager = new UndoRedoManager();
      const coordinator = new DragDropCoordinator();

      const sceneHandler = new SceneDropHandler("scene-view", {
        onDrop: (payload, position) => {
          if (payload.type === "entity") {
            manager.execute(
              new SetEntityPositionCommand(scene, payload.entityName, {
                x: position.x,
                y: 0,
                z: position.y,
              }),
            );
          }
        },
      });
      coordinator.registerTarget(sceneHandler.target);

      const entityHandler = new EntityDragHandler();
      const source = entityHandler.createSource("rabbit-drag", "rabbit", "SModel");
      coordinator.beginDrag(source, { x: 0, y: 0 });
      coordinator.moveTo({ x: 50, y: 75 });
      coordinator.drop("scene-view");

      expect(entity.position).toEqual({ x: 50, y: 0, z: 75 });

      manager.undo();
      expect(entity.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it("code block drop triggers add-statement workflow", () => {
      const statementsAdded: string[] = [];
      const coordinator = new DragDropCoordinator();

      const editorHandler = new CodeEditorDropHandler("code-editor", {
        onDrop: (payload, _position) => {
          statementsAdded.push(payload.template);
        },
      });
      coordinator.registerTarget(editorHandler.target);

      const codeHandler = new CodeBlockDragHandler();
      const source = codeHandler.createSource("say", "say", 'this.say("Hello")', "Say Block");
      coordinator.beginDrag(source, { x: 0, y: 0 });
      coordinator.drop("code-editor");

      expect(statementsAdded).toEqual(['this.say("Hello")']);
    });
  });

  // ==========================================================================
  // 3. Dialog → FocusTrap → KeyboardNavigation chain
  // ==========================================================================

  describe("Dialog → FocusTrap → Keyboard Navigation chain", () => {
    it("opening a modal dialog activates focus trap", () => {
      const dialogManager = new DialogManager();
      const focusTrap = new FocusTrapManager();

      // Create a dialog with focusable elements
      const inputDialog = new InputDialog("rename-dialog", "Rename Entity", "text");
      const managed = inputDialog.asManagedDialog();

      // Open the dialog
      dialogManager.open(managed);
      expect(dialogManager.hasBlockingModal()).toBe(true);

      // Set up focus trap for the dialog's elements
      focusTrap.createGroup("rename-dialog", ["name-input", "ok-btn", "cancel-btn"]);
      focusTrap.activate("rename-dialog");

      expect(focusTrap.isActive).toBe(true);
      expect(focusTrap.currentElementId).toBe("name-input");

      // Tab through elements
      expect(focusTrap.focusNext()).toBe("ok-btn");
      expect(focusTrap.focusNext()).toBe("cancel-btn");
      expect(focusTrap.focusNext()).toBe("name-input"); // wraps

      // Shift+Tab back
      expect(focusTrap.focusPrevious()).toBe("cancel-btn");

      // Close dialog, deactivate focus trap
      dialogManager.close("rename-dialog", "NewName");
      focusTrap.deactivate();

      expect(dialogManager.hasBlockingModal()).toBe(false);
      expect(focusTrap.isActive).toBe(false);
    });

    it("multiple modal dialogs stack focus traps correctly", () => {
      const dialogManager = new DialogManager();
      const focusTrap = new FocusTrapManager();

      // Open first dialog
      dialogManager.open({
        id: "confirm-delete",
        title: "Confirm Delete",
        mode: "modal",
        value: null,
        open: false,
      });
      focusTrap.createGroup("confirm-delete", ["yes-btn", "no-btn"]);
      focusTrap.activate("confirm-delete");

      expect(dialogManager.activeModal()?.id).toBe("confirm-delete");
      expect(focusTrap.currentElementId).toBe("yes-btn");

      // Open second dialog on top
      dialogManager.open({
        id: "error-msg",
        title: "Error",
        mode: "modal",
        value: null,
        open: false,
      });
      focusTrap.createGroup("error-msg", ["ok-btn"]);
      focusTrap.activate("error-msg");

      expect(dialogManager.activeModal()?.id).toBe("error-msg");
      expect(focusTrap.currentElementId).toBe("ok-btn");

      // Close top dialog, return to previous focus trap
      dialogManager.close("error-msg");
      focusTrap.activate("confirm-delete");
      expect(focusTrap.currentElementId).toBe("yes-btn");
    });

    it("accessibility announcer reports dialog actions", () => {
      const region = new AriaLiveRegion();
      const announcer = new AccessibilityAnnouncer(region, 0);

      // Announce dialog opening
      announcer.announce("Rename dialog opened", "assertive");
      expect(region.text).toBe("Rename dialog opened");

      // Announce validation error
      const dialog = new InputDialog("rename", "Rename", "text");
      const result = dialog.submit("  ");
      if (!result.accepted) {
        announcer.announce(`Error: ${result.reason}`, "assertive");
      }
      expect(region.text).toContain("text input is required");

      // Announce success
      const okResult = dialog.submit("NewName");
      if (okResult.accepted) {
        announcer.announce(`Renamed to ${okResult.value}`, "polite");
      }
      // assertive takes priority, so text should still be the error
      // until we explicitly set a new assertive or polite message
      expect(region.history.length).toBe(3);
    });
  });

  // ==========================================================================
  // 4. Shortcut context conflict behavior
  // ==========================================================================

  describe("Shortcut context conflict behavior", () => {
    it("same combo in global and scoped contexts both fire when both active", () => {
      const shortcutManager = new ShortcutManager();
      const fired: string[] = [];

      shortcutManager.register({
        id: "global-save",
        combo: "ctrl+s",
        description: "Save (global)",
        contexts: ["global"],
        action: () => fired.push("global"),
      });
      shortcutManager.register({
        id: "editor-save",
        combo: "ctrl+s",
        description: "Save (editor)",
        contexts: ["editor"],
        action: () => fired.push("editor"),
      });

      // With both contexts active, both fire
      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["global", "editor"],
      });
      bridge.handleEvent(keyEvent({ key: "s", ctrlKey: true }));

      // Current behavior: all matching shortcuts fire
      expect(fired).toContain("global");
      expect(fired).toContain("editor");
    });

    it("scoped shortcut only fires when its context is active", () => {
      const shortcutManager = new ShortcutManager();
      const fired: string[] = [];

      shortcutManager.register({
        id: "editor-save",
        combo: "ctrl+s",
        description: "Save (editor)",
        contexts: ["editor"],
        action: () => fired.push("editor"),
      });
      shortcutManager.register({
        id: "scene-save",
        combo: "ctrl+s",
        description: "Save (scene)",
        contexts: ["scene"],
        action: () => fired.push("scene"),
      });

      // Only editor context active
      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["editor"],
      });
      bridge.handleEvent(keyEvent({ key: "s", ctrlKey: true }));

      expect(fired).toEqual(["editor"]);
    });

    it("global shortcuts fire when no scoped shortcuts match", () => {
      const shortcutManager = new ShortcutManager();
      const fired: string[] = [];

      shortcutManager.register({
        id: "global-help",
        combo: "f1",
        description: "Help",
        contexts: ["global"],
        action: () => fired.push("help"),
      });

      // No scoped contexts, only global
      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["global"],
      });
      bridge.handleEvent(keyEvent({ key: "F1" }));

      expect(fired).toEqual(["help"]);
    });

    it("conflict detector reports overlapping combos", () => {
      const shortcutManager = new ShortcutManager();

      shortcutManager.register({
        id: "undo",
        combo: "ctrl+z",
        description: "Undo",
        contexts: ["global"],
      });
      shortcutManager.register({
        id: "editor-undo",
        combo: "ctrl+z",
        description: "Editor Undo",
        contexts: ["editor"],
      });

      const conflicts = shortcutManager.conflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      const ctrlZ = conflicts.find((c) => c.shortcutIds.includes("undo"));
      expect(ctrlZ).toBeDefined();
      expect(ctrlZ!.shortcutIds).toContain("editor-undo");
    });

    it("shortcut without contexts fires for any active context set", () => {
      const shortcutManager = new ShortcutManager();
      const fired: string[] = [];

      shortcutManager.register({
        id: "universal",
        combo: "ctrl+q",
        description: "Quit",
        // No contexts specified = always matches
        action: () => fired.push("quit"),
      });

      const bridge = new KeyboardEventBridge(shortcutManager, {
        contexts: () => ["editor"],
      });
      bridge.handleEvent(keyEvent({ key: "q", ctrlKey: true }));
      expect(fired).toEqual(["quit"]);
    });
  });

  // ==========================================================================
  // 5. Layout → Component → HTMLAdapter + ARIA
  // ==========================================================================

  describe("Layout → Component → HTML + ARIA chain", () => {
    it("builds a toolbar with layout, components, and ARIA attributes", () => {
      // Create layout
      const boxLayout = new BoxLayoutBridge("x", 4);
      const containerStyle = boxLayout.containerStyle();
      expect(containerStyle.display).toBe("flex");
      expect(containerStyle["flex-direction"]).toBe("row");

      // Create component tree
      const toolbar = createToolbar("main-toolbar", [
        createButton("save", "Save", { tooltip: "Save project" }),
        createSeparator("sep1"),
        createButton("undo", "Undo"),
        createButton("redo", "Redo"),
      ], { label: "Main Toolbar" });

      // Convert to HTML
      const adapter = new HTMLAdapter();
      const spec = adapter.convert(toolbar);

      expect(spec.tag).toBe("nav");
      expect(spec.attributes.role).toBe("toolbar");
      expect(spec.attributes["aria-label"]).toBe("Main Toolbar");
      expect(spec.children?.length).toBe(4);
      expect(spec.children![0].tag).toBe("button");
      expect(spec.children![0].attributes["aria-label"]).toBe("Save");
      expect(spec.children![1].tag).toBe("hr");
    });

    it("builds an IDE panel with BorderLayout and components", () => {
      // Create border layout for IDE
      const layout = new BorderLayoutBridge({ hgap: 4, vgap: 4 });
      layout.addRegion("north");
      layout.addRegion("west");
      layout.addRegion("center");
      layout.addRegion("south");

      const containerStyle = layout.containerStyle();
      expect(containerStyle.display).toBe("grid");
      expect(containerStyle["grid-template-areas"]).toContain("north");

      // Create component tree for each region
      const northPanel = createToolbar("toolbar", [
        createButton("run", "Run"),
      ]);
      const westPanel = createPanel("scene-tree", [
        createLabel("tree-label", "Scene Objects"),
      ], { label: "Scene Tree" });
      const centerPanel = createPanel("editor", [
        createTextField("code-input", { placeholder: "Enter code..." }),
      ], { label: "Code Editor" });

      // Convert each region to HTML
      const htmlAdapter = new HTMLAdapter();
      const toolbarSpec = htmlAdapter.convert(northPanel);
      const treeSpec = htmlAdapter.convert(westPanel);
      const editorSpec = htmlAdapter.convert(centerPanel);

      expect(toolbarSpec.attributes.role).toBe("toolbar");
      expect(treeSpec.attributes.role).toBe("group");
      expect(editorSpec.attributes.role).toBe("group");

      // Child styles
      expect(layout.childStyle("north")["grid-area"]).toBe("north");
      expect(layout.childStyle("center")["grid-area"]).toBe("center");
    });

    it("component ARIA attributes align with accessibility role mapping", () => {
      const registry = new RoleMappingRegistry();
      const builder = new AriaAttributeBuilder(registry);

      // Build ARIA attributes for scene elements
      const sceneAttrs = builder.build({
        id: "rabbit",
        label: "Rabbit",
        role: "actor",
        selected: true,
      });
      expect(sceneAttrs.role).toBe("treeitem");
      expect(sceneAttrs["aria-selected"]).toBe("true");

      // Component button should have button role
      const btn = createButton("save", "Save");
      expect(btn.ariaRole).toBe("button");
      expect(btn.ariaLabel).toBe("Save");
    });
  });

  // ==========================================================================
  // 6. AWT Event Bridge → EventSystem → Accessibility
  // ==========================================================================

  describe("AWT Event Bridge → EventSystem → Accessibility", () => {
    it("AWT key binding resolves through InputMapBridge and fires EventSystem", () => {
      const eventSystem = new EventSystem();
      eventSystem.register({ eventType: "keyPressed", handlerName: "onSave", key: "s" });

      // Set up InputMapBridge with AWT-style binding
      const inputMap = new InputMapBridge();
      inputMap.bind(AWT_KEY_CODES.VK_S, "save", { ctrl: true });

      // Simulate DOM keyboard event
      const domEvent = makeDomKeyEvent({ key: "s", ctrlKey: true });

      // InputMap resolves to action name
      const actions = inputMap.resolve(domEvent);
      expect(actions).toEqual(["save"]);

      // DOMEventAdapter dispatches to EventSystem
      const adapter = new DOMEventAdapter(eventSystem);
      const listeners = new Map<string, (event: DOMEventLike) => void>();
      const target = {
        addEventListener(type: string, fn: (event: DOMEventLike) => void) {
          listeners.set(type, fn);
        },
        removeEventListener(type: string, _fn: (event: DOMEventLike) => void) {
          listeners.delete(type);
        },
      };

      adapter.attach(target, ["keydown"]);
      listeners.get("keydown")!(domEvent);

      expect(adapter.firedResults.length).toBe(1);
      expect(adapter.firedResults[0].triggered[0].handlerName).toBe("onSave");
    });

    it("mouse event flows from DOM adapter through EventSystem", () => {
      const eventSystem = new EventSystem();
      eventSystem.register({ eventType: "mouseClicked", handlerName: "onSelect" });

      const adapter = new DOMEventAdapter(eventSystem);
      const listeners = new Map<string, (event: DOMEventLike) => void>();
      const target = {
        addEventListener(type: string, fn: (event: DOMEventLike) => void) {
          listeners.set(type, fn);
        },
        removeEventListener() {},
      };

      adapter.attach(target, ["click"]);
      listeners.get("click")!(makeDomMouseEvent({ clientX: 200, clientY: 150 }));

      expect(adapter.firedResults[0].triggered[0].handlerName).toBe("onSelect");

      // Announce the selection
      const announcer = new AccessibilityAnnouncer(new AriaLiveRegion(), 0);
      announcer.announce("Entity selected", "polite");
      expect(announcer.liveRegion.text).toBe("Entity selected");
    });
  });

  // ==========================================================================
  // 7. Full workflow: DnD + Keyboard + Dialog + Undo
  // ==========================================================================

  describe("Full workflow integration", () => {
    it("simulates add entity from gallery, rename via dialog, undo all", () => {
      const scene = new Scene();
      const manager = new UndoRedoManager();

      // Step 1: Drop a gallery item to add entity
      const entity = new SModel();
      entity.position = { x: 5, y: 0, z: 10 };
      manager.execute(new AddEntityToSceneCommand(scene, "Bunny", entity));
      expect(scene.getEntity("Bunny")).toBe(entity);

      // Step 2: Rename entity via dialog submission
      const renameDialog = new InputDialog("rename", "Rename", "text");
      const result = renameDialog.submit("WhiteRabbit");
      expect(result.accepted).toBe(true);
      manager.execute(new RenameEntityCommand(scene, "Bunny", result.value as string));
      expect(scene.getEntity("WhiteRabbit")).toBe(entity);

      // Step 3: Toggle visibility
      entity.isShowing = true;
      manager.execute(new SetVisibilityCommand(scene, "WhiteRabbit", false));
      expect(entity.isShowing).toBe(false);

      // Undo all three steps in reverse
      expect(manager.undoCount).toBe(3);

      manager.undo(); // undo visibility
      expect(entity.isShowing).toBe(true);

      manager.undo(); // undo rename
      expect(scene.getEntity("Bunny")).toBe(entity);
      expect(scene.getEntity("WhiteRabbit")).toBeUndefined();

      manager.undo(); // undo add
      expect(scene.getEntity("Bunny")).toBeUndefined();

      // Redo all three
      manager.redo(); // redo add
      expect(scene.getEntity("Bunny")).toBe(entity);

      manager.redo(); // redo rename
      expect(scene.getEntity("WhiteRabbit")).toBe(entity);

      manager.redo(); // redo visibility
      expect(entity.isShowing).toBe(false);
    });
  });
});
