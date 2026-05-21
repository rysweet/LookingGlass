import { EntityImp, JointedModelImp, type Property } from "./implementation";
import type { JointId, JointNode, Orientation, Position, Size } from "./types";

const ZERO_POSITION: Position = { x: 0, y: 0, z: 0 };
const IDENTITY_ORIENTATION: Orientation = { x: 0, y: 0, z: 0, w: 1 };
const UNIT_SIZE: Size = { width: 1, height: 1, depth: 1 };

type EntityImpConstructor = new (owner: SThing) => EntityImp;

function clonePosition(value: Position): Position {
  return { ...value };
}

function cloneOrientation(value: Orientation): Orientation {
  return { ...value };
}

function cloneSize(value: Size): Size {
  return { ...value };
}

function samePosition(left: Position, right: Position): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

function sameOrientation(left: Orientation, right: Orientation): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.z === right.z &&
    left.w === right.w
  );
}

function sameSize(left: Size, right: Size): boolean {
  return (
    left.width === right.width &&
    left.height === right.height &&
    left.depth === right.depth
  );
}

function isFinitePosition(value: Position): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function isFiniteOrientation(value: Orientation): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z) &&
    Number.isFinite(value.w)
  );
}

function isFiniteSize(value: Size): boolean {
  return (
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    Number.isFinite(value.depth)
  );
}

function isNonEmptyString(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
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

const GENERIC_JOINTS: JointNode[] = [joint("ROOT", null)];

const BIPED_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("PELVIS", "ROOT", [
      joint("SPINE", "PELVIS", [
        joint("CHEST", "SPINE", [
          joint("NECK", "CHEST", [joint("HEAD", "NECK")]),
          joint("LEFT_SHOULDER", "CHEST", [
            joint("LEFT_ELBOW", "LEFT_SHOULDER", [joint("LEFT_HAND", "LEFT_ELBOW")]),
          ]),
          joint("RIGHT_SHOULDER", "CHEST", [
            joint("RIGHT_ELBOW", "RIGHT_SHOULDER", [joint("RIGHT_HAND", "RIGHT_ELBOW")]),
          ]),
        ]),
      ]),
      joint("LEFT_HIP", "PELVIS", [joint("LEFT_KNEE", "LEFT_HIP", [joint("LEFT_FOOT", "LEFT_KNEE")])]),
      joint("RIGHT_HIP", "PELVIS", [joint("RIGHT_KNEE", "RIGHT_HIP", [joint("RIGHT_FOOT", "RIGHT_KNEE")])]),
    ]),
  ]),
];

const FLYER_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("BODY", "ROOT", [
      joint("HEAD", "BODY"),
      joint("LEFT_WING", "BODY"),
      joint("RIGHT_WING", "BODY"),
      joint("TAIL", "BODY"),
      joint("LEFT_LEG", "BODY"),
      joint("RIGHT_LEG", "BODY"),
    ]),
  ]),
];

const QUADRUPED_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("SPINE", "ROOT", [
      joint("NECK", "SPINE", [joint("HEAD", "NECK")]),
      joint("FRONT_LEFT_HIP", "SPINE", [joint("FRONT_LEFT_KNEE", "FRONT_LEFT_HIP")]),
      joint("FRONT_RIGHT_HIP", "SPINE", [joint("FRONT_RIGHT_KNEE", "FRONT_RIGHT_HIP")]),
      joint("BACK_LEFT_HIP", "SPINE", [joint("BACK_LEFT_KNEE", "BACK_LEFT_HIP")]),
      joint("BACK_RIGHT_HIP", "SPINE", [joint("BACK_RIGHT_KNEE", "BACK_RIGHT_HIP")]),
      joint("TAIL", "SPINE"),
    ]),
  ]),
];

const PROP_JOINTS: JointNode[] = [
  joint("ROOT", null, [joint("BODY", "ROOT"), joint("MARKER", "ROOT"), joint("HANDLE", "ROOT")]),
];

/** Base entity — visibility only, no spatial properties. */
export class SThing {
  protected readonly _imp: EntityImp;
  private readonly _isShowingProperty: Property<boolean>;

  constructor(impCtor: EntityImpConstructor = EntityImp) {
    this._imp = new impCtor(this);
    this._isShowingProperty = this._imp.createProperty("isShowing", true);
  }

  get imp(): EntityImp {
    return this._imp;
  }

  get isShowing(): boolean {
    return this._isShowingProperty.value;
  }

  set isShowing(value: boolean) {
    if (typeof value === "boolean") {
      this._isShowingProperty.value = value;
    }
  }
}

/** Ground plane — extends SThing with no additional capabilities. */
export class SGround extends SThing {}

/** Scene entity — extends SThing with no additional capabilities. */
export class SScene extends SThing {}

/** Adds orientation (quaternion) to SThing. */
export class STurnable extends SThing {
  private readonly _orientationProperty: Property<Orientation>;

  constructor(impCtor: EntityImpConstructor = EntityImp) {
    super(impCtor);
    this._orientationProperty = this.imp.createProperty("orientation", IDENTITY_ORIENTATION, {
      validate: isFiniteOrientation,
      clone: cloneOrientation,
      equals: sameOrientation,
    });
  }

  get orientation(): Orientation {
    return this._orientationProperty.value;
  }

  set orientation(value: Orientation) {
    this._orientationProperty.setValue(value);
  }
}

/** Adds position and paint to STurnable. */
export class SMovableTurnable extends STurnable {
  private readonly _positionProperty: Property<Position>;
  private readonly _paintProperty: Property<string>;

  constructor(impCtor: EntityImpConstructor = EntityImp) {
    super(impCtor);
    this._positionProperty = this.imp.createProperty("position", ZERO_POSITION, {
      validate: isFinitePosition,
      clone: clonePosition,
      equals: samePosition,
    });
    this._paintProperty = this.imp.createProperty<string>("paint", "WHITE", {
      validate: isNonEmptyString,
    });
  }

  get position(): Position {
    return this._positionProperty.value;
  }

  set position(value: Position) {
    this._positionProperty.setValue(value);
  }

  get paint(): string {
    return this._paintProperty.value;
  }

  set paint(value: string) {
    this._paintProperty.setValue(value);
  }
}

/** Camera — position + orientation, no size or joints. */
export class SCamera extends SMovableTurnable {}

/** Adds size, color, opacity, and vehicle to SMovableTurnable. */
export class SModel extends SMovableTurnable {
  private readonly _sizeProperty: Property<Size>;
  private readonly _colorProperty: Property<string>;
  private readonly _opacityProperty: Property<number>;
  private readonly _vehicleProperty: Property<SThing | null>;

  constructor(impCtor: EntityImpConstructor = EntityImp) {
    super(impCtor);
    this._sizeProperty = this.imp.createProperty("size", UNIT_SIZE, {
      validate: isFiniteSize,
      clone: cloneSize,
      equals: sameSize,
    });
    this._colorProperty = this.imp.createProperty<string>("color", "WHITE", {
      validate: isNonEmptyString,
    });
    this._opacityProperty = this.imp.createProperty<number>("opacity", 1.0, {
      validate: Number.isFinite,
    });
    this._vehicleProperty = this.imp.createProperty<SThing | null>("vehicle", null, {
      equals: (left, right) => left === right,
    });
  }

  get size(): Size {
    return this._sizeProperty.value;
  }

  set size(value: Size) {
    this._sizeProperty.setValue(value);
  }

  get color(): string {
    return this._colorProperty.value;
  }

  set color(value: string) {
    this._colorProperty.setValue(value);
  }

  get opacity(): number {
    return this._opacityProperty.value;
  }

  set opacity(value: number) {
    this._opacityProperty.setValue(value);
  }

  get vehicle(): SThing | null {
    return this._vehicleProperty.value;
  }

  set vehicle(value: SThing | null) {
    if (value === null) {
      this.imp.setVehicle(null);
      this._vehicleProperty.value = null;
      return;
    }
    if (!(value instanceof SThing)) {
      return;
    }
    this.imp.setVehicle(value.imp);
    this._vehicleProperty.value = value;
  }
}

/** Adds joint hierarchy to SModel. */
export class SJointedModel extends SModel {
  constructor(jointHierarchy: JointNode[] = GENERIC_JOINTS) {
    super(JointedModelImp);
    this.jointedModelImp.setJointHierarchy(jointHierarchy);
  }

  protected get jointedModelImp(): JointedModelImp {
    return this.imp as JointedModelImp;
  }

  getJoint(name: string): JointId | undefined {
    return this.jointedModelImp.getJoint(name);
  }

  getJointHierarchy(): JointNode[] {
    return this.jointedModelImp.jointHierarchy;
  }
}

/** Humanoid characters. */
export class SBiped extends SJointedModel {
  constructor() {
    super(BIPED_JOINTS);
  }
}

/** Flying creatures. */
export class SFlyer extends SJointedModel {
  constructor() {
    super(FLYER_JOINTS);
  }
}

/** Four-legged animals. */
export class SQuadruped extends SJointedModel {
  constructor() {
    super(QUADRUPED_JOINTS);
  }
}

/** Inanimate objects with joints. */
export class SProp extends SJointedModel {
  constructor() {
    super(PROP_JOINTS);
  }
}
