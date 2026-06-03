import {
  Alice,
  createBaseArchive,
  printReport,
  saveArchiveToFile,
  sceneObject,
  typeNameForEntityCategory,
} from "./common.js";

async function main(): Promise<void> {
  const output: string[] = [];
  const gaps: string[] = [];
  const archive = createBaseArchive("Tutorial1World");
  output.push(`Created empty-world project named ${archive.project.projectName}.`);

  const bunnyMatches = Alice.GalleryUi.searchGallery("bunny");
  output.push(`GalleryUi.searchGallery(\"bunny\") returned ${bunnyMatches.length} match(es): ${bunnyMatches.map((item) => item.displayName).slice(0, 5).join(", ")}.`);

  const fullGalleryBunny = bunnyMatches.find((item) => item.resourceId === "BUNNY") ?? bunnyMatches[0] ?? null;
  if (!fullGalleryBunny) {
    gaps.push("Full gallery search did not return a Bunny model.");
  }

  const editor = new Alice.SceneEditor.SceneEditor({ gallery: new Alice.Gallery.GalleryCatalog() });
  try {
    editor.placeFromGallery("BUNNY", "bunny");
    output.push("SceneEditor.placeFromGallery('BUNNY', 'bunny') unexpectedly succeeded.");
  } catch (error) {
    output.push(`SceneEditor.placeFromGallery('BUNNY', 'bunny') failed as expected: ${String(error)}`);
    gaps.push("The scene editor uses a simplified gallery catalog and cannot place full gallery ids like BUNNY or CAT.");
  }

  const integration = new Alice.GalleryUi.GallerySceneIntegration({ eventTarget: new EventTarget() });
  const bunnyEntity = integration.addModelToScene("BUNNY", { x: 1, y: 0, z: -2 });
  output.push(`GallerySceneIntegration.addModelToScene('BUNNY') produced ${bunnyEntity.type} geometry with ${bunnyEntity.model.geometry.vertices.length} vertices.`);

  archive.project.sceneObjects.push(
    sceneObject(
      "bunny",
      typeNameForEntityCategory(bunnyEntity.type),
      { x: 1, y: 0.45, z: -2 },
      bunnyEntity.orientation,
      { width: 1, height: 1, depth: 1 },
      null,
    ),
  );
  output.push(`Manually added fallback scene object type ${archive.project.sceneObjects[0]?.typeName} at ${JSON.stringify(archive.project.sceneObjects[0]?.position)}.`);

  const saved = await saveArchiveToFile("tutorial1.a3p", archive);
  output.push(`ProjectIo.writeProject/readProject round-tripped ${saved.bytes} bytes and ${saved.roundTrip.project.sceneObjects.length} scene object(s).`);

  gaps.push("There is no first-class public API that takes a full gallery search result like BUNNY and inserts that exact model into an AliceProject scene for save/load.");

  printReport({
    tutorial: "Tutorial 1: Getting Started — Create Your First Scene",
    script: [
      "ProjectTemplate.createProjectFromTemplate('empty-world')",
      "GalleryUi.searchGallery('bunny')",
      "SceneEditor.placeFromGallery('BUNNY', 'bunny')",
      "GalleryUi.GallerySceneIntegration.addModelToScene('BUNNY')",
      "ProjectIo.writeProject/readProject",
    ],
    result: gaps.length > 0 ? "PARTIAL" : "PASS",
    output,
    gaps,
    wouldBlock: true,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 1: Getting Started — Create Your First Scene",
    script: ["tutorial-tests/tutorial1.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
