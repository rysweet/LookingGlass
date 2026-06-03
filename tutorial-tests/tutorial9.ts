import {
  Alice,
  approximatelyEqual,
  createBaseArchive,
  printReport,
  saveArchiveToFile,
  sceneObject,
} from "./common.js";

async function main(): Promise<void> {
  const output: string[] = [];
  const gaps: string[] = [];
  const archive = createBaseArchive("Tutorial9World");
  archive.project.types = [
    ...(archive.project.types ?? []),
    {
      name: "TutorialBunny",
      superTypeName: "org.lgna.story.SBiped",
      fields: [],
      constructors: [],
      methods: [{
        name: "hop",
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "distance", type: "Number" }],
        statements: [
          { kind: "MethodCall", object: "this", method: "move", arguments: ["FORWARD", "distance", "1"] },
        ],
      }],
    },
  ];
  archive.project.sceneObjects.push(sceneObject("hero", "TutorialBunny", { x: 1, y: 0, z: -2 }));
  archive.project.sceneObjects.push(sceneObject("tree", "org.lgna.story.SProp", { x: -3, y: 0, z: 2 }, { x: 0, y: 0.70710678, z: 0, w: 0.70710678 }, { width: 2, height: 5, depth: 2 }));
  archive.project.methods.push({
    name: "run",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "MethodCall", object: "hero", method: "hop", arguments: ["1.5"] },
      { kind: "MethodCall", object: "hero", method: "say", arguments: ['"round-trip works"'] },
    ],
  });

  const saved = await saveArchiveToFile("tutorial9.a3p", archive);
  const roundTrip = saved.roundTrip.project;
  output.push(`writeProject/readProject round-tripped ${saved.bytes} bytes.`);
  output.push(`Round-trip scene objects: ${roundTrip.sceneObjects.map((object) => `${object.name}:${object.typeName}`).join(", ")}.`);
  output.push(`Round-trip type names: ${(roundTrip.types ?? []).map((type) => type.name).join(", ")}.`);
  output.push(`Round-trip methods: ${roundTrip.methods.map((method) => method.name).join(", ")}.`);

  const heroObject = roundTrip.sceneObjects.find((object) => object.name === "hero");
  const hopMethod = roundTrip.types?.find((type) => type.name === "TutorialBunny")?.methods?.find((method) => method.name === "hop");
  if (!heroObject || heroObject.typeName !== "TutorialBunny") {
    gaps.push("Custom scene object hero did not survive round-trip with its custom type.");
  }
  if (!hopMethod) {
    gaps.push("Custom type method hop(distance) did not survive round-trip.");
  }

  const runtime = Alice.VmSceneBridge.createVmSceneRuntime(roundTrip);
  runtime.executeProject();
  runtime.animationLoop.step(1500);
  const heroTransform = runtime.bridge.getNodeForEntity("hero")!.worldTransform;
  const bubbleText = runtime.bridge.getSpeechBubbleElement("hero")?.textContent ?? "<no bubble>";
  output.push(`Round-tripped project executed to hero.position=${JSON.stringify(heroTransform.position)} bubble=${bubbleText}.`);

  if (!approximatelyEqual(heroTransform.position.z, -3.5)) {
    gaps.push("Round-tripped custom hop(distance) behavior no longer moved the character as expected.");
  }
  if (!bubbleText.includes("round-trip works")) {
    gaps.push("Round-tripped project no longer displayed the expected speech bubble.");
  }

  printReport({
    tutorial: "Tutorial 9: Save, Load, Round-Trip",
    script: [
      "ProjectTemplate.createProjectFromTemplate('empty-world')",
      "Custom type TutorialBunny + top-level run()",
      "ProjectIo.writeProject/readProject",
      "VmSceneBridge.createVmSceneRuntime(roundTrippedProject)",
    ],
    result: gaps.length > 0 ? "FAIL" : "PASS",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 9: Save, Load, Round-Trip",
    script: ["tutorial-tests/tutorial9.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
