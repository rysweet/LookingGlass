import { describe, expect, it } from "vitest";
import {
  EMPTY_WORLD_TEMPLATE,
  createEmptyWorldProject,
  createProjectFromTemplate,
  getProjectTemplate,
  listProjectTemplates,
} from "../src/project-template.js";

describe("project-template", () => {
  it("lists the empty world template with localized names", () => {
    expect(listProjectTemplates("en")).toContainEqual({
      id: "empty-world",
      name: "Empty World",
      description: EMPTY_WORLD_TEMPLATE.description,
    });
    expect(listProjectTemplates("es")[0]?.name).toBe("Mundo vacío");
  });

  it("creates an empty world project shape", () => {
    const project = createEmptyWorldProject({ projectName: "Starter" });

    expect(project.projectName).toBe("Starter");
    expect(project.version).toBe("3.10.0.0");
    expect(project.sceneObjects).toEqual([]);
    expect(project.methods).toEqual([]);
    expect(project.types).toHaveLength(2);
    expect(project.types?.[0]).toMatchObject({
      name: "Program",
      superTypeName: "org.lgna.story.SProgram",
    });
    expect(project.types?.[0]?.fields).toEqual([
      { name: "myScene", typeName: "Scene", resourceType: null, initializer: null },
    ]);
    expect(project.types?.[1]).toMatchObject({
      name: "Scene",
      superTypeName: "org.lgna.story.SScene",
    });
  });

  it("creates archives from templates", () => {
    const archive = createProjectFromTemplate("empty-world", { projectName: "TemplateWorld" });

    expect(archive.project.projectName).toBe("TemplateWorld");
    expect(archive.resources.size).toBe(0);
    expect(archive.resourceEntries).toEqual([]);
    expect(archive.thumbnail).toBeNull();
    expect(archive.versionInfo.detectedAliceVersion).toBe("3.10.0.0");
    expect(archive.versionInfo.versionSource).toBe("default");
  });

  it("looks up templates by id and rejects unknown ones", () => {
    expect(getProjectTemplate("empty-world")?.id).toBe("empty-world");
    expect(getProjectTemplate("missing-template")).toBeNull();
    expect(() => createProjectFromTemplate("missing-template")).toThrow("Unknown project template");
  });
});
