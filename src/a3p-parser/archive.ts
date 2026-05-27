import JSZip from "jszip";
import { indexNodes, getProjectName } from "./dom.js";
import { extractBoundingBoxes, extractJointHierarchy, extractTextureRefs } from "./resources.js";
import { extractMethods, extractSceneObjects, extractTypes } from "./scene.js";
import {
  attachA3PSource,
  DEFAULT_A3P_XML_ENTRY,
  LEGACY_A3P_XML_ENTRY,
  snapshotAliceProject,
  type AliceProject,
} from "./types.js";

export async function parseA3P(data: ArrayBuffer | Uint8Array): Promise<AliceProject> {
  try {
    const zip = await JSZip.loadAsync(data);
    return parseA3PFromZip(zip);
  } catch (error) {
    throw new Error("Failed to parse .a3p archive: corrupted ZIP data", {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export async function parseA3PFromZip(zip: JSZip): Promise<AliceProject> {
  await ensureNodeXml();
  const version = await readTextFile(zip, "version.txt");
  const xmlEntry = await readA3PXmlEntry(zip);
  const doc = parseXmlString(xmlEntry.text);
  const nodeIndex = indexNodes(doc.documentElement);

  const project: AliceProject = {
    version: version.trim(),
    projectName: getProjectName(doc),
    sceneObjects: extractSceneObjects(nodeIndex.namedUserTypes, nodeIndex.keyMap),
    methods: extractMethods(nodeIndex.userMethods, nodeIndex.keyMap, { includeMain: false }),
    types: extractTypes(nodeIndex.namedUserTypes, nodeIndex.keyMap),
    jointHierarchy: extractJointHierarchy(nodeIndex.jointImplementations),
    boundingBoxes: extractBoundingBoxes(nodeIndex.modelResourceInfos),
    textureRefs: extractTextureRefs(nodeIndex.textureReferences, zip),
  };

  attachA3PSource(project, {
    zip,
    xmlEntryName: xmlEntry.name,
    xmlText: xmlEntry.text,
    snapshot: snapshotAliceProject(project),
  });

  return project;
}

async function readTextFile(zip: JSZip, name: string): Promise<string> {
  const entry = zip.file(name);
  if (!entry) return "";
  return entry.async("string");
}

export async function readA3PXmlEntry(zip: JSZip): Promise<{ name: string; text: string }> {
  const entryName = zip.file(DEFAULT_A3P_XML_ENTRY)
    ? DEFAULT_A3P_XML_ENTRY
    : zip.file(LEGACY_A3P_XML_ENTRY)
      ? LEGACY_A3P_XML_ENTRY
      : null;

  if (!entryName) {
    throw new Error(`No ${DEFAULT_A3P_XML_ENTRY} or ${LEGACY_A3P_XML_ENTRY} found in .a3p archive`);
  }

  const raw = await zip.file(entryName)!.async("uint8array");
  return { name: entryName, text: decodeXmlBytes(raw) };
}

function decodeXmlBytes(raw: Uint8Array): string {
  if (raw.length >= 2) {
    if (raw[0] === 0xfe && raw[1] === 0xff) {
      return decodeUtf16(raw, true);
    }
    if (raw[0] === 0xff && raw[1] === 0xfe) {
      return decodeUtf16(raw, false);
    }
    if (raw[0] === 0x00 || raw[1] === 0x00) {
      return decodeUtf16(raw, raw[0] === 0x00);
    }
  }

  return new TextDecoder("utf-8").decode(raw);
}

function decodeUtf16(bytes: Uint8Array, bigEndian: boolean): string {
  const label = bigEndian ? "utf-16be" : "utf-16le";
  return new TextDecoder(label).decode(bytes);
}

function parseXmlString(xml: string): Document {
  if (typeof globalThis.DOMParser !== "undefined") {
    return new globalThis.DOMParser().parseFromString(xml, "application/xml");
  }
  if (!_xmlDomParser) {
    throw new Error("Call initNodeXml() before parseXmlString in Node.js");
  }
  return _xmlDomParser.parseFromString(xml, "application/xml");
}

let _xmlDomParser: InstanceType<typeof DOMParser> | null = null;

async function ensureNodeXml(): Promise<void> {
  if (typeof globalThis.DOMParser !== "undefined") return;
  if (_xmlDomParser) return;
  const mod = await import("@xmldom/xmldom");
  _xmlDomParser = new (mod.DOMParser as unknown as typeof DOMParser)();
}
