/**
 * Translates Java Alice's Swing layout concepts to CSS/HTML equivalents.
 *
 * NOTE: This module exists as a **migration utility** for translating existing
 * Java Alice layout code to web equivalents. New web UI should use CSS
 * Grid/Flexbox directly rather than going through these Java layout
 * abstractions. The web platform provides all this functionality natively.
 *
 * Java Alice uses AWT/Swing layout managers:
 * - BorderLayout → CSS Grid with named areas
 * - BoxLayout → CSS Flexbox (row or column)
 * - FlowLayout → CSS Flexbox with wrap
 * - GridLayout → CSS Grid with equal tracks
 * - GridBagLayout → CSS Grid with explicit row/column constraints
 * - CardLayout → Stacked panels with visibility toggle
 *
 * Each bridge produces a CSSProperties object that can be applied to
 * container and child elements.
 */

// ---------------------------------------------------------------------------
// CSS Property Types
// ---------------------------------------------------------------------------

export interface CSSProperties {
  readonly [key: string]: string;
}

// ---------------------------------------------------------------------------
// BorderLayout Bridge
// ---------------------------------------------------------------------------

export type BorderRegion = "north" | "south" | "east" | "west" | "center";

const BORDER_REGION_AREA: Record<BorderRegion, string> = {
  north: "north",
  south: "south",
  east: "east",
  west: "west",
  center: "center",
};

/**
 * Converts Java's BorderLayout to CSS Grid with named areas.
 * Produces a container style and a per-region child style.
 */
export class BorderLayoutBridge {
  private readonly regions = new Map<BorderRegion, boolean>();
  private hgap = 0;
  private vgap = 0;

  constructor(options: { hgap?: number; vgap?: number } = {}) {
    this.hgap = options.hgap ?? 0;
    this.vgap = options.vgap ?? 0;
  }

  /** Mark a region as populated. */
  addRegion(region: BorderRegion): void {
    this.regions.set(region, true);
  }

  /** Remove a region. */
  removeRegion(region: BorderRegion): void {
    this.regions.delete(region);
  }

  /** Get the CSS for the container element. */
  containerStyle(): CSSProperties {
    const hasNorth = this.regions.has("north");
    const hasSouth = this.regions.has("south");
    const hasWest = this.regions.has("west");
    const hasEast = this.regions.has("east");

    const rows: string[] = [];
    if (hasNorth) rows.push("auto");
    rows.push("1fr");
    if (hasSouth) rows.push("auto");

    const cols: string[] = [];
    if (hasWest) cols.push("auto");
    cols.push("1fr");
    if (hasEast) cols.push("auto");

    const areas = this.buildGridAreas(hasNorth, hasSouth, hasWest, hasEast, cols.length);

    return {
      display: "grid",
      "grid-template-rows": rows.join(" "),
      "grid-template-columns": cols.join(" "),
      "grid-template-areas": areas,
      gap: `${this.vgap}px ${this.hgap}px`,
    };
  }

  /** Get the CSS for a child in a specific region. */
  childStyle(region: BorderRegion): CSSProperties {
    return { "grid-area": BORDER_REGION_AREA[region] };
  }

  private buildGridAreas(
    hasNorth: boolean,
    hasSouth: boolean,
    hasWest: boolean,
    hasEast: boolean,
    colCount: number,
  ): string {
    const rows: string[] = [];

    if (hasNorth) {
      rows.push(`"${Array(colCount).fill("north").join(" ")}"`);
    }

    const middleCols: string[] = [];
    if (hasWest) middleCols.push("west");
    middleCols.push("center");
    if (hasEast) middleCols.push("east");
    rows.push(`"${middleCols.join(" ")}"`);

    if (hasSouth) {
      rows.push(`"${Array(colCount).fill("south").join(" ")}"`);
    }

    return rows.join(" ");
  }
}

// ---------------------------------------------------------------------------
// BoxLayout Bridge
// ---------------------------------------------------------------------------

export type BoxAxis = "x" | "y";

/**
 * Converts Java's BoxLayout to CSS Flexbox.
 * BoxLayout.X_AXIS → flex-direction: row
 * BoxLayout.Y_AXIS → flex-direction: column
 */
export class BoxLayoutBridge {
  constructor(
    private readonly axis: BoxAxis,
    private readonly gap = 0,
  ) {}

  containerStyle(): CSSProperties {
    return {
      display: "flex",
      "flex-direction": this.axis === "x" ? "row" : "column",
      "align-items": "stretch",
      gap: `${this.gap}px`,
    };
  }

  /** Style for a child with optional flex weight (like Box.createGlue). */
  childStyle(options: { flex?: number; alignSelf?: string } = {}): CSSProperties {
    const styles: Record<string, string> = {};
    if (options.flex !== undefined) {
      styles.flex = String(options.flex);
    }
    if (options.alignSelf) {
      styles["align-self"] = options.alignSelf;
    }
    return styles;
  }

  /** Style for a rigid spacer (Box.createRigidArea). */
  rigidSpacerStyle(size: number): CSSProperties {
    return this.axis === "x"
      ? { width: `${size}px`, "flex-shrink": "0" }
      : { height: `${size}px`, "flex-shrink": "0" };
  }

  /** Style for a flexible spacer (Box.createGlue). */
  glueStyle(): CSSProperties {
    return { flex: "1" };
  }
}

// ---------------------------------------------------------------------------
// FlowLayout Bridge
// ---------------------------------------------------------------------------

export type FlowAlignment = "left" | "center" | "right";

/**
 * Converts Java's FlowLayout to CSS Flexbox with wrapping.
 */
export class FlowLayoutBridge {
  constructor(
    private readonly alignment: FlowAlignment = "center",
    private readonly hgap = 5,
    private readonly vgap = 5,
  ) {}

  containerStyle(): CSSProperties {
    const justifyMap: Record<FlowAlignment, string> = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
    };
    return {
      display: "flex",
      "flex-wrap": "wrap",
      "justify-content": justifyMap[this.alignment],
      gap: `${this.vgap}px ${this.hgap}px`,
    };
  }
}

// ---------------------------------------------------------------------------
// GridLayout Bridge
// ---------------------------------------------------------------------------

/**
 * Converts Java's GridLayout to CSS Grid with equal-sized tracks.
 */
export class GridLayoutBridge {
  constructor(
    private readonly rows: number,
    private readonly cols: number,
    private readonly hgap = 0,
    private readonly vgap = 0,
  ) {}

  containerStyle(): CSSProperties {
    const effectiveRows = Math.max(1, this.rows);
    const effectiveCols = Math.max(1, this.cols);
    return {
      display: "grid",
      "grid-template-rows": `repeat(${effectiveRows}, 1fr)`,
      "grid-template-columns": `repeat(${effectiveCols}, 1fr)`,
      gap: `${this.vgap}px ${this.hgap}px`,
    };
  }
}

// ---------------------------------------------------------------------------
// GridBagLayout Bridge
// ---------------------------------------------------------------------------

export interface GridBagConstraints {
  readonly gridx: number;
  readonly gridy: number;
  readonly gridwidth?: number;
  readonly gridheight?: number;
  readonly weightx?: number;
  readonly weighty?: number;
  readonly fill?: "none" | "horizontal" | "vertical" | "both";
  readonly anchor?: "center" | "north" | "south" | "east" | "west" |
    "northwest" | "northeast" | "southwest" | "southeast";
  readonly insets?: { top: number; left: number; bottom: number; right: number };
}

const ANCHOR_TO_CSS: Record<string, { justifySelf: string; alignSelf: string }> = {
  center: { justifySelf: "center", alignSelf: "center" },
  north: { justifySelf: "center", alignSelf: "start" },
  south: { justifySelf: "center", alignSelf: "end" },
  east: { justifySelf: "end", alignSelf: "center" },
  west: { justifySelf: "start", alignSelf: "center" },
  northwest: { justifySelf: "start", alignSelf: "start" },
  northeast: { justifySelf: "end", alignSelf: "start" },
  southwest: { justifySelf: "start", alignSelf: "end" },
  southeast: { justifySelf: "end", alignSelf: "end" },
};

/**
 * Converts Java's GridBagLayout to CSS Grid with explicit placement.
 */
export class GridBagLayoutBridge {
  private readonly constraints: GridBagConstraints[] = [];

  addConstraint(constraint: GridBagConstraints): void {
    this.constraints.push(constraint);
  }

  containerStyle(): CSSProperties {
    let maxCol = 0;
    let maxRow = 0;
    for (const c of this.constraints) {
      maxCol = Math.max(maxCol, c.gridx + (c.gridwidth ?? 1));
      maxRow = Math.max(maxRow, c.gridy + (c.gridheight ?? 1));
    }

    const colWeights = new Array<number>(Math.max(1, maxCol)).fill(0);
    const rowWeights = new Array<number>(Math.max(1, maxRow)).fill(0);
    for (const c of this.constraints) {
      if (c.weightx) colWeights[c.gridx] = Math.max(colWeights[c.gridx], c.weightx);
      if (c.weighty) rowWeights[c.gridy] = Math.max(rowWeights[c.gridy], c.weighty);
    }

    const colTemplate = colWeights.map((w) => (w > 0 ? `${w}fr` : "auto")).join(" ");
    const rowTemplate = rowWeights.map((w) => (w > 0 ? `${w}fr` : "auto")).join(" ");

    return {
      display: "grid",
      "grid-template-columns": colTemplate,
      "grid-template-rows": rowTemplate,
    };
  }

  childStyle(constraint: GridBagConstraints): CSSProperties {
    const styles: Record<string, string> = {
      "grid-column": `${constraint.gridx + 1} / span ${constraint.gridwidth ?? 1}`,
      "grid-row": `${constraint.gridy + 1} / span ${constraint.gridheight ?? 1}`,
    };

    const fill = constraint.fill ?? "none";
    if (fill === "horizontal" || fill === "both") {
      styles.width = "100%";
    }
    if (fill === "vertical" || fill === "both") {
      styles.height = "100%";
    }

    const anchor = constraint.anchor ?? "center";
    const anchorCSS = ANCHOR_TO_CSS[anchor];
    if (anchorCSS) {
      styles["justify-self"] = anchorCSS.justifySelf;
      styles["align-self"] = anchorCSS.alignSelf;
    }

    if (constraint.insets) {
      const { top, right, bottom, left } = constraint.insets;
      styles.margin = `${top}px ${right}px ${bottom}px ${left}px`;
    }

    return styles;
  }
}

// ---------------------------------------------------------------------------
// CardLayout Bridge
// ---------------------------------------------------------------------------

/**
 * Converts Java's CardLayout to a stacked visibility toggle.
 * Only one card is visible at a time.
 */
export class CardLayoutBridge {
  private readonly cards: string[] = [];
  private activeCard: string | null = null;

  addCard(name: string): void {
    if (!this.cards.includes(name)) {
      this.cards.push(name);
    }
    this.activeCard ??= name;
  }

  show(name: string): boolean {
    if (!this.cards.includes(name)) return false;
    this.activeCard = name;
    return true;
  }

  get active(): string | null {
    return this.activeCard;
  }

  get allCards(): readonly string[] {
    return [...this.cards];
  }

  containerStyle(): CSSProperties {
    return {
      display: "grid",
      "grid-template-rows": "1fr",
      "grid-template-columns": "1fr",
    };
  }

  cardStyle(name: string): CSSProperties {
    const isActive = name === this.activeCard;
    return {
      "grid-row": "1",
      "grid-column": "1",
      visibility: isActive ? "visible" : "hidden",
      "pointer-events": isActive ? "auto" : "none",
    };
  }
}
