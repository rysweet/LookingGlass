import { describe, expect, it } from "vitest";
import * as JointSystem from "../src/joint-system.js";
import {
  SBiped,
  type JointNode,
  type Orientation,
  type Position,
} from "../src/story-api";

interface JointTransform {
  readonly position: Position;
  readonly orientation: Orientation;
}

interface JointStateStoreContract {
  registerObject(input: {
    readonly objectName: string;
    readonly className: string;
    readonly hierarchy: readonly JointNode[];
  }): void;
  defineJointArray(input: {
    readonly objectName: string;
    readonly name: string;
    readonly joints: readonly string[];
  }): void;
  applyPose(input: {
    readonly objectName: string;
    readonly poseName?: string;
    readonly joints: Record<string, Partial<JointTransform>>;
  }): void;
  queueAnimation(input: {
    readonly objectName: string;
    readonly target:
      | { readonly jointName: string }
      | { readonly jointArray: string };
    readonly to: Partial<JointTransform>;
    readonly durationMs: number;
    readonly style?: "traditional" | "gentle" | "abrupt" | "linear";
    readonly evidenceLabel?: string;
  }): { readonly animationId: string };
  toJSON(): {
    readonly schema_version: "alice.joint-state/v1";
    readonly runtime: "alice-web";
    readonly objects: Record<string, {
      readonly className: string;
      readonly joints: Record<string, {
        readonly parentName: string | null;
        readonly bindTransform: JointTransform;
        readonly currentTransform: JointTransform;
      }>;
      readonly jointArrays: Record<string, readonly string[]>;
      readonly poses: Record<string, Record<string, Partial<JointTransform>>>;
      readonly pendingAnimations: readonly {
        readonly animationId: string;
        readonly target:
          | { readonly jointName: string }
          | { readonly jointArray: string };
        readonly resolvedJoints: readonly string[];
        readonly durationMs: number;
        readonly style?: string;
        readonly evidenceLabel?: string;
        readonly to: Partial<JointTransform>;
      }[];
    }>;
  };
}

const IDENTITY_ORIENTATION: Orientation = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_POSITION: Position = { x: 0, y: 0, z: 0 };
const WAVE_ORIENTATION: Orientation = { x: 0, y: 0, z: 0.707, w: 0.707 };

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
      joint("SHOULDER", "ROOT", [
        joint("CLAW_LEFT", "SHOULDER"),
        joint("CLAW_RIGHT", "SHOULDER"),
      ]),
    ]),
  ];
}

function getJointStateStoreCtor(): new () => JointStateStoreContract {
  const exported = (JointSystem as Record<string, unknown>).JointStateStore;
  expect(exported).toBeTypeOf("function");
  return exported as new () => JointStateStoreContract;
}

describe("JointStateStore contract", () => {
  it("persists joint arrays as metadata and resolves them for animation without prior pose keys", () => {
    const JointStateStore = getJointStateStoreCtor();
    const jointState = new JointStateStore();

    jointState.registerObject({
      objectName: "robotArm",
      className: "org.lgna.story.SProp",
      hierarchy: robotArmHierarchy(),
    });
    jointState.defineJointArray({
      objectName: "robotArm",
      name: "gripper",
      joints: ["CLAW_LEFT", "CLAW_RIGHT"],
    });
    const animation = jointState.queueAnimation({
      objectName: "robotArm",
      target: { jointArray: "gripper" },
      durationMs: 500,
      style: "linear",
      evidenceLabel: "close-gripper",
      to: { orientation: WAVE_ORIENTATION },
    });

    const snapshot = jointState.toJSON();
    expect(snapshot).toMatchObject({
      schema_version: "alice.joint-state/v1",
      runtime: "alice-web",
      objects: {
        robotArm: {
          className: "org.lgna.story.SProp",
          jointArrays: {
            gripper: ["CLAW_LEFT", "CLAW_RIGHT"],
          },
          poses: {},
        },
      },
    });
    expect(snapshot.objects.robotArm.pendingAnimations).toEqual([
      expect.objectContaining({
        animationId: animation.animationId,
        target: { jointArray: "gripper" },
        resolvedJoints: ["CLAW_LEFT", "CLAW_RIGHT"],
        durationMs: 500,
        style: "linear",
        evidenceLabel: "close-gripper",
        to: { orientation: WAVE_ORIENTATION },
      }),
    ]);
  });

  it("normalizes biped aliases in persisted poses and keeps read access legacy-compatible", () => {
    const JointStateStore = getJointStateStoreCtor();
    const jointState = new JointStateStore();
    const alice = new SBiped("alice");

    expect(alice.getJointId("PELVIS")).toEqual({
      name: "PELVIS_LOWER_BODY",
      parent: "ROOT",
    });
    expect(alice.getJointId("LEFT_TENTACLE")).toBeUndefined();

    jointState.registerObject({
      objectName: "alice",
      className: "org.lgna.story.SBiped",
      hierarchy: alice.getJointHierarchy(),
    });
    jointState.applyPose({
      objectName: "alice",
      poseName: "waveStart",
      joints: {
        PELVIS: { position: { x: 0, y: 0.25, z: 0 } },
        CHEST: { orientation: WAVE_ORIENTATION },
      },
    });

    const snapshot = jointState.toJSON();
    expect(snapshot.objects.alice.poses.waveStart).toEqual({
      PELVIS_LOWER_BODY: { position: { x: 0, y: 0.25, z: 0 } },
      SPINE_UPPER: { orientation: WAVE_ORIENTATION },
    });
    expect(snapshot.objects.alice.poses.waveStart).not.toHaveProperty("PELVIS");
    expect(snapshot.objects.alice.poses.waveStart).not.toHaveProperty("CHEST");
  });

  it("fails clearly and atomically when mutating unknown joints", () => {
    const JointStateStore = getJointStateStoreCtor();
    const jointState = new JointStateStore();
    const alice = new SBiped("alice");

    jointState.registerObject({
      objectName: "alice",
      className: "org.lgna.story.SBiped",
      hierarchy: alice.getJointHierarchy(),
    });
    const before = jointState.toJSON();

    expect(() => jointState.applyPose({
      objectName: "alice",
      poseName: "invalidPose",
      joints: {
        LEFT_TENTACLE: { orientation: WAVE_ORIENTATION },
      },
    })).toThrow(/LEFT_TENTACLE/);
    expect(jointState.toJSON()).toEqual(before);
  });
});

describe("Story API joint mutation contract", () => {
  it("preserves undefined read access but rejects unknown pose joints", () => {
    const alice = new SBiped("alice");

    expect(alice.getJointId("LEFT_TENTACLE")).toBeUndefined();
    expect(() => alice.strikePose({
      LEFT_TENTACLE: { orientation: WAVE_ORIENTATION },
    })).toThrow(/LEFT_TENTACLE/);
  });
});
