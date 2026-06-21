import JSZip from "jszip";
import {
  DEFAULT_A3P_XML_ENTRY,
  getA3PSource,
  type AliceProject,
} from "../a3p-parser.js";
import { writeProjectResources } from "../project-io/resources.js";
import { serializeManifest } from "../project-io/manifest.js";
import { writeProjectThumbnail } from "../project-io/thumbnails.js";
import { buildProjectXml, ensureXmlTools } from "./document.js";
import type { WriteA3POptions } from "./types.js";

export async function writeA3P(project: AliceProject, options: WriteA3POptions = {}): Promise<Uint8Array> {
  await ensureXmlTools();
  const source = getA3PSource(project);
  const xmlEntryName = options.xmlEntryName ?? source?.xmlEntryName ?? DEFAULT_A3P_XML_ENTRY;
  const baseXmlText = options.baseXmlText ?? source?.xmlText ?? null;
  const zip = new JSZip();

  if (options.resources) {
    writeProjectResources(zip, options.resources);
  }

  zip.file("version.txt", project.version);
  zip.file(xmlEntryName, buildProjectXml(project, baseXmlText));

  if (options.manifest !== undefined && options.manifest !== null) {
    zip.file("manifest.json", serializeManifest(options.manifest));
  }
  writeProjectThumbnail(zip, options.thumbnail ?? null);

  return zip.generateAsync({ type: "uint8array" });
}
