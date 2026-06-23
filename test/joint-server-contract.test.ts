import { afterEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import request from "supertest";
import { createServer } from "../src/server";
import { LOCAL_API_TOKEN_HEADER } from "../src/server/security";
import type { JointNode, Orientation, Position } from "../src/story-api";

const TEST_LOCAL_API_TOKEN = "test-local-api-token";
const IDENTITY_ORIENTATION: Orientation = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_POSITION: Position = { x: 0, y: 0, z: 0 };
const WAVE_ORIENTATION: Orientation = { x: 0, y: 0, z: 0.707, w: 0.707 };

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createTestServer(evidenceDir: string): Express {
  return createServer({
    port: 0,
    evidenceDir,
    localApiToken: TEST_LOCAL_API_TOKEN,
  });
}

function localPost(app: Express, apiPath: string) {
  return request(app)
    .post(apiPath)
    .set(LOCAL_API_TOKEN_HEADER, TEST_LOCAL_API_TOKEN);
}

function readJsonObject(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
}

function joint(name: string, parentName: string | null, children: JointNode[] = []): JointNode {
  return {
    name,
    parentName,
    children,
    localTransform: {
      position: ZERO_POSITION,
      orientation: IDENTITY_ORIENTATION,
    },
  };
}

function robotArmHierarchy(): JointNode[] {
  return [
    joint("ROOT", null, [
      joint("BODY", "ROOT"),
      joint("SHOULDER", "ROOT", [
        joint("HANDLE", "SHOULDER"),
      ]),
    ]),
  ];
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("joint manipulation server contract", () => {
  it("creates a custom jointed object with non-root joints and persists sidecar metadata", async () => {
    const evidenceDir = makeTempDir("alice-joints-server-");
    const app = createTestServer(evidenceDir);
    await localPost(app, "/api/launch").send({}).expect(200);

    const add = await localPost(app, "/api/scene/add-jointed-object")
      .send({
        name: "robotArm",
        className: "org.lgna.story.SProp",
        joints: robotArmHierarchy(),
        jointArrays: [
          { name: "gripper", joints: ["HANDLE"] },
        ],
      })
      .expect(200);

    const sidecarPath = path.join(evidenceDir, "alice-web", "joint-state.json");
    expect(add.body).toMatchObject({
      schema_version: "alice.jointed-object/v1",
      status: "added",
      objectName: "robotArm",
      className: "org.lgna.story.SProp",
      jointCount: 4,
      jointArrays: ["gripper"],
      evidenceArtifact: sidecarPath,
    });
    expect(fs.existsSync(sidecarPath)).toBe(true);
    expect(readJsonObject(sidecarPath)).toMatchObject({
      schema_version: "alice.joint-state/v1",
      runtime: "alice-web",
      objects: {
        robotArm: {
          className: "org.lgna.story.SProp",
          joints: {
            ROOT: { parentName: null },
            BODY: { parentName: "ROOT" },
            SHOULDER: { parentName: "ROOT" },
            HANDLE: { parentName: "SHOULDER" },
          },
          jointArrays: {
            gripper: ["HANDLE"],
          },
        },
      },
    });

    const state = await request(app).get("/api/joints/robotArm").expect(200);
    expect(state.body).toMatchObject({
      schema_version: "alice.joint-state-object/v1",
      objectName: "robotArm",
      className: "org.lgna.story.SProp",
      joints: {
        HANDLE: {
          parentName: "SHOULDER",
          currentTransform: {
            position: ZERO_POSITION,
            orientation: IDENTITY_ORIENTATION,
          },
        },
      },
      jointArrays: {
        gripper: ["HANDLE"],
      },
      poses: {},
      pendingAnimations: [],
    });
  });

  it("poses and animates biped joints through arrays, then verifies runtime effects and save persistence", async () => {
    const evidenceDir = makeTempDir("alice-joints-server-");
    const app = createTestServer(evidenceDir);
    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({
        className: "org.lgna.story.SBiped",
        name: "alice",
      })
      .expect(200);

    const initialState = await request(app).get("/api/joints/alice").expect(200);
    expect(initialState.body).toMatchObject({
      schema_version: "alice.joint-state-object/v1",
      objectName: "alice",
      className: "org.lgna.story.SBiped",
      joints: {
        LEFT_HAND: { parentName: "LEFT_WRIST" },
        PELVIS_LOWER_BODY: { parentName: "ROOT" },
      },
      jointArrays: {
        leftArm: ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
      },
    });

    const pose = await localPost(app, "/api/joints/alice/pose")
      .send({
        poseName: "waveStart",
        joints: {
          PELVIS: { position: { x: 0, y: 0.25, z: 0 } },
          LEFT_HAND: { orientation: WAVE_ORIENTATION },
        },
      })
      .expect(200);
    expect(pose.body).toMatchObject({
      schema_version: "alice.joint-pose-result/v1",
      status: "posed",
      objectName: "alice",
      poseName: "waveStart",
      canonicalJoints: ["PELVIS_LOWER_BODY", "LEFT_HAND"],
    });

    const animation = await localPost(app, "/api/joints/alice/animate")
      .send({
        target: { jointArray: "leftArm" },
        durationMs: 750,
        style: "gentle",
        evidenceLabel: "wave-left-arm",
        to: { orientation: WAVE_ORIENTATION },
      })
      .expect(200);
    expect(animation.body).toMatchObject({
      schema_version: "alice.joint-animation-result/v1",
      status: "queued",
      objectName: "alice",
      target: { jointArray: "leftArm" },
      resolvedJoints: ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
    });

    const run = await localPost(app, "/api/world/run").send({}).expect(200);
    expect(run.body).toMatchObject({
      schema_version: "eatme.alice-run-world-result/v1",
      status: "completed",
      jointAnimations: [
        {
          objectName: "alice",
          target: { jointArray: "leftArm" },
          resolvedJoints: ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
          durationMs: 750,
          status: "executed",
          evidenceLabel: "wave-left-arm",
        },
      ],
      jointVerification: {
        status: "verified",
        sidecarArtifact: path.join(evidenceDir, "alice-web", "joint-state.json"),
        objects: {
          alice: {
            verifiedArrays: ["leftArm"],
            verifiedJoints: ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
            finalPose: {
              LEFT_HAND: {
                orientation: WAVE_ORIENTATION,
              },
            },
          },
        },
      },
      errors: [],
    });
    expect(readJsonObject(run.body.evidenceArtifact)).toMatchObject({
      runtime: "alice-web",
      jointVerification: {
        status: "verified",
      },
    });

    await localPost(app, "/api/project/save")
      .send({ saveSelector: "scene.myFirstMethod" })
      .expect(200);
    const savedSidecarPath = path.join(evidenceDir, "project-save", "alice-web", "joint-state.json");
    expect(fs.existsSync(savedSidecarPath)).toBe(true);
    expect(readJsonObject(savedSidecarPath)).toMatchObject({
      schema_version: "alice.joint-state/v1",
      runtime: "alice-web",
      objects: {
        alice: {
          poses: {
            waveStart: {
              PELVIS_LOWER_BODY: { position: { x: 0, y: 0.25, z: 0 } },
              LEFT_HAND: { orientation: WAVE_ORIENTATION },
            },
          },
          jointArrays: {
            leftArm: ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
          },
        },
      },
    });
  });

  it("clears stale joint state when launching a replacement project", async () => {
    const evidenceDir = makeTempDir("alice-joints-reset-");
    const app = createTestServer(evidenceDir);
    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/scene/add-jointed-object")
      .send({
        name: "robotArm",
        className: "org.lgna.story.SProp",
        joints: robotArmHierarchy(),
      })
      .expect(200);

    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/project/save")
      .send({ saveSelector: "scene.myFirstMethod" })
      .expect(200);

    const savedSidecarPath = path.join(evidenceDir, "project-save", "alice-web", "joint-state.json");
    expect(fs.existsSync(savedSidecarPath)).toBe(false);
  });

  it("rejects unknown mutating joints without changing persisted sidecar state", async () => {
    const evidenceDir = makeTempDir("alice-joints-server-");
    const app = createTestServer(evidenceDir);
    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({
        className: "org.lgna.story.SBiped",
        name: "alice",
      })
      .expect(200);
    await request(app).get("/api/joints/alice").expect(200);

    const sidecarPath = path.join(evidenceDir, "alice-web", "joint-state.json");
    const before = fs.readFileSync(sidecarPath, "utf-8");

    const response = await localPost(app, "/api/joints/alice/pose")
      .send({
        poseName: "badPose",
        joints: {
          LEFT_TENTACLE: { orientation: WAVE_ORIENTATION },
        },
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: "Unknown joint names for alice",
      objectName: "alice",
      unknownJoints: ["LEFT_TENTACLE"],
    });
    expect(response.body.availableJoints).toContain("LEFT_HAND");
    expect(fs.readFileSync(sidecarPath, "utf-8")).toBe(before);

    const state = await request(app).get("/api/joints/alice").expect(200);
    expect(state.body.joints).not.toHaveProperty("LEFT_TENTACLE");
    expect(state.body.poses).not.toHaveProperty("badPose");
  });
});
