import type { TextureImageData } from "./materials.js";

export interface TextStyleOptions {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: string | number;
  fontStyle?: string;
  lineHeight?: number;
}

export interface TextMeasurement {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  lineHeight: number;
  font: string;
}

export interface TextLineLayout {
  text: string;
  width: number;
  y: number;
}

export interface TextLayoutOptions extends TextStyleOptions {
  maxWidth?: number;
}

export interface TextLayout {
  lines: TextLineLayout[];
  width: number;
  height: number;
  lineHeight: number;
  font: string;
}

export interface Point {
  x: number;
  y: number;
}

export type SpeechBubbleTailSide = "top" | "right" | "bottom" | "left";

export interface SpeechBubbleOptions {
  padding?: number;
  cornerRadius?: number;
  tailWidth?: number;
  tailHeight?: number;
  tailSide?: SpeechBubbleTailSide;
  tailAnchor?: number;
}

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpeechBubbleShape {
  bounds: TextBounds;
  bodyBounds: TextBounds;
  textBounds: TextBounds;
  cornerRadius: number;
  tailSide: SpeechBubbleTailSide;
  tail: [Point, Point, Point];
  outline: Point[];
}

export interface TextTextureOptions extends TextLayoutOptions {
  textColor?: string;
  backgroundColor?: string | null;
  bubble?: SpeechBubbleOptions | null;
  pixelRatio?: number;
}

export interface TextTexture {
  image: TextureImageData;
  layout: TextLayout;
  bubble: SpeechBubbleShape | null;
}

type Canvas2DContext = import("canvas").CanvasRenderingContext2D;

let canvasModulePromise: Promise<typeof import("canvas")> | null = null;

function buildFont(style: TextStyleOptions): string {
  const fontStyle = style.fontStyle ?? "normal";
  const fontWeight = style.fontWeight ?? "normal";
  const fontFamily = style.fontFamily ?? "sans-serif";
  return `${fontStyle} ${fontWeight} ${style.fontSize}px ${fontFamily}`;
}

function resolveLineHeight(style: TextStyleOptions, ascent: number, descent: number): number {
  return style.lineHeight ?? Math.ceil(Math.max(ascent + descent, style.fontSize * 1.2));
}

async function loadCanvasModule() {
  if (canvasModulePromise === null) {
    canvasModulePromise = import("canvas");
  }
  return canvasModulePromise;
}

async function createCanvasContext(width = 1, height = 1): Promise<{ canvas: import("canvas").Canvas; context: Canvas2DContext }> {
  const { createCanvas } = await loadCanvasModule();
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d") as Canvas2DContext | null;
  if (context === null) {
    throw new Error("2d canvas context is unavailable");
  }
  return { canvas, context };
}

function applyFont(context: Canvas2DContext, style: TextStyleOptions): string {
  const font = buildFont(style);
  context.font = font;
  context.textBaseline = "top";
  return font;
}

function measureLine(context: Canvas2DContext, text: string, style: TextStyleOptions): TextMeasurement {
  const font = applyFont(context, style);
  const reference = context.measureText(text.length > 0 ? text : "Mg");
  const ascent = reference.actualBoundingBoxAscent || style.fontSize * 0.8;
  const descent = reference.actualBoundingBoxDescent || style.fontSize * 0.2;
  const lineHeight = resolveLineHeight(style, ascent, descent);
  const width = text.length > 0 ? Math.ceil(context.measureText(text).width) : 0;
  return {
    width,
    height: lineHeight,
    ascent,
    descent,
    lineHeight,
    font,
  };
}

function splitLongWord(context: Canvas2DContext, word: string, style: TextStyleOptions, maxWidth: number): string[] {
  const segments: string[] = [];
  let current = "";

  for (const character of Array.from(word)) {
    const candidate = `${current}${character}`;
    if (current.length > 0 && measureLine(context, candidate, style).width > maxWidth) {
      segments.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [word];
}

function wrapParagraph(context: Canvas2DContext, paragraph: string, style: TextStyleOptions, maxWidth?: number): string[] {
  if (paragraph.length === 0) {
    return [""];
  }
  if (maxWidth === undefined || maxWidth <= 0) {
    return [paragraph.trim()];
  }

  const words = paragraph.trim().split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length > 0 ? `${current} ${word}` : word;
    if (measureLine(context, candidate, style).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
      current = "";
    }

    if (measureLine(context, word, style).width <= maxWidth) {
      current = word;
      continue;
    }

    const segments = splitLongWord(context, word, style, maxWidth);
    lines.push(...segments.slice(0, -1));
    current = segments[segments.length - 1] ?? "";
  }

  if (current.length > 0 || lines.length === 0) {
    lines.push(current);
  }

  return lines;
}

export async function measureText(text: string, style: TextStyleOptions): Promise<TextMeasurement> {
  const { context } = await createCanvasContext();
  return measureLine(context, text, style);
}

export async function layoutText(text: string, options: TextLayoutOptions): Promise<TextLayout> {
  const { context } = await createCanvasContext();
  const paragraphs = text.split(/\r?\n/);
  const lines: TextLineLayout[] = [];
  let width = 0;
  let lineHeight = 0;

  for (const paragraph of paragraphs) {
    const wrappedLines = wrapParagraph(context, paragraph, options, options.maxWidth);
    for (const lineText of wrappedLines) {
      const measurement = measureLine(context, lineText, options);
      lineHeight = measurement.lineHeight;
      width = Math.max(width, measurement.width);
      lines.push({
        text: lineText,
        width: measurement.width,
        y: lines.length * measurement.lineHeight,
      });
    }
  }

  if (lines.length === 0) {
    const measurement = measureLine(context, "", options);
    lineHeight = measurement.lineHeight;
    return {
      lines: [{ text: "", width: 0, y: 0 }],
      width: 0,
      height: measurement.lineHeight,
      lineHeight: measurement.lineHeight,
      font: measurement.font,
    };
  }

  return {
    lines,
    width,
    height: Math.max(lineHeight, lines.length * lineHeight),
    lineHeight,
    font: applyFont(context, options),
  };
}

function clampAnchor(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeSpeechBubbleShape(layout: Pick<TextLayout, "width" | "height">, options: SpeechBubbleOptions = {}): SpeechBubbleShape {
  const padding = options.padding ?? 12;
  const cornerRadius = options.cornerRadius ?? 12;
  const tailWidth = options.tailWidth ?? 18;
  const tailHeight = options.tailHeight ?? 12;
  const tailSide = options.tailSide ?? "bottom";
  const anchorFraction = options.tailAnchor ?? 0.5;
  const bodyBounds: TextBounds = {
    x: 0,
    y: 0,
    width: layout.width + (padding * 2),
    height: layout.height + (padding * 2),
  };
  const textBounds: TextBounds = {
    x: padding,
    y: padding,
    width: layout.width,
    height: layout.height,
  };

  let bounds: TextBounds;
  let tail: [Point, Point, Point];
  let outline: Point[];

  switch (tailSide) {
    case "top": {
      const anchorX = clampAnchor(anchorFraction * bodyBounds.width, padding + (tailWidth / 2), bodyBounds.width - padding - (tailWidth / 2));
      bounds = { x: 0, y: 0, width: bodyBounds.width, height: bodyBounds.height + tailHeight };
      tail = [
        { x: anchorX - (tailWidth / 2), y: tailHeight },
        { x: anchorX, y: 0 },
        { x: anchorX + (tailWidth / 2), y: tailHeight },
      ];
      outline = [
        { x: 0, y: tailHeight },
        tail[0],
        tail[1],
        tail[2],
        { x: bodyBounds.width, y: tailHeight },
        { x: bodyBounds.width, y: bounds.height },
        { x: 0, y: bounds.height },
      ];
      bodyBounds.y = tailHeight;
      textBounds.y += tailHeight;
      break;
    }
    case "right": {
      const anchorY = clampAnchor(anchorFraction * bodyBounds.height, padding + (tailWidth / 2), bodyBounds.height - padding - (tailWidth / 2));
      bounds = { x: 0, y: 0, width: bodyBounds.width + tailHeight, height: bodyBounds.height };
      tail = [
        { x: bodyBounds.width, y: anchorY - (tailWidth / 2) },
        { x: bounds.width, y: anchorY },
        { x: bodyBounds.width, y: anchorY + (tailWidth / 2) },
      ];
      outline = [
        { x: 0, y: 0 },
        { x: bodyBounds.width, y: 0 },
        tail[0],
        tail[1],
        tail[2],
        { x: bodyBounds.width, y: bounds.height },
        { x: 0, y: bounds.height },
      ];
      break;
    }
    case "left": {
      const anchorY = clampAnchor(anchorFraction * bodyBounds.height, padding + (tailWidth / 2), bodyBounds.height - padding - (tailWidth / 2));
      bounds = { x: 0, y: 0, width: bodyBounds.width + tailHeight, height: bodyBounds.height };
      tail = [
        { x: tailHeight, y: anchorY - (tailWidth / 2) },
        { x: 0, y: anchorY },
        { x: tailHeight, y: anchorY + (tailWidth / 2) },
      ];
      outline = [
        tail[1],
        tail[0],
        { x: bounds.width, y: 0 },
        { x: bounds.width, y: bounds.height },
        { x: tailHeight, y: bounds.height },
        tail[2],
      ];
      textBounds.x += tailHeight;
      bodyBounds.x = tailHeight;
      break;
    }
    case "bottom":
    default: {
      const anchorX = clampAnchor(anchorFraction * bodyBounds.width, padding + (tailWidth / 2), bodyBounds.width - padding - (tailWidth / 2));
      bounds = { x: 0, y: 0, width: bodyBounds.width, height: bodyBounds.height + tailHeight };
      tail = [
        { x: anchorX - (tailWidth / 2), y: bodyBounds.height },
        { x: anchorX, y: bounds.height },
        { x: anchorX + (tailWidth / 2), y: bodyBounds.height },
      ];
      outline = [
        { x: 0, y: 0 },
        { x: bounds.width, y: 0 },
        { x: bounds.width, y: bodyBounds.height },
        tail[2],
        tail[1],
        tail[0],
        { x: 0, y: bodyBounds.height },
      ];
      break;
    }
  }

  return {
    bounds,
    bodyBounds,
    textBounds,
    cornerRadius,
    tailSide,
    tail,
    outline,
  };
}

function drawRoundedRect(context: Canvas2DContext, bounds: TextBounds, radius: number): void {
  const clampedRadius = Math.max(0, Math.min(radius, Math.min(bounds.width, bounds.height) / 2));
  context.beginPath();
  context.moveTo(bounds.x + clampedRadius, bounds.y);
  context.lineTo(bounds.x + bounds.width - clampedRadius, bounds.y);
  context.quadraticCurveTo(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + clampedRadius);
  context.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - clampedRadius);
  context.quadraticCurveTo(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - clampedRadius, bounds.y + bounds.height);
  context.lineTo(bounds.x + clampedRadius, bounds.y + bounds.height);
  context.quadraticCurveTo(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - clampedRadius);
  context.lineTo(bounds.x, bounds.y + clampedRadius);
  context.quadraticCurveTo(bounds.x, bounds.y, bounds.x + clampedRadius, bounds.y);
  context.closePath();
}

function drawSpeechBubble(context: Canvas2DContext, bubble: SpeechBubbleShape, fillStyle: string): void {
  drawRoundedRect(context, bubble.bodyBounds, bubble.cornerRadius);
  context.moveTo(bubble.tail[0].x, bubble.tail[0].y);
  context.lineTo(bubble.tail[1].x, bubble.tail[1].y);
  context.lineTo(bubble.tail[2].x, bubble.tail[2].y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

export async function renderTextToTexture(text: string, options: TextTextureOptions): Promise<TextTexture> {
  const layout = await layoutText(text, options);
  const bubble = options.bubble ? computeSpeechBubbleShape(layout, options.bubble) : null;
  const pixelRatio = Math.max(1, options.pixelRatio ?? 1);
  const logicalWidth = Math.max(1, bubble?.bounds.width ?? layout.width ?? 1);
  const logicalHeight = Math.max(1, bubble?.bounds.height ?? layout.height ?? 1);
  const width = Math.ceil(logicalWidth * pixelRatio);
  const height = Math.ceil(logicalHeight * pixelRatio);
  const { canvas, context } = await createCanvasContext(width, height);

  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, logicalWidth, logicalHeight);

  if (bubble !== null) {
    drawSpeechBubble(context, bubble, options.backgroundColor ?? "#ffffff");
  } else if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, logicalWidth, logicalHeight);
  }

  context.font = layout.font;
  context.textBaseline = "top";
  context.fillStyle = options.textColor ?? "#000000";

  const originX = bubble?.textBounds.x ?? 0;
  const originY = bubble?.textBounds.y ?? 0;
  for (const line of layout.lines) {
    context.fillText(line.text, originX, originY + line.y);
  }

  const imageData = context.getImageData(0, 0, width, height);
  return {
    image: {
      width,
      height,
      data: new Uint8ClampedArray(imageData.data),
    },
    layout,
    bubble,
  };
}
