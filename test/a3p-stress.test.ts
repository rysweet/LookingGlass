import { beforeAll, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseA3P } from "../src/a3p-parser";
import { writeA3P } from "../src/a3p-writer";
import { readProject, writeProject } from "../src/project-io";

beforeAll(async () => {
  if (typeof globalThis.DOMParser === "undefined" || typeof globalThis.XMLSerializer === "undefined") {
    const { JSDOM } = await import("jsdom");
    const window = new JSDOM().window;
    globalThis.DOMParser = window.DOMParser;
    globalThis.XMLSerializer = window.XMLSerializer;
  }
});

async function createArchive(options: {
  xmlText?: string;
  resources?: Map<string, Uint8Array>;
  version?: string;
} = {}): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("version.txt", options.version ?? "3.10.0.0");
  zip.file("programType.xml", options.xmlText ?? buildProjectXml(4));

  for (const [path, bytes] of options.resources ?? new Map()) {
    zip.file(path, bytes);
  }

  return zip.generateAsync({ type: "uint8array" });
}

function buildProjectXml(customTypeCount: number): string {
  const customFields = Array.from({ length: customTypeCount }, (_, index) => {
    const id = index + 1;
    return `
                <node key="field-${id}" type="org.lgna.project.ast.UserField" uuid="field-${id}">
                  <property name="name"><value type="java.lang.String">generatedObject${id}</value></property>
                  <property name="valueType">
                    <node key="type-${id}" type="org.lgna.project.ast.NamedUserType" uuid="type-${id}">
                      <property name="name"><value type="java.lang.String">GeneratedType${id}</value></property>
                      <property name="superType">
                        <node key="type-super-${id}" type="org.lgna.project.ast.JavaType" uuid="type-super-${id}">
                          <type name="org.lgna.story.SProp"/>
                        </node>
                      </property>
                      <property name="fields"><collection type="java.util.ArrayList"/></property>
                      <property name="methods"><collection type="java.util.ArrayList"/></property>
                      <property name="constructors"><collection type="java.util.ArrayList"/></property>
                    </node>
                  </property>
                  <property name="initializer">
                    <node type="org.lgna.project.ast.InstanceCreation" uuid="init-${id}">
                      <resourceReference name="org.lgna.story.resources.prop.BushResource"/>
                    </node>
                  </property>
                </node>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<node key="1" type="org.lgna.project.ast.NamedUserType" uuid="program-root" version="3.10062">
  <property name="name"><value type="java.lang.String">Program</value></property>
  <property name="superType">
    <node key="2" type="org.lgna.project.ast.JavaType" uuid="program-super">
      <type name="org.lgna.story.SProgram"/>
    </node>
  </property>
  <property name="fields">
    <collection type="java.util.ArrayList">
      <node key="scene-field" type="org.lgna.project.ast.UserField" uuid="scene-field">
        <property name="name"><value type="java.lang.String">myScene</value></property>
        <property name="valueType">
          <node key="scene-type" type="org.lgna.project.ast.NamedUserType" uuid="scene-type">
            <property name="name"><value type="java.lang.String">Scene</value></property>
            <property name="superType">
              <node key="scene-super" type="org.lgna.project.ast.JavaType" uuid="scene-super">
                <type name="org.lgna.story.SScene"/>
              </node>
            </property>
            <property name="fields">
              <collection type="java.util.ArrayList">${customFields}
              </collection>
            </property>
            <property name="methods"><collection type="java.util.ArrayList"/></property>
            <property name="constructors"><collection type="java.util.ArrayList"/></property>
          </node>
        </property>
      </node>
    </collection>
  </property>
  <property name="methods"><collection type="java.util.ArrayList"/></property>
  <property name="constructors"><collection type="java.util.ArrayList"/></property>
</node>`;
}

function createResourceBytes(seed: number, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    bytes[index] = (seed * 37 + index * 13) % 256;
  }
  return bytes;
}

describe("a3p stress", () => {
  it("round-trips a project with more than one hundred types", async () => {
    const original = await parseA3P(await createArchive({ xmlText: buildProjectXml(128) }));
    expect(original.types?.length ?? 0).toBeGreaterThan(100);

    const written = await writeA3P(original);
    const roundTripped = await parseA3P(written);

    expect(roundTripped.types?.map((type) => type.name)).toEqual(original.types?.map((type) => type.name));
    expect(roundTripped.sceneObjects.map((object) => object.name)).toEqual(
      original.sceneObjects.map((object) => object.name),
    );
  });

  it("round-trips more than one thousand resources", async () => {
    const resources = new Map<string, Uint8Array>();
    for (let index = 0; index < 1024; index++) {
      resources.set(`resources/bin/resource-${String(index).padStart(4, "0")}.bin`, createResourceBytes(index, 48));
    }

    const archive = await readProject(await createArchive({ resources }));
    expect(archive.resourceEntries).toHaveLength(1024);

    const roundTripped = await readProject(await writeProject(archive));
    expect(roundTripped.resourceEntries).toHaveLength(1024);

    for (const index of [0, 1, 127, 512, 1023]) {
      const path = `resources/bin/resource-${String(index).padStart(4, "0")}.bin`;
      expect(roundTripped.resources.get(path)).toEqual(resources.get(path));
    }
  });

  it("parses xml documents larger than one hundred kilobytes", async () => {
    const xmlText = buildProjectXml(220);
    expect(new TextEncoder().encode(xmlText).length).toBeGreaterThan(100 * 1024);

    const project = await parseA3P(await createArchive({ xmlText }));

    expect(project.projectName).toBe("Program");
    expect(project.types?.length ?? 0).toBeGreaterThanOrEqual(221);
    expect(project.sceneObjects.length).toBeGreaterThanOrEqual(220);
  });

  it("preserves binary resource bytes through project round-trip", async () => {
    const binary = new Uint8Array(8192);
    for (let index = 0; index < binary.length; index++) {
      binary[index] = index % 256;
    }

    const resources = new Map<string, Uint8Array>([
      ["resources/blob/full-range.bin", binary],
      ["resources/audio/theme.wav", createResourceBytes(77, 257)],
    ]);

    const roundTrippedBytes = await writeProject(await readProject(await createArchive({ resources })));
    const roundTripped = await readProject(roundTrippedBytes);
    const zip = await JSZip.loadAsync(roundTrippedBytes);

    expect(roundTripped.resources.get("resources/blob/full-range.bin")).toEqual(binary);
    expect(roundTripped.resources.get("resources/audio/theme.wav")).toEqual(resources.get("resources/audio/theme.wav"));
    expect(await zip.file("resources/blob/full-range.bin")!.async("uint8array")).toEqual(binary);
  });
});
