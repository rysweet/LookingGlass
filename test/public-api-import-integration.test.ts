import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as PublicApi from "../src/index.js";

const SRC_ROOT = fileURLToPath(new URL("../src/", import.meta.url));

async function collectLibraryModuleSpecifiers(dir: string, relativeDir = ""): Promise<string[]> {
  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => !entry.name.startsWith("."))
    .sort((left, right) => left.name.localeCompare(right.name));
  const specifiers: string[] = [];

  for (const entry of entries) {
    const nextRelativeDir = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "story-api") {
        specifiers.push(...await collectLibraryModuleSpecifiers(absolutePath, nextRelativeDir));
      }
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      continue;
    }

    if (relativeDir === "" && (entry.name === "index.ts" || entry.name === "main.ts" || entry.name === "cli.ts")) {
      continue;
    }

    const prefix = relativeDir ? `${relativeDir}/` : "";
    specifiers.push(`../src/${prefix}${entry.name.replace(/\.ts$/, ".js")}`);
  }

  return specifiers;
}

beforeAll(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    DOMParser: dom.window.DOMParser,
    HTMLElement: dom.window.HTMLElement,
    HTMLCanvasElement: dom.window.HTMLCanvasElement,
    HTMLImageElement: dom.window.HTMLImageElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLUListElement: dom.window.HTMLUListElement,
    Image: dom.window.Image,
  });
  if (!("requestAnimationFrame" in globalThis)) {
    Object.assign(globalThis, {
      requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0),
      cancelAnimationFrame: (handle: number) => clearTimeout(handle),
    });
  }
});

describe("public API import integration", () => {
  it("imports every library module together without evaluation conflicts", async () => {
    const specifiers = await collectLibraryModuleSpecifiers(SRC_ROOT);
    const importedModules = await Promise.all(specifiers.map((specifier) => import(specifier)));

    expect(specifiers.length).toBeGreaterThanOrEqual(90);
    expect(importedModules).toHaveLength(specifiers.length);
    expect(specifiers).toContain("../src/server.js");
    expect(specifiers).toContain("../src/story-api/index.js");

    for (const importedModule of importedModules) {
      expect(importedModule).toBeTruthy();
      expect(typeof importedModule).toBe("object");
    }
  });

  it("keeps the public index aligned with representative direct imports", async () => {
    const [a3pParser, storyApi, projectIo, sceneBuilder, tweedleVm, server] = await Promise.all([
      import("../src/a3p-parser.js"),
      import("../src/story-api/index.js"),
      import("../src/project-io.js"),
      import("../src/scene-builder.js"),
      import("../src/tweedle-vm.js"),
      import("../src/server.js"),
    ]);

    expect(PublicApi.A3pParser).toBe(a3pParser);
    expect(PublicApi.StoryApi).toBe(storyApi);
    expect(PublicApi.ProjectIo).toBe(projectIo);
    expect(PublicApi.SceneBuilder).toBe(sceneBuilder);
    expect(PublicApi.TweedleVm).toBe(tweedleVm);
    expect(PublicApi.Server).toBe(server);
  });
});
