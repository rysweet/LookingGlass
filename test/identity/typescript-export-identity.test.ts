import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import request from "supertest";
import { createMinimalProject } from "../test-utils.js";
import { generateTypeScriptSource } from "../../src/code-generation.js";
import { TypeScriptExporter } from "../../src/project-export.js";
import { createServer } from "../../src/server.js";
import { LOCAL_API_TOKEN_HEADER } from "../../src/server/security.js";

const TEST_LOCAL_API_TOKEN = "test-local-api-token";

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function trackTempDir(dir: string): string {
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("TypeScript export identity boundaries", () => {
  it("uses Alice/alice-web product identity in generated source and never LookingGlass branding", () => {
    const project = createMinimalProject();
    project.projectName = "Identity Demo";
    project.methods.push({
      name: "myFirstMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [],
    });

    const generated = generateTypeScriptSource(project);
    const serialized = JSON.stringify(generated);

    expect(generated.manifest.product).toBe("alice-web");
    expect(generated.manifest.runtime).toBe("Alice");
    expect(serialized).toContain("Alice");
    expect(serialized).toContain("alice-web");
    expect(serialized).not.toMatch(/lookingglass/i);
  });

  it("uses Alice/alice-web identity in archive metadata, package metadata, and README", async () => {
    const project = createMinimalProject();
    project.projectName = "Archive Identity Demo";

    const exported = await new TypeScriptExporter().export(project);
    const zip = await JSZip.loadAsync(exported.archive);
    const manifestText = await zip.file("alice-web-typescript-source/manifest.json")!.async("string");
    const packageText = await zip.file("alice-web-typescript-source/package.json")!.async("string");
    const readme = await zip.file("alice-web-typescript-source/README.md")!.async("string");

    expect(JSON.parse(manifestText)).toMatchObject({
      product: "alice-web",
      runtime: "Alice",
    });
    expect(JSON.parse(packageText)).toMatchObject({
      name: "alice-web-typescript-source",
    });
    expect(readme).toContain("Alice web");
    expect(`${manifestText}\n${packageText}\n${readme}`).not.toMatch(/lookingglass/i);
  });

  it("uses Alice-branded API response headers for the downloadable handoff archive", async () => {
    const evidenceDir = trackTempDir(makeTempDir("alice-typescript-identity-"));
    const app = createServer({
      port: 0,
      evidenceDir,
      localApiToken: TEST_LOCAL_API_TOKEN,
    });
    await request(app)
      .post("/api/launch")
      .set(LOCAL_API_TOKEN_HEADER, TEST_LOCAL_API_TOKEN)
      .send({})
      .expect(200);

    const response = await request(app)
      .get("/api/projects/current/export/typescript")
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/^application\/zip\b/);
    expect(response.headers["content-disposition"]).toMatch(/alice-web-typescript-source\.zip/);
    expect(response.headers["content-disposition"]).not.toMatch(/lookingglass/i);
  });
});
