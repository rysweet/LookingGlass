import { beforeAll, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { JSDOM } from "jsdom";
import { readProject } from "../src/project-io";
import { validateProjectArchive } from "../src/project-validation";

beforeAll(() => {
  if (typeof globalThis.DOMParser === "undefined") {
    globalThis.DOMParser = new JSDOM().window.DOMParser;
  }
});

function javaType(typeName: string, uuid: string): string {
  return `<node type="org.lgna.project.ast.JavaType" uuid="${uuid}"><type name="${typeName}"/></node>`;
}

function userParameter(name: string, typeName: string, uuid: string): string {
  return `<node type="org.lgna.project.ast.UserParameter" uuid="${uuid}">
    <property name="name"><value type="java.lang.String">${name}</value></property>
    <property name="valueType">${javaType(typeName, `${uuid}-type`)}</property>
  </node>`;
}

function integerLiteral(value: number, uuid: string): string {
  return `<node type="org.lgna.project.ast.IntegerLiteral" uuid="${uuid}">
    <property name="value"><value type="java.lang.Integer">${value}</value></property>
  </node>`;
}

function stringLiteral(value: string, uuid: string): string {
  return `<node type="org.lgna.project.ast.StringLiteral" uuid="${uuid}">
    <property name="value"><value type="java.lang.String">${value}</value></property>
  </node>`;
}

function expressionStatement(innerXml: string, uuid: string): string {
  return `<node type="org.lgna.project.ast.ExpressionStatement" uuid="${uuid}">
    <property name="expression">${innerXml}</property>
  </node>`;
}

function methodInvocation(options: {
  name: string;
  uuid: string;
  parameterTypes?: string[];
  argumentNodes?: string[];
}): string {
  const parameterTypes = options.parameterTypes ?? [];
  const argumentNodes = options.argumentNodes ?? [];
  return `<node type="org.lgna.project.ast.MethodInvocation" uuid="${options.uuid}">
    <property name="method">
      <node type="org.lgna.project.ast.UserMethod" uuid="${options.uuid}-method">
        <property name="name"><value type="java.lang.String">${options.name}</value></property>
        <property name="returnType">${javaType("void", `${options.uuid}-return`)}</property>
        <property name="requiredParameters"><collection type="java.util.ArrayList">${parameterTypes
          .map((typeName, index) => userParameter(`arg${index + 1}`, typeName, `${options.uuid}-param-${index + 1}`))
          .join("")}</collection></property>
      </node>
    </property>
    <property name="requiredArguments"><collection type="java.util.ArrayList">${argumentNodes.join("")}</collection></property>
    <property name="variableArguments"><collection type="java.util.ArrayList"/></property>
    <property name="keyedArguments"><collection type="java.util.ArrayList"/></property>
  </node>`;
}

function userMethod(options: {
  name: string;
  uuid: string;
  statements?: string[];
}): string {
  return `<node type="org.lgna.project.ast.UserMethod" uuid="${options.uuid}">
    <property name="name"><value type="java.lang.String">${options.name}</value></property>
    <property name="returnType">${javaType("void", `${options.uuid}-return`)}</property>
    <property name="requiredParameters"><collection type="java.util.ArrayList"/></property>
    <property name="body">
      <node type="org.lgna.project.ast.BlockStatement" uuid="${options.uuid}-body">
        <property name="statements"><collection type="java.util.ArrayList">${(options.statements ?? []).join("")}</collection></property>
      </node>
    </property>
  </node>`;
}

function field(name: string, valueTypeXml: string, uuid: string, initializerXml = ""): string {
  return `<node type="org.lgna.project.ast.UserField" uuid="${uuid}">
    <property name="name"><value type="java.lang.String">${name}</value></property>
    <property name="valueType">${valueTypeXml}</property>
    ${initializerXml}
  </node>`;
}

function namedUserType(options: {
  key?: string;
  uuid: string;
  name: string;
  superTypeXml: string;
  fields?: string[];
  methods?: string[];
}): string {
  const keyAttr = options.key ? ` key="${options.key}"` : "";
  return `<node${keyAttr} type="org.lgna.project.ast.NamedUserType" uuid="${options.uuid}" version="3.10062">
    <property name="name"><value type="java.lang.String">${options.name}</value></property>
    <property name="superType">${options.superTypeXml}</property>
    <property name="fields"><collection type="java.util.ArrayList">${(options.fields ?? []).join("")}</collection></property>
    <property name="methods"><collection type="java.util.ArrayList">${(options.methods ?? []).join("")}</collection></property>
    <property name="constructors"><collection type="java.util.ArrayList"/></property>
  </node>`;
}

function textureNode(path: string, uuid: string): string {
  return `<node type="org.lgna.project.ast.TextureReference" uuid="${uuid}">
    <property name="texturePath"><value type="java.lang.String">${path}</value></property>
  </node>`;
}

async function createArchive(xmlText: string, resources?: Record<string, Uint8Array>): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("version.txt", "3.10.0.0");
  zip.file("programType.xml", xmlText);
  for (const [path, bytes] of Object.entries(resources ?? {})) {
    zip.file(path, bytes);
  }
  return zip.generateAsync({ type: "uint8array" });
}

function validProjectXml(extraSceneFields: string[] = [], extraSceneMethods: string[] = [], extraNodes = ""): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<node key="program" type="org.lgna.project.ast.NamedUserType" uuid="program" version="3.10062">
  <property name="name"><value type="java.lang.String">Program</value></property>
  <property name="superType">${javaType("org.lgna.story.SProgram", "program-super")}</property>
  <property name="fields"><collection type="java.util.ArrayList">
    ${field("myScene", namedUserType({
      key: "scene-type",
      uuid: "scene-type",
      name: "Scene",
      superTypeXml: javaType("org.lgna.story.SScene", "scene-super"),
      fields: [field("ground", javaType("org.lgna.story.SGround", "ground-type"), "ground-field"), ...extraSceneFields],
      methods: extraSceneMethods,
    }), "scene-field")}
  </collection></property>
  <property name="methods"><collection type="java.util.ArrayList"/></property>
  <property name="constructors"><collection type="java.util.ArrayList"/></property>
  ${extraNodes}
</node>`;
}

describe("project-validation", () => {
  it("accepts a structurally valid project archive", async () => {
    const archiveBytes = await createArchive(validProjectXml(), {
      "resources/textures/ground.png": new Uint8Array([1, 2, 3]),
    });
    const archive = await readProject(archiveBytes);

    const result = await validateProjectArchive(archive);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports unresolved types, method signature mismatches, and missing resources with line and column information", async () => {
    const xml = validProjectXml(
      [
        field("mystery", javaType("MissingType", "missing-type"), "mystery-field"),
      ],
      [
        userMethod({
          name: "problematicCalls",
          uuid: "problematic-calls",
          statements: [
            expressionStatement(
              methodInvocation({
                name: "announce",
                uuid: "bad-type-call",
                parameterTypes: ["java.lang.String"],
                argumentNodes: [integerLiteral(7, "bad-type-arg")],
              }),
              "bad-type-statement",
            ),
            expressionStatement(
              methodInvocation({
                name: "announce",
                uuid: "bad-count-call",
                parameterTypes: ["java.lang.String"],
                argumentNodes: [],
              }),
              "bad-count-statement",
            ),
          ],
        }),
      ],
      textureNode("resources/textures/missing.png", "missing-texture"),
    );
    const archive = await readProject(await createArchive(xml));

    const result = await validateProjectArchive(archive);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "unresolved-type-reference",
        "invalid-method-argument-type",
        "invalid-method-argument-count",
        "missing-resource-reference",
      ]),
    );
    expect(result.errors.every((error) => error.line > 0 && error.column > 0)).toBe(true);
    expect(result.errors.some((error) => error.message.includes("MissingType"))).toBe(true);
    expect(result.errors.some((error) => error.message.includes("expects 1 arguments but received 0"))).toBe(true);
    expect(result.errors.some((error) => error.message.includes("expects java.lang.String but received java.lang.Integer"))).toBe(true);
    expect(result.errors.some((error) => error.message.includes("resources/textures/missing.png"))).toBe(true);
  });

  it("rejects circular type hierarchies", async () => {
    const cycleA = namedUserType({
      key: "cycle-a",
      uuid: "cycle-a",
      name: "CycleA",
      superTypeXml: `<node key="cycle-b"/>`,
    });
    const cycleB = namedUserType({
      key: "cycle-b",
      uuid: "cycle-b",
      name: "CycleB",
      superTypeXml: `<node key="cycle-a"/>`,
    });
    const xml = validProjectXml([
      field("cycleA", cycleA, "cycle-a-field"),
      field("cycleB", cycleB, "cycle-b-field"),
      field(
        "label",
        javaType("java.lang.String", "label-type"),
        "label-field",
        `<property name="initializer">${stringLiteral("ok", "label-literal")}</property>`,
      ),
    ]);
    const archive = await readProject(await createArchive(xml));

    const result = await validateProjectArchive(archive);

    expect(result.valid).toBe(false);
    const cycleErrors = result.errors.filter((error) => error.code === "circular-type-hierarchy");
    expect(cycleErrors.length).toBeGreaterThanOrEqual(2);
    expect(cycleErrors.some((error) => error.message.includes("CycleA -> CycleB -> CycleA"))).toBe(true);
  });
});
