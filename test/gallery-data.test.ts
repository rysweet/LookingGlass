import { describe, expect, it } from "vitest";
import {
  buildGalleryCatalog,
  getGalleryCategories,
  searchGallery,
} from "../src/gallery/gallery-data.js";

const EXPECTED_CATEGORY_COUNTS = {
  biped: 24,
  quadruped: 32,
  flyer: 21,
  swimmer: 6,
  fish: 7,
  marine_mammal: 5,
  slitherer: 5,
  prop: 17,
  automobile: 8,
  aircraft: 6,
  watercraft: 7,
  train: 6,
} as const;

describe("gallery-data", () => {
  it("builds a full catalog of 144 items across 12 categories", () => {
    const catalog = buildGalleryCatalog();

    expect(catalog.items).toHaveLength(144);
    expect(Object.keys(catalog.itemsByCategory)).toHaveLength(12);

    const total = Object.values(catalog.itemsByCategory).reduce((count, items) => count + items.length, 0);
    expect(total).toBe(144);
  });

  it("includes valid resource ids, names, and profiles for every item", () => {
    const catalog = buildGalleryCatalog();

    for (const item of catalog.items) {
      expect(item.resourceId).toMatch(/^[A-Z0-9_]+$/);
      expect(item.displayName.length).toBeGreaterThan(0);
      expect(item.profile.id).toBe(item.resourceId);
      expect(item.profile.name).toBe(item.displayName);
    }
  });

  it("searches model names with case-insensitive substring matching", () => {
    const alienMatches = searchGallery("alien");
    const penguinMatches = searchGallery("PeNgUiN");

    expect(alienMatches.map((item) => item.resourceId)).toContain("ALIEN");
    expect(penguinMatches.map((item) => item.resourceId)).toEqual(["PENGUIN"]);
  });

  it("returns the expected category counts", () => {
    const categories = getGalleryCategories();
    const counts = Object.fromEntries(categories.map((category) => [category.name, category.modelCount]));

    expect(counts).toEqual(EXPECTED_CATEGORY_COUNTS);
  });
});
