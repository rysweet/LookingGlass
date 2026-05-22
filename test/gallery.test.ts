import { describe, expect, it } from "vitest";
import { GalleryCatalog } from "../src/gallery.js";

describe("GalleryCatalog", () => {
  it("ships with a searchable default model catalog", () => {
    const gallery = new GalleryCatalog();

    expect(gallery.get("people/biped")?.className).toBe("org.lgna.story.SBiped");
    expect(gallery.search("bird").map((entry) => entry.id)).toContain("animals/flyer");
    expect(gallery.byCategory("animals").map((entry) => entry.id)).toContain("animals/quadruped");
  });

  it("filters by tags in addition to text query", () => {
    const gallery = new GalleryCatalog();

    const results = gallery.search("", { category: "animals", tags: ["flying"] });
    expect(results.map((entry) => entry.id)).toEqual(["animals/flyer"]);
  });

  it("supports adding and removing custom catalog entries", () => {
    const gallery = new GalleryCatalog([]);
    gallery.add({
      id: "props/tree",
      name: "Tree",
      className: "org.lgna.story.SProp",
      category: "props",
      tags: ["tree", "nature"],
      resourceType: "TreeResource",
      placeOnGround: true,
    });

    expect(gallery.search("tree")).toHaveLength(1);
    expect(gallery.remove("props/tree")).toBe(true);
    expect(gallery.get("props/tree")).toBeNull();
  });

  it("rejects duplicate ids", () => {
    const gallery = new GalleryCatalog([]);
    gallery.add({
      id: "props/tree",
      name: "Tree",
      className: "org.lgna.story.SProp",
      category: "props",
      tags: ["tree"],
      resourceType: null,
      placeOnGround: true,
    });

    expect(() =>
      gallery.add({
        id: "props/tree",
        name: "Duplicate Tree",
        className: "org.lgna.story.SProp",
        category: "props",
        tags: ["tree"],
        resourceType: null,
        placeOnGround: true,
      }),
    ).toThrow(/already exists/);
  });
});
