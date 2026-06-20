import { afterEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import request from "supertest";
import { Clipboard } from "../src/clipboard.js";
import { formatConfig, printUsage } from "../src/cli.js";
import {
  writeEditProcedureProof,
  writeSaveProof,
} from "../src/evidence-writer.js";
import { IdeMenuBarModel } from "../src/menubar.js";
import type { MaterialDefinition } from "../src/materials.js";
import type { ModelGeometryData } from "../src/model-resources/definitions.js";
import { exportModelToGlb } from "../src/open-asset-pipeline/gltf-export.js";
import { PROCEDURAL_LICENSE } from "../src/open-asset-pipeline/types.js";
import { ProjectManager } from "../src/project-manager.js";
import { createServer } from "../src/server.js";
import { LOCAL_API_TOKEN_HEADER } from "../src/server/security.js";
import { UndoRedoManager } from "../src/undo-redo.js";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const ALICE_RUNTIME = "alice-web";
const ALICE_PRODUCT = "Alice";
const ALICE_LOCAL_API_HEADER = "X-Alice-Local-Api-Token";
const LOOKINGGLASS_LOCAL_API_HEADER = "X-LookingGlass-Local-Api-Token";
const TEST_LOCAL_API_TOKEN = "test-local-api-token";

const tempDirs: string[] = [];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf-8");
}

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readText(relativePath)) as Record<string, unknown>;
}

function makeTempDir(prefix = "alice-identity-"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function readArtifact(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
}

function makeTriangleGeometry(): ModelGeometryData {
  return {
    vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0, 1],
  };
}

const MATERIAL: MaterialDefinition = {
  name: "identity-material",
  diffuseColor: 0x99AAFF,
  specularColor: 0x000000,
  emissiveColor: 0x000000,
  opacity: 1,
  shininess: 0,
  visible: true,
  wireframe: false,
  flatShading: false,
  ethereal: false,
  alphaBlended: false,
  clamped: false,
};

async function readGltfAsset(glb: Uint8Array): Promise<Record<string, unknown>> {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  const jsonChunkLength = view.getUint32(12, true);
  const jsonChunk = glb.subarray(20, 20 + jsonChunkLength);
  const gltf = JSON.parse(new TextDecoder().decode(jsonChunk)) as {
    asset: Record<string, unknown>;
  };
  return gltf.asset;
}

function collectMarkdownFiles(): string[] {
  const files = ["README.md"];
  const stack = [path.join(PROJECT_ROOT, "docs")];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.relative(PROJECT_ROOT, fullPath));
      }
    }
  }
  return files.sort();
}

function expectNoForbiddenLookingGlassIdentity(
  relativePath: string,
  forbiddenTokens: readonly string[],
): void {
  const content = readText(relativePath);
  for (const token of forbiddenTokens) {
    expect(content, `${relativePath} must not contain ${token}`).not.toContain(token);
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("Alice identity boundary contract", () => {
  describe("package and helper metadata", () => {
    it("uses alice-web for npm package and executable identity", () => {
      const packageJson = readJson("package.json");
      const packageLock = readJson("package-lock.json");
      const lockPackages = packageLock.packages as Record<string, Record<string, unknown>>;

      expect(packageJson.name).toBe(ALICE_RUNTIME);
      expect(packageJson.bin).toEqual({ "alice-web": "./dist-server/cli.js" });
      expect(packageJson.bin).not.toHaveProperty("lookingglass");
      expect(packageLock.name).toBe(ALICE_RUNTIME);
      expect(lockPackages[""].name).toBe(ALICE_RUNTIME);
      expect(lockPackages[""].bin).toEqual({ "alice-web": "dist-server/cli.js" });
    });

    it("uses Alice/alice-web identity for Python helper metadata", () => {
      const pyproject = readText("pyproject.toml");
      const amplihackCli = readText("amplihack_cli.py");

      expect(pyproject).toContain('name = "alice-web-amplihack"');
      expect(pyproject).toContain("uvx-compatible outside-in test runner for Alice");
      expect(amplihackCli).toContain('DIST_NAME = "alice-web-amplihack"');
      expect(amplihackCli).toContain("Run Alice outside-in validation scenarios");
      expect(pyproject).not.toContain("lookingglass-amplihack");
      expect(amplihackCli).not.toContain('DIST_NAME = "lookingglass-amplihack"');
    });
  });

  describe("CLI runtime contract", () => {
    it("prints alice-web commands in usage text", () => {
      let output = "";
      const stream = {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      } as NodeJS.WriteStream;

      printUsage(stream);

      expect(output).toContain("alice-web serve");
      expect(output).toContain("alice-web print-config");
      expect(output).toContain("alice-web help");
      expect(output).not.toContain("lookingglass serve");
      expect(output).not.toContain("lookingglass print-config");
    });

    it("serializes Alice runtime config without exposing local API token values", () => {
      const token = "super-secret-token";
      const config = JSON.parse(formatConfig({
        command: "print-config",
        port: 4187,
        evidenceDir: "evidence/custom",
        project: "stories/demo.a3p",
        localApiToken: token,
      })) as Record<string, unknown>;

      expect(config).toMatchObject({
        command: "print-config",
        port: 4187,
        evidenceDir: path.resolve(PROJECT_ROOT, "evidence/custom"),
        project: path.resolve(PROJECT_ROOT, "stories/demo.a3p"),
        runtime: ALICE_RUNTIME,
      });
      expect(config).not.toHaveProperty("localApiToken");
      expect(JSON.stringify(config)).not.toContain(token);
      expect(String(config.runtime)).not.toContain("lookingglass");
    });
  });

  describe("server API identity and local auth contracts", () => {
    it("reports alice-web runtime identity from /api/health", async () => {
      const app = createServer({ port: 0, evidenceDir: makeTempDir() });

      const health = await request(app).get("/api/health").expect(200);

      expect(Object.keys(health.body).sort()).toEqual([
        "launched",
        "pid",
        "runtime",
        "status",
        "uptime",
      ]);
      expect(health.body.status).toBe("running");
      expect(health.body.runtime).toBe(ALICE_RUNTIME);
      expect(JSON.stringify(health.body)).not.toContain("LookingGlass");
      expect(JSON.stringify(health.body)).not.toContain("lookingglass");
    });

    it("uses only the Alice local API token header for mutating API requests", async () => {
      const app = createServer({
        port: 0,
        evidenceDir: makeTempDir(),
        localApiToken: TEST_LOCAL_API_TOKEN,
      });

      expect(LOCAL_API_TOKEN_HEADER).toBe(ALICE_LOCAL_API_HEADER);

      await request(app)
        .post("/api/launch")
        .set(ALICE_LOCAL_API_HEADER, TEST_LOCAL_API_TOKEN)
        .send({})
        .expect(200);

      const rejected = await request(app)
        .post("/api/launch")
        .set(LOOKINGGLASS_LOCAL_API_HEADER, TEST_LOCAL_API_TOKEN)
        .send({})
        .expect(401);
      expect(rejected.body.error).toBe("Missing or invalid local API token");
    });
  });

  describe("user-facing and generated metadata", () => {
    it("uses Alice as the default user-facing app name", () => {
      const model = new IdeMenuBarModel({
        projectManager: new ProjectManager(),
        undoRedoManager: new UndoRedoManager(),
        clipboard: new Clipboard(),
      });

      const about = model.getAboutDialog();

      expect(about.applicationName).toBe(ALICE_PRODUCT);
      expect(about.summary).toContain("Alice");
      expect(JSON.stringify(about)).not.toContain("LookingGlass");
    });

    it("writes Alice runtime identity into evidence metadata without changing eatme schemas", () => {
      const evidenceDir = makeTempDir();
      const editProof = writeEditProcedureProof(evidenceDir, {
        procedureSelector: "scene.myFirstMethod",
        editSpec: "append-comment:identity",
        inputProjectArtifact: "starter.a3p",
        sceneType: "Scene",
        methodName: "myFirstMethod",
        marker: "identity",
        beforeStatementCount: 0,
        afterStatementCount: 1,
        beforeMethods: ["myFirstMethod"],
        afterMethods: ["myFirstMethod"],
        editedProject: "edited-project.a3p",
      });
      const saveProof = writeSaveProof(evidenceDir, {
        savedFilePath: path.join(evidenceDir, "saved-project.a3p"),
        fileSizeBytes: 42,
      });

      expect(readArtifact(editProof)).toMatchObject({
        schema_version: "eatme.alice-first-lesson-code-editor-action-proof/v1",
        code_editor_backing: ALICE_RUNTIME,
      });
      expect(readArtifact(saveProof)).toMatchObject({
        schema_version: "eatme.alice-desktop-save-operation-result/v1",
        source: ALICE_RUNTIME,
      });
      expect(fs.readFileSync(editProof, "utf-8")).not.toContain("lookingglass");
      expect(fs.readFileSync(saveProof, "utf-8")).not.toContain("lookingglass");
    });

    it("uses Alice/alice-web generated asset metadata, not LookingGlass metadata", async () => {
      expect(PROCEDURAL_LICENSE.author).toBe(ALICE_PRODUCT);

      const glb = await exportModelToGlb(
        makeTriangleGeometry(),
        [],
        [MATERIAL],
        {
          modelId: "BUNNY",
          category: "BIPED",
          generatedAt: "2026-06-20T00:00:00Z",
        },
      );
      const asset = await readGltfAsset(glb);
      const extras = asset.extras as Record<string, unknown>;

      expect(asset.generator).toBe(ALICE_RUNTIME);
      expect(extras.alice).toEqual({
        modelId: "BUNNY",
        category: "BIPED",
        generatedAt: "2026-06-20T00:00:00Z",
      });
      expect(extras).not.toHaveProperty("lookingglass");
    });
  });

  describe("runtime storage and source identity", () => {
    it("keeps browser storage keys on the alice-web namespace", () => {
      const storageSurfaces = [
        "src/preferences.ts",
        "src/theme-system.ts",
        "src/notification-system.ts",
        "src/plugin-system.ts",
      ];

      for (const surface of storageSurfaces) {
        const content = readText(surface);
        expect(content, `${surface} should use alice-web storage keys`).toContain("alice-web.");
        expect(content, `${surface} must not use LookingGlass storage keys`).not.toContain("lookingglass.");
      }
    });

    it("keeps LookingGlass out of runtime, package, API, and generated metadata surfaces", () => {
      const forbiddenSurfaces = [
        "package.json",
        "package-lock.json",
        "pyproject.toml",
        "src/cli.ts",
        "src/server/routes/health-routes.ts",
        "src/server/security.ts",
        "src/evidence-writer.ts",
        "src/export-html/document.ts",
        "src/export-html/template.ts",
        "src/menubar.ts",
        "src/open-asset-pipeline/types.ts",
        "src/open-asset-pipeline/gltf-export.ts",
      ];
      const forbiddenTokens = [
        "LookingGlass",
        "lookingglass",
        "LOOKINGGLASS",
        "X-LookingGlass-Local-Api-Token",
        "LOOKINGGLASS_LOCAL_API_TOKEN",
        "LOOKINGGLASS_WEB_URL",
        "lookingglass-typescript-web",
      ];

      for (const surface of forbiddenSurfaces) {
        expectNoForbiddenLookingGlassIdentity(surface, forbiddenTokens);
      }
    });
  });

  describe("documentation boundary", () => {
    it("documents Alice runtime/API contracts and rejects unsupported LookingGlass API aliases", () => {
      const docs = collectMarkdownFiles()
        .map((file) => `${file}\n${readText(file)}`)
        .join("\n");

      expect(docs).toContain("Alice");
      expect(docs).toContain("alice-web");
      expect(docs).toContain("ALICE_LOCAL_API_TOKEN");
      expect(docs).toContain("ALICE_WEB_URL");
      expect(docs).toContain(ALICE_LOCAL_API_HEADER);
      expect(docs).not.toContain(LOOKINGGLASS_LOCAL_API_HEADER);
      expect(docs).not.toContain("LOOKINGGLASS_LOCAL_API_TOKEN");
      expect(docs).not.toContain("LOOKINGGLASS_WEB_URL");
      expect(docs).not.toContain("lookingglass-typescript-web");
    });

    it("allows LookingGlass only in explicit repository/project nickname documentation", () => {
      const docsWithLookingGlass = collectMarkdownFiles()
        .filter((file) => readText(file).includes("LookingGlass"));

      expect(docsWithLookingGlass.length).toBeGreaterThan(0);
      for (const file of docsWithLookingGlass) {
        const content = readText(file);
        expect(
          /repository|repo|project nickname|GitHub|migration|PR #207|PR #212/.test(content),
          `${file} must frame LookingGlass as repository/project nickname context`,
        ).toBe(true);
      }
    });
  });
});
