/**
 * Renderer-agnostic component abstraction for Alice IDE.
 *
 * NOTE: This module exists as a **migration utility** for translating existing
 * Java Alice Swing component definitions into web-compatible descriptors.
 * New web UI should use the project's chosen framework (React, Vue, etc.)
 * directly rather than going through this abstraction layer. The web platform
 * and its frameworks already provide equivalent component models.
 *
 * Java Alice defines UI via Swing components (JButton, JLabel, JPanel, etc.).
 * This module defines Alice components in framework-neutral terms with
 * HTML/CSS adapters, so any renderer (React, Vue, vanilla DOM) can consume them.
 *
 * Each component is described as data (ComponentDescriptor), not as a live
 * widget. The HTMLAdapter converts descriptors to element specifications
 * suitable for DOM creation.
 */

// ---------------------------------------------------------------------------
// Component Types (mirrors Swing component categories)
// ---------------------------------------------------------------------------

export type ComponentType =
  | "button"
  | "label"
  | "text-field"
  | "text-area"
  | "checkbox"
  | "radio-button"
  | "combo-box"
  | "slider"
  | "spinner"
  | "panel"
  | "scroll-pane"
  | "split-pane"
  | "tabbed-pane"
  | "toolbar"
  | "menu-bar"
  | "menu-item"
  | "separator"
  | "progress-bar";

// ---------------------------------------------------------------------------
// Component Descriptor
// ---------------------------------------------------------------------------

export interface ComponentDescriptor {
  readonly id: string;
  readonly type: ComponentType;
  readonly label?: string;
  readonly enabled?: boolean;
  readonly visible?: boolean;
  readonly tooltip?: string;
  readonly children?: readonly ComponentDescriptor[];
  readonly props?: Readonly<Record<string, unknown>>;
  readonly ariaRole?: string;
  readonly ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Component Factories
// ---------------------------------------------------------------------------

export function createButton(
  id: string,
  label: string,
  options: { enabled?: boolean; tooltip?: string; onClick?: string } = {},
): ComponentDescriptor {
  return {
    id,
    type: "button",
    label,
    enabled: options.enabled ?? true,
    tooltip: options.tooltip,
    ariaRole: "button",
    ariaLabel: label,
    props: options.onClick ? { onClick: options.onClick } : undefined,
  };
}

export function createLabel(
  id: string,
  text: string,
  options: { htmlContent?: boolean } = {},
): ComponentDescriptor {
  return {
    id,
    type: "label",
    label: text,
    ariaRole: options.htmlContent ? "presentation" : undefined,
  };
}

export function createTextField(
  id: string,
  options: {
    value?: string;
    placeholder?: string;
    columns?: number;
    editable?: boolean;
  } = {},
): ComponentDescriptor {
  return {
    id,
    type: "text-field",
    enabled: options.editable ?? true,
    ariaRole: "textbox",
    props: {
      value: options.value ?? "",
      placeholder: options.placeholder ?? "",
      columns: options.columns ?? 20,
    },
  };
}

export function createCheckbox(
  id: string,
  label: string,
  checked = false,
): ComponentDescriptor {
  return {
    id,
    type: "checkbox",
    label,
    ariaRole: "checkbox",
    ariaLabel: label,
    props: { checked },
  };
}

export function createComboBox(
  id: string,
  options: { items: readonly string[]; selectedIndex?: number; label?: string },
): ComponentDescriptor {
  return {
    id,
    type: "combo-box",
    label: options.label,
    ariaRole: "combobox",
    ariaLabel: options.label,
    props: {
      items: [...options.items],
      selectedIndex: options.selectedIndex ?? 0,
    },
  };
}

export function createSlider(
  id: string,
  options: { min?: number; max?: number; value?: number; label?: string } = {},
): ComponentDescriptor {
  return {
    id,
    type: "slider",
    label: options.label,
    ariaRole: "slider",
    ariaLabel: options.label,
    props: {
      min: options.min ?? 0,
      max: options.max ?? 100,
      value: options.value ?? 50,
    },
  };
}

export function createPanel(
  id: string,
  children: readonly ComponentDescriptor[] = [],
  options: { label?: string } = {},
): ComponentDescriptor {
  return {
    id,
    type: "panel",
    label: options.label,
    children,
    ariaRole: children.length > 0 ? "group" : undefined,
    ariaLabel: options.label,
  };
}

export function createToolbar(
  id: string,
  items: readonly ComponentDescriptor[],
  options: { label?: string } = {},
): ComponentDescriptor {
  return {
    id,
    type: "toolbar",
    label: options.label,
    children: items,
    ariaRole: "toolbar",
    ariaLabel: options.label ?? "Toolbar",
  };
}

export function createSeparator(id: string): ComponentDescriptor {
  return {
    id,
    type: "separator",
    ariaRole: "separator",
  };
}

export function createProgressBar(
  id: string,
  options: { min?: number; max?: number; value?: number; indeterminate?: boolean } = {},
): ComponentDescriptor {
  return {
    id,
    type: "progress-bar",
    ariaRole: "progressbar",
    props: {
      min: options.min ?? 0,
      max: options.max ?? 100,
      value: options.value ?? 0,
      indeterminate: options.indeterminate ?? false,
    },
  };
}

// ---------------------------------------------------------------------------
// Component Tree Utilities
// ---------------------------------------------------------------------------

/** Recursively find a component by ID in a tree. */
export function findComponent(
  root: ComponentDescriptor,
  id: string,
): ComponentDescriptor | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findComponent(child, id);
    if (found) return found;
  }
  return null;
}

/** Count all components in a tree (including the root). */
export function countComponents(root: ComponentDescriptor): number {
  let count = 1;
  for (const child of root.children ?? []) {
    count += countComponents(child);
  }
  return count;
}

/** Collect all component IDs in a tree, depth-first. */
export function collectIds(root: ComponentDescriptor): string[] {
  const ids: string[] = [root.id];
  for (const child of root.children ?? []) {
    ids.push(...collectIds(child));
  }
  return ids;
}

// ---------------------------------------------------------------------------
// HTML Element Specification
// ---------------------------------------------------------------------------

export interface HTMLElementSpec {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children?: readonly HTMLElementSpec[];
  readonly textContent?: string;
}

// ---------------------------------------------------------------------------
// HTML Adapter
// ---------------------------------------------------------------------------

const TYPE_TO_TAG: Record<ComponentType, string> = {
  button: "button",
  label: "span",
  "text-field": "input",
  "text-area": "textarea",
  checkbox: "label",
  "radio-button": "label",
  "combo-box": "select",
  slider: "input",
  spinner: "input",
  panel: "div",
  "scroll-pane": "div",
  "split-pane": "div",
  "tabbed-pane": "div",
  toolbar: "nav",
  "menu-bar": "nav",
  "menu-item": "button",
  separator: "hr",
  "progress-bar": "progress",
};

/**
 * Converts a ComponentDescriptor tree into HTMLElementSpec trees.
 * Framework-agnostic: produces data for any DOM renderer.
 */
export class HTMLAdapter {
  /** Convert a single component descriptor to an HTML element spec. */
  convert(descriptor: ComponentDescriptor): HTMLElementSpec {
    const tag = TYPE_TO_TAG[descriptor.type] ?? "div";
    const attributes: Record<string, string> = { id: descriptor.id };

    if (descriptor.ariaRole) {
      attributes.role = descriptor.ariaRole;
    }
    if (descriptor.ariaLabel) {
      attributes["aria-label"] = descriptor.ariaLabel;
    }
    if (descriptor.enabled === false) {
      attributes.disabled = "true";
      attributes["aria-disabled"] = "true";
    }
    if (descriptor.visible === false) {
      attributes.hidden = "true";
    }
    if (descriptor.tooltip) {
      attributes.title = descriptor.tooltip;
    }

    this.applyTypeSpecificAttributes(descriptor, tag, attributes);

    const children = descriptor.children?.map((child) => this.convert(child));
    const textContent = descriptor.type === "label" || descriptor.type === "button"
      ? descriptor.label
      : undefined;

    return {
      tag,
      attributes,
      ...(children && children.length > 0 ? { children } : {}),
      ...(textContent ? { textContent } : {}),
    };
  }

  private applyTypeSpecificAttributes(
    descriptor: ComponentDescriptor,
    tag: string,
    attributes: Record<string, string>,
  ): void {
    const props = descriptor.props ?? {};

    switch (descriptor.type) {
    case "text-field":
      attributes.type = "text";
      if (typeof props.value === "string") attributes.value = props.value;
      if (typeof props.placeholder === "string") attributes.placeholder = props.placeholder;
      break;
    case "text-area":
      if (typeof props.value === "string") attributes.value = props.value;
      break;
    case "checkbox":
      // checkbox wraps in a label
      break;
    case "slider":
      attributes.type = "range";
      if (props.min !== undefined) attributes.min = String(props.min);
      if (props.max !== undefined) attributes.max = String(props.max);
      if (props.value !== undefined) attributes.value = String(props.value);
      break;
    case "spinner":
      attributes.type = "number";
      break;
    case "progress-bar":
      if (props.max !== undefined) attributes.max = String(props.max);
      if (props.value !== undefined) attributes.value = String(props.value);
      break;
    case "combo-box": {
      // select tag — children would be option elements
      break;
    }
    }
  }
}
