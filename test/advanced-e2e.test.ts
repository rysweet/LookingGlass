// @vitest-environment jsdom
import { afterAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import { parseTweedle } from "../src/tweedle-parser.js";
import { createTypeEnvironment } from "../src/tweedle-typechecker.js";
import type { AliceProject } from "../src/a3p-parser.js";
import { SceneManager } from "../src/scene-manager.js";
import {
  WorkspaceManager,
  restoreWorkspace,
  serializeWorkspace,
} from "../src/workspace.js";
import { createServer } from "../src/server.js";

const EVIDENCE_DIR = path.resolve(__dirname, "../.test-advanced-e2e-evidence");

function createProject(projectName: string, objectNames: string[]): AliceProject {
  return {
    version: "3.10.0.0",
    projectName,
    sceneObjects: objectNames.map((name, index) => ({
      name,
      typeName: index === 0 ? "org.lgna.story.SBiped" : "org.lgna.story.SProp",
      resourceType: null,
      position: { x: index, y: 0, z: -index },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      size: { width: 1, height: 1, depth: 1 },
    })),
    methods: [],
  };
}

afterAll(() => {
  fs.rmSync(EVIDENCE_DIR, { recursive: true, force: true });
});

describe("advanced end-to-end scenarios", () => {
  it("parses Tweedle inheritance and preserves the type hierarchy", () => {
    const actor = parseTweedle(`class Actor extends SBiped {
      void cheer() {
        this.say("ready");
      }
    }`);
    const boss = parseTweedle(`class BossActor extends Actor {
      void roar() {
        this.cheer();
      }
    }`);

    const env = createTypeEnvironment([actor, boss]);
    const resolved = env.resolveType("BossActor");

    expect(actor.superClass).toBe("SBiped");
    expect(boss.superClass).toBe("Actor");
    expect(resolved?.superClass).toBe("Actor");
    expect(env.isAssignableTo("BossActor", "Actor")).toBe(true);
    expect(env.isAssignableTo("BossActor", "SBiped")).toBe(true);
    expect(resolved?.classDecl?.methods.map((method) => method.name)).toContain("roar");
  });

  it("serializes a multi-scene authoring session and restores every scene", () => {
    const projects = {
      intro: createProject("IntroScene", ["guide", "ground"]),
      battle: createProject("BattleScene", ["hero", "villain", "arena"]),
      outro: createProject("OutroScene", ["mentor", "banner"]),
    };

    const scenes = new SceneManager();
    scenes.addScene("intro", projects.intro);
    scenes.addScene("battle", projects.battle);
    scenes.addScene("outro", projects.outro);
    scenes.setActive("battle", { kind: "crossfade", durationMs: 500 });

    const workspace = new WorkspaceManager();
    workspace.openWindow({ windowId: "intro", title: "Intro", project: projects.intro });
    workspace.openWindow({ windowId: "battle", title: "Battle", project: projects.battle });
    workspace.openWindow({ windowId: "outro", title: "Outro", project: projects.outro });
    workspace.switchWindow("battle");

    const restored = restoreWorkspace(serializeWorkspace(workspace));

    expect(scenes.sceneNames).toEqual(["intro", "battle", "outro"]);
    expect(scenes.activeSceneName).toBe("battle");
    expect(restored.currentWindowId).toBe("battle");
    expect(restored.listWindows().map((window) => window.windowId)).toEqual([
      "intro",
      "battle",
      "outro",
    ]);
    expect(restored.getWindow("intro")?.project?.projectName).toBe("IntroScene");
    expect(restored.getWindow("battle")?.project?.sceneObjects.map((object) => object.name)).toEqual([
      "hero",
      "villain",
      "arena",
    ]);
    expect(restored.getWindow("outro")?.project?.projectName).toBe("OutroScene");
  });

  it("runs the event pipeline end-to-end and fires registered handlers", async () => {
    fs.rmSync(EVIDENCE_DIR, { recursive: true, force: true });
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const app = createServer({ port: 0, evidenceDir: EVIDENCE_DIR });

    await request(app).post("/api/launch").send({}).expect(200);
    await request(app)
      .post("/api/scene/add-object")
      .send({ className: "org.lgna.story.SBiped", name: "bunny" })
      .expect(200);
    await request(app)
      .post("/api/scene/add-object")
      .send({ className: "org.lgna.story.SQuadruped", name: "cat" })
      .expect(200);

    await request(app)
      .post("/api/events/register")
      .send({ eventType: "sceneActivated", handlerName: "onStart" })
      .expect(200);
    await request(app)
      .post("/api/events/register")
      .send({ eventType: "keyPressed", handlerName: "onJump", key: "Space" })
      .expect(200);
    await request(app)
      .post("/api/events/register")
      .send({
        eventType: "proximity",
        handlerName: "onMeet",
        targetObjects: ["bunny", "cat"],
        threshold: 2,
      })
      .expect(200);

    const sceneActivated = await request(app)
      .post("/api/events/fire")
      .send({ eventType: "sceneActivated" })
      .expect(200);
    const keyPressed = await request(app)
      .post("/api/events/fire")
      .send({ eventType: "keyPressed", payload: { key: "Space" } })
      .expect(200);
    const proximity = await request(app)
      .post("/api/events/fire")
      .send({ eventType: "proximity", payload: { sourceObject: "bunny" } })
      .expect(200);

    expect(sceneActivated.body.triggered).toEqual([
      { id: "evt-1", eventType: "sceneActivated", handlerName: "onStart" },
    ]);
    expect(keyPressed.body.triggered).toEqual([
      { id: "evt-2", eventType: "keyPressed", handlerName: "onJump" },
    ]);
    expect(proximity.body.triggered).toEqual([
      { id: "evt-3", eventType: "proximity", handlerName: "onMeet" },
    ]);
    expect(fs.existsSync(path.join(EVIDENCE_DIR, "event-fire.json"))).toBe(true);
  });
});
