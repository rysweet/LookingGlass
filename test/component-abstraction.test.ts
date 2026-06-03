import { describe, expect, it } from "vitest";
import {
  HTMLAdapter,
  collectIds,
  countComponents,
  createButton,
  createCheckbox,
  createComboBox,
  createLabel,
  createPanel,
  createProgressBar,
  createSeparator,
  createSlider,
  createTextField,
  createToolbar,
  findComponent,
  type ComponentDescriptor,
} from "../src/component-abstraction";

describe("component-abstraction", () => {
  // ---------- Component Factories ----------

  it("creates buttons with label and ARIA attributes", () => {
    const btn = createButton("save-btn", "Save", { tooltip: "Save project", onClick: "handleSave" });
    expect(btn.id).toBe("save-btn");
    expect(btn.type).toBe("button");
    expect(btn.label).toBe("Save");
    expect(btn.ariaRole).toBe("button");
    expect(btn.tooltip).toBe("Save project");
    expect(btn.props?.onClick).toBe("handleSave");
  });

  it("creates disabled buttons", () => {
    const btn = createButton("disabled-btn", "Disabled", { enabled: false });
    expect(btn.enabled).toBe(false);
  });

  it("creates labels", () => {
    const lbl = createLabel("title", "Hello World");
    expect(lbl.type).toBe("label");
    expect(lbl.label).toBe("Hello World");
  });

  it("creates text fields with properties", () => {
    const field = createTextField("name-input", {
      value: "Alice",
      placeholder: "Enter name",
      columns: 30,
      editable: true,
    });
    expect(field.type).toBe("text-field");
    expect(field.ariaRole).toBe("textbox");
    expect(field.props?.value).toBe("Alice");
    expect(field.props?.placeholder).toBe("Enter name");
    expect(field.props?.columns).toBe(30);
  });

  it("creates read-only text fields", () => {
    const field = createTextField("readonly", { editable: false });
    expect(field.enabled).toBe(false);
  });

  it("creates checkboxes", () => {
    const cb = createCheckbox("show-grid", "Show Grid", true);
    expect(cb.type).toBe("checkbox");
    expect(cb.label).toBe("Show Grid");
    expect(cb.ariaRole).toBe("checkbox");
    expect(cb.props?.checked).toBe(true);
  });

  it("creates combo boxes", () => {
    const combo = createComboBox("perspective", {
      items: ["Scene", "Code", "Run"],
      selectedIndex: 1,
      label: "Perspective",
    });
    expect(combo.type).toBe("combo-box");
    expect(combo.ariaRole).toBe("combobox");
    expect(combo.props?.items).toEqual(["Scene", "Code", "Run"]);
    expect(combo.props?.selectedIndex).toBe(1);
  });

  it("creates sliders", () => {
    const slider = createSlider("opacity", {
      min: 0,
      max: 100,
      value: 75,
      label: "Opacity",
    });
    expect(slider.type).toBe("slider");
    expect(slider.ariaRole).toBe("slider");
    expect(slider.props?.min).toBe(0);
    expect(slider.props?.max).toBe(100);
    expect(slider.props?.value).toBe(75);
  });

  it("creates panels with children", () => {
    const panel = createPanel("main", [
      createLabel("lbl", "Name:"),
      createTextField("input"),
    ], { label: "Main Panel" });

    expect(panel.type).toBe("panel");
    expect(panel.children?.length).toBe(2);
    expect(panel.ariaRole).toBe("group");
    expect(panel.ariaLabel).toBe("Main Panel");
  });

  it("creates empty panels without group role", () => {
    const panel = createPanel("empty");
    expect(panel.ariaRole).toBeUndefined();
  });

  it("creates toolbars", () => {
    const toolbar = createToolbar("main-toolbar", [
      createButton("save", "Save"),
      createSeparator("sep1"),
      createButton("undo", "Undo"),
    ], { label: "Main Toolbar" });

    expect(toolbar.type).toBe("toolbar");
    expect(toolbar.ariaRole).toBe("toolbar");
    expect(toolbar.children?.length).toBe(3);
  });

  it("creates separators", () => {
    const sep = createSeparator("divider");
    expect(sep.type).toBe("separator");
    expect(sep.ariaRole).toBe("separator");
  });

  it("creates progress bars", () => {
    const bar = createProgressBar("loading", { value: 50, max: 100 });
    expect(bar.type).toBe("progress-bar");
    expect(bar.ariaRole).toBe("progressbar");
    expect(bar.props?.value).toBe(50);
    expect(bar.props?.max).toBe(100);
  });

  it("creates indeterminate progress bars", () => {
    const bar = createProgressBar("spinner", { indeterminate: true });
    expect(bar.props?.indeterminate).toBe(true);
  });

  // ---------- Component Tree Utilities ----------

  it("finds components by ID in a tree", () => {
    const tree = createPanel("root", [
      createPanel("left", [
        createButton("save", "Save"),
        createButton("undo", "Undo"),
      ]),
      createPanel("right", [
        createTextField("search"),
      ]),
    ]);

    expect(findComponent(tree, "root")?.id).toBe("root");
    expect(findComponent(tree, "save")?.type).toBe("button");
    expect(findComponent(tree, "search")?.type).toBe("text-field");
    expect(findComponent(tree, "missing")).toBeNull();
  });

  it("counts components in a tree", () => {
    const tree = createPanel("root", [
      createButton("a", "A"),
      createPanel("sub", [
        createButton("b", "B"),
        createButton("c", "C"),
      ]),
    ]);
    expect(countComponents(tree)).toBe(5);
  });

  it("collects all IDs depth-first", () => {
    const tree = createPanel("root", [
      createButton("a", "A"),
      createPanel("sub", [
        createButton("b", "B"),
      ]),
    ]);
    expect(collectIds(tree)).toEqual(["root", "a", "sub", "b"]);
  });

  // ---------- HTML Adapter ----------

  describe("HTMLAdapter", () => {
    const adapter = new HTMLAdapter();

    it("converts a button to an HTML element spec", () => {
      const btn = createButton("save", "Save", { tooltip: "Save project" });
      const spec = adapter.convert(btn);

      expect(spec.tag).toBe("button");
      expect(spec.attributes.id).toBe("save");
      expect(spec.attributes.role).toBe("button");
      expect(spec.attributes["aria-label"]).toBe("Save");
      expect(spec.attributes.title).toBe("Save project");
      expect(spec.textContent).toBe("Save");
    });

    it("converts a disabled element", () => {
      const btn = createButton("dis", "Disabled", { enabled: false });
      const spec = adapter.convert(btn);

      expect(spec.attributes.disabled).toBe("true");
      expect(spec.attributes["aria-disabled"]).toBe("true");
    });

    it("converts a hidden element", () => {
      const desc: ComponentDescriptor = {
        id: "hidden",
        type: "panel",
        visible: false,
      };
      const spec = adapter.convert(desc);
      expect(spec.attributes.hidden).toBe("true");
    });

    it("converts a label to a span", () => {
      const lbl = createLabel("title", "Hello");
      const spec = adapter.convert(lbl);

      expect(spec.tag).toBe("span");
      expect(spec.textContent).toBe("Hello");
    });

    it("converts a text field to an input", () => {
      const field = createTextField("name", { value: "Alice", placeholder: "Enter name" });
      const spec = adapter.convert(field);

      expect(spec.tag).toBe("input");
      expect(spec.attributes.type).toBe("text");
      expect(spec.attributes.value).toBe("Alice");
      expect(spec.attributes.placeholder).toBe("Enter name");
    });

    it("converts a slider to a range input", () => {
      const slider = createSlider("vol", { min: 0, max: 100, value: 50 });
      const spec = adapter.convert(slider);

      expect(spec.tag).toBe("input");
      expect(spec.attributes.type).toBe("range");
      expect(spec.attributes.min).toBe("0");
      expect(spec.attributes.max).toBe("100");
      expect(spec.attributes.value).toBe("50");
    });

    it("converts a progress bar", () => {
      const bar = createProgressBar("loading", { max: 200, value: 100 });
      const spec = adapter.convert(bar);

      expect(spec.tag).toBe("progress");
      expect(spec.attributes.max).toBe("200");
      expect(spec.attributes.value).toBe("100");
    });

    it("converts a toolbar to a nav with children", () => {
      const toolbar = createToolbar("tb", [
        createButton("a", "A"),
        createButton("b", "B"),
      ]);
      const spec = adapter.convert(toolbar);

      expect(spec.tag).toBe("nav");
      expect(spec.attributes.role).toBe("toolbar");
      expect(spec.children?.length).toBe(2);
      expect(spec.children![0].tag).toBe("button");
    });

    it("converts a separator to an hr", () => {
      const spec = adapter.convert(createSeparator("s1"));
      expect(spec.tag).toBe("hr");
      expect(spec.attributes.role).toBe("separator");
    });

    it("converts a panel with nested children", () => {
      const tree = createPanel("root", [
        createLabel("l1", "Label"),
        createPanel("inner", [
          createButton("b1", "Button"),
        ]),
      ]);
      const spec = adapter.convert(tree);

      expect(spec.tag).toBe("div");
      expect(spec.children?.length).toBe(2);
      expect(spec.children![1].children?.length).toBe(1);
    });

    it("converts a combo box to a select", () => {
      const combo = createComboBox("pick", { items: ["A", "B"] });
      const spec = adapter.convert(combo);
      expect(spec.tag).toBe("select");
    });
  });
});
