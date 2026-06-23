import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { execFileSync, execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import JSZip from "jszip";
import { readProject } from "../src/project-io.js";

let evidenceDir: string;
let testProjectPath: string;

beforeAll(() => {
  execSync("npm run build:server", { stdio: "inherit" });
});

function runTool(toolName: string, args: string[]): string {
  return execFileSync(path.resolve("tools", toolName), args, {
    encoding: "utf-8",
    timeout: 10000,
  }).trim();
}

function runToolRaw(toolName: string, args: string[]) {
  return spawnSync(path.resolve("tools", toolName), args, {
    encoding: "utf-8",
    timeout: 10000,
  });
}

beforeEach(async () => {
  evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), "alice-hooks-test-"));
  // Create a minimal test .a3p
  const zip = new JSZip();
  zip.file("version.txt", "3.10.0.0");
  zip.file(
    "programType.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<node key="1" type="org.lgna.project.ast.NamedUserType" uuid="program" version="3.10062">
  <property name="name"><value type="java.lang.String">Program</value></property>
  <property name="superType">
    <node key="2" type="org.lgna.project.ast.JavaType" uuid="program-super">
      <type name="org.lgna.story.SProgram"/>
    </node>
  </property>
  <property name="fields">
    <collection type="java.util.ArrayList">
      <node key="scene-field" type="org.lgna.project.ast.UserField" uuid="scene-field-uuid">
        <property name="name"><value type="java.lang.String">myScene</value></property>
        <property name="valueType">
          <node key="scene-type" type="org.lgna.project.ast.NamedUserType" uuid="scene-type-uuid">
            <property name="name"><value type="java.lang.String">Scene</value></property>
            <property name="superType">
              <node key="scene-super" type="org.lgna.project.ast.JavaType" uuid="scene-super-uuid">
                <type name="org.lgna.story.SScene"/>
              </node>
            </property>
            <property name="fields"><collection type="java.util.ArrayList"/></property>
            <property name="methods"><collection type="java.util.ArrayList"/></property>
            <property name="constructors"><collection type="java.util.ArrayList"/></property>
          </node>
        </property>
      </node>
    </collection>
  </property>
  <property name="methods"><collection type="java.util.ArrayList"/></property>
  <property name="constructors"><collection type="java.util.ArrayList"/></property>
</node>`,
  );
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  testProjectPath = path.join(evidenceDir, "test-input.a3p");
  fs.writeFileSync(testProjectPath, buf);
});

afterEach(() => {
  fs.rmSync(evidenceDir, { recursive: true, force: true });
});

function runHook(hookName: string, extraArgs: string[] = [], projectPath = testProjectPath): string {
  const hookPath = path.resolve("dist-server/hooks", `${hookName}.js`);
  const evidenceSubdir = path.join(evidenceDir, hookName);
  fs.mkdirSync(evidenceSubdir, { recursive: true });
  const args = [
    "--project",
    projectPath,
    "--evidence-dir",
    evidenceSubdir,
    "--json",
    ...extraArgs,
  ];
  return execFileSync("node", [hookPath, ...args], {
    encoding: "utf-8",
    timeout: 10000,
  }).trim();
}

describe("eatme CLI hooks", () => {
  it("place-object produces valid JSON and artifacts", () => {
    const stdout = runHook("place-object");
    const result = JSON.parse(stdout);
    expect(result.schema_version).toBe(
      "eatme.alice-object-placement-result/v1",
    );
    expect(result.status).toBe("placed");
    expect(result.placement_artifact).toBe("placement.json");

    const hookEvidenceDir = path.join(evidenceDir, "place-object");
    expect(fs.existsSync(path.join(hookEvidenceDir, "placed-project.a3p"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(hookEvidenceDir, "placement.json"))).toBe(true);
    expect(fs.existsSync(path.join(hookEvidenceDir, "scene.diff.json"))).toBe(true);

    const placement = JSON.parse(
      fs.readFileSync(path.join(hookEvidenceDir, "placement.json"), "utf-8"),
    );
    expect(placement.schema_version).toBe(
      "eatme.alice-object-placement-artifact/v1",
    );
    expect(placement.object_class).toBe("org.lgna.story.SBiped");
  });

  it("place-object honors explicit names and resource types", () => {
    const stdout = runHook("place-object", [
      "--name",
      "heroBunny",
      "--resource-type",
      "org.lgna.story.resources.biped.BunnyResource",
    ]);
    const result = JSON.parse(stdout);
    expect(result.object_identifier).toBe("heroBunny");

    const hookEvidenceDir = path.join(evidenceDir, "place-object");
    const placement = JSON.parse(
      fs.readFileSync(path.join(hookEvidenceDir, "placement.json"), "utf-8"),
    );
    const diff = JSON.parse(
      fs.readFileSync(path.join(hookEvidenceDir, "scene.diff.json"), "utf-8"),
    );
    expect(placement.object_identifier).toBe("heroBunny");
    expect(placement.resource_type).toBe(
      "org.lgna.story.resources.biped.BunnyResource",
    );
    expect(diff.added_fields).toEqual(["heroBunny"]);
  });

  it("edit-procedure produces valid JSON and artifacts", () => {
    const stdout = runHook("edit-procedure");
    const result = JSON.parse(stdout);
    expect(result.schema_version).toBe(
      "eatme.alice-first-lesson-code-editor-action-proof-result/v1",
    );
    expect(result.status).toBe("proved");
    expect(result.procedure_selector).toBe("scene.eatmeFirstLessonStep");

    const hookEvidenceDir = path.join(evidenceDir, "edit-procedure");
    expect(
      fs.existsSync(path.join(hookEvidenceDir, "edited-project.a3p")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(hookEvidenceDir, "first-lesson-code-editor-action-proof.json"),
      ),
    ).toBe(true);
  });

  it("edit-procedure creates missing methods for plain selectors and custom markers", () => {
    const stdout = runHook("edit-procedure", [
      "--procedure-selector",
      "customStep",
      "--edit-spec",
      "append-comment:custom-marker",
    ]);
    const result = JSON.parse(stdout);
    expect(result.procedure_selector).toBe("customStep");

    const hookEvidenceDir = path.join(evidenceDir, "edit-procedure");
    const diff = JSON.parse(
      fs.readFileSync(path.join(hookEvidenceDir, "procedure.diff.json"), "utf-8"),
    );
    expect(diff.method_name).toBe("customStep");
    expect(diff.before_statement_count).toBe(0);
    expect(diff.after_statement_count).toBe(1);
    expect(diff.added_statements).toEqual(["custom-marker"]);
  });

  it("run-world produces valid JSON and artifacts", () => {
    const stdout = runHook("run-world");
    const result = JSON.parse(stdout);
    expect(result.schema_version).toBe("eatme.alice-run-world-result/v1");
    expect(result.status).toBe("completed");

    const hookEvidenceDir = path.join(evidenceDir, "run-world");
    expect(
      fs.existsSync(path.join(hookEvidenceDir, "run-world-result.json")),
    ).toBe(true);
  });

  it("save-project produces valid JSON and artifacts", () => {
    const stdout = runHook("save-project", [
      "--save-selector",
      "scene.eatmeFirstLessonStep",
    ]);
    const result = JSON.parse(stdout);
    expect(result.schema_version).toBe("eatme.alice-project-save-result/v1");
    expect(result.status).toBe("saved");

    const hookEvidenceDir = path.join(evidenceDir, "save-project");
    expect(
      fs.existsSync(path.join(hookEvidenceDir, "saved-project.a3p")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(hookEvidenceDir, "desktop-save-operation-result.json"),
      ),
    ).toBe(true);

    const saveResult = JSON.parse(
      fs.readFileSync(
        path.join(hookEvidenceDir, "desktop-save-operation-result.json"),
        "utf-8",
      ),
    );
    expect(saveResult.schema_version).toBe(
      "eatme.alice-desktop-save-operation-result/v1",
    );
    expect(saveResult.status).toBe("saved");
    expect(saveResult.saved_file_size_bytes).toBeGreaterThan(0);
  });

  it("save-project preserves custom targets while emitting canonical evidence copy", () => {
    const customTarget = path.join(evidenceDir, "custom-output", "lesson-copy.a3p");
    const stdout = runHook("save-project", [
      "--save-selector",
      "scene.eatmeFirstLessonStep",
      "--target",
      customTarget,
    ]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("saved");

    const hookEvidenceDir = path.join(evidenceDir, "save-project");
    expect(fs.existsSync(customTarget)).toBe(true);
    expect(
      fs.existsSync(path.join(hookEvidenceDir, "saved-project.a3p")),
    ).toBe(true);
  });

  it("transform-object produces valid JSON and transformed project artifacts", async () => {
    const placeResult = JSON.parse(runHook("place-object", ["--name", "heroBunny"]));
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");

    const stdout = runHook("transform-object", ["--object-identifier", placeResult.object_identifier], placedProject);
    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      schema_version: "eatme.alice-object-transform-result/v1",
      status: "transformed",
      object_id: "heroBunny",
      transform_artifact: "object-transform.json",
      transformed_project_artifact: "transformed-object-project.a3p",
    });

    const hookEvidenceDir = path.join(evidenceDir, "transform-object");
    const transformedProject = path.join(hookEvidenceDir, "transformed-object-project.a3p");
    expect(fs.existsSync(transformedProject)).toBe(true);
    expect(fs.existsSync(path.join(hookEvidenceDir, "object-transform.json"))).toBe(true);

    const archive = await readProject(fs.readFileSync(transformedProject));
    expect(archive.project.sceneObjects.find((object) => object.name === "heroBunny")?.position?.x).toBe(1);
  });

  it("reopen-project proves same-run saved project state", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("transform-object", ["--object-identifier", "heroBunny"], placedProject);
    const transformedProject = path.join(evidenceDir, "transform-object", "transformed-object-project.a3p");
    runHook("edit-procedure", [
      "--procedure-selector",
      "scene.myFirstMethod",
      "--edit-spec",
      "append-comment:movement-proof",
    ], transformedProject);
    const editedProject = path.join(evidenceDir, "edit-procedure", "edited-project.a3p");
    runHook("run-world", [], editedProject);
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      editedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "scene.myFirstMethod",
    ]);

    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });
    const stdout = runTool("eatme-reopen-project", [
      "--saved-project",
      path.join(evidenceDir, "project-save", "saved-project.a3p"),
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ]);
    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      schema_version: "eatme.alice-project-reopen-result/v1",
      status: "reopened",
      source_saved_project_artifact: "project-save/saved-project.a3p",
      reopen_selector: "objects-first-full-path",
      reopened_project_artifact: "reopened-project.a3p",
      reopen_artifact: "project-reopen.json",
      reopened_state_artifact: "reopened-state.json",
      state_verification: "passed",
    });

    for (const artifact of [
      result.reopened_project_artifact,
      result.reopen_artifact,
      result.reopened_state_artifact,
    ]) {
      const artifactPath = path.join(reopenEvidenceDir, artifact);
      expect(fs.existsSync(artifactPath)).toBe(true);
      expect(fs.statSync(artifactPath).size).toBeGreaterThan(0);
    }

    const state = JSON.parse(fs.readFileSync(path.join(reopenEvidenceDir, "reopened-state.json"), "utf8"));
    expect(state.object_id).toBe("heroBunny");
    expect(state.transform.position.x).toBe(1);
    expect(state.procedure_selector).toBe("objects-first-full-path");
    expect(state.movement.present).toBe(true);
    expect(state.object_identities).toEqual(
      expect.arrayContaining([expect.objectContaining({ object_id: "heroBunny" })]),
    );
    expect(state.method_names).toContain("myFirstMethod");
    expect(state.prior_run_evidence_artifact).toBe("run-world/run-world-result.json");
  });

  it("reopen-project rejects non-canonical saved artifacts", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("edit-procedure", [
      "--procedure-selector",
      "scene.myFirstMethod",
      "--edit-spec",
      "append-comment:movement-proof",
    ], placedProject);
    const editedProject = path.join(evidenceDir, "edit-procedure", "edited-project.a3p");
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      editedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "scene.myFirstMethod",
    ]);

    const alternateSavedProject = path.join(saveEvidenceDir, "alternate.a3p");
    fs.copyFileSync(path.join(saveEvidenceDir, "saved-project.a3p"), alternateSavedProject);
    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });

    expect(() => runTool("eatme-reopen-project", [
      "--saved-project",
      alternateSavedProject,
      "--reopen-selector",
      "scene.myFirstMethod",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ])).toThrow(/project-save\/saved-project\.a3p/);
  });

  it("reopen-project rejects saved projects without movement procedure evidence", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      placedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "objects-first-full-path",
    ]);

    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });
    expect(() => runTool("eatme-reopen-project", [
      "--saved-project",
      path.join(saveEvidenceDir, "saved-project.a3p"),
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ])).toThrow(/procedure edit proof/);
  });

  it("reopen-project rejects transform state drift", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("transform-object", ["--object-identifier", "heroBunny"], placedProject);
    runHook("edit-procedure", [
      "--procedure-selector",
      "scene.myFirstMethod",
      "--edit-spec",
      "append-comment:movement-proof",
    ], placedProject);
    const editedProject = path.join(evidenceDir, "edit-procedure", "edited-project.a3p");
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      editedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "objects-first-full-path",
    ]);

    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });
    expect(() => runTool("eatme-reopen-project", [
      "--saved-project",
      path.join(saveEvidenceDir, "saved-project.a3p"),
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ])).toThrow(/transform does not match/);
  });

  it("reopen-project rejects saved projects missing same-run transform evidence", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("edit-procedure", [
      "--procedure-selector",
      "scene.myFirstMethod",
      "--edit-spec",
      "append-comment:movement-proof",
    ], placedProject);
    const editedProject = path.join(evidenceDir, "edit-procedure", "edited-project.a3p");
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      editedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "objects-first-full-path",
    ]);

    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });
    expect(() => runTool("eatme-reopen-project", [
      "--saved-project",
      path.join(saveEvidenceDir, "saved-project.a3p"),
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ])).toThrow(/transform-object\/object-transform\.json/);
  });

  it("reopen-project rejects saved projects missing the transformed object", () => {
    runHook("place-object", ["--name", "heroBunny"]);
    const placedProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("transform-object", ["--object-identifier", "heroBunny"], placedProject);
    runHook("place-object", ["--name", "otherBunny"]);
    const otherProject = path.join(evidenceDir, "place-object", "placed-project.a3p");
    runHook("edit-procedure", [
      "--procedure-selector",
      "scene.myFirstMethod",
      "--edit-spec",
      "append-comment:movement-proof",
    ], otherProject);
    const editedProject = path.join(evidenceDir, "edit-procedure", "edited-project.a3p");
    const saveEvidenceDir = path.join(evidenceDir, "project-save");
    fs.mkdirSync(saveEvidenceDir, { recursive: true });
    runTool("eatme-save-project", [
      "--project",
      editedProject,
      "--evidence-dir",
      saveEvidenceDir,
      "--json",
      "--save-selector",
      "objects-first-full-path",
    ]);

    const reopenEvidenceDir = path.join(evidenceDir, "project-reopen");
    fs.mkdirSync(reopenEvidenceDir, { recursive: true });
    expect(() => runTool("eatme-reopen-project", [
      "--saved-project",
      path.join(saveEvidenceDir, "saved-project.a3p"),
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      reopenEvidenceDir,
      "--json",
    ])).toThrow(/transformed object: heroBunny/);
  });

  it("transform-object fails closed for invalid inputs", () => {
    const help = runToolRaw("eatme-transform-object", ["--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Usage: transform-object");

    const missingJson = runToolRaw("eatme-transform-object", [
      "--project",
      testProjectPath,
      "--evidence-dir",
      path.join(evidenceDir, "bad-transform"),
    ]);
    expect(missingJson.status).not.toBe(0);
    expect(missingJson.stderr).toContain("--json is required");

    const missingObject = runToolRaw("eatme-transform-object", [
      "--project",
      testProjectPath,
      "--evidence-dir",
      path.join(evidenceDir, "bad-transform"),
      "--object-identifier",
      "missingObject",
      "--json",
    ]);
    expect(missingObject.status).not.toBe(0);
    expect(missingObject.stderr).toContain("project has no scene object to transform");
  });

  it("reopen-project fails closed for invalid inputs", () => {
    const help = runToolRaw("eatme-reopen-project", ["--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Usage: reopen-project");

    const missingSavedProject = runToolRaw("eatme-reopen-project", [
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      path.join(evidenceDir, "bad-reopen"),
      "--json",
    ]);
    expect(missingSavedProject.status).not.toBe(0);
    expect(missingSavedProject.stderr).toContain("--saved-project is required");

    const outsideRunSavedProject = path.join(evidenceDir, "saved-project.a3p");
    fs.copyFileSync(testProjectPath, outsideRunSavedProject);
    const outsideRun = runToolRaw("eatme-reopen-project", [
      "--saved-project",
      outsideRunSavedProject,
      "--reopen-selector",
      "objects-first-full-path",
      "--evidence-dir",
      path.join(evidenceDir, "project-reopen"),
      "--json",
    ]);
    expect(outsideRun.status).not.toBe(0);
    expect(outsideRun.stderr).toContain("project-save evidence directory");
  });
});
