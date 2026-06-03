// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { GalleryBrowserView } from "../src/gallery/gallery-browser-view.js";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("GalleryBrowserView", () => {
  it("renders 12 category tabs plus an All tab", () => {
    const view = new GalleryBrowserView();
    document.body.append(view.render());

    const tabs = document.querySelectorAll("[data-gallery-category-tab]");
    expect(tabs).toHaveLength(13);
    expect(document.querySelector('[data-gallery-category-tab="all"]')?.textContent).toContain("144");
    expect(document.querySelector('[data-gallery-category-tab="biped"]')?.textContent).toContain("24");
  });

  it("renders model cards in the gallery grid", () => {
    const view = new GalleryBrowserView();
    document.body.append(view.render());

    const cards = document.querySelectorAll("[data-gallery-card]");
    expect(cards).toHaveLength(144);
    expect(document.querySelector('[data-gallery-card="ALIEN"] [data-gallery-card-name="ALIEN"]')?.textContent).toBe("Alien");
  });

  it("filters the grid when a category tab is clicked", () => {
    const view = new GalleryBrowserView();
    document.body.append(view.render());

    document.querySelector('[data-gallery-category-tab="quadruped"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const cards = document.querySelectorAll("[data-gallery-card]");
    expect(cards).toHaveLength(32);
    expect([...document.querySelectorAll("[data-gallery-card-category]")].every((badge) => badge.textContent === "Quadruped")).toBe(true);
  });

  it("filters the grid as the user types in search", () => {
    const view = new GalleryBrowserView();
    document.body.append(view.render());

    const input = document.querySelector("[data-gallery-search]") as HTMLInputElement;
    input.value = "penguin";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.querySelectorAll("[data-gallery-card]")).toHaveLength(1);
    expect(document.querySelector("[data-gallery-results-count]")?.textContent).toBe("1 results");
    expect(document.querySelector('[data-gallery-card="PENGUIN"]')?.textContent).toContain("Penguin");

    document.querySelector("[data-gallery-clear-search]")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("");
    expect(document.querySelectorAll("[data-gallery-card]")).toHaveLength(144);
  });

  it("opens the preview panel when a model card is clicked", () => {
    const view = new GalleryBrowserView();
    document.body.append(view.render());

    document.querySelector('[data-gallery-card="QUEEN_OF_HEARTS"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const preview = document.querySelector("[data-gallery-preview]") as HTMLElement;
    expect(preview.hidden).toBe(false);
    expect(document.querySelector("[data-gallery-preview-name]")?.textContent).toBe("Queen of Hearts");
    expect(document.querySelectorAll("[data-gallery-color-swatch]")).toHaveLength(2);
    expect(document.querySelector("[data-gallery-feature-list]")?.textContent).toContain("crown");
    expect(document.querySelector("[data-gallery-feature-list]")?.textContent).toContain("collar");
  });
});
