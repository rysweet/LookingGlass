export interface PoseDefinition {
  readonly name: string;
  readonly jointRotations: Readonly<Record<string, number>>;
}

export interface PoseableEntity {
  jointRotations: Record<string, number>;
}

export const STAND_POSE: PoseDefinition = Object.freeze({
  name: "stand",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: 0,
    SPINE_BASE: 0,
    SPINE_MIDDLE: 0,
    SPINE_UPPER: 0,
    LEFT_HIP: 0,
    RIGHT_HIP: 0,
    LEFT_KNEE: 0,
    RIGHT_KNEE: 0,
    LEFT_ANKLE: 0,
    RIGHT_ANKLE: 0,
    LEFT_SHOULDER: 0,
    RIGHT_SHOULDER: 0,
    LEFT_ELBOW: 0,
    RIGHT_ELBOW: 0,
  }),
});

export const SIT_POSE: PoseDefinition = Object.freeze({
  name: "sit",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: -0.1,
    LEFT_HIP: -1.4,
    RIGHT_HIP: -1.4,
    LEFT_KNEE: 1.4,
    RIGHT_KNEE: 1.4,
    LEFT_ANKLE: 0.1,
    RIGHT_ANKLE: 0.1,
    LEFT_SHOULDER: -0.2,
    RIGHT_SHOULDER: -0.2,
    LEFT_ELBOW: 0.5,
    RIGHT_ELBOW: 0.5,
  }),
});

export const WALK_READY_POSE: PoseDefinition = Object.freeze({
  name: "walk_ready",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: 0,
    LEFT_HIP: -0.15,
    RIGHT_HIP: 0.15,
    LEFT_KNEE: 0.1,
    RIGHT_KNEE: 0.05,
    LEFT_SHOULDER: 0.15,
    RIGHT_SHOULDER: -0.15,
    LEFT_ELBOW: -0.3,
    RIGHT_ELBOW: -0.3,
  }),
});

const WALK_STRIDE_POSE: PoseDefinition = Object.freeze({
  name: "walk_stride",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: 0,
    LEFT_HIP: 0.35,
    RIGHT_HIP: -0.35,
    LEFT_KNEE: 0.05,
    RIGHT_KNEE: 0.4,
    LEFT_SHOULDER: -0.35,
    RIGHT_SHOULDER: 0.35,
    LEFT_ELBOW: -0.3,
    RIGHT_ELBOW: -0.3,
  }),
});

const WALK_PASS_POSE: PoseDefinition = Object.freeze({
  name: "walk_pass",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: 0,
    LEFT_HIP: 0,
    RIGHT_HIP: 0,
    LEFT_KNEE: 0.1,
    RIGHT_KNEE: 0.1,
    LEFT_SHOULDER: 0,
    RIGHT_SHOULDER: 0,
    LEFT_ELBOW: -0.3,
    RIGHT_ELBOW: -0.3,
  }),
});

const WALK_STRIDE_MIRROR_POSE: PoseDefinition = Object.freeze({
  name: "walk_stride_mirror",
  jointRotations: Object.freeze({
    PELVIS_LOWER_BODY: 0,
    LEFT_HIP: -0.35,
    RIGHT_HIP: 0.35,
    LEFT_KNEE: 0.4,
    RIGHT_KNEE: 0.05,
    LEFT_SHOULDER: 0.35,
    RIGHT_SHOULDER: -0.35,
    LEFT_ELBOW: -0.3,
    RIGHT_ELBOW: -0.3,
  }),
});

export function applyPose(entity: PoseableEntity, pose: PoseDefinition): void {
  entity.jointRotations = { ...entity.jointRotations, ...pose.jointRotations };
}

export function createWalkCycle(): PoseDefinition[] {
  return [WALK_READY_POSE, WALK_STRIDE_POSE, WALK_PASS_POSE, WALK_STRIDE_MIRROR_POSE];
}

// --- Flyer poses (FlyerJoints: LEFT/RIGHT_WING_SHOULDER, TAIL_0, LEFT/RIGHT_HIP) ---

export const FLYER_REST_POSE: PoseDefinition = Object.freeze({
  name: "flyer_rest",
  jointRotations: Object.freeze({
    LEFT_WING_SHOULDER: -0.3,
    RIGHT_WING_SHOULDER: -0.3,
    TAIL_0: 0,
    LEFT_HIP: 0,
    RIGHT_HIP: 0,
  }),
});

export const FLYER_GLIDE_POSE: PoseDefinition = Object.freeze({
  name: "flyer_glide",
  jointRotations: Object.freeze({
    LEFT_WING_SHOULDER: 0.1,
    RIGHT_WING_SHOULDER: 0.1,
    TAIL_0: -0.05,
    LEFT_HIP: -0.1,
    RIGHT_HIP: -0.1,
  }),
});

export const FLYER_FLAP_UP_POSE: PoseDefinition = Object.freeze({
  name: "flyer_flap_up",
  jointRotations: Object.freeze({
    LEFT_WING_SHOULDER: 0.5,
    RIGHT_WING_SHOULDER: 0.5,
    TAIL_0: -0.05,
  }),
});

export const FLYER_FLAP_DOWN_POSE: PoseDefinition = Object.freeze({
  name: "flyer_flap_down",
  jointRotations: Object.freeze({
    LEFT_WING_SHOULDER: -0.4,
    RIGHT_WING_SHOULDER: -0.4,
    TAIL_0: 0.05,
  }),
});

export const FLYER_LAND_POSE: PoseDefinition = Object.freeze({
  name: "flyer_land",
  jointRotations: Object.freeze({
    LEFT_WING_SHOULDER: -0.2,
    RIGHT_WING_SHOULDER: -0.2,
    TAIL_0: 0.1,
    LEFT_HIP: -0.6,
    RIGHT_HIP: -0.6,
  }),
});

export function createFlyerFlapCycle(): PoseDefinition[] {
  return [FLYER_REST_POSE, FLYER_FLAP_UP_POSE, FLYER_GLIDE_POSE, FLYER_FLAP_DOWN_POSE];
}

// --- Quadruped poses (QuadrupedJoints: FRONT_LEFT/RIGHT_SHOULDER, BACK_LEFT/RIGHT_HIP, TAIL_0) ---

export const QUADRUPED_STAND_POSE: PoseDefinition = Object.freeze({
  name: "quadruped_stand",
  jointRotations: Object.freeze({
    FRONT_LEFT_SHOULDER: 0,
    FRONT_RIGHT_SHOULDER: 0,
    BACK_LEFT_HIP: 0,
    BACK_RIGHT_HIP: 0,
    TAIL_0: 0,
    NECK: 0,
  }),
});

export const QUADRUPED_SIT_POSE: PoseDefinition = Object.freeze({
  name: "quadruped_sit",
  jointRotations: Object.freeze({
    FRONT_LEFT_SHOULDER: 0,
    FRONT_RIGHT_SHOULDER: 0,
    BACK_LEFT_HIP: -1.2,
    BACK_RIGHT_HIP: -1.2,
    TAIL_0: -0.2,
    NECK: 0.1,
  }),
});

export const QUADRUPED_TROT_STRIDE_POSE: PoseDefinition = Object.freeze({
  name: "quadruped_trot_stride",
  jointRotations: Object.freeze({
    FRONT_LEFT_SHOULDER: 0.35,
    FRONT_RIGHT_SHOULDER: -0.35,
    BACK_LEFT_HIP: -0.35,
    BACK_RIGHT_HIP: 0.35,
    TAIL_0: 0.1,
  }),
});

export const QUADRUPED_TROT_PASS_POSE: PoseDefinition = Object.freeze({
  name: "quadruped_trot_pass",
  jointRotations: Object.freeze({
    FRONT_LEFT_SHOULDER: 0,
    FRONT_RIGHT_SHOULDER: 0,
    BACK_LEFT_HIP: 0,
    BACK_RIGHT_HIP: 0,
    TAIL_0: 0,
  }),
});

export const QUADRUPED_TROT_STRIDE_MIRROR_POSE: PoseDefinition = Object.freeze({
  name: "quadruped_trot_stride_mirror",
  jointRotations: Object.freeze({
    FRONT_LEFT_SHOULDER: -0.35,
    FRONT_RIGHT_SHOULDER: 0.35,
    BACK_LEFT_HIP: 0.35,
    BACK_RIGHT_HIP: -0.35,
    TAIL_0: -0.1,
  }),
});

export function createQuadrupedTrotCycle(): PoseDefinition[] {
  return [QUADRUPED_STAND_POSE, QUADRUPED_TROT_STRIDE_POSE, QUADRUPED_TROT_PASS_POSE, QUADRUPED_TROT_STRIDE_MIRROR_POSE];
}

// --- Slitherer poses (SlithererJoints: NECK, SPINE_BASE, SPINE_MIDDLE, SPINE_UPPER) ---

export const SLITHERER_STRAIGHT_POSE: PoseDefinition = Object.freeze({
  name: "slitherer_straight",
  jointRotations: Object.freeze({
    NECK: 0,
    SPINE_BASE: 0,
    SPINE_MIDDLE: 0,
    SPINE_UPPER: 0,
  }),
});

export const SLITHERER_S_CURVE_LEFT_POSE: PoseDefinition = Object.freeze({
  name: "slitherer_s_curve_left",
  jointRotations: Object.freeze({
    NECK: 0.15,
    SPINE_BASE: -0.15,
    SPINE_MIDDLE: 0.15,
    SPINE_UPPER: -0.15,
  }),
});

export const SLITHERER_S_CURVE_RIGHT_POSE: PoseDefinition = Object.freeze({
  name: "slitherer_s_curve_right",
  jointRotations: Object.freeze({
    NECK: -0.15,
    SPINE_BASE: 0.15,
    SPINE_MIDDLE: -0.15,
    SPINE_UPPER: 0.15,
  }),
});

export function createSlithererCycle(): PoseDefinition[] {
  return [SLITHERER_STRAIGHT_POSE, SLITHERER_S_CURVE_LEFT_POSE, SLITHERER_STRAIGHT_POSE, SLITHERER_S_CURVE_RIGHT_POSE];
}

// --- Swimmer poses (SwimmerJoints: TAIL, NECK) ---

export const SWIMMER_IDLE_POSE: PoseDefinition = Object.freeze({
  name: "swimmer_idle",
  jointRotations: Object.freeze({
    TAIL: 0,
    NECK: 0,
  }),
});

export const SWIMMER_TAIL_LEFT_POSE: PoseDefinition = Object.freeze({
  name: "swimmer_tail_left",
  jointRotations: Object.freeze({
    TAIL: 0.2,
    NECK: -0.05,
  }),
});

export const SWIMMER_TAIL_RIGHT_POSE: PoseDefinition = Object.freeze({
  name: "swimmer_tail_right",
  jointRotations: Object.freeze({
    TAIL: -0.2,
    NECK: 0.05,
  }),
});

export const SWIMMER_DIVE_POSE: PoseDefinition = Object.freeze({
  name: "swimmer_dive",
  jointRotations: Object.freeze({
    TAIL: 0.3,
    NECK: -0.25,
  }),
});

export function createSwimmerTailCycle(): PoseDefinition[] {
  return [SWIMMER_IDLE_POSE, SWIMMER_TAIL_LEFT_POSE, SWIMMER_IDLE_POSE, SWIMMER_TAIL_RIGHT_POSE];
}

/** Aggregated pose libraries per entity type, matching Java pattern. */
export const FlyerPoseLibrary = Object.freeze({
  REST: FLYER_REST_POSE,
  GLIDE: FLYER_GLIDE_POSE,
  FLAP_UP: FLYER_FLAP_UP_POSE,
  FLAP_DOWN: FLYER_FLAP_DOWN_POSE,
  LAND: FLYER_LAND_POSE,
} as const);

export const QuadrupedPoseLibrary = Object.freeze({
  STAND: QUADRUPED_STAND_POSE,
  SIT: QUADRUPED_SIT_POSE,
  TROT_STRIDE: QUADRUPED_TROT_STRIDE_POSE,
  TROT_PASS: QUADRUPED_TROT_PASS_POSE,
  TROT_STRIDE_MIRROR: QUADRUPED_TROT_STRIDE_MIRROR_POSE,
} as const);

export const SlithererPoseLibrary = Object.freeze({
  STRAIGHT: SLITHERER_STRAIGHT_POSE,
  S_CURVE_LEFT: SLITHERER_S_CURVE_LEFT_POSE,
  S_CURVE_RIGHT: SLITHERER_S_CURVE_RIGHT_POSE,
} as const);

export const SwimmerPoseLibrary = Object.freeze({
  IDLE: SWIMMER_IDLE_POSE,
  TAIL_LEFT: SWIMMER_TAIL_LEFT_POSE,
  TAIL_RIGHT: SWIMMER_TAIL_RIGHT_POSE,
  DIVE: SWIMMER_DIVE_POSE,
} as const);

export function getPoseCycle(entityType: string): PoseDefinition[] {
  switch (entityType) {
    case "flyer": return createFlyerFlapCycle();
    case "quadruped": return createQuadrupedTrotCycle();
    case "slitherer": return createSlithererCycle();
    case "swimmer": return createSwimmerTailCycle();
    default: return createWalkCycle();
  }
}
