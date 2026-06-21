import type {
  JointNode,
  JointId as StoryJointId,
  Orientation,
  Position,
  SJointedModel,
} from "./story-api";

export interface JointTransform {
  readonly position: Position;
  readonly orientation: Orientation;
}

export interface JointLimit {
  readonly min?: number;
  readonly max?: number;
}

export interface JointLimits {
  readonly pitch?: JointLimit;
  readonly yaw?: JointLimit;
  readonly roll?: JointLimit;
}

export interface JointVisualSegment {
  readonly joint: JointId;
  readonly from: Position;
  readonly to: Position;
}

const ZERO_POSITION: Position = { x: 0, y: 0, z: 0 };
const IDENTITY_ORIENTATION: Orientation = { x: 0, y: 0, z: 0, w: 1 };

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
}

function addPosition(left: Position, right: Position): Position {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtractPosition(left: Position, right: Position): Position {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function scalePosition(position: Position, scalar: number): Position {
  return { x: position.x * scalar, y: position.y * scalar, z: position.z * scalar };
}

function magnitude(position: Position): number {
  return Math.hypot(position.x, position.y, position.z);
}

function distance(left: Position, right: Position): number {
  return magnitude(subtractPosition(left, right));
}

function normalize(position: Position): Position {
  const length = magnitude(position);
  return length > 0 ? scalePosition(position, 1 / length) : ZERO_POSITION;
}

function quaternionMultiply(left: Orientation, right: Orientation): Orientation {
  return normalizeQuaternion({
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
  });
}

function normalizeQuaternion(orientation: Orientation): Orientation {
  const length = Math.hypot(orientation.x, orientation.y, orientation.z, orientation.w);
  if (length === 0) {
    return IDENTITY_ORIENTATION;
  }
  return {
    x: orientation.x / length,
    y: orientation.y / length,
    z: orientation.z / length,
    w: orientation.w / length,
  };
}

function orientationFromDirection(direction: Position): Orientation {
  const normalized = normalize(direction);
  if (magnitude(normalized) === 0) {
    return IDENTITY_ORIENTATION;
  }
  const yaw = Math.atan2(normalized.x, -normalized.z);
  const pitch = Math.atan2(normalized.y, Math.hypot(normalized.x, normalized.z));
  const yawHalf = yaw * 0.5;
  const pitchHalf = pitch * 0.5;
  return normalizeQuaternion({
    x: Math.sin(pitchHalf) * Math.cos(yawHalf),
    y: Math.cos(pitchHalf) * Math.sin(yawHalf),
    z: -Math.sin(pitchHalf) * Math.sin(yawHalf),
    w: Math.cos(pitchHalf) * Math.cos(yawHalf),
  });
}

function copyTransform(transform?: Partial<JointTransform>): JointTransform {
  return {
    position: clonePosition(transform?.position ?? ZERO_POSITION),
    orientation: cloneOrientation(transform?.orientation ?? IDENTITY_ORIENTATION),
  };
}

export class JointId {
  readonly parentChain: readonly string[];

  constructor(readonly name: string, parentChain: readonly string[] = []) {
    this.parentChain = [...parentChain];
  }

  get path(): readonly string[] {
    return [...this.parentChain, this.name];
  }

  child(name: string): JointId {
    return new JointId(name, this.path);
  }

  isAncestorOf(other: JointId): boolean {
    return this.path.every((segment, index) => other.path[index] === segment) && this.path.length < other.path.length;
  }

  toStoryApiJointId(): StoryJointId {
    const parent = this.parentChain[this.parentChain.length - 1];
    return parent ? { name: this.name, parent } : { name: this.name };
  }

  toString(): string {
    return this.path.join("/");
  }

  static fromPath(path: readonly string[]): JointId {
    if (path.length === 0) {
      throw new TypeError("joint path must contain at least one segment");
    }
    return new JointId(path[path.length - 1], path.slice(0, -1));
  }
}

export class JointImplementation {
  ikTarget: Position | null = null;
  readonly children: JointImplementation[] = [];

  localPosition: Position;
  localOrientation: Orientation;

  constructor(
    readonly id: JointId,
    transform: JointTransform = copyTransform(),
    readonly parent: JointImplementation | null = null,
    readonly limits: JointLimits = {},
  ) {
    this.localPosition = clonePosition(transform.position);
    this.localOrientation = cloneOrientation(transform.orientation);
    this.parent?.children.push(this);
  }

  get worldPosition(): Position {
    return this.parent ? addPosition(this.parent.worldPosition, this.localPosition) : clonePosition(this.localPosition);
  }

  get worldOrientation(): Orientation {
    return this.parent
      ? quaternionMultiply(this.parent.worldOrientation, this.localOrientation)
      : cloneOrientation(this.localOrientation);
  }

  get lengthToParent(): number {
    return magnitude(this.localPosition);
  }

  setIkTarget(target: Position | null): this {
    this.ikTarget = target ? clonePosition(target) : null;
    return this;
  }

  pointToward(target: Position): void {
    this.localOrientation = orientationFromDirection(subtractPosition(target, this.worldPosition));
    this.ikTarget = clonePosition(target);
  }
}

export class JointChain {
  readonly joints: readonly JointImplementation[];

  constructor(joints: readonly JointImplementation[]) {
    if (joints.length < 2) {
      throw new TypeError("joint chain requires at least two joints");
    }
    this.joints = [...joints];
  }

  get root(): JointImplementation {
    return this.joints[0];
  }

  get endEffector(): JointImplementation {
    return this.joints[this.joints.length - 1];
  }

  endEffectorDistanceTo(target: Position): number {
    return distance(this.endEffector.worldPosition, target);
  }

  solveCcd(target: Position, iterations = 8, tolerance = 1e-3): number {
    return this.solveFabrik(target, iterations, tolerance);
  }

  solveFabrik(target: Position, iterations = 8, tolerance = 1e-3): number {
    const targetPosition = clonePosition(target);
    const positions = this.joints.map((joint) => joint.worldPosition);
    const lengths = this.joints.slice(1).map((joint) => joint.lengthToParent);
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    const rootPosition = positions[0];

    if (distance(rootPosition, targetPosition) >= totalLength) {
      const direction = normalize(subtractPosition(targetPosition, rootPosition));
      positions[0] = rootPosition;
      for (let index = 1; index < positions.length; index += 1) {
        positions[index] = addPosition(positions[index - 1], scalePosition(direction, lengths[index - 1]));
      }
      this.#applyPositions(positions);
      return this.endEffectorDistanceTo(targetPosition);
    }

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      positions[positions.length - 1] = targetPosition;
      for (let index = positions.length - 2; index >= 0; index -= 1) {
        const direction = normalize(subtractPosition(positions[index], positions[index + 1]));
        positions[index] = addPosition(positions[index + 1], scalePosition(direction, lengths[index]));
      }
      positions[0] = rootPosition;
      for (let index = 1; index < positions.length; index += 1) {
        const direction = normalize(subtractPosition(positions[index], positions[index - 1]));
        positions[index] = addPosition(positions[index - 1], scalePosition(direction, lengths[index - 1]));
      }
      if (distance(positions[positions.length - 1], targetPosition) <= tolerance) {
        break;
      }
    }

    this.#applyPositions(positions);
    return this.endEffectorDistanceTo(targetPosition);
  }

  #applyPositions(worldPositions: readonly Position[]): void {
    for (const [index, joint] of this.joints.entries()) {
      const parent = joint.parent;
      const worldPosition = worldPositions[index];
      joint.localPosition = parent ? subtractPosition(worldPosition, parent.worldPosition) : clonePosition(worldPosition);
      if (index < worldPositions.length - 1) {
        joint.pointToward(worldPositions[index + 1]);
      }
    }
  }
}

export class JointedModelResource {
  readonly hierarchy: readonly JointNode[];
  readonly jointLimits: Readonly<Record<string, JointLimits>>;
  readonly bindPose: Readonly<Record<string, JointTransform>>;

  constructor(
    readonly name: string,
    hierarchy: readonly JointNode[],
    jointLimits: Readonly<Record<string, JointLimits>> = {},
  ) {
    this.hierarchy = JSON.parse(JSON.stringify(hierarchy)) as JointNode[];
    this.jointLimits = { ...jointLimits };
    this.bindPose = Object.freeze(Object.fromEntries(this.listJointIds().map((jointId) => {
      const node = this.#findNode(jointId.name);
      return [jointId.name, copyTransform(node?.localTransform)];
    })));
  }

  listJointIds(): JointId[] {
    const ids: JointId[] = [];
    const visit = (nodes: readonly JointNode[], ancestry: readonly string[]): void => {
      for (const node of nodes) {
        ids.push(new JointId(node.name, ancestry));
        visit(node.children, [...ancestry, node.name]);
      }
    };
    visit(this.hierarchy, []);
    return ids;
  }

  getJointId(name: string): JointId | undefined {
    return this.listJointIds().find((jointId) => jointId.name === name);
  }

  createImplementationMap(): ReadonlyMap<string, JointImplementation> {
    const implementations = new Map<string, JointImplementation>();
    const visit = (nodes: readonly JointNode[], parent: JointImplementation | null, ancestry: readonly string[]): void => {
      for (const node of nodes) {
        const jointId = new JointId(node.name, ancestry);
        const implementation = new JointImplementation(
          jointId,
          copyTransform(node.localTransform),
          parent,
          this.jointLimits[node.name] ?? {},
        );
        implementations.set(node.name, implementation);
        visit(node.children, implementation, [...ancestry, node.name]);
      }
    };
    visit(this.hierarchy, null, []);
    return implementations;
  }

  createChain(...jointNames: string[]): JointChain {
    const implementations = this.createImplementationMap();
    const joints = jointNames.map((name) => {
      const joint = implementations.get(name);
      if (!joint) {
        throw new TypeError(`unknown joint ${name}`);
      }
      return joint;
    });
    return new JointChain(joints);
  }

  #findNode(name: string): JointNode | undefined {
    const stack = [...this.hierarchy];
    while (stack.length > 0) {
      const current = stack.shift()!;
      if (current.name === name) {
        return current;
      }
      stack.unshift(...current.children);
    }
    return undefined;
  }
}

export function createJointedModelResource(
  name: string,
  hierarchy: readonly JointNode[],
  jointLimits: Readonly<Record<string, JointLimits>> = {},
): JointedModelResource {
  return new JointedModelResource(name, hierarchy, jointLimits);
}

export function createJointedModelResourceFromModel(
  name: string,
  model: SJointedModel,
  jointLimits: Readonly<Record<string, JointLimits>> = {},
): JointedModelResource {
  return new JointedModelResource(name, model.getJointHierarchy(), jointLimits);
}

export class JointVisualizer {
  readonly resource: JointedModelResource;

  constructor(resourceOrModel: JointedModelResource | SJointedModel, name = "JointedModel") {
    this.resource = resourceOrModel instanceof JointedModelResource
      ? resourceOrModel
      : createJointedModelResourceFromModel(name, resourceOrModel);
  }

  buildSegments(): JointVisualSegment[] {
    const implementations = this.resource.createImplementationMap();
    return [...implementations.values()]
      .filter((joint) => joint.parent)
      .map((joint) => ({
        joint: joint.id,
        from: joint.parent!.worldPosition,
        to: joint.worldPosition,
      }));
  }
}

export const BipedJoints = Object.freeze({
  ROOT: new JointId("ROOT"),
  PELVIS: new JointId("PELVIS_LOWER_BODY", ["ROOT"]),
  SPINE_BASE: new JointId("SPINE_BASE", ["ROOT"]),
  SPINE_UPPER: new JointId("SPINE_UPPER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE"]),
  HEAD: new JointId("HEAD", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "NECK"]),
  LEFT_SHOULDER: new JointId("LEFT_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "LEFT_CLAVICLE"]),
  LEFT_HAND: new JointId("LEFT_HAND", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"]),
  RIGHT_SHOULDER: new JointId("RIGHT_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "RIGHT_CLAVICLE"]),
  RIGHT_HAND: new JointId("RIGHT_HAND", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "RIGHT_CLAVICLE", "RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"]),
  LEFT_HIP: new JointId("LEFT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
  RIGHT_HIP: new JointId("RIGHT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
} as const);

export const QuadrupedJoints = Object.freeze({
  ROOT: new JointId("ROOT"),
  SPINE_UPPER: new JointId("SPINE_UPPER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE"]),
  HEAD: new JointId("HEAD", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "NECK"]),
  FRONT_LEFT_SHOULDER: new JointId("FRONT_LEFT_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "FRONT_LEFT_CLAVICLE"]),
  FRONT_RIGHT_SHOULDER: new JointId("FRONT_RIGHT_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "FRONT_RIGHT_CLAVICLE"]),
  BACK_LEFT_HIP: new JointId("BACK_LEFT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
  BACK_RIGHT_HIP: new JointId("BACK_RIGHT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
  TAIL: new JointId("TAIL_0", ["ROOT", "PELVIS_LOWER_BODY"]),
} as const);

export const FlyerJoints = Object.freeze({
  ROOT: new JointId("ROOT"),
  SPINE_UPPER: new JointId("SPINE_UPPER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE"]),
  HEAD: new JointId("HEAD", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "NECK_0", "NECK_1"]),
  LEFT_WING_SHOULDER: new JointId("LEFT_WING_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER"]),
  RIGHT_WING_SHOULDER: new JointId("RIGHT_WING_SHOULDER", ["ROOT", "SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER"]),
  TAIL: new JointId("TAIL_0", ["ROOT", "PELVIS_LOWER_BODY"]),
  LEFT_HIP: new JointId("LEFT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
  RIGHT_HIP: new JointId("RIGHT_HIP", ["ROOT", "PELVIS_LOWER_BODY"]),
} as const);

export type JointAnimationStyle = "traditional" | "gentle" | "abrupt" | "linear";

export interface JointArrayDefinition {
  readonly name: string;
  readonly joints: readonly string[];
}

export interface JointPoseInput {
  readonly objectName: string;
  readonly poseName?: string;
  readonly joints: Record<string, Partial<JointTransform>>;
}

export interface JointAnimationTarget {
  readonly jointName?: string;
  readonly jointArray?: string;
}

export interface JointAnimationInput {
  readonly objectName: string;
  readonly target: JointAnimationTarget;
  readonly to: Partial<JointTransform>;
  readonly durationMs: number;
  readonly style?: JointAnimationStyle;
  readonly evidenceLabel?: string;
}

export interface QueuedJointAnimation {
  readonly animationId: string;
  readonly target:
    | { readonly jointName: string }
    | { readonly jointArray: string };
  readonly resolvedJoints: readonly string[];
  readonly durationMs: number;
  readonly style?: JointAnimationStyle;
  readonly evidenceLabel?: string;
  readonly to: Partial<JointTransform>;
}

export interface JointStateObjectSnapshot {
  readonly className: string;
  readonly joints: Record<string, {
    readonly parentName: string | null;
    readonly bindTransform: JointTransform;
    readonly currentTransform: JointTransform;
  }>;
  readonly jointArrays: Record<string, readonly string[]>;
  readonly poses: Record<string, Record<string, Partial<JointTransform>>>;
  readonly pendingAnimations: readonly QueuedJointAnimation[];
}

export interface JointStateSnapshot {
  readonly schema_version: "alice.joint-state/v1";
  readonly runtime: "alice-web";
  readonly objects: Record<string, JointStateObjectSnapshot>;
}

export interface ExecutedJointAnimation extends QueuedJointAnimation {
  readonly objectName: string;
  readonly status: "executed";
}

export interface JointRuntimeVerification {
  readonly status: "verified" | "not-applicable";
  readonly sidecarArtifact: string;
  readonly objects: Record<string, {
    readonly verifiedArrays: readonly string[];
    readonly verifiedJoints: readonly string[];
    readonly finalPose: Record<string, Partial<JointTransform>>;
  }>;
}

export class UnknownJointError extends Error {
  constructor(
    readonly objectName: string,
    readonly unknownJoints: readonly string[],
    readonly availableJoints: readonly string[],
  ) {
    super(`Unknown joint names for ${objectName}: ${unknownJoints.join(", ")}`);
    this.name = "UnknownJointError";
  }
}

export class UnknownJointArrayError extends Error {
  constructor(
    readonly objectName: string,
    readonly jointArray: string,
    readonly availableJointArrays: readonly string[],
  ) {
    super(`Unknown joint array for ${objectName}: ${jointArray}`);
    this.name = "UnknownJointArrayError";
  }
}

type StoredJoint = {
  parentName: string | null;
  bindTransform: JointTransform;
  currentTransform: JointTransform;
};

type StoredObject = {
  className: string;
  joints: Map<string, StoredJoint>;
  canonicalByUpperName: Map<string, string>;
  aliases: Map<string, string>;
  jointArrays: Map<string, string[]>;
  poses: Map<string, Record<string, Partial<JointTransform>>>;
  pendingAnimations: QueuedJointAnimation[];
};

const BIPED_JOINT_ALIASES = new Map<string, string>([
  ["PELVIS", "PELVIS_LOWER_BODY"],
  ["SPINE", "SPINE_BASE"],
  ["CHEST", "SPINE_UPPER"],
]);

export const BipedJointArrays: Readonly<Record<string, readonly string[]>> = Object.freeze({
  leftArm: Object.freeze(["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"]),
  rightArm: Object.freeze(["RIGHT_CLAVICLE", "RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST", "RIGHT_HAND"]),
  leftLeg: Object.freeze(["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE", "LEFT_FOOT"]),
  rightLeg: Object.freeze(["RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE", "RIGHT_FOOT"]),
  spine: Object.freeze(["SPINE_BASE", "SPINE_MIDDLE", "SPINE_UPPER", "NECK", "HEAD"]),
});

function defaultJoint(name: string, parentName: string | null, children: JointNode[] = []): JointNode {
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

const DEFAULT_BIPED_HIERARCHY: readonly JointNode[] = Object.freeze([
  defaultJoint("ROOT", null, [
    defaultJoint("PELVIS_LOWER_BODY", "ROOT", [
      defaultJoint("LEFT_HIP", "PELVIS_LOWER_BODY", [
        defaultJoint("LEFT_KNEE", "LEFT_HIP", [
          defaultJoint("LEFT_ANKLE", "LEFT_KNEE", [
            defaultJoint("LEFT_FOOT", "LEFT_ANKLE"),
          ]),
        ]),
      ]),
      defaultJoint("RIGHT_HIP", "PELVIS_LOWER_BODY", [
        defaultJoint("RIGHT_KNEE", "RIGHT_HIP", [
          defaultJoint("RIGHT_ANKLE", "RIGHT_KNEE", [
            defaultJoint("RIGHT_FOOT", "RIGHT_ANKLE"),
          ]),
        ]),
      ]),
    ]),
    defaultJoint("SPINE_BASE", "ROOT", [
      defaultJoint("SPINE_MIDDLE", "SPINE_BASE", [
        defaultJoint("SPINE_UPPER", "SPINE_MIDDLE", [
          defaultJoint("NECK", "SPINE_UPPER", [
            defaultJoint("HEAD", "NECK", [
              defaultJoint("MOUTH", "HEAD"),
              defaultJoint("LEFT_EYE", "HEAD"),
              defaultJoint("RIGHT_EYE", "HEAD"),
              defaultJoint("LEFT_EYELID", "HEAD"),
              defaultJoint("RIGHT_EYELID", "HEAD"),
            ]),
          ]),
          defaultJoint("RIGHT_CLAVICLE", "SPINE_UPPER", [
            defaultJoint("RIGHT_SHOULDER", "RIGHT_CLAVICLE", [
              defaultJoint("RIGHT_ELBOW", "RIGHT_SHOULDER", [
                defaultJoint("RIGHT_WRIST", "RIGHT_ELBOW", [
                  defaultJoint("RIGHT_HAND", "RIGHT_WRIST", [
                    defaultJoint("RIGHT_THUMB", "RIGHT_HAND", [defaultJoint("RIGHT_THUMB_KNUCKLE", "RIGHT_THUMB")]),
                    defaultJoint("RIGHT_INDEX_FINGER", "RIGHT_HAND", [defaultJoint("RIGHT_INDEX_FINGER_KNUCKLE", "RIGHT_INDEX_FINGER")]),
                    defaultJoint("RIGHT_MIDDLE_FINGER", "RIGHT_HAND", [defaultJoint("RIGHT_MIDDLE_FINGER_KNUCKLE", "RIGHT_MIDDLE_FINGER")]),
                    defaultJoint("RIGHT_PINKY_FINGER", "RIGHT_HAND", [defaultJoint("RIGHT_PINKY_FINGER_KNUCKLE", "RIGHT_PINKY_FINGER")]),
                  ]),
                ]),
              ]),
            ]),
          ]),
          defaultJoint("LEFT_CLAVICLE", "SPINE_UPPER", [
            defaultJoint("LEFT_SHOULDER", "LEFT_CLAVICLE", [
              defaultJoint("LEFT_ELBOW", "LEFT_SHOULDER", [
                defaultJoint("LEFT_WRIST", "LEFT_ELBOW", [
                  defaultJoint("LEFT_HAND", "LEFT_WRIST", [
                    defaultJoint("LEFT_THUMB", "LEFT_HAND", [defaultJoint("LEFT_THUMB_KNUCKLE", "LEFT_THUMB")]),
                    defaultJoint("LEFT_INDEX_FINGER", "LEFT_HAND", [defaultJoint("LEFT_INDEX_FINGER_KNUCKLE", "LEFT_INDEX_FINGER")]),
                    defaultJoint("LEFT_MIDDLE_FINGER", "LEFT_HAND", [defaultJoint("LEFT_MIDDLE_FINGER_KNUCKLE", "LEFT_MIDDLE_FINGER")]),
                    defaultJoint("LEFT_PINKY_FINGER", "LEFT_HAND", [defaultJoint("LEFT_PINKY_FINGER_KNUCKLE", "LEFT_PINKY_FINGER")]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
]);

const DEFAULT_PROP_HIERARCHY: readonly JointNode[] = Object.freeze([
  defaultJoint("ROOT", null, [
    defaultJoint("BODY", "ROOT"),
    defaultJoint("HANDLE", "ROOT"),
    defaultJoint("MARKER", "ROOT"),
  ]),
]);

export function defaultJointHierarchyForClassName(className: string): JointNode[] | null {
  if (isBipedClassName(className)) {
    return copyJointHierarchy(DEFAULT_BIPED_HIERARCHY);
  }
  if (className.endsWith(".SProp") || className === "SProp") {
    return copyJointHierarchy(DEFAULT_PROP_HIERARCHY);
  }
  return null;
}

let nextAnimationSequence = 1;

function cloneTransform(transform: JointTransform): JointTransform {
  return {
    position: clonePosition(transform.position),
    orientation: cloneOrientation(transform.orientation),
  };
}

function clonePartialTransform(transform: Partial<JointTransform>): Partial<JointTransform> {
  return {
    ...(transform.position ? { position: clonePosition(transform.position) } : {}),
    ...(transform.orientation ? { orientation: cloneOrientation(transform.orientation) } : {}),
  };
}

function copyJointHierarchy(nodes: readonly JointNode[]): JointNode[] {
  return nodes.map((node) => ({
    name: node.name,
    parentName: node.parentName,
    children: copyJointHierarchy(node.children),
    localTransform: cloneTransform(copyTransform(node.localTransform)),
  }));
}

function flattenJointHierarchy(nodes: readonly JointNode[]): JointNode[] {
  const flattened: JointNode[] = [];
  const visit = (entries: readonly JointNode[]): void => {
    for (const entry of entries) {
      flattened.push(entry);
      visit(entry.children);
    }
  };
  visit(nodes);
  return flattened;
}

function isBipedClassName(className: string): boolean {
  return className.endsWith(".SBiped") || className === "SBiped";
}

function animationTargetKey(target: JointAnimationTarget): "jointName" | "jointArray" | null {
  const hasJointName = typeof target.jointName === "string";
  const hasJointArray = typeof target.jointArray === "string";
  if (hasJointName === hasJointArray) {
    return null;
  }
  return hasJointName ? "jointName" : "jointArray";
}

function ensureNonEmptyString(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
  return trimmed;
}

export class JointStateStore {
  readonly #objects = new Map<string, StoredObject>();

  hasObject(objectName: string): boolean {
    return this.#objects.has(objectName);
  }

  registerObject(input: {
    readonly objectName: string;
    readonly className: string;
    readonly hierarchy: readonly JointNode[];
  }): void {
    const objectName = ensureNonEmptyString(input.objectName, "objectName");
    const className = ensureNonEmptyString(input.className, "className");
    const hierarchy = copyJointHierarchy(input.hierarchy);
    const flattened = flattenJointHierarchy(hierarchy);
    if (flattened.length === 0) {
      throw new TypeError(`jointed object ${objectName} must declare at least one joint`);
    }

    const joints = new Map<string, StoredJoint>();
    const canonicalByUpperName = new Map<string, string>();
    for (const node of flattened) {
      const canonicalName = ensureNonEmptyString(node.name, "joint name");
      const upperName = canonicalName.toUpperCase();
      if (canonicalByUpperName.has(upperName)) {
        throw new TypeError(`duplicate joint name for ${objectName}: ${canonicalName}`);
      }
      const bindTransform = copyTransform(node.localTransform);
      canonicalByUpperName.set(upperName, canonicalName);
      joints.set(canonicalName, {
        parentName: node.parentName,
        bindTransform,
        currentTransform: cloneTransform(bindTransform),
      });
    }

    const aliases = new Map<string, string>();
    if (isBipedClassName(className)) {
      for (const [alias, canonical] of BIPED_JOINT_ALIASES) {
        if (canonicalByUpperName.has(canonical.toUpperCase())) {
          aliases.set(alias, canonical);
        }
      }
    }

    const object: StoredObject = {
      className,
      joints,
      canonicalByUpperName,
      aliases,
      jointArrays: new Map(),
      poses: new Map(),
      pendingAnimations: [],
    };
    this.#objects.set(objectName, object);

    if (isBipedClassName(className)) {
      for (const [name, jointNames] of Object.entries(BipedJointArrays)) {
        this.defineJointArray({ objectName, name, joints: jointNames });
      }
    }
  }

  defineJointArray(input: {
    readonly objectName: string;
    readonly name: string;
    readonly joints: readonly string[];
  }): void {
    const object = this.#requireObject(input.objectName);
    const name = ensureNonEmptyString(input.name, "joint array name");
    if (input.joints.length === 0) {
      throw new TypeError(`joint array ${name} for ${input.objectName} must include at least one joint`);
    }
    const resolvedJoints = this.#resolveJointNames(input.objectName, object, input.joints);
    object.jointArrays.set(name, resolvedJoints);
  }

  applyPose(input: JointPoseInput): readonly string[] {
    const object = this.#requireObject(input.objectName);
    const entries = Object.entries(input.joints);
    if (entries.length === 0) {
      throw new TypeError(`pose for ${input.objectName} must include at least one joint`);
    }

    const canonicalEntries = entries.map(([jointName, transform]) =>
      [this.#resolveJointName(input.objectName, object, jointName), clonePartialTransform(transform)] as const,
    );

    for (const [jointName, transform] of canonicalEntries) {
      const joint = object.joints.get(jointName)!;
      joint.currentTransform = {
        position: transform.position ? clonePosition(transform.position) : clonePosition(joint.currentTransform.position),
        orientation: transform.orientation ? cloneOrientation(transform.orientation) : cloneOrientation(joint.currentTransform.orientation),
      };
    }

    if (input.poseName !== undefined) {
      const poseName = ensureNonEmptyString(input.poseName, "poseName");
      object.poses.set(poseName, Object.fromEntries(canonicalEntries));
    }

    return canonicalEntries.map(([jointName]) => jointName);
  }

  queueAnimation(input: JointAnimationInput): { readonly animationId: string; readonly resolvedJoints: readonly string[] } {
    const object = this.#requireObject(input.objectName);
    const targetKey = animationTargetKey(input.target);
    if (!targetKey) {
      throw new TypeError("animation target must specify exactly one of jointName or jointArray");
    }
    if (!Number.isFinite(input.durationMs) || input.durationMs < 0) {
      throw new TypeError("durationMs must be a non-negative finite number");
    }
    if (!input.to.position && !input.to.orientation) {
      throw new TypeError("animation target transform must include position or orientation");
    }

    const target: QueuedJointAnimation["target"] = targetKey === "jointName"
      ? { jointName: this.#resolveJointName(input.objectName, object, input.target.jointName!) }
      : { jointArray: ensureNonEmptyString(input.target.jointArray!, "jointArray") };
    const resolvedJoints = "jointName" in target
      ? [target.jointName]
      : this.#resolveJointArray(input.objectName, object, target.jointArray);
    const animationId = `joint-animation-${nextAnimationSequence++}`;
    const queuedAnimation: QueuedJointAnimation = {
      animationId,
      target,
      resolvedJoints,
      durationMs: input.durationMs,
      ...(input.style !== undefined ? { style: input.style } : {}),
      ...(input.evidenceLabel !== undefined ? { evidenceLabel: input.evidenceLabel } : {}),
      to: clonePartialTransform(input.to),
    };

    object.pendingAnimations.push(queuedAnimation);
    return { animationId, resolvedJoints };
  }

  getObjectSnapshot(objectName: string): JointStateObjectSnapshot | null {
    const object = this.#objects.get(objectName);
    return object ? this.#snapshotObject(object) : null;
  }

  listObjectNames(): readonly string[] {
    return [...this.#objects.keys()];
  }

  executePendingAnimations(sidecarArtifact: string): {
    readonly animations: readonly ExecutedJointAnimation[];
    readonly verification: JointRuntimeVerification;
  } {
    const animations: ExecutedJointAnimation[] = [];
    const verificationObjects: JointRuntimeVerification["objects"] = {};

    for (const [objectName, object] of this.#objects) {
      const pending = object.pendingAnimations.splice(0);
      const verifiedJoints = new Set<string>();
      const verifiedArrays = new Set<string>();
      const finalPose: Record<string, Partial<JointTransform>> = {};

      for (const animation of pending) {
        for (const jointName of animation.resolvedJoints) {
          const joint = object.joints.get(jointName);
          if (!joint) {
            throw new UnknownJointError(objectName, [jointName], this.#availableJoints(object));
          }
          joint.currentTransform = {
            position: animation.to.position ? clonePosition(animation.to.position) : clonePosition(joint.currentTransform.position),
            orientation: animation.to.orientation ? cloneOrientation(animation.to.orientation) : cloneOrientation(joint.currentTransform.orientation),
          };
          verifiedJoints.add(jointName);
          finalPose[jointName] = cloneTransform(joint.currentTransform);
        }
        if ("jointArray" in animation.target) {
          verifiedArrays.add(animation.target.jointArray);
        }
        animations.push({
          ...animation,
          objectName,
          status: "executed",
        });
      }

      if (verifiedJoints.size > 0 || verifiedArrays.size > 0) {
        verificationObjects[objectName] = {
          verifiedArrays: [...verifiedArrays],
          verifiedJoints: [...verifiedJoints],
          finalPose,
        };
      }
    }

    return {
      animations,
      verification: {
        status: animations.length > 0 ? "verified" : "not-applicable",
        sidecarArtifact,
        objects: verificationObjects,
      },
    };
  }

  toJSON(): JointStateSnapshot {
    return {
      schema_version: "alice.joint-state/v1",
      runtime: "alice-web",
      objects: Object.fromEntries(
        [...this.#objects.entries()].map(([objectName, object]) => [objectName, this.#snapshotObject(object)]),
      ),
    };
  }

  #requireObject(objectName: string): StoredObject {
    const object = this.#objects.get(objectName);
    if (!object) {
      throw new TypeError(`Unknown jointed object: ${objectName}`);
    }
    return object;
  }

  #resolveJointNames(objectName: string, object: StoredObject, jointNames: readonly string[]): string[] {
    const resolved: string[] = [];
    const unknown: string[] = [];
    for (const jointName of jointNames) {
      const resolvedName = this.#tryResolveJointName(object, jointName);
      if (resolvedName) {
        resolved.push(resolvedName);
      } else {
        unknown.push(jointName);
      }
    }
    if (unknown.length > 0) {
      throw new UnknownJointError(objectName, unknown, this.#availableJoints(object));
    }
    return resolved;
  }

  #resolveJointName(objectName: string, object: StoredObject, jointName: string): string {
    const resolvedName = this.#tryResolveJointName(object, jointName);
    if (!resolvedName) {
      throw new UnknownJointError(objectName, [jointName], this.#availableJoints(object));
    }
    return resolvedName;
  }

  #tryResolveJointName(object: StoredObject, jointName: string): string | null {
    const requested = ensureNonEmptyString(jointName, "joint name").toUpperCase();
    const aliased = object.aliases.get(requested) ?? requested;
    return object.canonicalByUpperName.get(aliased.toUpperCase()) ?? null;
  }

  #resolveJointArray(objectName: string, object: StoredObject, jointArray: string): readonly string[] {
    const resolved = object.jointArrays.get(jointArray);
    if (!resolved) {
      throw new UnknownJointArrayError(objectName, jointArray, [...object.jointArrays.keys()]);
    }
    return [...resolved];
  }

  #availableJoints(object: StoredObject): readonly string[] {
    return [...object.joints.keys()];
  }

  #snapshotObject(object: StoredObject): JointStateObjectSnapshot {
    return {
      className: object.className,
      joints: Object.fromEntries(
        [...object.joints.entries()].map(([jointName, joint]) => [
          jointName,
          {
            parentName: joint.parentName,
            bindTransform: cloneTransform(joint.bindTransform),
            currentTransform: cloneTransform(joint.currentTransform),
          },
        ]),
      ),
      jointArrays: Object.fromEntries(
        [...object.jointArrays.entries()].map(([arrayName, joints]) => [arrayName, [...joints]]),
      ),
      poses: Object.fromEntries(
        [...object.poses.entries()].map(([poseName, joints]) => [
          poseName,
          Object.fromEntries(
            Object.entries(joints).map(([jointName, transform]) => [jointName, clonePartialTransform(transform)]),
          ),
        ]),
      ),
      pendingAnimations: object.pendingAnimations.map((animation) => ({
        ...animation,
        resolvedJoints: [...animation.resolvedJoints],
        to: clonePartialTransform(animation.to),
      })),
    };
  }
}
