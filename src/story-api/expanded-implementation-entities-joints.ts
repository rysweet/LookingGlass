import {
  UNIT_SIZE,
  cloneOrientation,
  clonePosition,
} from "./expanded-math";
import type { JointId, JointNode, Orientation, Position } from "./expanded-types";
import {
  BooleanProperty,
  SizeProperty,
  type ImplementableEntity,
} from "./expanded-implementation-properties";
import { ModelImp, TransformableImp } from "./expanded-implementation-entities-transformable";

export class JointImp extends TransformableImp {
  readonly #jointId: JointId;
  readonly #originalTransform: { position: Position; orientation: Orientation };
  readonly size = this.registerProperty(new SizeProperty(this, "size", UNIT_SIZE));
  readonly pivotVisible = this.registerProperty(new BooleanProperty(this, "pivotVisible", false));

  constructor(owner: ImplementableEntity, jointId: JointId, localTransform: { position: Position; orientation: Orientation }) {
    super(owner);
    this.#jointId = { ...jointId };
    this.#originalTransform = {
      position: clonePosition(localTransform.position),
      orientation: cloneOrientation(localTransform.orientation),
    };
    this.name = jointId.name;
    this.position.setValue(localTransform.position);
    this.orientation.setValue(localTransform.orientation);
  }

  getJointId(): JointId {
    return { ...this.#jointId };
  }

  straighten(): void {
    this.position.setValue(this.#originalTransform.position);
    this.orientation.setValue(this.#originalTransform.orientation);
  }
}

export class JointedModelImp extends ModelImp {
  readonly #jointIds = new Map<string, JointId>();
  readonly #jointImps = new Map<string, JointImp>();
  #jointHierarchy: JointNode[] = [];

  constructor(owner: ImplementableEntity, jointHierarchy: JointNode[] = []) {
    super(owner);
    if (jointHierarchy.length > 0) {
      this.setJointHierarchy(jointHierarchy);
    }
  }

  setJointHierarchy(jointHierarchy: JointNode[]): void {
    this.#jointIds.clear();
    this.#jointImps.clear();
    this.#jointHierarchy = cloneJointHierarchy(jointHierarchy);

    const visit = (node: JointNode, parentImp: JointImp | null): void => {
      const jointId: JointId = node.parentName ? { name: node.name, parent: node.parentName } : { name: node.name };
      this.#jointIds.set(node.name.toUpperCase(), jointId);
      const jointImp = new JointImp(this.owner, jointId, node.localTransform);
      jointImp.setVehicle(parentImp ?? this);
      this.#jointImps.set(node.name.toUpperCase(), jointImp);
      for (const child of node.children) {
        visit(child, jointImp);
      }
    };

    for (const root of this.#jointHierarchy) {
      visit(root, null);
    }
  }

  getJoint(name: string): JointId | undefined {
    const joint = this.#jointIds.get(name.toUpperCase());
    return joint ? { ...joint } : undefined;
  }

  getJointImplementation(name: string): JointImp | undefined {
    return this.#jointImps.get(name.toUpperCase());
  }

  get jointHierarchy(): JointNode[] {
    return cloneJointHierarchy(this.#jointHierarchy);
  }

  getJoints(): JointImp[] {
    return [...this.#jointImps.values()];
  }

  straightenOutJoints(): void {
    for (const joint of this.#jointImps.values()) {
      joint.straighten();
    }
  }

  strikePose(pose: Record<string, Partial<{ position: Position; orientation: Orientation }>>): void {
    for (const [name, transform] of Object.entries(pose)) {
      const joint = this.getJointImplementation(name);
      if (!joint) {
        continue;
      }
      if (transform.position) {
        joint.position.setValue(transform.position);
      }
      if (transform.orientation) {
        joint.orientation.setValue(transform.orientation);
      }
    }
  }
}

export function cloneJointHierarchy(joints: JointNode[]): JointNode[] {
  return joints.map((joint) => ({
    name: joint.name,
    parentName: joint.parentName,
    children: cloneJointHierarchy(joint.children),
    localTransform: {
      position: clonePosition(joint.localTransform.position),
      orientation: cloneOrientation(joint.localTransform.orientation),
    },
  }));
}
