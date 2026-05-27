import type { JointId, Size } from "../story-api/types";
import { cloneSize } from "../story-api/expanded-math";
import { EntityImp, ModelImp } from "./core.js";

export class MarkerImp extends ModelImp {
  readonly #defaultSize: Size;

  constructor(name: string | null = null, size: Size = { width: 0.2, height: 0.2, depth: 0.2 }) {
    super(name, size);
    this.#defaultSize = cloneSize(size);
    this.paint = "YELLOW";
    this.opacity = 0.75;
  }

  capture(entity: EntityImp): void {
    this.setWorldPosition(entity.getWorldPosition());
    this.setWorldOrientation(entity.getWorldOrientation());
    if (entity instanceof ModelImp) {
      this.size = entity.getScaledSize();
      this.paint = entity.paint;
      this.opacity = entity.opacity;
    } else {
      this.size = this.#defaultSize;
    }
  }

  applyTo(entity: EntityImp): void {
    entity.setWorldPosition(this.getWorldPosition());
    entity.setWorldOrientation(this.getWorldOrientation());
    if (entity instanceof ModelImp) {
      entity.size = this.size;
      entity.paint = this.paint;
      entity.opacity = this.opacity;
    }
  }
}

export class JointImp extends ModelImp {
  readonly #jointId: JointId;
  #jointParent: JointImp | ModelImp | null = null;
  readonly #jointChildren = new Set<JointImp>();

  constructor(jointId: string | JointId, name: string | null = null) {
    const resolvedJointId = typeof jointId === "string" ? { name: jointId } : { ...jointId };
    super(name ?? resolvedJointId.name, { width: 0.15, height: 0.15, depth: 0.15 });
    this.#jointId = resolvedJointId;
  }

  get jointId(): JointId { return { ...this.#jointId }; }
  get jointParent(): JointImp | ModelImp | null { return this.#jointParent; }
  get jointChildren(): JointImp[] {
    return [...this.#jointChildren].sort((left, right) => left.jointId.name.localeCompare(right.jointId.name));
  }

  setJointParent(parent: JointImp | ModelImp | null): void {
    if (parent === this) {
      throw new TypeError("joint cannot parent itself");
    }
    let current: JointImp | ModelImp | null = parent;
    while (current instanceof JointImp) {
      if (current === this) {
        throw new TypeError("joint assignment would create a cycle");
      }
      current = current.jointParent;
    }

    if (this.#jointParent instanceof JointImp) {
      this.#jointParent.#jointChildren.delete(this);
    } else if (this.#jointParent instanceof ModelImp) {
      this.#jointParent.unregisterJoint(this);
    }

    this.#jointParent = parent;
    if (parent instanceof JointImp) {
      parent.#jointChildren.add(this);
      parent.getModelRoot()?.registerJoint(this);
    } else if (parent instanceof ModelImp) {
      parent.registerJoint(this);
    }
    this.setParent(parent);
  }

  getModelRoot(): ModelImp | null {
    let current: JointImp | ModelImp | null = this.#jointParent;
    while (current instanceof JointImp) {
      current = current.jointParent;
    }
    return current instanceof ModelImp ? current : null;
  }

  getJointChain(): JointImp[] {
    const chain: JointImp[] = [this];
    let current = this.#jointParent;
    while (current instanceof JointImp) {
      chain.unshift(current);
      current = current.jointParent;
    }
    return chain;
  }

  enumerateSubtree(): JointImp[] {
    return [this, ...this.jointChildren.flatMap((child) => child.enumerateSubtree())];
  }
}

export class ModelJointImp extends JointImp {}
export class ObjectMarkerImp extends MarkerImp {}
