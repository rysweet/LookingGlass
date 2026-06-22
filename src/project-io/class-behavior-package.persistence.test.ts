import { describe, expect, it } from "vitest";
import type { AliceProject, AliceTypeDefinition } from "../a3p-parser.js";
import {
  readProject,
  writeProject,
  type AliceProjectArchive,
} from "../project-io.js";
import {
  exportClassBehaviorPackage,
  importClassBehaviorPackage,
  parseClassBehaviorPackage,
  serializeClassBehaviorPackage,
} from "./class-behavior-package.js";

function createBehaviorType(name = "SpinnerBehavior"): AliceTypeDefinition {
  return {
    name,
    superTypeName: "org.lgna.story.SModel",
    fields: [
      { name: "turnSpeed", typeName: "Double", initializer: "0.25" },
      { name: "turnLabel", typeName: "java.lang.String", initializer: "spin" },
    ],
    constructors: [
      {
        name,
        isFunction: false,
        returnType: name,
        parameters: [{ name: "speed", type: "Double" }],
        statements: [
          { kind: "expression", expression: "this.turnSpeed = speed" },
          { kind: "call", object: "this", method: "setVehicle", arguments: ["this"] },
        ],
      },
    ],
    methods: [
      {
        name: "spinOnce",
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "amount", type: "Double" }],
        statements: [
          { kind: "call", object: "this", method: "turn", arguments: ["LEFT", "amount"] },
          { kind: "expression", expression: "this.turnLabel = \"spun\"" },
        ],
      },
      {
        name: "spinCountLabel",
        isFunction: true,
        returnType: "java.lang.String",
        parameters: [],
        statements: [{ kind: "return", expression: "this.turnLabel" }],
      },
    ],
  };
}

function createProject(projectName: string, types: AliceTypeDefinition[]): AliceProject {
  return {
    version: "3.10.0.0",
    projectName,
    sceneObjects: [],
    methods: [],
    types,
  };
}

function createArchive(project: AliceProject): AliceProjectArchive {
  return {
    project,
    manifest: null,
    resources: new Map(),
    resourceEntries: [],
    thumbnail: null,
    versionInfo: {
      originalAliceVersion: project.version,
      detectedAliceVersion: project.version,
      manifestVersion: null,
      xmlVersion: null,
      versionSource: "default",
      migrated: false,
      migrationSteps: [],
    },
  };
}

describe("project-io/class-behavior-package persistence", () => {
  it("preserves exported and imported class behavior through package JSON and Alice project save/read", async () => {
    const sourceType = createBehaviorType();
    const sourceProject = createProject("Alice Source Project", [sourceType]);
    const targetProject = createProject("Alice Target Project", []);

    const exportedPackage = exportClassBehaviorPackage(sourceProject, "SpinnerBehavior");
    const parsedPackage = parseClassBehaviorPackage(serializeClassBehaviorPackage(exportedPackage));

    const importResult = importClassBehaviorPackage(targetProject, parsedPackage);
    const savedBytes = await writeProject(createArchive(targetProject), {
      generateThumbnailFromScene: false,
    });
    const reopened = await readProject(savedBytes, {
      limits: {
        maxArchiveBytes: 10 * 1024 * 1024,
        maxEntryUncompressedBytes: 10 * 1024 * 1024,
        maxTotalUncompressedBytes: 10 * 1024 * 1024,
        maxXmlTextBytes: 10 * 1024 * 1024,
        maxEntries: 128,
      },
    });

    expect(importResult).toMatchObject({
      importedName: "SpinnerBehavior",
      renamed: false,
      replaced: false,
      merged: false,
    });
    expect(reopened.project.types?.find((type) => type.name === "SpinnerBehavior")).toEqual(sourceType);
  });

  it("persists renamed class behavior without rewriting method bodies or superclass data", async () => {
    const targetProject = createProject("Alice Rename Target", [createBehaviorType()]);
    const packageData = exportClassBehaviorPackage(
      createProject("Alice Source Project", [createBehaviorType()]),
      "SpinnerBehavior",
    );

    const importResult = importClassBehaviorPackage(targetProject, packageData);
    const savedBytes = await writeProject(createArchive(targetProject), {
      generateThumbnailFromScene: false,
    });
    const reopened = await readProject(savedBytes);
    const renamed = reopened.project.types?.find((type) => type.name === "SpinnerBehavior2");

    expect(importResult).toMatchObject({
      originalName: "SpinnerBehavior",
      importedName: "SpinnerBehavior2",
      renamed: true,
    });
    expect(renamed?.superTypeName).toBe("org.lgna.story.SModel");
    expect(renamed?.constructors?.[0]).toMatchObject({
      name: "SpinnerBehavior2",
      returnType: "SpinnerBehavior2",
    });
    expect(renamed?.methods).toEqual(createBehaviorType().methods);
  });
});
