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
  const archive = createBaseArchive("Tutorial2World");
  archive.project.sceneObjects.push(sceneObject("bunny", "org.lgna.story.SBiped"));
  archive.project.methods.push({
    name: "animateHello",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD", "2", "1"] },
      { kind: "MethodCall", object: "bunny", method: "turn", arguments: ["LEFT", "0.25", "1"] },
      { kind: "MethodCall", object: "bunny", method: "say", arguments: ['"Hello World"'] },
    ],
  });

  const runtime = Alice.VmSceneBridge.createVmSceneRuntime(archive.project);
  const execution = runtime.executeProject();
  output.push(`executeProject logged ${execution.execution_log.length} entries.`);

  runtime.animationLoop.step(1000);
  const afterMove = runtime.bridge.getNodeForEntity("bunny")!.worldTransform;
  output.push(`After 1s move step: ${vec3String(afterMove.position)}.`);

  runtime.animationLoop.step(1000);
  const finalTransform = runtime.bridge.getNodeForEntity("bunny")!.worldTransform;
  const bubble = runtime.bridge.getSpeechBubbleElement("bunny")?.textContent ?? "<no bubble element>";
  output.push(`After 2s total: ${vec3String(finalTransform.position)} ${quatString(finalTransform.orientation)} bubble=${bubble}.`);

  const moved = approximatelyEqual(finalTransform.position.z, -2);
  const turned = approximatelyEqual(finalTransform.orientation.y, Math.SQRT1_2, 1e-3)
    && approximatelyEqual(finalTransform.orientation.w, Math.SQRT1_2, 1e-3);
  const spoke = bubble.includes("Hello World");

  if (!moved) gaps.push("Move forward 2 meters did not complete.");
  if (!turned) gaps.push("Turn left 0.25 revolutions did not complete.");
  if (!spoke) gaps.push("say('Hello World') did not create a visible speech bubble.");

  printReport({
    tutorial: "Tutorial 2: Your First Animation",
    script: [
      "ProjectTemplate.createProjectFromTemplate('empty-world')",
      "VmSceneBridge.createVmSceneRuntime(project)",
      "MethodCall bunny.move/turn/say",
      "animationLoop.step(1000) twice",
    ],
    result: gaps.length > 0 ? "FAIL" : "PASS",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 2: Your First Animation",
    script: ["tutorial-tests/tutorial2.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
