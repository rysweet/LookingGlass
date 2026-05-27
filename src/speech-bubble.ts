import type { Position, Size } from "./story-api/types";

export type BubbleAnchor = "above" | "below" | "left" | "right";
export type BubbleKind = "speech" | "thought";
export type BubbleAnimationState = "hidden" | "appearing" | "visible" | "disappearing";

export interface BubbleShadow {
  readonly blur: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly color: string;
}

export interface BubbleStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly textColor: string;
  readonly fillColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly padding: number;
  readonly tailLength: number;
  readonly maxWidth: number;
  readonly shadow: BubbleShadow | null;
}

export interface BubbleBounds {
  readonly width: number;
  readonly height: number;
}

export interface BubblePlacement {
  readonly kind: BubbleKind;
  readonly lines: readonly string[];
  readonly bounds: BubbleBounds;
  readonly bubblePosition: Position;
  readonly tailBase: Position;
  readonly tailTip: Position;
  readonly maxLineWidth: number;
}

export interface BubbleOptions {
  readonly style?: Partial<BubbleStyle>;
  readonly entitySize?: Size;
  readonly anchor?: BubbleAnchor;
  readonly animation?: BubbleAnimation;
}

const DEFAULT_SIZE: Size = Object.freeze({ width: 1, height: 1, depth: 1 });
const ZERO_POSITION: Position = Object.freeze({ x: 0, y: 0, z: 0 });

export const DEFAULT_BUBBLE_STYLE: BubbleStyle = Object.freeze({
  fontFamily: "Arial",
  fontSize: 16,
  lineHeight: 20,
  textColor: "#111111",
  fillColor: "#ffffff",
  borderColor: "#222222",
  borderWidth: 2,
  padding: 12,
  tailLength: 18,
  maxWidth: 220,
  shadow: Object.freeze({ blur: 8, offsetX: 2, offsetY: 4, color: "rgba(0,0,0,0.25)" }),
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneSize(size: Size): Size {
  return { width: size.width, height: size.height, depth: size.depth };
}

function normalizeStyle(style?: Partial<BubbleStyle>): BubbleStyle {
  return {
    ...DEFAULT_BUBBLE_STYLE,
    ...style,
    shadow: style?.shadow === undefined ? DEFAULT_BUBBLE_STYLE.shadow : style.shadow,
  };
}

function sanitizeWidth(width: number, fallback: number): number {
  return Number.isFinite(width) && width > 0 ? width : fallback;
}

function sanitizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitLongWord(word: string, chunkSize: number): string[] {
  if (word.length <= chunkSize) {
    return [word];
  }
  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += chunkSize) {
    chunks.push(word.slice(index, index + chunkSize));
  }
  return chunks;
}

export class BubbleLayout {
  readonly style: BubbleStyle;

  constructor(style: Partial<BubbleStyle> = {}) {
    this.style = normalizeStyle(style);
  }

  private get averageCharacterWidth(): number {
    return this.style.fontSize * 0.6;
  }

  wrapText(text: string, maxWidth = this.style.maxWidth): string[] {
    const normalized = sanitizeText(text);
    if (normalized.length === 0) {
      return [""];
    }
    const usableWidth = Math.max(1, sanitizeWidth(maxWidth, this.style.maxWidth) - this.style.padding * 2);
    const maxChars = Math.max(1, Math.floor(usableWidth / this.averageCharacterWidth));
    const words = normalized.split(" ").flatMap((word) => splitLongWord(word, maxChars));
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current.length === 0 ? word : `${current} ${word}`;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current.length > 0) {
          lines.push(current);
        }
        current = word;
      }
    }
    if (current.length > 0) {
      lines.push(current);
    }
    return lines.length > 0 ? lines : [""];
  }

  measure(text: string, maxWidth = this.style.maxWidth): { lines: string[]; bounds: BubbleBounds; maxLineWidth: number } {
    const lines = this.wrapText(text, maxWidth);
    const maxLineWidth = lines.reduce((longest, line) => Math.max(longest, line.length * this.averageCharacterWidth), 0);
    return {
      lines,
      bounds: {
        width: maxLineWidth + this.style.padding * 2,
        height: lines.length * this.style.lineHeight + this.style.padding * 2,
      },
      maxLineWidth,
    };
  }

  positionRelativeTo(anchorPoint: Position, entitySize: Size, bounds: BubbleBounds, anchor: BubbleAnchor): Pick<BubblePlacement, "bubblePosition" | "tailBase" | "tailTip"> {
    const halfHeight = entitySize.height / 2;
    const halfWidth = entitySize.width / 2;
    const tailTip = clonePosition(anchorPoint);
    switch (anchor) {
      case "below": {
        const bubblePosition = {
          x: anchorPoint.x - bounds.width / 2,
          y: anchorPoint.y - halfHeight - this.style.tailLength - bounds.height,
          z: anchorPoint.z,
        };
        return {
          bubblePosition,
          tailBase: { x: anchorPoint.x, y: bubblePosition.y + bounds.height, z: anchorPoint.z },
          tailTip,
        };
      }
      case "left": {
        const bubblePosition = {
          x: anchorPoint.x - halfWidth - this.style.tailLength - bounds.width,
          y: anchorPoint.y - bounds.height / 2,
          z: anchorPoint.z,
        };
        return {
          bubblePosition,
          tailBase: { x: bubblePosition.x + bounds.width, y: anchorPoint.y, z: anchorPoint.z },
          tailTip,
        };
      }
      case "right": {
        const bubblePosition = {
          x: anchorPoint.x + halfWidth + this.style.tailLength,
          y: anchorPoint.y - bounds.height / 2,
          z: anchorPoint.z,
        };
        return {
          bubblePosition,
          tailBase: { x: bubblePosition.x, y: anchorPoint.y, z: anchorPoint.z },
          tailTip,
        };
      }
      case "above":
      default: {
        const bubblePosition = {
          x: anchorPoint.x - bounds.width / 2,
          y: anchorPoint.y + halfHeight + this.style.tailLength,
          z: anchorPoint.z,
        };
        return {
          bubblePosition,
          tailBase: { x: anchorPoint.x, y: bubblePosition.y, z: anchorPoint.z },
          tailTip,
        };
      }
    }
  }

  layoutBubble(kind: BubbleKind, text: string, anchorPoint: Position, entitySize: Size = DEFAULT_SIZE, anchor: BubbleAnchor = "above", maxWidth = this.style.maxWidth): BubblePlacement {
    const { lines, bounds, maxLineWidth } = this.measure(text, maxWidth);
    return {
      kind,
      lines,
      bounds,
      maxLineWidth,
      ...this.positionRelativeTo(anchorPoint, entitySize, bounds, anchor),
    };
  }
}

export class BubbleAnimation {
  private _state: BubbleAnimationState = "hidden";
  private _progress = 0;

  constructor(
    readonly appearDurationMs = 180,
    readonly disappearDurationMs = 120,
  ) {}

  get state(): BubbleAnimationState {
    return this._state;
  }

  get progress(): number {
    return this._progress;
  }

  get alpha(): number {
    return this._progress;
  }

  get scale(): number {
    return 0.85 + this._progress * 0.15;
  }

  get visible(): boolean {
    return this._state !== "hidden";
  }

  show(): void {
    this._state = this._progress >= 1 ? "visible" : "appearing";
  }

  hide(): void {
    this._state = this._progress <= 0 ? "hidden" : "disappearing";
  }

  update(deltaMs: number): BubbleAnimationState {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      return this._state;
    }
    if (this._state === "appearing") {
      this._progress = clamp(this._progress + deltaMs / this.appearDurationMs, 0, 1);
      this._state = this._progress >= 1 ? "visible" : "appearing";
    } else if (this._state === "disappearing") {
      this._progress = clamp(this._progress - deltaMs / this.disappearDurationMs, 0, 1);
      this._state = this._progress <= 0 ? "hidden" : "disappearing";
    }
    return this._state;
  }
}

export class SpeechBubble {
  readonly kind: BubbleKind = "speech";
  readonly style: BubbleStyle;
  readonly layout: BubbleLayout;
  readonly animation: BubbleAnimation;
  private _text: string;
  private _speakerPosition: Position;
  private _entitySize: Size;
  private _anchor: BubbleAnchor;

  constructor(text = "", speakerPosition: Position = ZERO_POSITION, options: BubbleOptions = {}) {
    this.style = normalizeStyle(options.style);
    this.layout = new BubbleLayout(this.style);
    this.animation = options.animation ?? new BubbleAnimation();
    this._text = text;
    this._speakerPosition = clonePosition(speakerPosition);
    this._entitySize = cloneSize(options.entitySize ?? DEFAULT_SIZE);
    this._anchor = options.anchor ?? "above";
  }

  get text(): string {
    return this._text;
  }

  get speakerPosition(): Position {
    return clonePosition(this._speakerPosition);
  }

  get entitySize(): Size {
    return cloneSize(this._entitySize);
  }

  get anchor(): BubbleAnchor {
    return this._anchor;
  }

  setText(text: string): void {
    this._text = text;
  }

  setSpeakerPosition(position: Position): void {
    this._speakerPosition = clonePosition(position);
  }

  setEntitySize(size: Size): void {
    this._entitySize = cloneSize(size);
  }

  setAnchor(anchor: BubbleAnchor): void {
    this._anchor = anchor;
  }

  render(maxWidth = this.style.maxWidth): BubblePlacement {
    return this.layout.layoutBubble(this.kind, this._text, this._speakerPosition, this._entitySize, this._anchor, maxWidth);
  }
}

export class ThoughtBubble extends SpeechBubble {
  readonly kind: BubbleKind = "thought";
  readonly cloudPuffs = 3;

  constructor(text = "", speakerPosition: Position = ZERO_POSITION, options: BubbleOptions = {}) {
    super(text, speakerPosition, {
      ...options,
      style: {
        fillColor: "#f8fbff",
        ...options.style,
      },
    });
  }
}
