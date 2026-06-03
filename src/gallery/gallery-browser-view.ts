import { DragDataTransfer, DRAG_MIME_TYPE, type GalleryItemPayload } from "../drag-drop-bridge.js";
import {
  buildGalleryCatalog,
  filterGalleryItems,
  formatGalleryColor,
  getGalleryCategories,
  getGalleryCategoryLabel,
  type GalleryCategoryName,
  type GalleryItem,
} from "./gallery-data.js";
import { GalleryPreview } from "./gallery-preview.js";
import { GallerySceneIntegration } from "./gallery-scene-integration.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GalleryBrowserViewOptions {
  readonly document?: Document;
  readonly integration?: GallerySceneIntegration;
  readonly preview?: GalleryPreview;
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

function createCardSilhouette(document: Document, item: GalleryItem): SVGSVGElement {
  const svg = createSvgElement(document, "svg", {
    viewBox: "0 0 120 72",
    width: "120",
    height: "72",
    role: "img",
    "aria-label": `${item.displayName} silhouette`,
    "data-gallery-card-visual": item.resourceId,
  });

  const primary = formatGalleryColor(item.profile.primaryColor);
  const secondary = formatGalleryColor(item.profile.secondaryColor);
  const bodyWidth = Math.max(26, item.profile.body.width * 32);
  const bodyHeight = Math.max(20, item.profile.body.height * 26);
  const bodyX = 60 - bodyWidth / 2;
  const bodyY = 40 - bodyHeight / 2;
  const headSize = Math.max(10, item.profile.head.size * 11);
  const headCenterY = bodyY - headSize * 0.5 - 4 + item.profile.head.yOffset * 6;

  svg.append(createSvgElement(document, "rect", {
    x: "0",
    y: "0",
    width: "120",
    height: "72",
    rx: "12",
    fill: primary,
  }));

  svg.append(createSvgElement(document, "rect", {
    x: bodyX.toFixed(1),
    y: bodyY.toFixed(1),
    width: bodyWidth.toFixed(1),
    height: bodyHeight.toFixed(1),
    rx: "10",
    fill: secondary,
    opacity: "0.88",
  }));

  switch (item.profile.head.shape) {
    case "elongated":
      svg.append(createSvgElement(document, "ellipse", {
        cx: "60",
        cy: headCenterY.toFixed(1),
        rx: (headSize * 0.7).toFixed(1),
        ry: (headSize * 0.45).toFixed(1),
        fill: primary,
      }));
      break;
    case "flat":
      svg.append(createSvgElement(document, "rect", {
        x: (60 - headSize * 0.5).toFixed(1),
        y: (headCenterY - headSize * 0.35).toFixed(1),
        width: headSize.toFixed(1),
        height: (headSize * 0.7).toFixed(1),
        rx: "5",
        fill: primary,
      }));
      break;
    case "pointed":
      svg.append(createSvgElement(document, "polygon", {
        points: `${60},${(headCenterY - headSize * 0.6).toFixed(1)} ${(60 + headSize * 0.55).toFixed(1)},${(headCenterY + headSize * 0.45).toFixed(1)} ${(60 - headSize * 0.55).toFixed(1)},${(headCenterY + headSize * 0.45).toFixed(1)}`,
        fill: primary,
      }));
      break;
    default:
      svg.append(createSvgElement(document, "circle", {
        cx: "60",
        cy: headCenterY.toFixed(1),
        r: (headSize * 0.5).toFixed(1),
        fill: primary,
      }));
      break;
  }

  return svg;
}

export class GalleryBrowserView {
  readonly element: HTMLElement;

  private readonly categoryButtons = new Map<GalleryCategoryName | "all", HTMLButtonElement>();
  private readonly searchInput: HTMLInputElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly resultsCount: HTMLSpanElement;
  private readonly grid: HTMLDivElement;
  private readonly emptyState: HTMLParagraphElement;
  private readonly previewHost: HTMLDivElement;
  private readonly preview: GalleryPreview;
  private activeCategory: GalleryCategoryName | "all" = "all";
  private searchQuery = "";
  private selectedResourceId: string | null = null;

  constructor(private readonly options: GalleryBrowserViewOptions = {}) {
    const document = options.document ?? globalThis.document;
    const catalog = buildGalleryCatalog();
    this.preview = options.preview ?? new GalleryPreview({ document, integration: options.integration });

    this.element = document.createElement("section");
    this.element.dataset.galleryBrowser = "root";
    this.element.style.display = "grid";
    this.element.style.gridTemplateColumns = "220px minmax(0, 1fr)";
    this.element.style.gap = "16px";
    this.element.style.alignItems = "start";

    const sidebar = document.createElement("aside");
    sidebar.dataset.gallerySidebar = "categories";
    sidebar.style.display = "grid";
    sidebar.style.gap = "8px";

    const allButton = this.createCategoryButton(document, "all", "✨", "All", catalog.items.length);
    sidebar.append(allButton);
    for (const category of getGalleryCategories()) {
      sidebar.append(this.createCategoryButton(
        document,
        category.name,
        category.icon,
        getGalleryCategoryLabel(category.name),
        category.modelCount,
      ));
    }

    const content = document.createElement("div");
    content.style.display = "grid";
    content.style.gap = "16px";

    const toolbar = document.createElement("div");
    toolbar.dataset.galleryToolbar = "search";
    toolbar.style.display = "grid";
    toolbar.style.gridTemplateColumns = "minmax(0, 1fr) auto auto";
    toolbar.style.gap = "8px";
    toolbar.style.alignItems = "center";

    this.searchInput = document.createElement("input");
    this.searchInput.type = "search";
    this.searchInput.placeholder = "Search models";
    this.searchInput.dataset.gallerySearch = "input";
    this.searchInput.setAttribute("aria-label", "Search gallery models");
    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value;
      this.renderVisibleItems();
    });

    this.clearButton = document.createElement("button");
    this.clearButton.type = "button";
    this.clearButton.dataset.galleryClearSearch = "button";
    this.clearButton.textContent = "Clear";
    this.clearButton.addEventListener("click", () => {
      this.searchQuery = "";
      this.searchInput.value = "";
      this.renderVisibleItems();
    });

    this.resultsCount = document.createElement("span");
    this.resultsCount.dataset.galleryResultsCount = "count";
    this.resultsCount.style.color = "#475569";
    this.resultsCount.style.fontSize = "14px";

    toolbar.append(this.searchInput, this.clearButton, this.resultsCount);

    const body = document.createElement("div");
    body.style.display = "grid";
    body.style.gridTemplateColumns = "minmax(0, 1fr) minmax(280px, 320px)";
    body.style.gap = "16px";
    body.style.alignItems = "start";

    const gridHost = document.createElement("div");
    gridHost.style.display = "grid";
    gridHost.style.gap = "12px";

    this.grid = document.createElement("div");
    this.grid.dataset.galleryGrid = "cards";
    this.grid.style.display = "grid";
    this.grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
    this.grid.style.gap = "12px";

    this.emptyState = document.createElement("p");
    this.emptyState.dataset.galleryEmptyState = "message";
    this.emptyState.textContent = "No models match your current filters.";
    this.emptyState.hidden = true;

    gridHost.append(this.grid, this.emptyState);

    this.previewHost = document.createElement("div");
    this.previewHost.dataset.galleryPreviewHost = "host";
    this.previewHost.hidden = true;
    this.previewHost.append(this.preview.element);

    body.append(gridHost, this.previewHost);
    content.append(toolbar, body);
    this.element.append(sidebar, content);

    this.renderVisibleItems();
  }

  render(container?: HTMLElement): HTMLElement {
    if (container && !container.contains(this.element)) {
      container.append(this.element);
    }
    return this.element;
  }

  getVisibleItems(): GalleryItem[] {
    return filterGalleryItems(this.searchQuery, this.activeCategory);
  }

  private createCategoryButton(
    document: Document,
    category: GalleryCategoryName | "all",
    icon: string,
    label: string,
    count: number,
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.galleryCategoryTab = category;
    button.style.display = "grid";
    button.style.gridTemplateColumns = "auto 1fr auto";
    button.style.alignItems = "center";
    button.style.gap = "8px";
    button.style.padding = "10px 12px";
    button.style.borderRadius = "12px";
    button.style.border = "1px solid rgba(15, 23, 42, 0.12)";
    button.style.background = "#ffffff";
    button.setAttribute("aria-pressed", category === this.activeCategory ? "true" : "false");
    button.addEventListener("click", () => {
      this.activeCategory = category;
      this.renderVisibleItems();
    });

    const iconNode = document.createElement("span");
    iconNode.textContent = icon;
    iconNode.dataset.galleryCategoryIcon = category;

    const labelNode = document.createElement("span");
    labelNode.textContent = label;

    const countNode = document.createElement("span");
    countNode.textContent = String(count);
    countNode.dataset.galleryCategoryCount = category;

    button.append(iconNode, labelNode, countNode);
    this.categoryButtons.set(category, button);
    return button;
  }

  private renderVisibleItems(): void {
    const visibleItems = filterGalleryItems(this.searchQuery, this.activeCategory);
    this.resultsCount.textContent = `${visibleItems.length} results`;
    this.grid.replaceChildren(...visibleItems.map((item) => this.createCard(item)));
    this.emptyState.hidden = visibleItems.length > 0;

    for (const [category, button] of this.categoryButtons.entries()) {
      const isActive = category === this.activeCategory;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      button.style.background = isActive ? "#e2e8f0" : "#ffffff";
    }

    if (!visibleItems.some((item) => item.resourceId === this.selectedResourceId)) {
      this.selectedResourceId = null;
      this.preview.clear();
      this.previewHost.hidden = true;
    }
  }

  private createCard(item: GalleryItem): HTMLButtonElement {
    const document = this.element.ownerDocument;
    const card = document.createElement("button");
    card.type = "button";
    card.draggable = true;
    card.dataset.galleryCard = item.resourceId;
    card.dataset.resourceId = item.resourceId;
    card.style.display = "grid";
    card.style.gap = "10px";
    card.style.padding = "12px";
    card.style.textAlign = "left";
    card.style.border = "1px solid rgba(15, 23, 42, 0.12)";
    card.style.borderRadius = "14px";
    card.style.background = "#ffffff";
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      this.selectedResourceId = item.resourceId;
      this.preview.render(item);
      this.previewHost.hidden = false;
    });
    card.addEventListener("dragstart", (event) => {
      const payload: GalleryItemPayload = {
        type: "gallery-item",
        modelId: item.resourceId,
        category: item.category,
        displayName: item.displayName,
      };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(DRAG_MIME_TYPE, DragDataTransfer.serialize(payload));
        event.dataTransfer.setData("text/plain", item.resourceId);
      }
    });

    const title = document.createElement("strong");
    title.textContent = item.displayName;
    title.dataset.galleryCardName = item.resourceId;

    const badge = document.createElement("span");
    badge.textContent = getGalleryCategoryLabel(item.category);
    badge.dataset.galleryCardCategory = item.category;
    badge.style.justifySelf = "start";
    badge.style.fontSize = "12px";
    badge.style.color = "#334155";
    badge.style.padding = "2px 8px";
    badge.style.borderRadius = "999px";
    badge.style.background = "#e2e8f0";

    card.append(createCardSilhouette(document, item), title, badge);
    return card;
  }
}
