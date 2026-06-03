import { Alice, approximatelyEqual, ensureDomGlobals, printReport, yQuarterTurnQuaternion } from "./common.js";

async function main(): Promise<void> {
  ensureDomGlobals();
  const output: string[] = [];
  const gaps: string[] = [];

  const editor = new Alice.SceneEditor.SceneEditor();
  editor.placeObject("platform", "org.lgna.story.SProp", {
    position: { x: 10, y: 0, z: -5 },
    size: { width: 4, height: 1, depth: 4 },
    select: false,
  });
  editor.placeObject("rider", "org.lgna.story.SBiped", {
    position: { x: 0, y: 0, z: 0 },
    orientation: yQuarterTurnQuaternion(),
    size: { width: 1, height: 2, depth: 1 },
    select: false,
  });
  editor.placeObject("tree", "org.lgna.story.SProp", {
    position: { x: -3, y: 0, z: 2 },
    size: { width: 2, height: 5, depth: 2 },
    select: false,
  });

  const rider = editor.getObject("rider") as Alice.StoryApi.SThing;
  const platform = editor.getObject("platform") as Alice.StoryApi.SThing;
  Alice.VehicleSystem.setVehicle(rider, platform);
  Alice.VehicleSystem.setPositionInVehicleSpace(rider, { x: 1, y: 1, z: -2 });
  const riderTransform = Alice.VehicleSystem.getVehicleTransform(rider);
  output.push(`platform.position=${JSON.stringify(editor.getProperty("platform", "position"))}`);
  output.push(`rider.orientation=${JSON.stringify(editor.getProperty("rider", "orientation"))}`);
  output.push(`tree.size=${JSON.stringify(editor.getProperty("tree", "size"))}`);
  output.push(`rider absolute vehicle transform=${JSON.stringify(riderTransform)}`);

  if (!approximatelyEqual(riderTransform.absolutePosition.x, 11)
    || !approximatelyEqual(riderTransform.absolutePosition.y, 1)
    || !approximatelyEqual(riderTransform.absolutePosition.z, -7)) {
    gaps.push("Parenting rider to platform via setVehicle did not produce the expected world transform.");
  }

  printReport({
    tutorial: "Tutorial 8: Scene Editor — Positioning Objects",
    script: [
      "SceneEditor.placeObject for platform/rider/tree",
      "SceneEditor position/orientation/size placement",
      "VehicleSystem.setVehicle + setPositionInVehicleSpace",
      "VehicleSystem.getVehicleTransform",
    ],
    result: gaps.length > 0 ? "FAIL" : "PASS",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 8: Scene Editor — Positioning Objects",
    script: ["tutorial-tests/tutorial8.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
