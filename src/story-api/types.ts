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

/** 3D vector — used by BoundingBox corners and JointNode.localTransform.position. Structurally identical to Position. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Axis-aligned bounding box with min/max corners. */
export interface BoundingBox {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** Node in a skeleton joint hierarchy tree. */
export interface JointNode {
  readonly name: string;
  readonly parentName: string | null;
  readonly children: JointNode[];
  readonly localTransform: {
    readonly position: Vec3;
    readonly orientation: Orientation;
  };
}
