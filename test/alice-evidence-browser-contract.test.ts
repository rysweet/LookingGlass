import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

function loadPageDocument(): Document {
  const html = readFileSync(resolve(process.cwd(), "src/index.html"), "utf8");
  return new JSDOM(html).window.document;
}

function expectButton(document: Document, id: string, testId: string, label: RegExp): HTMLButtonElement {
  const element = document.querySelector(`#${id}`);

  expect(element).toBeInstanceOf(document.defaultView!.HTMLButtonElement);
  expect(element?.getAttribute("data-testid")).toBe(testId);
  expect(element?.textContent).toMatch(label);

  return element as HTMLButtonElement;
}

describe("alice evidence browser UI contract", () => {
  it("adds stable evidence selectors beside the existing browser workflow controls", () => {
    const document = loadPageDocument();

    const panel = document.querySelector("#evidence-panel");
    const status = document.querySelector("#evidence-status");
    const summary = document.querySelector("#evidence-summary");
    const captureList = document.querySelector("#evidence-capture-list");

    expect(panel).toBeInstanceOf(document.defaultView!.HTMLElement);
    expect(panel?.getAttribute("data-testid")).toBe("alice-evidence-panel");
    expect(panel?.getAttribute("aria-label")).toBe("Alice evidence export");
    expect(panel?.parentElement?.id).toBe("sidebar");

    expectButton(document, "capture-evidence-button", "alice-evidence-capture-button", /capture/i);
    expectButton(document, "export-evidence-button", "alice-evidence-export-button", /export evidence/i);
    expectButton(document, "share-evidence-button", "alice-evidence-share-button", /share evidence/i);

    expect(status).toBeInstanceOf(document.defaultView!.HTMLElement);
    expect(status?.getAttribute("data-testid")).toBe("alice-evidence-status");
    expect(status?.getAttribute("data-alice-evidence-status")).toBe("empty");

    expect(summary).toBeInstanceOf(document.defaultView!.HTMLElement);
    expect(summary?.getAttribute("data-testid")).toBe("alice-evidence-summary");
    expect(summary?.textContent).toMatch(/no evidence captured/i);

    expect(captureList).toBeInstanceOf(document.defaultView!.HTMLUListElement);
    expect(captureList?.getAttribute("data-testid")).toBe("alice-evidence-capture-list");
  });

  it("starts empty with export and share disabled until a valid capture exists", () => {
    const document = loadPageDocument();

    expect(document.querySelector("#evidence-status")?.getAttribute("data-alice-evidence-status")).toBe("empty");
    expect(document.querySelector("#capture-evidence-button")?.hasAttribute("disabled")).toBe(false);
    expect(document.querySelector("#export-evidence-button")?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelector("#share-evidence-button")?.hasAttribute("disabled")).toBe(true);
  });
});
