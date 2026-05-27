export type SplitOrientation = "horizontal" | "vertical";
export type DockPosition = "left" | "right" | "top" | "bottom" | "center";
export type PropertyValueType = "string" | "number" | "boolean" | "select";

export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutPanel {
  readonly id: string;
  readonly title: string;
  readonly preferredSize?: number;
  readonly minSize?: number;
  readonly visible?: boolean;
}

export interface TabItem<T = unknown> {
  readonly id: string;
  readonly title: string;
  readonly content: T;
  readonly closable?: boolean;
  readonly dirty?: boolean;
}

export interface ToolPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly keywords?: readonly string[];
  readonly disabled?: boolean;
}

export interface PropertyField<T = unknown> {
  readonly key: string;
  readonly label: string;
  readonly type: PropertyValueType;
  readonly value: T;
  readonly section?: string;
  readonly options?: readonly T[];
  readonly readOnly?: boolean;
  readonly parser?: (input: unknown) => T;
  readonly validator?: (value: T) => string | null;
}

export interface PropertyUpdateResult<T = unknown> {
  readonly applied: boolean;
  readonly value: T;
  readonly error: string | null;
}

const DEFAULT_RECT: LayoutRect = { x: 0, y: 0, width: 1, height: 1 };
const DOCK_ORDER: DockPosition[] = ["left", "right", "top", "bottom", "center"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneRect(rect: LayoutRect): LayoutRect {
  return { ...rect };
}

function stackVertically(bounds: LayoutRect, count: number, index: number): LayoutRect {
  const height = bounds.height / Math.max(1, count);
  return {
    x: bounds.x,
    y: bounds.y + (height * index),
    width: bounds.width,
    height,
  };
}

function stackHorizontally(bounds: LayoutRect, count: number, index: number): LayoutRect {
  const width = bounds.width / Math.max(1, count);
  return {
    x: bounds.x + (width * index),
    y: bounds.y,
    width,
    height: bounds.height,
  };
}

export class SplitPane {
  ratio: number;

  constructor(
    readonly orientation: SplitOrientation,
    ratio = 0.5,
    readonly minPrimarySize = 120,
    readonly minSecondarySize = 120,
  ) {
    this.ratio = clamp(ratio, 0.1, 0.9);
  }

  setRatio(ratio: number): number {
    this.ratio = clamp(ratio, 0.1, 0.9);
    return this.ratio;
  }

  resize(delta: number, totalSize: number): number {
    if (!Number.isFinite(totalSize) || totalSize <= 0) {
      return this.ratio;
    }
    const currentPrimarySize = totalSize * this.ratio;
    const requestedRatio = (currentPrimarySize + delta) / totalSize;
    const minRatio = Math.min(0.9, this.minPrimarySize / totalSize);
    const maxRatio = Math.max(0.1, 1 - (this.minSecondarySize / totalSize));
    if (minRatio > maxRatio) {
      this.ratio = 0.5;
      return this.ratio;
    }
    this.ratio = clamp(requestedRatio, minRatio, maxRatio);
    return this.ratio;
  }

  layout(bounds: LayoutRect): { primary: LayoutRect; secondary: LayoutRect } {
    const workingBounds = cloneRect(bounds);
    if (this.orientation === "horizontal") {
      const primaryWidth = workingBounds.width * this.ratio;
      return {
        primary: { x: workingBounds.x, y: workingBounds.y, width: primaryWidth, height: workingBounds.height },
        secondary: {
          x: workingBounds.x + primaryWidth,
          y: workingBounds.y,
          width: workingBounds.width - primaryWidth,
          height: workingBounds.height,
        },
      };
    }
    const primaryHeight = workingBounds.height * this.ratio;
    return {
      primary: { x: workingBounds.x, y: workingBounds.y, width: workingBounds.width, height: primaryHeight },
      secondary: {
        x: workingBounds.x,
        y: workingBounds.y + primaryHeight,
        width: workingBounds.width,
        height: workingBounds.height - primaryHeight,
      },
    };
  }
}

export class TabContainer<T = unknown> {
  private readonly tabs: TabItem<T>[] = [];
  private activeTabId: string | null = null;

  addTab(tab: TabItem<T>): TabItem<T> {
    const existingIndex = this.tabs.findIndex((entry) => entry.id === tab.id);
    if (existingIndex >= 0) {
      this.tabs.splice(existingIndex, 1, { ...tab });
    } else {
      this.tabs.push({ ...tab });
    }
    this.activeTabId ??= tab.id;
    return this.activeTab!;
  }

  activate(tabId: string): boolean {
    if (!this.tabs.some((entry) => entry.id === tabId)) {
      return false;
    }
    this.activeTabId = tabId;
    return true;
  }

  close(tabId: string): TabItem<T> | null {
    const index = this.tabs.findIndex((entry) => entry.id === tabId);
    if (index < 0) {
      return null;
    }
    const [removed] = this.tabs.splice(index, 1);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[index]?.id ?? this.tabs[index - 1]?.id ?? null;
    }
    return removed;
  }

  move(tabId: string, nextIndex: number): boolean {
    const currentIndex = this.tabs.findIndex((entry) => entry.id === tabId);
    if (currentIndex < 0) {
      return false;
    }
    const [tab] = this.tabs.splice(currentIndex, 1);
    this.tabs.splice(clamp(nextIndex, 0, this.tabs.length), 0, tab);
    return true;
  }

  get activeTab(): TabItem<T> | null {
    return this.tabs.find((entry) => entry.id === this.activeTabId) ?? null;
  }

  listTabs(): TabItem<T>[] {
    return this.tabs.map((entry) => ({ ...entry }));
  }
}

export class DockingSystem {
  private readonly zones = new Map<DockPosition, string[]>(DOCK_ORDER.map((position) => [position, []]));

  dock(panelId: string, position: DockPosition, index?: number): void {
    this.undock(panelId);
    const zone = this.zones.get(position)!;
    if (index === undefined || index < 0 || index >= zone.length) {
      zone.push(panelId);
      return;
    }
    zone.splice(index, 0, panelId);
  }

  undock(panelId: string): DockPosition | null {
    for (const position of DOCK_ORDER) {
      const zone = this.zones.get(position)!;
      const index = zone.indexOf(panelId);
      if (index >= 0) {
        zone.splice(index, 1);
        return position;
      }
    }
    return null;
  }

  getPanels(position: DockPosition): string[] {
    return [...this.zones.get(position)!];
  }

  getPosition(panelId: string): DockPosition | null {
    return DOCK_ORDER.find((position) => this.zones.get(position)!.includes(panelId)) ?? null;
  }

  suggestDock(x: number, y: number, bounds: LayoutRect = DEFAULT_RECT): DockPosition {
    const normalizedX = (x - bounds.x) / Math.max(bounds.width, 1);
    const normalizedY = (y - bounds.y) / Math.max(bounds.height, 1);
    if (normalizedY <= 0.2) {
      return "top";
    }
    if (normalizedY >= 0.8) {
      return "bottom";
    }
    if (normalizedX <= 0.2) {
      return "left";
    }
    if (normalizedX >= 0.8) {
      return "right";
    }
    return "center";
  }

  snapshot(): Record<DockPosition, string[]> {
    return {
      left: this.getPanels("left"),
      right: this.getPanels("right"),
      top: this.getPanels("top"),
      bottom: this.getPanels("bottom"),
      center: this.getPanels("center"),
    };
  }
}

export class LayoutManager {
  private readonly panels = new Map<string, LayoutPanel>();

  constructor(readonly docking = new DockingSystem()) {}

  registerPanel(panel: LayoutPanel, position: DockPosition = "center"): LayoutPanel {
    const nextPanel = { ...panel, visible: panel.visible ?? true };
    this.panels.set(panel.id, nextPanel);
    this.docking.dock(panel.id, position);
    return nextPanel;
  }

  movePanel(panelId: string, position: DockPosition, index?: number): boolean {
    if (!this.panels.has(panelId)) {
      return false;
    }
    this.docking.dock(panelId, position, index);
    return true;
  }

  getPanel(panelId: string): LayoutPanel | null {
    const panel = this.panels.get(panelId);
    return panel ? { ...panel } : null;
  }

  layout(width: number, height: number): Record<string, LayoutRect> {
    const rootBounds: LayoutRect = { x: 0, y: 0, width: Math.max(width, 1), height: Math.max(height, 1) };
    const leftPanels = this.visiblePanels("left");
    const rightPanels = this.visiblePanels("right");
    const topPanels = this.visiblePanels("top");
    const bottomPanels = this.visiblePanels("bottom");
    const centerPanels = this.visiblePanels("center");

    const leftWidth = resolveDockSize(leftPanels, rootBounds.width, 0.22, 180, 360);
    const rightWidth = resolveDockSize(rightPanels, rootBounds.width, 0.22, 180, 360);
    const remainingWidth = Math.max(rootBounds.width - leftWidth - rightWidth, 1);
    const topHeight = resolveDockSize(topPanels, rootBounds.height, 0.18, 120, 240);
    const bottomHeight = resolveDockSize(bottomPanels, rootBounds.height, 0.18, 120, 240);
    const remainingHeight = Math.max(rootBounds.height - topHeight - bottomHeight, 1);

    const leftBounds: LayoutRect = { x: 0, y: 0, width: leftWidth, height: rootBounds.height };
    const rightBounds: LayoutRect = { x: rootBounds.width - rightWidth, y: 0, width: rightWidth, height: rootBounds.height };
    const centerStrip: LayoutRect = { x: leftWidth, y: 0, width: remainingWidth, height: rootBounds.height };
    const topBounds: LayoutRect = { x: centerStrip.x, y: 0, width: centerStrip.width, height: topHeight };
    const bottomBounds: LayoutRect = {
      x: centerStrip.x,
      y: rootBounds.height - bottomHeight,
      width: centerStrip.width,
      height: bottomHeight,
    };
    const centerBounds: LayoutRect = {
      x: centerStrip.x,
      y: topHeight,
      width: centerStrip.width,
      height: remainingHeight,
    };

    const layout: Record<string, LayoutRect> = {};
    assignZone(layout, leftPanels, leftBounds, stackVertically);
    assignZone(layout, rightPanels, rightBounds, stackVertically);
    assignZone(layout, topPanels, topBounds, stackHorizontally);
    assignZone(layout, bottomPanels, bottomBounds, stackHorizontally);
    assignZone(layout, centerPanels, centerBounds, stackVertically);
    return layout;
  }

  private visiblePanels(position: DockPosition): LayoutPanel[] {
    return this.docking
      .getPanels(position)
      .map((panelId) => this.panels.get(panelId))
      .filter((panel): panel is LayoutPanel => Boolean(panel?.visible));
  }
}

export class ToolPalette {
  private readonly categories = new Map<string, ToolPaletteItem[]>();

  addItem(item: ToolPaletteItem): ToolPaletteItem {
    const entries = this.categories.get(item.category) ?? [];
    const nextEntries = entries.filter((entry) => entry.id !== item.id);
    nextEntries.push({ ...item, keywords: [...(item.keywords ?? [])] });
    this.categories.set(item.category, nextEntries);
    return nextEntries[nextEntries.length - 1];
  }

  listCategories(): string[] {
    return [...this.categories.keys()].sort((left, right) => left.localeCompare(right));
  }

  getItems(category: string): ToolPaletteItem[] {
    return (this.categories.get(category) ?? []).map((entry) => ({ ...entry, keywords: [...(entry.keywords ?? [])] }));
  }

  search(term: string): ToolPaletteItem[] {
    const needle = term.trim().toLowerCase();
    return [...this.categories.values()]
      .flat()
      .filter((entry) => {
        if (needle.length === 0) {
          return true;
        }
        const haystack = [entry.label, ...(entry.keywords ?? []), entry.category].join(" ").toLowerCase();
        return haystack.includes(needle);
      })
      .map((entry) => ({ ...entry, keywords: [...(entry.keywords ?? [])] }));
  }
}

export class PropertySheet {
  private readonly fields = new Map<string, PropertyField<unknown>>();

  register<T>(field: PropertyField<T>): PropertyField<T> {
    const nextField = {
      ...field,
      options: field.options ? [...field.options] : undefined,
    } satisfies PropertyField<T>;
    this.fields.set(field.key, nextField as PropertyField<unknown>);
    return nextField;
  }

  getValue<T>(key: string): T | undefined {
    const field = this.fields.get(key) as PropertyField<T> | undefined;
    return field?.value;
  }

  update<T>(key: string, input: unknown): PropertyUpdateResult<T> {
    const field = this.fields.get(key) as PropertyField<T> | undefined;
    if (!field) {
      throw new Error(`unknown property: ${key}`);
    }
    if (field.readOnly) {
      return { applied: false, value: field.value, error: `${field.label} is read-only` };
    }
    const parsed = (field.parser ? field.parser(input) : parseByType(field.type, input)) as T;
    if (field.options && !field.options.some((option) => Object.is(option, parsed))) {
      return { applied: false, value: field.value, error: `${field.label} must match one of the configured options` };
    }
    const error = field.validator?.(parsed) ?? null;
    if (error) {
      return { applied: false, value: field.value, error };
    }
    const nextField: PropertyField<T> = {
      ...field,
      value: parsed,
      options: field.options ? [...field.options] : undefined,
    };
    this.fields.set(key, nextField as PropertyField<unknown>);
    return { applied: true, value: parsed, error: null };
  }

  describeGrid(): Array<{ section: string; keys: string[] }> {
    const grouped = new Map<string, string[]>();
    for (const field of this.fields.values()) {
      const section = field.section ?? "General";
      const keys = grouped.get(section) ?? [];
      keys.push(field.key);
      grouped.set(section, keys);
    }
    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([section, keys]) => ({ section, keys: [...keys] }));
  }
}

function resolveDockSize(panels: LayoutPanel[], total: number, fraction: number, min: number, max: number): number {
  if (panels.length === 0) {
    return 0;
  }
  const preferred = panels.reduce((largest, panel) => Math.max(largest, panel.preferredSize ?? 0), 0);
  const minimum = panels.reduce((largest, panel) => Math.max(largest, panel.minSize ?? 0), 0);
  const fallback = total * fraction;
  return clamp(preferred || fallback, Math.max(min, minimum), Math.min(max, total / 2));
}

function assignZone(
  layout: Record<string, LayoutRect>,
  panels: LayoutPanel[],
  bounds: LayoutRect,
  arranger: (bounds: LayoutRect, count: number, index: number) => LayoutRect,
): void {
  panels.forEach((panel, index) => {
    layout[panel.id] = arranger(bounds, panels.length, index);
  });
}

function parseByType(type: PropertyValueType, input: unknown): unknown {
  switch (type) {
  case "number": {
    const value = typeof input === "number" ? input : Number(input);
    if (!Number.isFinite(value)) {
      throw new TypeError(`expected a finite number, received ${String(input)}`);
    }
    return value;
  }
  case "boolean":
    if (typeof input === "boolean") {
      return input;
    }
    if (input === "true" || input === "1") {
      return true;
    }
    if (input === "false" || input === "0") {
      return false;
    }
    throw new TypeError(`expected a boolean value, received ${String(input)}`);
  case "select":
  case "string":
  default:
    return String(input);
  }
}
