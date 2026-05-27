import type { AliceProject } from "../a3p-parser.js";
import { SerializationError, validateProject } from "./types.js";

export function serializeToJson(project: AliceProject): string {
  return JSON.stringify(project, null, 2);
}

export function deserializeFromJson(json: string): AliceProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error: unknown) {
    throw new SerializationError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`, "json");
  }
  return validateProject(parsed, "json");
}
