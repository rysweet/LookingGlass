import type { Express } from "express";
import {
  applyTextureBinding,
  importProjectAsset,
  ImportedProjectAssetError,
} from "../../imported-project-assets.js";
import { buildCurrentProject } from "../state.js";
import type { ServerContext } from "../context.js";
import {
  readJsonObjectBody,
  readOptionalStringField,
  readRequiredStringField,
} from "../validation.js";

type AssetImportKind = "model" | "texture";

export function registerAssetRoutes(app: Express, context: ServerContext): void {
  app.post("/api/assets/import-model", (req, res) => {
    handleAssetImport(context, req.body, "model")
      .then((asset) => {
        console.info(`Imported Alice model asset: ${asset.id}`);
        res.json({ status: "imported", asset });
      })
      .catch((error: unknown) => sendAssetError(res, error));
  });

  app.post("/api/assets/import-texture", (req, res) => {
    handleAssetImport(context, req.body, "texture")
      .then((asset) => {
        console.info(`Imported Alice texture asset: ${asset.id}`);
        res.json({ status: "imported", asset });
      })
      .catch((error: unknown) => sendAssetError(res, error));
  });

  app.post("/api/scene/apply-texture", (req, res) => {
    try {
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
      const textureResourceId = readRequiredStringField(body.body, "textureResourceId");
      if (!textureResourceId.ok) {
        res.status(400).json({ error: textureResourceId.error });
        return;
      }
      const target = readRequiredStringField(body.body, "target");
      if (!target.ok) {
        res.status(400).json({ error: target.error });
        return;
      }

      const project = synchronizeCurrentProject(context);
      const object = applyTextureBinding(project, {
        objectName: objectName.value,
        textureResourceId: textureResourceId.value,
        target: target.value,
      });
      console.info(`Applied Alice texture ${textureResourceId.value} to ${objectName.value}.`);
      res.json({
        status: "applied",
        objectName: object.name,
        materialBindings: object.materialBindings ?? [],
      });
    } catch (error) {
      sendAssetError(res, error);
    }
  });
}

async function handleAssetImport(
  context: ServerContext,
  requestBody: unknown,
  kind: AssetImportKind,
) {
  const body = readJsonObjectBody(requestBody);
  if (!body.ok) {
    throw new ImportedProjectAssetError(body.error);
  }

  const fileName = readRequiredStringField(body.body, "fileName");
  if (!fileName.ok) {
    throw new ImportedProjectAssetError(fileName.error);
  }
  const contentBase64 = readRequiredStringField(body.body, "contentBase64");
  if (!contentBase64.ok) {
    throw new ImportedProjectAssetError(contentBase64.error);
  }
  const displayName = readOptionalStringField(body.body, "displayName");
  if (!displayName.ok) {
    throw new ImportedProjectAssetError(displayName.error);
  }

  const project = synchronizeCurrentProject(context);
  return importProjectAsset({
    project,
    resources: context.state.projectResources,
    kind,
    fileName: fileName.value,
    ...(displayName.value !== undefined ? { displayName: displayName.value } : {}),
    bytes: decodeBase64Content(contentBase64.value),
  });
}

function synchronizeCurrentProject(context: ServerContext) {
  const project = buildCurrentProject(context.state);
  context.state.parsedProject = project;
  return project;
}

function decodeBase64Content(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) {
    throw new ImportedProjectAssetError("contentBase64 must be valid base64 data.");
  }

  const buffer = Buffer.from(value, "base64");
  if (buffer.length === 0) {
    throw new ImportedProjectAssetError("Imported asset is empty.");
  }

  const normalizedInput = value.replace(/=+$/, "");
  const normalizedRoundTrip = buffer.toString("base64").replace(/=+$/, "");
  if (normalizedRoundTrip !== normalizedInput) {
    throw new ImportedProjectAssetError("contentBase64 must be valid base64 data.");
  }
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

function sendAssetError(res: { status(code: number): { json(body: unknown): void } }, error: unknown): void {
  if (error instanceof ImportedProjectAssetError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error("Asset route failed:", error);
  res.status(500).json({ error: "Internal server error" });
}
