import type { AliceProject } from "../a3p-parser.js";

export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly format: string,
  ) {
    super(message);
    this.name = "SerializationError";
  }
}

export type SerializationFormat = "json" | "xml";

export interface SerializationOptions {
  format: SerializationFormat;
  pretty?: boolean;
}

export function validateProject(obj: unknown, format: string): AliceProject {
  if (!obj || typeof obj !== "object") {
    throw new SerializationError("Expected an object", format);
  }
  const record = obj as Record<string, unknown>;
  if (!("version" in record) || !record.version) {
    throw new SerializationError("Missing required field: version", format);
  }
  if (!("projectName" in record) || !record.projectName) {
    throw new SerializationError("Missing required field: projectName", format);
  }
  if (!("sceneObjects" in record)) {
    throw new SerializationError("Missing required field: sceneObjects", format);
  }
  if (!("methods" in record)) {
    throw new SerializationError("Missing required field: methods", format);
  }
  if (!Array.isArray(record.sceneObjects)) {
    throw new SerializationError("sceneObjects must be an array", format);
  }
  if (!Array.isArray(record.methods)) {
    throw new SerializationError("methods must be an array", format);
  }
  return obj as AliceProject;
}
