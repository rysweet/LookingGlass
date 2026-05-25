export * from "./expanded-entities";

import { SJointedModel, SModel, SThing } from "./expanded-entities";
import type { BoundingBox, JointId, JointNode } from "./expanded-types";
import { describeSpeechBubble } from "./types";

export function getEntityBoundingBox(entity: SThing): BoundingBox | null {
  return entity.imp.getBoundingBox();
}

export function listJointNames(entity: SJointedModel): string[] {
  const names: string[] = [];
  const visit = (nodes: readonly JointNode[]): void => {
    for (const node of nodes) {
      names.push(node.name);
      visit(node.children);
    }
  };
  visit(entity.getJointHierarchy());
  return names;
}

export function hasJoint(entity: SJointedModel, joint: string | JointId): boolean {
  return entity.getJointId(joint) !== undefined;
}

export function getSpeechBubbleSummary(entity: SModel): string | null {
  return describeSpeechBubble(entity.speechBubbleEntity ?? entity.speechBubble);
}
