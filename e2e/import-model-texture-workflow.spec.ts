import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function writeAssetFixture(fileName: string, bytes: Uint8Array): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alice-browser-assets-"));
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

test("imports a model and texture, saves, and reopens the Alice project", async ({ page }) => {
  const modelPath = writeAssetFixture("Moon Rover.GLB", new Uint8Array([0x67, 0x6c, 0x54, 0x46]));
  const texturePath = writeAssetFixture("Checker.PNG", new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

  await page.goto("/");

  await expect(page).toHaveTitle(/Alice/i);
  await expect(page.getByTestId("alice-import-model-input")).toBeAttached();
  await expect(page.getByTestId("alice-import-texture-input")).toBeAttached();
  await expect(page.getByTestId("alice-scene-object-list")).toBeVisible();

  await page.getByTestId("alice-import-model-input").setInputFiles(modelPath);
  await expect(page.getByTestId("alice-imported-model-list")).toContainText("Moon Rover");
  await expect(page.locator("body")).not.toContainText("LookingGlass");

  await page.getByTestId("alice-create-shape-button").click();
  await expect(page.getByTestId("alice-scene-object-list")).toContainText("box");
  await page.getByTestId("alice-scene-object-list").getByText("box").click();

  await page.getByTestId("alice-import-texture-input").setInputFiles(texturePath);
  await expect(page.getByTestId("alice-imported-texture-list")).toContainText("Checker");
  await page.getByTestId("alice-apply-texture-button").click();
  await expect(page.getByTestId("alice-selected-object-material")).toContainText("Checker");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("alice-save-project-button").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.a3p$/);

  const savedProjectPath = path.join(os.tmpdir(), `alice-imported-assets-${Date.now()}.a3p`);
  await download.saveAs(savedProjectPath);

  await page.getByTestId("alice-open-project-input").setInputFiles(savedProjectPath);
  await expect(page.getByTestId("alice-imported-model-list")).toContainText("Moon Rover");
  await expect(page.getByTestId("alice-imported-texture-list")).toContainText("Checker");
  await expect(page.getByTestId("alice-scene-object-list")).toContainText("box");
  await page.getByTestId("alice-scene-object-list").getByText("box").click();
  await expect(page.getByTestId("alice-selected-object-material")).toContainText("Checker");
});
