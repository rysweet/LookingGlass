import {
  Alice,
  approximatelyEqual,
  createBaseArchive,
  printReport,
  quatString,
  sceneObject,
  vec3String,
} from "./common.js";

async function main(): Promise<void> {
  const output: string[] = [];
  const gaps: string[] = [];
  const archive = createBaseArchive("Tutorial5World");
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
  archive.project.sceneObjects.push(sceneObject("hopper", "TutorialBunny"));
  archive.project.methods.push({
    name: "run",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "MethodCall", object: "hopper", method: "hop", arguments: ["1"] },
      { kind: "MethodCall", object: "hopper", method: "hop", arguments: ["2"] },
    ],
  });

  const runtime = Alice.VmSceneBridge.createVmSceneRuntime(archive.project);
  const execution = runtime.executeProject();
  runtime.animationLoop.step(3000);
  const finalTransform = runtime.bridge.getNodeForEntity("hopper")!.worldTransform;
  output.push(`Custom method hop(distance) moved hopper to ${vec3String(finalTransform.position)} ${quatString(finalTransform.orientation)}.`);
  output.push(`Execution log: ${execution.execution_log.map((entry) => entry.detail).join(" | ")}.`);

  if (!approximatelyEqual(finalTransform.position.z, -3)) {
    gaps.push("Calling the custom hop(distance) method with 1 and 2 did not move the character 3 total meters.");
  }

  printReport({
    tutorial: "Tutorial 5: Custom Methods and Parameters",
    script: [
      "Custom Alice type TutorialBunny extends org.lgna.story.SBiped",
      "Type method hop(distance)",
      "Top-level run() calling hopper.hop(1) and hopper.hop(2)",
      "VmSceneBridge.createVmSceneRuntime(project)",
    ],
    result: gaps.length > 0 ? "FAIL" : "PASS",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 5: Custom Methods and Parameters",
    script: ["tutorial-tests/tutorial5.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
