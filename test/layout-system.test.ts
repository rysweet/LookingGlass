import { describe, expect, it } from "vitest";
import {
  DockingSystem,
  LayoutManager,
  PropertySheet,
  SplitPane,
  TabContainer,
  ToolPalette,
} from "../src/layout-system";

describe("layout-system", () => {
  it("splits bounds and clamps resize ratios", () => {
    const split = new SplitPane("horizontal", 0.5, 100, 100);
    const initial = split.layout({ x: 0, y: 0, width: 600, height: 300 });

    expect(initial.primary.width).toBe(300);
    expect(initial.secondary.x).toBe(300);

    split.resize(260, 600);
    const resized = split.layout({ x: 0, y: 0, width: 600, height: 300 });
    expect(resized.primary.width).toBe(500);
    expect(resized.secondary.width).toBe(100);
  });

  it("tracks tabs, activation, closing, and reordering", () => {
    const tabs = new TabContainer<string>();
    tabs.addTab({ id: "scene", title: "Scene", content: "scene-editor" });
    tabs.addTab({ id: "code", title: "Code", content: "code-editor" });
    tabs.addTab({ id: "console", title: "Console", content: "console-view" });

    expect(tabs.activate("code")).toBe(true);
    expect(tabs.activeTab?.id).toBe("code");

    expect(tabs.move("console", 0)).toBe(true);
    expect(tabs.listTabs().map((tab) => tab.id)).toEqual(["console", "scene", "code"]);

    expect(tabs.close("code")?.id).toBe("code");
    expect(tabs.listTabs().map((tab) => tab.id)).toEqual(["console", "scene"]);
  });

  it("docks panels and suggests IDE drop zones", () => {
    const docking = new DockingSystem();
    docking.dock("gallery", "left");
    docking.dock("editor", "center");
    docking.dock("console", "bottom");

    expect(docking.getPosition("gallery")).toBe("left");
    expect(docking.suggestDock(10, 200, { x: 0, y: 0, width: 1000, height: 800 })).toBe("left");
    expect(docking.suggestDock(500, 790, { x: 0, y: 0, width: 1000, height: 800 })).toBe("bottom");
    expect(docking.snapshot().center).toEqual(["editor"]);
  });

  it("lays out docked panels for an IDE workspace", () => {
    const manager = new LayoutManager();
    manager.registerPanel({ id: "gallery", title: "Gallery", preferredSize: 220 }, "left");
    manager.registerPanel({ id: "editor", title: "Code Editor" }, "center");
    manager.registerPanel({ id: "scene", title: "Scene" }, "center");
    manager.registerPanel({ id: "console", title: "Console", preferredSize: 160 }, "bottom");

    const layout = manager.layout(1200, 900);

    expect(layout.gallery.x).toBe(0);
    expect(layout.gallery.width).toBe(220);
    expect(layout.console.y).toBeGreaterThan(layout.editor.y);
    expect(layout.editor.width).toBe(980);
    expect(layout.scene.height).toBeCloseTo(layout.editor.height, 6);
  });

  it("categorizes palette items and searches by keyword", () => {
    const palette = new ToolPalette();
    palette.addItem({ id: "say", label: "Say", category: "Actions", keywords: ["speech", "dialog"] });
    palette.addItem({ id: "loop", label: "Loop", category: "Control", keywords: ["repeat"] });

    expect(palette.listCategories()).toEqual(["Actions", "Control"]);
    expect(palette.search("speech").map((item) => item.id)).toEqual(["say"]);
    expect(palette.getItems("Control")[0]?.label).toBe("Loop");
  });

  it("updates property sheet values with validation", () => {
    const sheet = new PropertySheet();
    sheet.register({ key: "name", label: "Name", type: "string", value: "Bunny", section: "General" });
    sheet.register({
      key: "opacity",
      label: "Opacity",
      type: "number",
      value: 1,
      section: "Rendering",
      validator: (value) => (value < 0 || value > 1 ? "Opacity must stay within 0..1" : null),
    });

    expect(sheet.update("name", "Rabbit")).toEqual({ applied: true, value: "Rabbit", error: null });
    expect(sheet.update("opacity", 0.5)).toEqual({ applied: true, value: 0.5, error: null });
    expect(sheet.update("opacity", 2)).toEqual({ applied: false, value: 0.5, error: "Opacity must stay within 0..1" });
    expect(sheet.describeGrid()).toEqual([
      { section: "General", keys: ["name"] },
      { section: "Rendering", keys: ["opacity"] },
    ]);
  });
});
