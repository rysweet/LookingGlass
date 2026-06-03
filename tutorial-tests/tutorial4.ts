import {
  Alice,
  approximatelyEqual,
  createBaseArchive,
  printReport,
  sceneObject,
  vec3String,
} from "./common.js";

async function main(): Promise<void> {
  const output: string[] = [];
  const gaps: string[] = [];
  const archive = createBaseArchive("Tutorial4World");
  archive.project.sceneObjects.push(sceneObject("bunny", "org.lgna.story.SBiped"));
  archive.project.methods.push({
    name: "run",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "VariableDeclaration", name: "steps", varType: "Number", value: "0" },
      { kind: "CountLoop", count: 5, body: [
        { kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD", "1"] },
      ] },
      { kind: "WhileLoop", condition: "steps < 3", body: [
        { kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD", "1"] },
        { kind: "VariableAssignment", name: "steps", value: "steps + 1" },
      ] },
      { kind: "IfElse", condition: "steps == 3", ifBody: [
        { kind: "MethodCall", object: "bunny", method: "say", arguments: ['"loop-ok"'] },
      ], elseBody: [
        { kind: "MethodCall", object: "bunny", method: "say", arguments: ['"loop-bad"'] },
      ] },
    ],
  });

  const runtime = Alice.VmSceneBridge.createVmSceneRuntime(archive.project);
  const execution = runtime.executeProject();
  const finalPosition = runtime.bridge.getNodeForEntity("bunny")!.worldTransform.position;
  const bubbleText = runtime.bridge.getSpeechBubbleElement("bunny")?.textContent ?? "<no bubble>";
  output.push(`Final position ${vec3String(finalPosition)} bubble=${bubbleText}.`);
  output.push(`Execution log kinds: ${execution.execution_log.map((entry) => entry.kind).join(", ")}.`);

  if (!approximatelyEqual(finalPosition.z, -8)) {
    gaps.push("CountLoop + WhileLoop did not move the character the expected total distance of 8 meters.");
  }
  if (!bubbleText.includes("loop-ok")) {
    gaps.push("IfElse did not take the expected branch after the while loop completed.");
  }

  printReport({
    tutorial: "Tutorial 4: Control Structures",
    script: [
      "CountLoop repeat 5 move forward 1",
      "WhileLoop with steps < 3",
      "IfElse with steps == 3",
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
    tutorial: "Tutorial 4: Control Structures",
    script: ["tutorial-tests/tutorial4.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
