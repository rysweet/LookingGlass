import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf-8");
}

function expectElement(html: string, id: string): void {
  expect(html, `src/index.html must define #${id}`).toContain(`id="${id}"`);
}

describe("Alice browser workflow UI contract", () => {
  it("exposes controls for project, model, texture, camera, joint, evidence, export, and share steps", () => {
    const html = readText("src/index.html");

    expect(html).toContain("Alice 3 Web Viewer");
    expect(html).not.toContain("LookingGlass");
    expectElement(html, "file-input");
    expectElement(html, "model-file-input");
    expectElement(html, "texture-file-input");
    expectElement(html, "assign-texture-button");
    expectElement(html, "camera-panel");
    expectElement(html, "joint-panel");
    expectElement(html, "joint-object-select");
    expectElement(html, "joint-pose-name");
    expectElement(html, "joint-apply-pose");
    expectElement(html, "evidence-panel");
    expectElement(html, "capture-evidence-button");
    expectElement(html, "export-evidence-button");
    expectElement(html, "share-evidence-button");
    expectElement(html, "evidence-status");
    expectElement(html, "evidence-summary");
    expectElement(html, "export-a3p-button");
    expectElement(html, "export-web-package-button");
    expectElement(html, "share-web-package-button");
    expect(html).toContain("Alice evidence");
    expect(html).toContain("Capture visible behavior");
    expect(html).toContain("Export evidence");
    expect(html).toContain("Share evidence");
    expect(html).toContain('data-testid="alice-evidence-capture-button"');
    expect(html).toContain('data-testid="alice-evidence-export-button"');
    expect(html).toContain('data-testid="alice-evidence-share-button"');
    expect(html).toContain('data-testid="alice-evidence-status"');
    expect(html).toContain('data-testid="alice-evidence-summary"');
    expect(html).toContain('accept=".a3p"');
    expect(html).toContain(".glb");
    expect(html).toContain(".gltf");
    expect(html).toContain(".png");
    expect(html).toContain(".jpg");
    expect(html).toContain(".jpeg");
    expect(html).toContain(".webp");
  });

  it("wires UI controls through the shared TypeScript workflow modules", () => {
    const main = readText("src/main.ts");

    for (const id of [
      "model-file-input",
      "texture-file-input",
      "assign-texture-button",
      "joint-object-select",
      "joint-pose-name",
      "joint-apply-pose",
      "capture-evidence-button",
      "export-evidence-button",
      "share-evidence-button",
      "evidence-status",
      "evidence-summary",
      "export-a3p-button",
      "export-web-package-button",
      "share-web-package-button",
    ]) {
      expect(main, `src/main.ts must bind #${id}`).toContain(`requireElement("${id}"`);
    }

    expect(main).toContain("ModelTextureCameraJointExportWorkflow");
    expect(main).toContain("ProjectIo");
    expect(main).toContain("ProjectExport");
    expect(main).toContain("JointSystem");
    expect(main).toContain("importModelAsset");
    expect(main).toContain("importTextureAsset");
    expect(main).toContain("assignTextureToModel");
    expect(main).toContain("exportWebPackage");
    expect(main).toContain("generateShareArtifacts");
    expect(main).toContain("alice-evidence-artifact");
    expect(main).toContain("createAliceEvidenceArtifact");
    expect(main).toContain("serializeAliceEvidenceArtifact");
    expect(main).toContain("validateAliceEvidenceArtifact");
    expect(main).toContain("navigator.share");
  });
});
