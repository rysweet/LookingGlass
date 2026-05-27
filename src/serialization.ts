import type { AliceProject } from "./a3p-parser.js";
import { deserializeFromJson } from "./serialization/json.js";
import { deserializeFromXml } from "./serialization/xml-read.js";
import { serializeToJson } from "./serialization/json.js";
import { serializeToXml } from "./serialization/xml-write.js";
import type { SerializationFormat, SerializationOptions } from "./serialization/types.js";

export { deserializeFromJson, serializeToJson } from "./serialization/json.js";
export { deserializeFromXml } from "./serialization/xml-read.js";
export { serializeToXml } from "./serialization/xml-write.js";
export { SerializationError, type SerializationFormat, type SerializationOptions } from "./serialization/types.js";

export function serialize(project: AliceProject, options: SerializationOptions): string {
  if (options.format === "json") {
    return options.pretty === false ? JSON.stringify(project) : serializeToJson(project);
  }
  return serializeToXml(project);
}

export function deserialize(data: string, format: SerializationFormat): AliceProject {
  return format === "json" ? deserializeFromJson(data) : deserializeFromXml(data);
}
