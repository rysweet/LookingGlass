import { describe, expect, it } from "vitest";
import {
  CodePerspective,
  PerspectiveManager,
  PerspectiveToolbar,
  RunPerspective,
  ScenePerspective,
} from "../src/ide-perspectives.js";

describe("ide-perspectives", () => {
  it("defines the expected panels for the built-in perspectives", () => {
    expect(new CodePerspective().listPanels()).toEqual([
      { id: "code-editor", label: "Code Editor", region: "center", visible: true },
      { id: "type-hierarchy", label: "Type Hierarchy", region: "sidebar", visible: true },
    ]);
    expect(new ScenePerspective().listPanels()).toEqual([
      { id: "scene-editor", label: "Scene Editor", region: "center", visible: true },
      { id: "object-palette", label: "Object Palette", region: "sidebar", visible: true },
    ]);
    expect(new RunPerspective().listPanels()).toEqual([
      { id: "running-world", label: "Running World", region: "center", visible: true },
      { id: "console", label: "Console", region: "footer", visible: true },
    ]);
  });

  it("switches perspectives and restores saved layouts", () => {
    const manager = new PerspectiveManager();
    manager.getPerspective("code")?.setPanelVisibility("type-hierarchy", false);
    manager.switchTo("scene");

    const savedLayout = manager.saveLayout();

    manager.getPerspective("code")?.setPanelVisibility("type-hierarchy", true);
    manager.switchTo("run");
    manager.restoreLayout(savedLayout);

    expect(manager.current?.id).toBe("scene");
    expect(manager.previous?.id).toBe("code");
    expect(manager.getPerspective("code")?.isPanelVisible("type-hierarchy")).toBe(false);
  });

  it("rejects activating hidden panels", () => {
    const perspective = new CodePerspective();
    perspective.setPanelVisibility("type-hierarchy", false);

    expect(() => perspective.setActivePanel("type-hierarchy")).toThrow("Cannot activate hidden panel");
  });

  it("builds toolbar buttons that mirror and switch the active perspective", () => {
    const manager = new PerspectiveManager();
    const toolbar = new PerspectiveToolbar(manager);

    expect(toolbar.listButtons().map((button) => ({ id: button.perspectiveId, active: button.active }))).toEqual([
      { id: "code", active: true },
      { id: "scene", active: false },
      { id: "run", active: false },
    ]);

    toolbar.press("run");

    expect(toolbar.listButtons().map((button) => ({ id: button.perspectiveId, active: button.active }))).toEqual([
      { id: "code", active: false },
      { id: "scene", active: false },
      { id: "run", active: true },
    ]);
  });
});
