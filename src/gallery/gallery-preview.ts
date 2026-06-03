import { generateProceduralModel } from "../open-asset-pipeline/procedural-generators.js";
import type { DistinctiveFeature } from "../open-asset-pipeline/model-profiles.js";
import {
  formatGalleryColor,
  getGalleryCategoryLabel,
  toProceduralModelConfig,
  type GalleryItem,
} from "./gallery-data.js";
import { GallerySceneIntegration } from "./gallery-scene-integration.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GalleryPreviewOptions {
  readonly document?: Document;
  readonly integration?: GallerySceneIntegration;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  document: Document,
  tagName: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function createFeatureLabel(feature: DistinctiveFeature): string {
  return feature.type.replace(/_/g, " ");
}

function projectVertex(x: number, y: number, z: number): { x: number; y: number; depth: number } {
  return {
    x: x - z * 0.65,
    y: y * 1.05 + z * 0.35,
    depth: z - x * 0.1,
  };
}

function renderModelToCanvas(canvas: HTMLCanvasElement, item: GalleryItem): void {
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.dataset.renderStatus = "unavailable";
    return;
  }

  const { geometry, materials } = generateProceduralModel(toProceduralModelConfig(item));
  const { width, height } = canvas;
  const primary = formatGalleryColor(materials[0]?.diffuseColor ?? item.profile.primaryColor);
  const secondary = formatGalleryColor(materials[1]?.diffuseColor ?? item.profile.secondaryColor);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#0f172a";
  context.fillRect(0, 0, width, height);

  if (geometry.vertices.length === 0 || geometry.indices.length === 0) {
    canvas.dataset.renderStatus = "empty";
    return;
  }

  const projected: Array<{ x: number; y: number; depth: number }> = [];
  for (let index = 0; index < geometry.vertices.length; index += 3) {
    projected.push(projectVertex(
      geometry.vertices[index] ?? 0,
      geometry.vertices[index + 1] ?? 0,
      geometry.vertices[index + 2] ?? 0,
    ));
  }

  const bounds = projected.reduce((current, point) => ({
    minX: Math.min(current.minX, point.x),
    maxX: Math.max(current.maxX, point.x),
    minY: Math.min(current.minY, point.y),
    maxY: Math.max(current.maxY, point.y),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  });

  const projectedWidth = Math.max(bounds.maxX - bounds.minX, 0.001);
  const projectedHeight = Math.max(bounds.maxY - bounds.minY, 0.001);
  const scale = Math.min((width - 32) / projectedWidth, (height - 32) / projectedHeight);
  const offsetX = (width - projectedWidth * scale) * 0.5 - bounds.minX * scale;
  const offsetY = (height - projectedHeight * scale) * 0.5 + bounds.maxY * scale;

  const triangles = [] as Array<{
    readonly points: readonly [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
    ];
    readonly depth: number;
  }>;

  for (let index = 0; index < geometry.indices.length; index += 3) {
    const first = projected[geometry.indices[index] ?? 0];
    const second = projected[geometry.indices[index + 1] ?? 0];
    const third = projected[geometry.indices[index + 2] ?? 0];
    if (!first || !second || !third) {
      continue;
    }

    triangles.push({
      points: [
        { x: offsetX + first.x * scale, y: offsetY - first.y * scale },
        { x: offsetX + second.x * scale, y: offsetY - second.y * scale },
        { x: offsetX + third.x * scale, y: offsetY - third.y * scale },
      ],
      depth: (first.depth + second.depth + third.depth) / 3,
    });
  }

  triangles.sort((left, right) => left.depth - right.depth);

  for (const triangle of triangles) {
    context.beginPath();
    context.moveTo(triangle.points[0].x, triangle.points[0].y);
    context.lineTo(triangle.points[1].x, triangle.points[1].y);
    context.lineTo(triangle.points[2].x, triangle.points[2].y);
    context.closePath();
    context.fillStyle = `${primary}66`;
    context.strokeStyle = secondary;
    context.lineWidth = 1;
    context.fill();
    context.stroke();
  }

  canvas.dataset.renderStatus = "rendered";
}

function buildProportionsSvg(document: Document, item: GalleryItem): SVGSVGElement {
  const svg = createSvgElement(document, "svg", {
    viewBox: "0 0 180 180",
    width: "180",
    height: "180",
    role: "img",
    "aria-label": `${item.displayName} body proportions`,
    "data-gallery-proportions": item.resourceId,
  });

  const primary = formatGalleryColor(item.profile.primaryColor);
  const secondary = formatGalleryColor(item.profile.secondaryColor);
  const bodyHeight = Math.max(40, item.profile.body.height * 62);
  const bodyWidth = Math.max(24, item.profile.body.width * 44);
  const headSize = Math.max(18, item.profile.head.size * 22);
  const limbLength = Math.max(18, item.profile.limbs.length * 28);
  const limbThickness = Math.max(4, item.profile.limbs.thickness * 5);
  const bodyX = 90 - bodyWidth / 2;
  const bodyY = 92 - bodyHeight / 2;
  const headCenterY = bodyY - headSize / 2 - 8 + item.profile.head.yOffset * 12;

  svg.append(createSvgElement(document, "rect", {
    x: bodyX.toFixed(1),
    y: bodyY.toFixed(1),
    width: bodyWidth.toFixed(1),
    height: bodyHeight.toFixed(1),
    rx: "8",
    fill: primary,
    stroke: secondary,
    "stroke-width": "2",
  }));

  switch (item.profile.head.shape) {
    case "elongated":
      svg.append(createSvgElement(document, "ellipse", {
        cx: "90",
        cy: headCenterY.toFixed(1),
        rx: (headSize * 0.7).toFixed(1),
        ry: (headSize * 0.42).toFixed(1),
        fill: secondary,
      }));
      break;
    case "flat":
      svg.append(createSvgElement(document, "rect", {
        x: (90 - headSize * 0.45).toFixed(1),
        y: (headCenterY - headSize * 0.32).toFixed(1),
        width: (headSize * 0.9).toFixed(1),
        height: (headSize * 0.64).toFixed(1),
        rx: "6",
        fill: secondary,
      }));
      break;
    case "pointed":
      svg.append(createSvgElement(document, "polygon", {
        points: `${90},${(headCenterY - headSize * 0.55).toFixed(1)} ${(90 + headSize * 0.5).toFixed(1)},${(headCenterY + headSize * 0.45).toFixed(1)} ${(90 - headSize * 0.5).toFixed(1)},${(headCenterY + headSize * 0.45).toFixed(1)}`,
        fill: secondary,
      }));
      break;
    default:
      svg.append(createSvgElement(document, "circle", {
        cx: "90",
        cy: headCenterY.toFixed(1),
        r: (headSize * 0.5).toFixed(1),
        fill: secondary,
      }));
      break;
  }

  const leftArmX = bodyX + bodyWidth * 0.2;
  const rightArmX = bodyX + bodyWidth * 0.8;
  const shoulderY = bodyY + bodyHeight * 0.28;
  const hipY = bodyY + bodyHeight * 0.78;
  const legOffset = bodyWidth * 0.16;

  for (const limb of [
    { x: leftArmX, y: shoulderY, dx: -limbLength * 0.25, dy: limbLength * 0.8 },
    { x: rightArmX, y: shoulderY, dx: limbLength * 0.25, dy: limbLength * 0.8 },
    { x: 90 - legOffset, y: hipY, dx: -limbLength * 0.08, dy: limbLength },
    { x: 90 + legOffset, y: hipY, dx: limbLength * 0.08, dy: limbLength },
  ]) {
    svg.append(createSvgElement(document, "line", {
      x1: limb.x.toFixed(1),
      y1: limb.y.toFixed(1),
      x2: (limb.x + limb.dx).toFixed(1),
      y2: (limb.y + limb.dy).toFixed(1),
      stroke: secondary,
      "stroke-width": limbThickness.toFixed(1),
      "stroke-linecap": "round",
    }));
  }

  return svg;
}

function createColorSwatch(document: Document, label: string, color: number): HTMLDivElement {
  const swatch = document.createElement("div");
  swatch.dataset.galleryColorSwatch = label.toLowerCase();
  swatch.dataset.color = formatGalleryColor(color);
  swatch.style.display = "grid";
  swatch.style.gap = "6px";

  const chip = document.createElement("div");
  chip.style.width = "100%";
  chip.style.height = "22px";
  chip.style.borderRadius = "999px";
  chip.style.border = "1px solid rgba(15, 23, 42, 0.15)";
  chip.style.background = formatGalleryColor(color);

  const text = document.createElement("span");
  text.textContent = `${label}: ${formatGalleryColor(color)}`;
  text.style.fontSize = "12px";

  swatch.append(chip, text);
  return swatch;
}

export class GalleryPreview {
  readonly element: HTMLElement;

  private readonly titleElement: HTMLHeadingElement;
  private readonly categoryElement: HTMLParagraphElement;
  private readonly swatchesElement: HTMLDivElement;
  private readonly proportionsHost: HTMLDivElement;
  private readonly featuresElement: HTMLUListElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly addButton: HTMLButtonElement;
  private currentItem: GalleryItem | null = null;

  constructor(private readonly options: GalleryPreviewOptions = {}) {
    const document = options.document ?? globalThis.document;
    this.element = document.createElement("section");
    this.element.dataset.galleryPreview = "panel";
    this.element.hidden = true;
    this.element.style.display = "grid";
    this.element.style.alignContent = "start";
    this.element.style.gap = "16px";
    this.element.style.padding = "16px";
    this.element.style.border = "1px solid rgba(15, 23, 42, 0.12)";
    this.element.style.borderRadius = "16px";
    this.element.style.background = "#f8fafc";

    this.titleElement = document.createElement("h2");
    this.titleElement.dataset.galleryPreviewName = "title";
    this.titleElement.style.margin = "0";

    this.categoryElement = document.createElement("p");
    this.categoryElement.dataset.galleryPreviewCategory = "category";
    this.categoryElement.style.margin = "0";
    this.categoryElement.style.color = "#475569";

    this.swatchesElement = document.createElement("div");
    this.swatchesElement.style.display = "grid";
    this.swatchesElement.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    this.swatchesElement.style.gap = "12px";

    this.proportionsHost = document.createElement("div");
    this.proportionsHost.dataset.galleryProportionsHost = "host";

    this.featuresElement = document.createElement("ul");
    this.featuresElement.dataset.galleryFeatureList = "features";
    this.featuresElement.style.margin = "0";
    this.featuresElement.style.paddingLeft = "18px";
    this.featuresElement.style.display = "grid";
    this.featuresElement.style.gap = "4px";

    this.canvas = document.createElement("canvas");
    this.canvas.width = 280;
    this.canvas.height = 180;
    this.canvas.dataset.galleryPreviewCanvas = "canvas";
    this.canvas.style.width = "100%";
    this.canvas.style.maxWidth = "280px";
    this.canvas.style.borderRadius = "12px";
    this.canvas.style.background = "#0f172a";

    this.addButton = document.createElement("button");
    this.addButton.type = "button";
    this.addButton.dataset.galleryAddToScene = "button";
    this.addButton.textContent = "Add to Scene";
    this.addButton.disabled = true;
    this.addButton.addEventListener("click", () => {
      if (this.currentItem) {
        this.options.integration?.addModelToScene(this.currentItem.resourceId);
      }
    });

    this.element.append(
      this.titleElement,
      this.categoryElement,
      this.swatchesElement,
      this.proportionsHost,
      this.featuresElement,
      this.canvas,
      this.addButton,
    );
  }

  get item(): GalleryItem | null {
    return this.currentItem;
  }

  clear(): void {
    this.currentItem = null;
    this.element.hidden = true;
    this.titleElement.textContent = "";
    this.categoryElement.textContent = "";
    this.swatchesElement.replaceChildren();
    this.proportionsHost.replaceChildren();
    this.featuresElement.replaceChildren();
    this.addButton.disabled = true;
    const context = this.canvas.getContext("2d");
    context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(item: GalleryItem): HTMLElement {
    const document = this.element.ownerDocument;
    this.currentItem = item;
    this.element.hidden = false;
    this.titleElement.textContent = item.displayName;
    this.categoryElement.textContent = getGalleryCategoryLabel(item.category);
    this.swatchesElement.replaceChildren(
      createColorSwatch(document, "Primary", item.profile.primaryColor),
      createColorSwatch(document, "Secondary", item.profile.secondaryColor),
    );
    this.proportionsHost.replaceChildren(buildProportionsSvg(document, item));

    const featureItems = item.profile.features.length > 0
      ? item.profile.features
      : [{ type: "glow", scale: 0 } satisfies DistinctiveFeature];

    this.featuresElement.replaceChildren(...featureItems.map((feature) => {
      const entry = document.createElement("li");
      entry.dataset.featureType = feature.type;
      entry.textContent = item.profile.features.length > 0 ? createFeatureLabel(feature) : "no distinctive features";
      return entry;
    }));

    renderModelToCanvas(this.canvas, item);
    this.addButton.disabled = false;
    return this.element;
  }
}
