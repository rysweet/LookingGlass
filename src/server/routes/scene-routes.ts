import type { Express } from "express";
import type { ServerContext } from "../context.js";
import {
  addSceneObjectToCurrentProject,
  DEFAULT_POSITION,
  ensureCurrentProject,
  type Orientation,
  type Position,
  type Size,
} from "../state.js";
import { registerSceneObjectJointsIfSupported } from "./joint-routes.js";
import {
  readJsonObjectBody,
  readOptionalStringField,
  readRequiredStringField,
} from "../validation.js";

export function registerSceneRoutes(app: Express, context: ServerContext): void {
  app.post("/api/scene/add-object", async (req, res, next) => {
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

    const name = readOptionalStringField(body.body, "name");
    if (!name.ok) {
      res.status(400).json({ error: name.error });
      return;
    }

    const modelResourceId = readOptionalStringField(body.body, "modelResourceId");
    if (!modelResourceId.ok) {
      res.status(400).json({ error: modelResourceId.error });
      return;
    }
    if (modelResourceId.value !== undefined) {
      const modelAsset = context.state.parsedProject?.importedAssets
        ?.find((asset) => asset.id === modelResourceId.value);
      if (!modelAsset || modelAsset.kind !== "model") {
        res.status(400).json({ error: `Unknown modelResourceId: ${modelResourceId.value}` });
        return;
      }
    }

    const objectName =
      name.value ?? className.value.split(".").pop()?.toLowerCase() ?? "object";
    context.state.sceneObjects.set(objectName, {
      name: objectName,
      className: className.value,
      position: { ...DEFAULT_POSITION },
      orientation: null,
      size: null,
      ...(modelResourceId.value !== undefined ? { modelResourceId: modelResourceId.value } : {}),
    });
    addSceneObjectToCurrentProject(context.state, {
      name: objectName,
      className: className.value,
      ...(modelResourceId.value !== undefined ? { modelResourceId: modelResourceId.value } : {}),
    });

    try {
      await registerSceneObjectJointsIfSupported(context, objectName, className.value);
    } catch (error) {
      next(error);
      return;
    }

    const artifactPath = context.evidenceService.recordSceneObjectAdded(
      context.evidenceDir,
      className.value,
      context.state.sceneObjects.size,
    );

    res.json({
      status: "added",
      objectName,
      className: className.value,
      ...(modelResourceId.value !== undefined ? { modelResourceId: modelResourceId.value } : {}),
      sceneFieldCountAfter: context.state.sceneObjects.size,
      evidenceArtifact: artifactPath,
    });
  });

  app.post("/api/scene/transform-object", async (req, res) => {
    const body = readJsonObjectBody(req.body);
    if (!body.ok) {
      res.status(400).json({ error: body.error });
      return;
    }

    const objectName = readRequiredStringField(body.body, "objectName");
    if (!objectName.ok) {
      res.status(400).json({ error: objectName.error });
      return;
    }

    const position = readOptionalPosition(body.body, "position");
    if (!position.ok) {
      res.status(400).json({ error: position.error });
      return;
    }
    const orientation = readOptionalOrientation(body.body, "orientation");
    if (!orientation.ok) {
      res.status(400).json({ error: orientation.error });
      return;
    }
    const size = readOptionalSize(body.body, "size");
    if (!size.ok) {
      res.status(400).json({ error: size.error });
      return;
    }
    if (
      position.value === undefined &&
      orientation.value === undefined &&
      size.value === undefined
    ) {
      res.status(400).json({ error: "position, orientation, or size is required" });
      return;
    }

    const sceneObject = context.state.sceneObjects.get(objectName.value);
    if (!sceneObject) {
      res.status(404).json({ error: `Unknown scene object: ${objectName.value}` });
      return;
    }

    if (position.value !== undefined) sceneObject.position = position.value;
    if (orientation.value !== undefined) sceneObject.orientation = orientation.value;
    if (size.value !== undefined) sceneObject.size = size.value;

    const project = ensureCurrentProject(context.state);
    const projectObject = project.sceneObjects.find((object) => object.name === objectName.value);
    if (projectObject) {
      if (position.value !== undefined) projectObject.position = position.value;
      if (orientation.value !== undefined) projectObject.orientation = orientation.value;
      if (size.value !== undefined) projectObject.size = size.value;
    }

    const artifactPath = context.evidenceService.recordSceneObjectTransform(
      context.evidenceDir,
      {
        objectName: objectName.value,
        ...(position.value !== undefined ? { position: position.value } : {}),
        ...(orientation.value !== undefined ? { orientation: orientation.value } : {}),
        ...(size.value !== undefined ? { size: size.value } : {}),
      },
    );

    res.json({
      status: "transformed",
      objectName: objectName.value,
      position: sceneObject.position,
      orientation: sceneObject.orientation,
      size: sceneObject.size,
      evidenceArtifact: artifactPath,
    });
  });
}

type FieldResult<T> = { ok: true; value: T | undefined } | { ok: false; error: string };

function readOptionalPosition(body: Record<string, unknown>, fieldName: string): FieldResult<Position> {
  return readOptionalNumberObject(body, fieldName, ["x", "y", "z"], (values) => ({
    x: values.x,
    y: values.y,
    z: values.z,
  }));
}

function readOptionalOrientation(body: Record<string, unknown>, fieldName: string): FieldResult<Orientation> {
  const result = readOptionalNumberObject(body, fieldName, ["x", "y", "z", "w"], (values) => ({
    x: values.x,
    y: values.y,
    z: values.z,
    w: values.w,
  }));
  if (!result.ok || result.value === undefined) {
    return result;
  }
  const length = Math.hypot(result.value.x, result.value.y, result.value.z, result.value.w);
  if (length === 0 || Math.abs(length - 1) > 1e-6) {
    return { ok: false, error: `${fieldName} must be a normalized non-zero quaternion` };
  }
  return result;
}

function readOptionalSize(body: Record<string, unknown>, fieldName: string): FieldResult<Size> {
  const result = readOptionalNumberObject(body, fieldName, ["width", "height", "depth"], (values) => ({
    width: values.width,
    height: values.height,
    depth: values.depth,
  }));
  if (!result.ok || result.value === undefined) {
    return result;
  }
  if (result.value.width <= 0 || result.value.height <= 0 || result.value.depth <= 0) {
    return { ok: false, error: `${fieldName} dimensions must be positive` };
  }
  return result;
}

function readOptionalNumberObject<T>(
  body: Record<string, unknown>,
  fieldName: string,
  keys: readonly string[],
  build: (values: Record<string, number>) => T,
): FieldResult<T> {
  const value = body[fieldName];
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: `${fieldName} must be an object` };
  }
  const record = value as Record<string, unknown>;
  const numbers: Record<string, number> = {};
  for (const key of keys) {
    const numberValue = record[key];
    if (typeof numberValue !== "number" || !Number.isFinite(numberValue)) {
      return { ok: false, error: `${fieldName}.${key} must be a finite number` };
    }
    numbers[key] = numberValue;
  }
  return { ok: true, value: build(numbers) };
}
