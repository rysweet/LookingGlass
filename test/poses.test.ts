import { describe, expect, it } from "vitest";
import {
  applyPose,
  createWalkCycle,
  createFlyerFlapCycle,
  createQuadrupedTrotCycle,
  createSlithererCycle,
  createSwimmerTailCycle,
  FLYER_REST_POSE,
  FLYER_GLIDE_POSE,
  FLYER_FLAP_UP_POSE,
  FLYER_FLAP_DOWN_POSE,
  FLYER_LAND_POSE,
  QUADRUPED_STAND_POSE,
  QUADRUPED_SIT_POSE,
  QUADRUPED_TROT_STRIDE_POSE,
  QUADRUPED_TROT_PASS_POSE,
  QUADRUPED_TROT_STRIDE_MIRROR_POSE,
  SLITHERER_STRAIGHT_POSE,
  SLITHERER_S_CURVE_LEFT_POSE,
  SLITHERER_S_CURVE_RIGHT_POSE,
  SWIMMER_IDLE_POSE,
  SWIMMER_TAIL_LEFT_POSE,
  SWIMMER_TAIL_RIGHT_POSE,
  SWIMMER_DIVE_POSE,
  STAND_POSE,
  type PoseDefinition,
  type PoseableEntity,
} from "../src/poses.js";

function createMockEntity(joints: Record<string, number> = {}): PoseableEntity {
  return { jointRotations: { ...joints } };
}

describe("entity-specific poses", () => {
  describe("flyer poses", () => {
    it("defines 5 flyer poses with correct names and wing joints", () => {
      const poses = [FLYER_REST_POSE, FLYER_GLIDE_POSE, FLYER_FLAP_UP_POSE, FLYER_FLAP_DOWN_POSE, FLYER_LAND_POSE];
      const expectedNames = ["flyer_rest", "flyer_glide", "flyer_flap_up", "flyer_flap_down", "flyer_land"];

      for (let i = 0; i < poses.length; i++) {
        expect(poses[i].name).toBe(expectedNames[i]);
        expect(Object.keys(poses[i].jointRotations).length).toBeGreaterThan(0);
      }

      // Wing-based poses use LEFT/RIGHT_WING_SHOULDER
      expect(FLYER_GLIDE_POSE.jointRotations).toHaveProperty("LEFT_WING_SHOULDER");
      expect(FLYER_GLIDE_POSE.jointRotations).toHaveProperty("RIGHT_WING_SHOULDER");
      expect(FLYER_FLAP_UP_POSE.jointRotations).toHaveProperty("LEFT_WING_SHOULDER");
      expect(FLYER_FLAP_DOWN_POSE.jointRotations).toHaveProperty("RIGHT_WING_SHOULDER");

      // Land pose also uses hip joints
      expect(FLYER_LAND_POSE.jointRotations).toHaveProperty("LEFT_HIP");
      expect(FLYER_LAND_POSE.jointRotations).toHaveProperty("RIGHT_HIP");
    });

    it("creates a 4-pose flyer flap cycle", () => {
      const cycle = createFlyerFlapCycle();
      expect(cycle).toHaveLength(4);
      expect(cycle[0]).toBe(FLYER_REST_POSE);
      expect(cycle[1]).toBe(FLYER_FLAP_UP_POSE);
      expect(cycle[2]).toBe(FLYER_GLIDE_POSE);
      expect(cycle[3]).toBe(FLYER_FLAP_DOWN_POSE);
    });

    it("freezes all flyer poses (immutable)", () => {
      expect(Object.isFrozen(FLYER_REST_POSE)).toBe(true);
      expect(Object.isFrozen(FLYER_REST_POSE.jointRotations)).toBe(true);
      expect(Object.isFrozen(FLYER_GLIDE_POSE)).toBe(true);
      expect(Object.isFrozen(FLYER_FLAP_UP_POSE)).toBe(true);
      expect(Object.isFrozen(FLYER_FLAP_DOWN_POSE)).toBe(true);
      expect(Object.isFrozen(FLYER_LAND_POSE)).toBe(true);
    });
  });

  describe("quadruped poses", () => {
    it("defines 5 quadruped poses with correct names and leg joints", () => {
      const poses = [
        QUADRUPED_STAND_POSE, QUADRUPED_SIT_POSE,
        QUADRUPED_TROT_STRIDE_POSE, QUADRUPED_TROT_PASS_POSE,
        QUADRUPED_TROT_STRIDE_MIRROR_POSE,
      ];
      const expectedNames = [
        "quadruped_stand", "quadruped_sit",
        "quadruped_trot_stride", "quadruped_trot_pass",
        "quadruped_trot_stride_mirror",
      ];

      for (let i = 0; i < poses.length; i++) {
        expect(poses[i].name).toBe(expectedNames[i]);
        expect(Object.keys(poses[i].jointRotations).length).toBeGreaterThan(0);
      }

      // Uses QuadrupedJoints names
      expect(QUADRUPED_TROT_STRIDE_POSE.jointRotations).toHaveProperty("FRONT_LEFT_SHOULDER");
      expect(QUADRUPED_TROT_STRIDE_POSE.jointRotations).toHaveProperty("FRONT_RIGHT_SHOULDER");
      expect(QUADRUPED_TROT_STRIDE_POSE.jointRotations).toHaveProperty("BACK_LEFT_HIP");
      expect(QUADRUPED_TROT_STRIDE_POSE.jointRotations).toHaveProperty("BACK_RIGHT_HIP");

      // Sit uses back hips
      expect(QUADRUPED_SIT_POSE.jointRotations).toHaveProperty("BACK_LEFT_HIP");
      expect(QUADRUPED_SIT_POSE.jointRotations).toHaveProperty("BACK_RIGHT_HIP");

      // Stand pose has all leg joints at 0
      for (const value of Object.values(QUADRUPED_STAND_POSE.jointRotations)) {
        expect(value).toBe(0);
      }
    });

    it("creates a 4-pose quadruped trot cycle", () => {
      const cycle = createQuadrupedTrotCycle();
      expect(cycle).toHaveLength(4);
      expect(cycle[0]).toBe(QUADRUPED_STAND_POSE);
      expect(cycle[1]).toBe(QUADRUPED_TROT_STRIDE_POSE);
      expect(cycle[2]).toBe(QUADRUPED_TROT_PASS_POSE);
      expect(cycle[3]).toBe(QUADRUPED_TROT_STRIDE_MIRROR_POSE);
    });

    it("freezes all quadruped poses (immutable)", () => {
      expect(Object.isFrozen(QUADRUPED_STAND_POSE)).toBe(true);
      expect(Object.isFrozen(QUADRUPED_STAND_POSE.jointRotations)).toBe(true);
      expect(Object.isFrozen(QUADRUPED_SIT_POSE)).toBe(true);
      expect(Object.isFrozen(QUADRUPED_TROT_STRIDE_POSE)).toBe(true);
      expect(Object.isFrozen(QUADRUPED_TROT_PASS_POSE)).toBe(true);
      expect(Object.isFrozen(QUADRUPED_TROT_STRIDE_MIRROR_POSE)).toBe(true);
    });
  });

  describe("slitherer poses", () => {
    it("defines 3 slitherer poses with spine joint names", () => {
      const poses = [SLITHERER_STRAIGHT_POSE, SLITHERER_S_CURVE_LEFT_POSE, SLITHERER_S_CURVE_RIGHT_POSE];
      const expectedNames = ["slitherer_straight", "slitherer_s_curve_left", "slitherer_s_curve_right"];

      for (let i = 0; i < poses.length; i++) {
        expect(poses[i].name).toBe(expectedNames[i]);
        expect(Object.keys(poses[i].jointRotations).length).toBeGreaterThan(0);
      }

      // Uses raw spine joint names matching SSlitherer.slither()
      expect(SLITHERER_S_CURVE_LEFT_POSE.jointRotations).toHaveProperty("NECK");
      expect(SLITHERER_S_CURVE_LEFT_POSE.jointRotations).toHaveProperty("SPINE_BASE");
      expect(SLITHERER_S_CURVE_LEFT_POSE.jointRotations).toHaveProperty("SPINE_MIDDLE");
      expect(SLITHERER_S_CURVE_LEFT_POSE.jointRotations).toHaveProperty("SPINE_UPPER");

      // Straight pose has all joints at 0
      for (const value of Object.values(SLITHERER_STRAIGHT_POSE.jointRotations)) {
        expect(value).toBe(0);
      }

      // S-curve left and right are mirror images (opposite signs)
      const leftJoints = SLITHERER_S_CURVE_LEFT_POSE.jointRotations;
      const rightJoints = SLITHERER_S_CURVE_RIGHT_POSE.jointRotations;
      for (const key of Object.keys(leftJoints)) {
        expect(rightJoints[key]).toBeCloseTo(-leftJoints[key], 6);
      }
    });

    it("creates a 4-pose slitherer cycle", () => {
      const cycle = createSlithererCycle();
      expect(cycle).toHaveLength(4);
      expect(cycle[0]).toBe(SLITHERER_STRAIGHT_POSE);
      expect(cycle[1]).toBe(SLITHERER_S_CURVE_LEFT_POSE);
      expect(cycle[2]).toBe(SLITHERER_STRAIGHT_POSE);
      expect(cycle[3]).toBe(SLITHERER_S_CURVE_RIGHT_POSE);
    });

    it("freezes all slitherer poses (immutable)", () => {
      expect(Object.isFrozen(SLITHERER_STRAIGHT_POSE)).toBe(true);
      expect(Object.isFrozen(SLITHERER_STRAIGHT_POSE.jointRotations)).toBe(true);
      expect(Object.isFrozen(SLITHERER_S_CURVE_LEFT_POSE)).toBe(true);
      expect(Object.isFrozen(SLITHERER_S_CURVE_RIGHT_POSE)).toBe(true);
    });
  });

  describe("swimmer poses", () => {
    it("defines 4 swimmer poses with TAIL and NECK joints", () => {
      const poses = [SWIMMER_IDLE_POSE, SWIMMER_TAIL_LEFT_POSE, SWIMMER_TAIL_RIGHT_POSE, SWIMMER_DIVE_POSE];
      const expectedNames = ["swimmer_idle", "swimmer_tail_left", "swimmer_tail_right", "swimmer_dive"];

      for (let i = 0; i < poses.length; i++) {
        expect(poses[i].name).toBe(expectedNames[i]);
        expect(Object.keys(poses[i].jointRotations).length).toBeGreaterThan(0);
      }

      // Uses "TAIL" (not "TAIL_0" — swimmer joint name differs from quadruped)
      expect(SWIMMER_TAIL_LEFT_POSE.jointRotations).toHaveProperty("TAIL");
      expect(SWIMMER_TAIL_RIGHT_POSE.jointRotations).toHaveProperty("TAIL");

      // Dive pose uses both TAIL and NECK
      expect(SWIMMER_DIVE_POSE.jointRotations).toHaveProperty("TAIL");
      expect(SWIMMER_DIVE_POSE.jointRotations).toHaveProperty("NECK");

      // Idle has joints at 0
      for (const value of Object.values(SWIMMER_IDLE_POSE.jointRotations)) {
        expect(value).toBe(0);
      }

      // Tail left and right are mirror images
      const leftTail = SWIMMER_TAIL_LEFT_POSE.jointRotations["TAIL"];
      const rightTail = SWIMMER_TAIL_RIGHT_POSE.jointRotations["TAIL"];
      expect(rightTail).toBeCloseTo(-leftTail, 6);
    });

    it("creates a 4-pose swimmer tail cycle", () => {
      const cycle = createSwimmerTailCycle();
      expect(cycle).toHaveLength(4);
      expect(cycle[0]).toBe(SWIMMER_IDLE_POSE);
      expect(cycle[1]).toBe(SWIMMER_TAIL_LEFT_POSE);
      expect(cycle[2]).toBe(SWIMMER_IDLE_POSE);
      expect(cycle[3]).toBe(SWIMMER_TAIL_RIGHT_POSE);
    });

    it("freezes all swimmer poses (immutable)", () => {
      expect(Object.isFrozen(SWIMMER_IDLE_POSE)).toBe(true);
      expect(Object.isFrozen(SWIMMER_IDLE_POSE.jointRotations)).toBe(true);
      expect(Object.isFrozen(SWIMMER_TAIL_LEFT_POSE)).toBe(true);
      expect(Object.isFrozen(SWIMMER_TAIL_RIGHT_POSE)).toBe(true);
      expect(Object.isFrozen(SWIMMER_DIVE_POSE)).toBe(true);
    });
  });

  describe("applyPose integration", () => {
    it("applies entity-specific poses to a PoseableEntity", () => {
      const entity = createMockEntity({ LEFT_WING_SHOULDER: 0, RIGHT_WING_SHOULDER: 0 });
      applyPose(entity, FLYER_GLIDE_POSE);
      expect(entity.jointRotations["LEFT_WING_SHOULDER"]).toBe(FLYER_GLIDE_POSE.jointRotations["LEFT_WING_SHOULDER"]);
      expect(entity.jointRotations["RIGHT_WING_SHOULDER"]).toBe(FLYER_GLIDE_POSE.jointRotations["RIGHT_WING_SHOULDER"]);
    });

    it("preserves joints not in the pose definition", () => {
      const entity = createMockEntity({ EXTRA_JOINT: 0.5, TAIL: 0 });
      applyPose(entity, SWIMMER_TAIL_LEFT_POSE);
      expect(entity.jointRotations["EXTRA_JOINT"]).toBe(0.5);
      expect(entity.jointRotations["TAIL"]).toBe(SWIMMER_TAIL_LEFT_POSE.jointRotations["TAIL"]);
    });
  });

  describe("existing walk cycle unchanged", () => {
    it("still produces 4-pose biped walk cycle", () => {
      const cycle = createWalkCycle();
      expect(cycle).toHaveLength(4);
      expect(cycle[0].name).toBe("walk_ready");
    });

    it("existing STAND_POSE is still exported and frozen", () => {
      expect(STAND_POSE.name).toBe("stand");
      expect(Object.isFrozen(STAND_POSE)).toBe(true);
    });
  });
});
