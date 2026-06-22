import { describe, expect, it } from "vitest";
import type { AliceProject, AliceTypeDefinition } from "../a3p-parser.js";
import {
  CLASS_BEHAVIOR_PACKAGE_KIND,
  CLASS_BEHAVIOR_PACKAGE_VERSION,
  ClassBehaviorPackageError,
  MAX_CLASS_BEHAVIOR_ARRAY_ITEMS,
  MAX_CLASS_BEHAVIOR_JSON_BYTES,
  MAX_CLASS_BEHAVIOR_STRING_LENGTH,
  exportClassBehaviorPackage,
  importClassBehaviorPackage,
  parseClassBehaviorPackage,
  serializeClassBehaviorPackage,
  type AliceClassBehaviorPackage,
} from "./class-behavior-package.js";

function createProject(types: AliceTypeDefinition[] = [createReusableDoorType()]): AliceProject {
  return {
    version: "3.10.0.0",
    projectName: "Alice Class Behavior Test",
    sceneObjects: [],
    methods: [
      {
        name: "projectOnlyMethod",
        isFunction: false,
        returnType: "void",
        parameters: [],
        statements: [{ kind: "comment", expression: "project methods are not part of a class package" }],
      },
    ],
    types,
  };
}

function createReusableDoorType(name = "ReusableDoor"): AliceTypeDefinition {
  return {
    name,
    superTypeName: "org.lgna.story.SModel",
    fields: [
      { name: "openCount", typeName: "Number", initializer: "0" },
      { name: "ownerName", typeName: "java.lang.String", initializer: "Alice" },
    ],
    constructors: [
      {
        name,
        isFunction: false,
        returnType: name,
        parameters: [{ name: "ownerName", type: "java.lang.String" }],
        statements: [
          { kind: "expression", expression: "this.ownerName = ownerName" },
          { kind: "call", object: "this", method: "resetDoor", arguments: [] },
        ],
      },
    ],
    methods: [
      {
        name: "openDoor",
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "degrees", type: "Number" }],
        statements: [
          { kind: "call", object: "this", method: "turn", arguments: ["LEFT", "degrees"] },
          { kind: "expression", expression: "this.openCount = this.openCount + 1" },
        ],
      },
      {
        name: "isOpen",
        isFunction: true,
        returnType: "Boolean",
        parameters: [],
        statements: [{ kind: "return", expression: "this.openCount > 0" }],
      },
    ],
  };
}

function createPackage(type = createReusableDoorType()): AliceClassBehaviorPackage {
  return {
    kind: CLASS_BEHAVIOR_PACKAGE_KIND,
    version: CLASS_BEHAVIOR_PACKAGE_VERSION,
    exportedBy: "alice-web",
    type,
  };
}

function expectPackageError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ClassBehaviorPackageError);
    expect((error as ClassBehaviorPackageError).code).toBe(code);
    return;
  }
  throw new Error(`Expected class behavior package error ${code}`);
}

describe("project-io/class-behavior-package", () => {
  it("exports one reusable Alice class behavior package from AliceTypeDefinition data", () => {
    const type = createReusableDoorType();
    const project = createProject([
      type,
      createReusableDoorType("HelperDoor"),
    ]);

    const packageData = exportClassBehaviorPackage(project, "ReusableDoor");

    expect(packageData).toEqual(createPackage(type));
    expect(packageData.type).not.toBe(type);
    expect(Object.keys(packageData).sort()).toEqual(["exportedBy", "kind", "type", "version"]);
    expect(JSON.stringify(packageData)).not.toContain("projectOnlyMethod");
    expect(JSON.stringify(packageData)).not.toContain("HelperDoor");
  });

  it("serializes packages as stable pretty JSON for downloadable files", () => {
    const serialized = serializeClassBehaviorPackage(createPackage());

    expect(serialized).toBe(`${JSON.stringify(createPackage(), null, 2)}\n`);
    expect(serialized.length).toBeLessThanOrEqual(MAX_CLASS_BEHAVIOR_JSON_BYTES);
  });

  it("parses a valid JSON package without sharing mutable objects with the input", () => {
    const sourcePackage = createPackage();

    const parsed = parseClassBehaviorPackage(JSON.stringify(sourcePackage));
    parsed.type.fields?.push({ name: "localOnly", typeName: "Number" });

    expect(parsed).toEqual({
      ...sourcePackage,
      type: {
        ...sourcePackage.type,
        fields: [
          ...(sourcePackage.type.fields ?? []),
          { name: "localOnly", typeName: "Number" },
        ],
      },
    });
    expect(sourcePackage.type.fields?.map((field) => field.name)).toEqual(["openCount", "ownerName"]);
  });

  it("throws a typed error when the requested class behavior is missing", () => {
    expectPackageError(
      () => exportClassBehaviorPackage(createProject(), "MissingDoor"),
      "missing-class-behavior",
    );
  });

  it("rejects invalid package identity, version, and exporter values", () => {
    expectPackageError(
      () => parseClassBehaviorPackage({ ...createPackage(), kind: "alice.reusable-class-behavior" }),
      "invalid-class-behavior-package",
    );
    expectPackageError(
      () => parseClassBehaviorPackage({ ...createPackage(), version: 2 }),
      "unsupported-class-behavior-version",
    );
    expectPackageError(
      () => parseClassBehaviorPackage({ ...createPackage(), exportedBy: "other-tool" }),
      "invalid-class-behavior-package",
    );
  });

  it("rejects unsafe names before import can modify a project", () => {
    const target = createProject([]);
    const before = JSON.stringify(target);

    expectPackageError(
      () => importClassBehaviorPackage(target, createPackage(createReusableDoorType("Bad Name!"))),
      "unsafe-class-behavior-name",
    );
    expect(JSON.stringify(target)).toBe(before);
  });

  it("rejects packages with oversized strings and arrays", () => {
    expectPackageError(
      () => parseClassBehaviorPackage(createPackage({
        ...createReusableDoorType(),
        name: "A".repeat(MAX_CLASS_BEHAVIOR_STRING_LENGTH + 1),
      })),
      "class-behavior-package-too-large",
    );

    expectPackageError(
      () => parseClassBehaviorPackage(createPackage({
        ...createReusableDoorType(),
        fields: Array.from({ length: MAX_CLASS_BEHAVIOR_ARRAY_ITEMS + 1 }, (_, index) => ({
          name: `field${index}`,
          typeName: "Number",
        })),
      })),
      "class-behavior-package-too-large",
    );
  });

  it("rejects dangerous keys anywhere in untrusted JSON", () => {
    const dangerousJson = JSON.stringify(createPackage()).replace(
      '"fields":[',
      '"__proto__":{"polluted":true},"fields":[',
    );

    expectPackageError(
      () => parseClassBehaviorPackage(dangerousJson),
      "dangerous-class-behavior-key",
    );
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("imports a non-conflicting class behavior into the target Alice project", () => {
    const target = createProject([]);

    const result = importClassBehaviorPackage(target, createPackage());

    expect(result).toEqual({
      schema_version: "alice-web.class-behavior-import-result/v1",
      status: "imported",
      originalName: "ReusableDoor",
      importedName: "ReusableDoor",
      conflictStrategy: "rename",
      renamed: false,
      replaced: false,
      merged: false,
    });
    expect(target.types).toEqual([createReusableDoorType()]);
  });

  it("renames same-name imports by default and only updates constructor identity", () => {
    const target = createProject([createReusableDoorType()]);
    const packageData = createPackage({
      ...createReusableDoorType(),
      methods: [
        {
          name: "describeSelf",
          isFunction: true,
          returnType: "java.lang.String",
          parameters: [],
          statements: [{ kind: "return", expression: '"ReusableDoor"' }],
        },
      ],
    });

    const result = importClassBehaviorPackage(target, packageData);

    expect(result).toMatchObject({
      originalName: "ReusableDoor",
      importedName: "ReusableDoor2",
      conflictStrategy: "rename",
      renamed: true,
      replaced: false,
      merged: false,
    });
    expect(target.types?.map((type) => type.name)).toEqual(["ReusableDoor", "ReusableDoor2"]);
    const renamed = target.types?.find((type) => type.name === "ReusableDoor2");
    expect(renamed?.constructors?.[0]).toMatchObject({
      name: "ReusableDoor2",
      returnType: "ReusableDoor2",
    });
    expect(renamed?.methods?.[0]?.statements).toEqual([{ kind: "return", expression: '"ReusableDoor"' }]);
  });

  it("supports explicit replace, merge, and reject conflict strategies", () => {
    const existing = createReusableDoorType();
    const incoming = createReusableDoorType();
    incoming.fields = [
      { name: "openCount", typeName: "Number", initializer: "99" },
      { name: "doorColor", typeName: "java.lang.String", initializer: "red" },
    ];
    incoming.methods = [
      {
        name: "openDoor",
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "degrees", type: "Number" }],
        statements: [{ kind: "call", object: "this", method: "swingOpen", arguments: ["degrees"] }],
      },
      {
        name: "closeDoor",
        isFunction: false,
        returnType: "void",
        parameters: [],
        statements: [{ kind: "call", object: "this", method: "turn", arguments: ["RIGHT", "90"] }],
      },
    ];
    incoming.constructors = [
      {
        name: "ReusableDoor",
        isFunction: false,
        returnType: "ReusableDoor",
        parameters: [{ name: "ownerName", type: "java.lang.String" }],
        statements: [{ kind: "expression", expression: "this.ownerName = ownerName.trim()" }],
      },
      {
        name: "ReusableDoor",
        isFunction: false,
        returnType: "ReusableDoor",
        parameters: [],
        statements: [{ kind: "call", object: "this", method: "resetDoor", arguments: [] }],
      },
    ];

    const replacedTarget = createProject([existing]);
    expect(importClassBehaviorPackage(replacedTarget, createPackage(incoming), { conflictStrategy: "replace" }))
      .toMatchObject({ importedName: "ReusableDoor", replaced: true, merged: false, renamed: false });
    expect(replacedTarget.types).toEqual([incoming]);

    const mergedTarget = createProject([existing]);
    expect(importClassBehaviorPackage(mergedTarget, createPackage(incoming), { conflictStrategy: "merge" }))
      .toMatchObject({ importedName: "ReusableDoor", replaced: false, merged: true, renamed: false });
    const merged = mergedTarget.types?.[0];
    expect(merged?.fields).toEqual([
      { name: "openCount", typeName: "Number", initializer: "99" },
      { name: "ownerName", typeName: "java.lang.String", initializer: "Alice" },
      { name: "doorColor", typeName: "java.lang.String", initializer: "red" },
    ]);
    expect(merged?.methods?.map((method) => [method.name, method.statements])).toEqual([
      ["openDoor", [{ kind: "call", object: "this", method: "swingOpen", arguments: ["degrees"] }]],
      ["isOpen", [{ kind: "return", expression: "this.openCount > 0" }]],
      ["closeDoor", [{ kind: "call", object: "this", method: "turn", arguments: ["RIGHT", "90"] }]],
    ]);
    expect(merged?.constructors?.map((constructorMethod) => constructorMethod.statements)).toEqual([
      [{ kind: "expression", expression: "this.ownerName = ownerName.trim()" }],
      [{ kind: "call", object: "this", method: "resetDoor", arguments: [] }],
    ]);

    const rejectedTarget = createProject([existing]);
    const beforeReject = JSON.stringify(rejectedTarget);
    expectPackageError(
      () => importClassBehaviorPackage(rejectedTarget, createPackage(incoming), { conflictStrategy: "reject" }),
      "class-behavior-conflict",
    );
    expect(JSON.stringify(rejectedTarget)).toBe(beforeReject);
  });
});
