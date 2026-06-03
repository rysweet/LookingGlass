import { Alice, ensureDomGlobals, printReport } from "./common.js";

async function main(): Promise<void> {
  ensureDomGlobals();
  const output: string[] = [];
  const gaps: string[] = [];

  const scene = new Alice.StoryApi.SScene();
  let sceneMouseRegistrations = 0;
  let sceneKeyRegistrations = 0;
  scene.addMouseClickOnObjectListener(() => { sceneMouseRegistrations += 1; });
  scene.addKeyPressListener(() => { sceneKeyRegistrations += 1; });
  output.push(`SScene registered mouse and key callbacks without throwing.`);
  output.push(`Registration counters remain ${sceneMouseRegistrations}/${sceneKeyRegistrations}; public scene dispatch hooks are mouseDown=${typeof (scene as unknown as { mouseDown?: unknown }).mouseDown}, keyDown=${typeof (scene as unknown as { keyDown?: unknown }).keyDown}.`);

  if (typeof (scene as unknown as { mouseDown?: unknown }).mouseDown !== "function"
    || typeof (scene as unknown as { keyDown?: unknown }).keyDown !== "function") {
    gaps.push("Scene-level listener registration exists, but there is no public input bridge that dispatches mouse/keyboard events into those registered callbacks.");
  }

  const hero = new Alice.StoryApi.SBox();
  hero.setName("hero");
  const mouseListener = new Alice.StoryApiEvents.MouseClickOnObjectListener();
  mouseListener.mouseDown({ x: 0, y: 0, z: 0 }, [hero]);
  const click = mouseListener.mouseUp({ x: 0, y: 0, z: 0 }, 100, [hero]);
  output.push(`MouseClickOnObjectListener produced event ${JSON.stringify(click)}.`);

  const keyListener = new Alice.StoryApiEvents.KeyListener();
  keyListener.bindShortcut("Ctrl+K", "commandPalette");
  const keyPress = keyListener.keyDown("k", { ctrl: true });
  output.push(`KeyListener produced event ${JSON.stringify(keyPress)}.`);

  if (!click || click.targetName !== "hero") {
    gaps.push("Mouse click helper classes could not target a clicked object.");
  }
  if (keyPress.shortcuts[0] !== "commandPalette") {
    gaps.push("Keyboard helper classes could not register and resolve a shortcut.");
  }

  printReport({
    tutorial: "Tutorial 6: Events and Interaction",
    script: [
      "SScene.addMouseClickOnObjectListener/addKeyPressListener",
      "StoryApiEvents.MouseClickOnObjectListener",
      "StoryApiEvents.KeyListener.bindShortcut/keyDown",
    ],
    result: gaps.length === 0 ? "PASS" : "PARTIAL",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 6: Events and Interaction",
    script: ["tutorial-tests/tutorial6.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
