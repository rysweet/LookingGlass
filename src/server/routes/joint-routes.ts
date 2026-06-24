import type { Express, Response } from "express";
import {
  type JointAnimationInput,
  type JointArrayDefinition,
  type JointTransform,
  UnknownJointArrayError,
  UnknownJointError,
  defaultJointHierarchyForClassName,
} from "../../joint-system.js";
import {
  isJointNode,
  isOrientation,
  isPosition,
  type JointNode,
} from "../../story-api/expanded-types.js";
import type { ServerContext } from "../context.js";
import { writeJointStateSidecar } from "../joint-state-sidecar.js";
import { DEFAULT_POSITION } from "../state.js";
import {
  readJsonObjectBody,
  readOptionalStringField,
  readRequiredStringField,
} from "../validation.js";

type JsonReadResult<T> = { ok: true; value: T } | { ok: false; error: string };

function createJointHierarchyForClass(className: string): JointNode[] | null {
  return defaultJointHierarchyForClassName(className);
}

export async function registerSceneObjectJointsIfSupported(
  context: ServerContext,
  objectName: string,
  className: string,
): Promise<string | null> {
  if (context.state.jointState.hasObject(objectName)) {
    return writeJointStateSidecar(context.evidenceDir, context.state.jointState);
  }

  const hierarchy = createJointHierarchyForClass(className);
  if (!hierarchy) {
    return null;
  }

  context.state.jointState.registerObject({
    objectName,
    className,
    hierarchy,
  });
  return writeJointStateSidecar(context.evidenceDir, context.state.jointState);
}

function readJointHierarchy(value: unknown): JsonReadResult<JointNode[]> {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isJointNode)) {
    return { ok: false, error: "joints must be a non-empty array of valid joint nodes" };
  }
  return { ok: true, value };
}

function readJointArrays(value: unknown): JsonReadResult<JointArrayDefinition[]> {
  if (value === undefined) {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: "jointArrays must be an array" };
  }

  const arrays: JointArrayDefinition[] = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: "each joint array must be a JSON object" };
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.name !== "string" || !record.name.trim()) {
      return { ok: false, error: "each joint array must include a non-empty name" };
    }
    if (!Array.isArray(record.joints) || record.joints.some((joint) => typeof joint !== "string" || !joint.trim())) {
      return { ok: false, error: "each joint array must include non-empty joint names" };
    }
    arrays.push({
      name: record.name.trim(),
      joints: record.joints.map((joint) => joint.trim()),
    });
  }
  return { ok: true, value: arrays };
}

function readPartialTransform(value: unknown): JsonReadResult<Partial<JointTransform>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "joint transform must be a JSON object" };
  }
  const record = value as Record<string, unknown>;
  const transform: {
    position?: JointTransform["position"];
    orientation?: JointTransform["orientation"];
  } = {};
  if (record.position !== undefined) {
    if (!isPosition(record.position)) {
      return { ok: false, error: "joint position must contain finite x, y, and z values" };
    }
    transform.position = record.position;
  }
  if (record.orientation !== undefined) {
    if (!isOrientation(record.orientation)) {
      return { ok: false, error: "joint orientation must contain finite x, y, z, and w values" };
    }
    transform.orientation = record.orientation;
  }
  if (!transform.position && !transform.orientation) {
    return { ok: false, error: "joint transform must include position or orientation" };
  }
  return { ok: true, value: transform };
}

function readPoseJoints(value: unknown): JsonReadResult<Record<string, Partial<JointTransform>>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "joints must be a JSON object keyed by joint name" };
  }

  const joints: Record<string, Partial<JointTransform>> = {};
  for (const [jointName, rawTransform] of Object.entries(value as Record<string, unknown>)) {
    if (!jointName.trim()) {
      return { ok: false, error: "joint names must be non-empty strings" };
    }
    const transform = readPartialTransform(rawTransform);
    if (!transform.ok) {
      return transform;
    }
    joints[jointName] = transform.value;
  }

  if (Object.keys(joints).length === 0) {
    return { ok: false, error: "joints must include at least one joint transform" };
  }
  return { ok: true, value: joints };
}

function readAnimationInput(objectName: string, body: Record<string, unknown>): JsonReadResult<JointAnimationInput> {
  const target = body.target;
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    return { ok: false, error: "target must be a JSON object" };
  }
  const targetRecord = target as Record<string, unknown>;
  const jointName = typeof targetRecord.jointName === "string" && targetRecord.jointName.trim().length > 0
    ? targetRecord.jointName.trim()
    : null;
  const jointArray = typeof targetRecord.jointArray === "string" && targetRecord.jointArray.trim().length > 0
    ? targetRecord.jointArray.trim()
    : null;
  if ((jointName === null) === (jointArray === null)) {
    return { ok: false, error: "target must specify exactly one of jointName or jointArray" };
  }

  const durationMs = body.durationMs;
  if (!Number.isFinite(durationMs) || typeof durationMs !== "number" || durationMs < 0) {
    return { ok: false, error: "durationMs must be a non-negative finite number" };
  }

  const to = readPartialTransform(body.to);
  if (!to.ok) {
    return to;
  }

  if (body.style !== undefined && body.style !== "traditional" && body.style !== "gentle" && body.style !== "abrupt" && body.style !== "linear") {
    return { ok: false, error: "style must be traditional, gentle, abrupt, or linear" };
  }
  if (body.evidenceLabel !== undefined && (typeof body.evidenceLabel !== "string" || !body.evidenceLabel.trim())) {
    return { ok: false, error: "evidenceLabel must be a non-empty string" };
  }

  return {
    ok: true,
    value: {
      objectName,
      target: jointName !== null
        ? { jointName }
        : { jointArray: jointArray! },
      durationMs,
      to: to.value,
      ...(body.style !== undefined ? { style: body.style } : {}),
      ...(body.evidenceLabel !== undefined ? { evidenceLabel: body.evidenceLabel.trim() } : {}),
    },
  };
}

function sendJointMutationError(res: Response, error: unknown): boolean {
  if (error instanceof UnknownJointError) {
    res.status(400).json({
      error: `Unknown joint names for ${error.objectName}`,
      objectName: error.objectName,
      unknownJoints: error.unknownJoints,
      availableJoints: error.availableJoints,
    });
    return true;
  }
  if (error instanceof UnknownJointArrayError) {
    res.status(400).json({
      error: `Unknown joint array for ${error.objectName}`,
      objectName: error.objectName,
      jointArray: error.jointArray,
      availableJointArrays: error.availableJointArrays,
    });
    return true;
  }
  if (error instanceof TypeError) {
    res.status(400).json({ error: error.message });
    return true;
  }
  return false;
}

export function registerJointRoutes(app: Express, context: ServerContext): void {
  app.get("/api/joints/:objectName", async (req, res, next) => {
    try {
      const sceneObject = context.state.sceneObjects.get(req.params.objectName);
      if (sceneObject) {
        await registerSceneObjectJointsIfSupported(context, sceneObject.name, sceneObject.className);
      }

      const snapshot = context.state.jointState.getObjectSnapshot(req.params.objectName);
      if (!snapshot) {
        res.status(404).json({ error: `Jointed object not found: ${req.params.objectName}` });
        return;
      }

      res.json({
        schema_version: "alice.joint-state-object/v1",
        objectName: req.params.objectName,
        ...snapshot,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/scene/add-jointed-object", async (req, res, next) => {
    try {
      const body = readJsonObjectBody(req.body);
      if (!body.ok) {
        res.status(400).json({ error: body.error });
        return;
      }

      const className = readRequiredStringField(body.body, "className");
      if (!className.ok) {
        res.status(400).json({ error: className.error });
        return;
      }
      const name = readRequiredStringField(body.body, "name");
      if (!name.ok) {
        res.status(400).json({ error: name.error });
        return;
      }
      const hierarchy = readJointHierarchy(body.body.joints);
      if (!hierarchy.ok) {
        res.status(400).json({ error: hierarchy.error });
        return;
      }
      const jointArrays = readJointArrays(body.body.jointArrays);
      if (!jointArrays.ok) {
        res.status(400).json({ error: jointArrays.error });
        return;
      }

      context.state.sceneObjects.set(name.value, {
        name: name.value,
        className: className.value,
        position: { ...DEFAULT_POSITION },
        orientation: null,
        size: null,
      });
      context.state.jointState.registerObject({
        objectName: name.value,
        className: className.value,
        hierarchy: hierarchy.value,
      });
      for (const jointArray of jointArrays.value) {
        context.state.jointState.defineJointArray({
          objectName: name.value,
          name: jointArray.name,
          joints: jointArray.joints,
        });
      }
      const evidenceArtifact = await writeJointStateSidecar(context.evidenceDir, context.state.jointState);
      const snapshot = context.state.jointState.getObjectSnapshot(name.value)!;

      res.json({
        schema_version: "alice.jointed-object/v1",
        status: "added",
        objectName: name.value,
        className: className.value,
        jointCount: Object.keys(snapshot.joints).length,
        jointArrays: Object.keys(snapshot.jointArrays),
        evidenceArtifact,
      });
    } catch (error) {
      if (sendJointMutationError(res, error)) {
        return;
      }
      next(error);
    }
  });

  app.post("/api/joints/:objectName/pose", async (req, res, next) => {
    try {
      const body = readJsonObjectBody(req.body);
      if (!body.ok) {
        res.status(400).json({ error: body.error });
        return;
      }
      const sceneObject = context.state.sceneObjects.get(req.params.objectName);
      if (sceneObject) {
        await registerSceneObjectJointsIfSupported(context, sceneObject.name, sceneObject.className);
      }

      const poseName = readOptionalStringField(body.body, "poseName");
      if (!poseName.ok) {
        res.status(400).json({ error: poseName.error });
        return;
      }
      const joints = readPoseJoints(body.body.joints);
      if (!joints.ok) {
        res.status(400).json({ error: joints.error });
        return;
      }

      const canonicalJoints = context.state.jointState.applyPose({
        objectName: req.params.objectName,
        ...(poseName.value !== undefined ? { poseName: poseName.value } : {}),
        joints: joints.value,
      });
      const evidenceArtifact = await writeJointStateSidecar(context.evidenceDir, context.state.jointState);

      res.json({
        schema_version: "alice.joint-pose-result/v1",
        status: "posed",
        objectName: req.params.objectName,
        ...(poseName.value !== undefined ? { poseName: poseName.value } : {}),
        canonicalJoints,
        evidenceArtifact,
      });
    } catch (error) {
      if (sendJointMutationError(res, error)) {
        return;
      }
      next(error);
    }
  });

  app.post("/api/joints/:objectName/arrays", async (req, res, next) => {
    try {
      const body = readJsonObjectBody(req.body);
      if (!body.ok) {
        res.status(400).json({ error: body.error });
        return;
      }
      const sceneObject = context.state.sceneObjects.get(req.params.objectName);
      if (sceneObject) {
        await registerSceneObjectJointsIfSupported(context, sceneObject.name, sceneObject.className);
      }

      const name = readRequiredStringField(body.body, "name");
      if (!name.ok) {
        res.status(400).json({ error: name.error });
        return;
      }
      if (!Array.isArray(body.body.joints) || body.body.joints.some((joint) => typeof joint !== "string" || !joint.trim())) {
        res.status(400).json({ error: "joints must be an array of non-empty joint names" });
        return;
      }

      context.state.jointState.defineJointArray({
        objectName: req.params.objectName,
        name: name.value,
        joints: body.body.joints.map((joint) => joint.trim()),
      });
      const evidenceArtifact = await writeJointStateSidecar(context.evidenceDir, context.state.jointState);

      res.json({
        schema_version: "alice.joint-array-result/v1",
        status: "defined",
        objectName: req.params.objectName,
        name: name.value,
        joints: context.state.jointState.getObjectSnapshot(req.params.objectName)?.jointArrays[name.value] ?? [],
        evidenceArtifact,
      });
    } catch (error) {
      if (sendJointMutationError(res, error)) {
        return;
      }
      next(error);
    }
  });

  app.post("/api/joints/:objectName/animate", async (req, res, next) => {
    try {
      const body = readJsonObjectBody(req.body);
      if (!body.ok) {
        res.status(400).json({ error: body.error });
        return;
      }
      const sceneObject = context.state.sceneObjects.get(req.params.objectName);
      if (sceneObject) {
        await registerSceneObjectJointsIfSupported(context, sceneObject.name, sceneObject.className);
      }

      const animationInput = readAnimationInput(req.params.objectName, body.body);
      if (!animationInput.ok) {
        res.status(400).json({ error: animationInput.error });
        return;
      }
      const animation = context.state.jointState.queueAnimation(animationInput.value);
      const evidenceArtifact = await writeJointStateSidecar(context.evidenceDir, context.state.jointState);

      res.json({
        schema_version: "alice.joint-animation-result/v1",
        status: "queued",
        objectName: req.params.objectName,
        target: animationInput.value.target,
        animationId: animation.animationId,
        resolvedJoints: animation.resolvedJoints,
        evidenceArtifact,
      });
    } catch (error) {
      if (sendJointMutationError(res, error)) {
        return;
      }
      next(error);
    }
  });
}
