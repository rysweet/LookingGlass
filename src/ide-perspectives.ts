export type PerspectiveId = "code" | "scene" | "run";
export type PerspectivePanelRegion = "center" | "sidebar" | "footer";

export interface PerspectivePanel {
  readonly id: string;
  readonly label: string;
  readonly region: PerspectivePanelRegion;
  readonly visible: boolean;
}

export interface PerspectiveLayoutSnapshot {
  readonly perspectiveId: string;
  readonly title: string;
  readonly activePanelId: string | null;
  readonly panels: readonly PerspectivePanel[];
}

export interface PerspectiveWorkspaceSnapshot {
  readonly activePerspectiveId: string | null;
  readonly previousPerspectiveId: string | null;
  readonly perspectives: readonly PerspectiveLayoutSnapshot[];
}

type MutablePerspectivePanel = {
  id: string;
  label: string;
  region: PerspectivePanelRegion;
  visible: boolean;
};

function clonePanel(panel: MutablePerspectivePanel): PerspectivePanel {
  return { ...panel };
}

function clonePanels(panels: readonly MutablePerspectivePanel[]): PerspectivePanel[] {
  return panels.map(clonePanel);
}

function normalizePanelId(panelId: string): string {
  const normalized = panelId.trim();
  if (!normalized) {
    throw new Error("Perspective panel id must be a non-empty string");
  }
  return normalized;
}

export abstract class BasePerspective {
  private readonly panels = new Map<string, MutablePerspectivePanel>();
  private panelOrder: string[];
  private currentActivePanelId: string | null;

  protected constructor(
    readonly id: string,
    readonly title: string,
    panels: readonly (Omit<PerspectivePanel, "visible"> & { readonly visible?: boolean })[],
    activePanelId?: string | null,
  ) {
    if (!panels.length) {
      throw new Error(`Perspective ${id} requires at least one panel`);
    }
    this.panelOrder = panels.map((panel) => normalizePanelId(panel.id));
    for (const panel of panels) {
      const panelId = normalizePanelId(panel.id);
      if (this.panels.has(panelId)) {
        throw new Error(`Duplicate panel id: ${panelId}`);
      }
      this.panels.set(panelId, {
        id: panelId,
        label: panel.label,
        region: panel.region,
        visible: panel.visible ?? true,
      });
    }
    this.currentActivePanelId = this.resolveActivePanelId(activePanelId ?? panels[0]?.id ?? null);
  }

  get activePanelId(): string | null {
    return this.currentActivePanelId;
  }

  listPanels(): PerspectivePanel[] {
    return this.panelOrder
      .map((panelId) => this.panels.get(panelId))
      .filter((panel): panel is MutablePerspectivePanel => panel !== undefined)
      .map(clonePanel);
  }

  getPanel(panelId: string): PerspectivePanel | null {
    const panel = this.panels.get(panelId);
    return panel ? clonePanel(panel) : null;
  }

  isPanelVisible(panelId: string): boolean {
    return this.requirePanel(panelId).visible;
  }

  setPanelVisibility(panelId: string, visible: boolean): this {
    const panel = this.requirePanel(panelId);
    panel.visible = visible;
    if (!visible && this.currentActivePanelId === panel.id) {
      this.currentActivePanelId = this.firstVisiblePanelId();
    } else if (visible && this.currentActivePanelId === null) {
      this.currentActivePanelId = panel.id;
    }
    return this;
  }

  setActivePanel(panelId: string): this {
    const panel = this.requirePanel(panelId);
    if (!panel.visible) {
      throw new Error(`Cannot activate hidden panel: ${panelId}`);
    }
    this.currentActivePanelId = panel.id;
    return this;
  }

  saveLayout(): PerspectiveLayoutSnapshot {
    return {
      perspectiveId: this.id,
      title: this.title,
      activePanelId: this.currentActivePanelId,
      panels: this.listPanels(),
    };
  }

  restoreLayout(snapshot: PerspectiveLayoutSnapshot): this {
    if (snapshot.perspectiveId !== this.id) {
      throw new Error(`Cannot restore layout for ${snapshot.perspectiveId} into ${this.id}`);
    }
    for (const savedPanel of snapshot.panels) {
      const panel = this.panels.get(savedPanel.id);
      if (!panel) {
        continue;
      }
      panel.visible = savedPanel.visible;
    }
    this.currentActivePanelId = this.resolveActivePanelId(snapshot.activePanelId);
    return this;
  }

  private firstVisiblePanelId(): string | null {
    return this.panelOrder.find((panelId) => this.panels.get(panelId)?.visible) ?? null;
  }

  private resolveActivePanelId(panelId: string | null): string | null {
    if (panelId) {
      const panel = this.panels.get(panelId);
      if (panel?.visible) {
        return panel.id;
      }
    }
    return this.firstVisiblePanelId();
  }

  private requirePanel(panelId: string): MutablePerspectivePanel {
    const panel = this.panels.get(normalizePanelId(panelId));
    if (!panel) {
      throw new Error(`Unknown panel: ${panelId}`);
    }
    return panel;
  }
}

export class CodePerspective extends BasePerspective {
  constructor() {
    super("code", "Code", [
      { id: "code-editor", label: "Code Editor", region: "center" },
      { id: "type-hierarchy", label: "Type Hierarchy", region: "sidebar" },
    ]);
  }
}

export class ScenePerspective extends BasePerspective {
  constructor() {
    super("scene", "Scene", [
      { id: "scene-editor", label: "Scene Editor", region: "center" },
      { id: "object-palette", label: "Object Palette", region: "sidebar" },
    ]);
  }
}

export class RunPerspective extends BasePerspective {
  constructor() {
    super("run", "Run", [
      { id: "running-world", label: "Running World", region: "center" },
      { id: "console", label: "Console", region: "footer" },
    ]);
  }
}

function defaultPerspectives(): BasePerspective[] {
  return [new CodePerspective(), new ScenePerspective(), new RunPerspective()];
}

export class PerspectiveManager {
  private readonly perspectives = new Map<string, BasePerspective>();
  private currentPerspectiveId: string | null;
  private previousPerspectiveId: string | null = null;

  constructor(
    perspectives: readonly BasePerspective[] = defaultPerspectives(),
    initialPerspectiveId?: string | null,
  ) {
    for (const perspective of perspectives) {
      if (this.perspectives.has(perspective.id)) {
        throw new Error(`Duplicate perspective id: ${perspective.id}`);
      }
      this.perspectives.set(perspective.id, perspective);
    }
    const firstPerspectiveId = perspectives[0]?.id ?? null;
    this.currentPerspectiveId = initialPerspectiveId ?? firstPerspectiveId;
    if (this.currentPerspectiveId) {
      this.requirePerspective(this.currentPerspectiveId);
    }
  }

  get current(): BasePerspective | null {
    return this.currentPerspectiveId ? this.perspectives.get(this.currentPerspectiveId) ?? null : null;
  }

  get previous(): BasePerspective | null {
    return this.previousPerspectiveId ? this.perspectives.get(this.previousPerspectiveId) ?? null : null;
  }

  listPerspectives(): BasePerspective[] {
    return [...this.perspectives.values()];
  }

  getPerspective(id: string): BasePerspective | null {
    return this.perspectives.get(id) ?? null;
  }

  switchTo(id: string): BasePerspective {
    const perspective = this.requirePerspective(id);
    if (this.currentPerspectiveId !== id) {
      this.previousPerspectiveId = this.currentPerspectiveId;
      this.currentPerspectiveId = id;
    }
    return perspective;
  }

  saveLayout(): PerspectiveWorkspaceSnapshot {
    return {
      activePerspectiveId: this.currentPerspectiveId,
      previousPerspectiveId: this.previousPerspectiveId,
      perspectives: this.listPerspectives().map((perspective) => perspective.saveLayout()),
    };
  }

  restoreLayout(snapshot: PerspectiveWorkspaceSnapshot): this {
    for (const layout of snapshot.perspectives) {
      this.perspectives.get(layout.perspectiveId)?.restoreLayout(layout);
    }
    this.currentPerspectiveId = snapshot.activePerspectiveId
      ? this.requirePerspective(snapshot.activePerspectiveId).id
      : this.listPerspectives()[0]?.id ?? null;
    this.previousPerspectiveId = snapshot.previousPerspectiveId && this.perspectives.has(snapshot.previousPerspectiveId)
      ? snapshot.previousPerspectiveId
      : null;
    return this;
  }

  private requirePerspective(id: string): BasePerspective {
    const perspective = this.perspectives.get(id);
    if (!perspective) {
      throw new Error(`Unknown perspective: ${id}`);
    }
    return perspective;
  }
}

export interface PerspectiveToolbarButton {
  readonly perspectiveId: string;
  readonly label: string;
  readonly active: boolean;
  press(): BasePerspective;
}

export class PerspectiveToolbar {
  constructor(private readonly manager: PerspectiveManager) {}

  listButtons(): PerspectiveToolbarButton[] {
    return this.manager.listPerspectives().map((perspective) => ({
      perspectiveId: perspective.id,
      label: perspective.title,
      active: this.manager.current?.id === perspective.id,
      press: () => this.manager.switchTo(perspective.id),
    }));
  }

  press(perspectiveId: string): BasePerspective {
    return this.manager.switchTo(perspectiveId);
  }
}
