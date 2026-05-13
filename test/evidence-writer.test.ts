import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  writeSceneObjectAdded,
  writeEditProcedureProof,
  editProcedureResultJson,
  writeSaveProof,
  saveProjectResultJson,
  ARTIFACT_NAMES,
} from "../src/evidence-writer";

const TEST_EVIDENCE_DIR = path.resolve(__dirname, "../.test-evidence");

describe("evidence-writer", () => {
  beforeAll(() => {
    fs.mkdirSync(TEST_EVIDENCE_DIR, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(TEST_EVIDENCE_DIR, { recursive: true, force: true });
  });

  describe("writeSceneObjectAdded", () => {
    it("writes valid JSON matching Java schema", () => {
      const artifactPath = writeSceneObjectAdded(TEST_EVIDENCE_DIR, {
        objectClassName: "org.lgna.story.SBiped",
        sceneFieldCountAfter: 5,
      });
      const content = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

      expect(content.schema_version).toBe("eatme.alice-scene-object-added/v1");
      expect(content.object_class_name).toBe("org.lgna.story.SBiped");
      expect(content.scene_field_count_after).toBe(5);
      expect(typeof content.timestamp).toBe("number");
      expect(content.timestamp).toBeGreaterThan(0);
    });

    it("creates the correct filename", () => {
      const artifactPath = writeSceneObjectAdded(TEST_EVIDENCE_DIR, {
        objectClassName: "org.lgna.story.SProp",
        sceneFieldCountAfter: 3,
      });
      expect(path.basename(artifactPath)).toBe(
        ARTIFACT_NAMES.sceneObjectAdded,
      );
    });

    it("creates evidence dir if missing", () => {
      const nestedDir = path.join(TEST_EVIDENCE_DIR, "nested-scene-test");
      writeSceneObjectAdded(nestedDir, {
        objectClassName: "Foo",
        sceneFieldCountAfter: 1,
      });
      expect(fs.existsSync(nestedDir)).toBe(true);
      fs.rmSync(nestedDir, { recursive: true, force: true });
    });
  });

  describe("writeEditProcedureProof", () => {
    it("writes valid JSON matching Java schema", () => {
      const artifactPath = writeEditProcedureProof(TEST_EVIDENCE_DIR, {
        procedureSelector: "scene.myFirstMethod",
        editSpec: "append-comment:eatme first lesson edit proof",
        inputProjectArtifact: "starter.a3p",
        sceneType: "Scene",
        methodName: "myFirstMethod",
        marker: "eatme first lesson edit proof",
        beforeStatementCount: 0,
        afterStatementCount: 1,
        beforeMethods: ["myFirstMethod"],
        afterMethods: ["myFirstMethod"],
        editedProject: "edited-project.a3p",
      });
      const content = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

      expect(content.schema_version).toBe(
        "eatme.alice-first-lesson-code-editor-action-proof/v1",
      );
      expect(content.status).toBe("proved");
      expect(content.procedure_selector).toBe("scene.myFirstMethod");
      expect(content.edit_spec).toBe(
        "append-comment:eatme first lesson edit proof",
      );
      expect(content.method_name).toBe("myFirstMethod");
      expect(content.marker).toBe("eatme first lesson edit proof");
      expect(content.before_statement_count).toBe(0);
      expect(content.after_statement_count).toBe(1);
      expect(content.statement_count_delta).toBe(1);
      expect(content.target_marker_count).toBe(1);
      expect(content.wrong_target_marker_count).toBe(0);
      expect(content.success).toBe(true);
      expect(content.edited_project).toBe("edited-project.a3p");
      expect(Array.isArray(content.doesNotClaim)).toBe(true);
      expect(content.before_methods).toEqual(["myFirstMethod"]);
      expect(content.after_methods).toEqual(["myFirstMethod"]);
    });

    it("creates the correct filename", () => {
      const artifactPath = writeEditProcedureProof(TEST_EVIDENCE_DIR, {
        procedureSelector: "scene.myFirstMethod",
        editSpec: "append-comment:test",
        inputProjectArtifact: "test.a3p",
        sceneType: "Scene",
        methodName: "myFirstMethod",
        marker: "test",
        beforeStatementCount: 0,
        afterStatementCount: 1,
        beforeMethods: [],
        afterMethods: [],
        editedProject: "edited-project.a3p",
      });
      expect(path.basename(artifactPath)).toBe(
        ARTIFACT_NAMES.editProcedureProof,
      );
    });
  });

  describe("editProcedureResultJson", () => {
    it("returns valid JSON matching eatme hook result schema", () => {
      const json = editProcedureResultJson("scene.myFirstMethod");
      const result = JSON.parse(json);

      expect(result.schema_version).toBe(
        "eatme.alice-first-lesson-code-editor-action-proof-result/v1",
      );
      expect(result.status).toBe("proved");
      expect(result.procedure_selector).toBe("scene.myFirstMethod");
      expect(result.edited_project_artifact).toBe("edited-project.a3p");
      expect(result.action_proof).toBe(
        "first-lesson-code-editor-action-proof.json",
      );
    });
  });

  describe("writeSaveProof", () => {
    it("writes valid JSON matching Java save schema", () => {
      const artifactPath = writeSaveProof(TEST_EVIDENCE_DIR, {
        savedFilePath: "/some/path/saved.a3p",
        fileSizeBytes: 12345,
      });
      const content = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

      expect(content.schema_version).toBe(
        "eatme.alice-desktop-save-operation-result/v1",
      );
      expect(content.status).toBe("saved");
      expect(content.finished).toBe(true);
      expect(content.canceled).toBe(false);
      expect(content.saved_file_exists).toBe(true);
      expect(content.saved_file_size_bytes).toBe(12345);
      expect(content.wroteFile).toBe(true);
      expect(content.fileExtension).toBe("a3p");
      expect(Array.isArray(content.doesNotClaim)).toBe(true);
    });
  });

  describe("saveProjectResultJson", () => {
    it("returns valid JSON matching eatme save hook result schema", () => {
      const json = saveProjectResultJson(
        "scene.myFirstMethod",
        "saved-project.a3p",
        "desktop-save-operation-result.json",
      );
      const result = JSON.parse(json);

      expect(result.schema_version).toBe("eatme.alice-project-save-result/v1");
      expect(result.status).toBe("saved");
      expect(result.save_selector).toBe("scene.myFirstMethod");
      expect(result.saved_project_artifact).toBe("saved-project.a3p");
      expect(result.save_artifact).toBe(
        "desktop-save-operation-result.json",
      );
    });
  });
});
