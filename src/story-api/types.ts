/** 3D position in Alice's Y-up coordinate system. */
export interface Position {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Quaternion orientation. */
export interface Orientation {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

/** Axis-aligned bounding size. */
export interface Size {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** Identifies a joint in a jointed model's skeleton hierarchy. */
export interface JointId {
  readonly name: string;
  readonly parent?: string;
}
