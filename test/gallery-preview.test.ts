// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  buildGalleryCatalog,
  formatGalleryColor,
  type GalleryCategoryName,
} from "../src/gallery/gallery-data.js";
import { GalleryPreview } from "../src/gallery/gallery-preview.js";
import { GallerySceneIntegration, type EntityData } from "../src/gallery/gallery-scene-integration.js";

afterEach(() => {
  document.body.innerHTML = "";
});

const CATEGORY_ORDER: GalleryCategoryName[] = [
  "biped",
  "quadruped",
  "flyer",
  "swimmer",
  "fish",
  "marine_mammal",
  "slitherer",
  "prop",
  "automobile",
  "aircraft",
  "watercraft",
  "train",
];

describe("GalleryPreview", () => {
  it("renders preview content for every gallery category", () => {
    const catalog = buildGalleryCatalog();
    const preview = new GalleryPreview();
    document.body.append(preview.element);

    for (const category of CATEGORY_ORDER) {
      const item = catalog.itemsByCategory[category][0];
      expect(item).toBeDefined();
      preview.render(item!);
      expect(preview.element.hidden).toBe(false);
      expect(document.querySelector("[data-gallery-preview-name]")?.textContent).toBe(item!.displayName);
      expect(document.querySelector("[data-gallery-preview-category]")?.textContent?.length).toBeGreaterThan(0);
      expect(document.querySelector("[data-gallery-proportions]")?.getAttribute("data-gallery-proportions")).toBe(item!.resourceId);
    }
  });

  it("shows color swatches and distinctive features from the model profile", () => {
    const item = buildGalleryCatalog().items.find((entry) => entry.resourceId === "QUEEN_OF_HEARTS");
    expect(item).toBeDefined();

    const preview = new GalleryPreview();
    document.body.append(preview.element);
    preview.render(item!);

    const swatches = [...document.querySelectorAll("[data-gallery-color-swatch]")].map((element) => element.getAttribute("data-color"));
    expect(swatches).toEqual([
      formatGalleryColor(item!.profile.primaryColor),
      formatGalleryColor(item!.profile.secondaryColor),
    ]);
    expect([...document.querySelectorAll("[data-gallery-feature-list] li")].map((element) => element.textContent)).toEqual([
      "crown",
      "collar",
    ]);
  });

  it("uses the gallery integration when Add to Scene is clicked", () => {
    const target = new EventTarget();
    const integration = new GallerySceneIntegration({ eventTarget: target });
    const preview = new GalleryPreview({ integration });
    const item = buildGalleryCatalog().items.find((entry) => entry.resourceId === "SUBMARINE");
    const received: EntityData[] = [];

    integration.onAddToScene((entity) => {
      received.push(entity);
    });

    document.body.append(preview.element);
    preview.render(item!);
    document.querySelector("[data-gallery-add-to-scene]")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(received).toHaveLength(1);
    expect(received[0]?.resourceId).toBe("SUBMARINE");
    expect(received[0]?.type).toBe("VEHICLE");
  });
});
