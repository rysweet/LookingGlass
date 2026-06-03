import {
  Alice,
  approximatelyEqual,
  createBaseArchive,
  printReport,
  sceneObject,
  vec3String,
} from "./common.js";

function buildProject(kind: "DoInOrder" | "DoTogether") {
  const archive = createBaseArchive(`Tutorial3-${kind}`);
  archive.project.sceneObjects.push(sceneObject("character1", "org.lgna.story.SBiped"));
  archive.project.sceneObjects.push(sceneObject("character2", "org.lgna.story.SBiped", { x: 2, y: 0, z: 0 }));
  archive.project.methods.push({
    name: "run",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [{
      kind,
      body: [
        { kind: "MethodCall", object: "character1", method: "move", arguments: ["FORWARD", "2", "1"] },
        { kind: "MethodCall", object: "character2", method: "move", arguments: ["FORWARD", "2", "1"] },
      ],
    }],
  });
  return archive.project;
}

async function main(): Promise<void> {
  const output: string[] = [];
  const gaps: string[] = [];

  const orderedRuntime = Alice.VmSceneBridge.createVmSceneRuntime(buildProject("DoInOrder"));
  orderedRuntime.executeProject();
  orderedRuntime.animationLoop.step(500);
  const orderedHalfA = orderedRuntime.bridge.getNodeForEntity("character1")!.worldTransform.position;
  const orderedHalfB = orderedRuntime.bridge.getNodeForEntity("character2")!.worldTransform.position;
  output.push(`DoInOrder after 0.5s => character1 ${vec3String(orderedHalfA)}, character2 ${vec3String(orderedHalfB)}.`);

  const orderedLooksSequential = approximatelyEqual(orderedHalfA.z, -1)
    && approximatelyEqual(orderedHalfB.z, 0);
  if (!orderedLooksSequential) {
    gaps.push("DoInOrder animations across different characters start together instead of waiting for the first character to finish.");
  }

  const togetherRuntime = Alice.VmSceneBridge.createVmSceneRuntime(buildProject("DoTogether"));
  togetherRuntime.executeProject();
  togetherRuntime.animationLoop.step(500);
  const togetherHalfA = togetherRuntime.bridge.getNodeForEntity("character1")!.worldTransform.position;
  const togetherHalfB = togetherRuntime.bridge.getNodeForEntity("character2")!.worldTransform.position;
  output.push(`DoTogether after 0.5s => character1 ${vec3String(togetherHalfA)}, character2 ${vec3String(togetherHalfB)}.`);

  const togetherWorks = approximatelyEqual(togetherHalfA.z, -1)
    && approximatelyEqual(togetherHalfB.z, -1);
  if (!togetherWorks) {
    gaps.push("DoTogether did not move both characters simultaneously.");
  }

  printReport({
    tutorial: "Tutorial 3: Do In Order / Do Together",
    script: [
      "VmSceneBridge.createVmSceneRuntime(project)",
      "DoInOrder with two move statements",
      "DoTogether with two move statements",
      "animationLoop.step(500)",
    ],
    result: gaps.length === 0 ? "PASS" : togetherWorks ? "PARTIAL" : "FAIL",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 3: Do In Order / Do Together",
    script: ["tutorial-tests/tutorial3.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
