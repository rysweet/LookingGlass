import { describe, expect, it } from "vitest";
import {
  ProjectPersistence,
  type JsonValue,
  type PersistenceStateSnapshot,
  type PersistenceStateStore,
} from "../src/persistence.js";

class MemoryStateStore<T extends JsonValue> implements PersistenceStateStore<T> {
  private state: PersistenceStateSnapshot<T> = { projects: [], versions: [] };

  async loadState(): Promise<PersistenceStateSnapshot<T>> {
    return JSON.parse(JSON.stringify(this.state)) as PersistenceStateSnapshot<T>;
  }

  async saveState(state: PersistenceStateSnapshot<T>): Promise<void> {
    this.state = JSON.parse(JSON.stringify(state)) as PersistenceStateSnapshot<T>;
  }
}

describe("persistence depth", () => {
  it("reuses the previous version for unchanged snapshots and trims identifiers", async () => {
    const persistence = new ProjectPersistence({
      store: new MemoryStateStore(),
      now: createNow([100, 200]),
      createVersionId: (projectId, sequence) => `${projectId}-v${sequence}`,
    });

    const first = await persistence.saveProject(
      "  project-1  ",
      "  Starter Story  ",
      {
        sceneObjects: [{ name: "ground" }],
        methods: [],
      },
      { autoSaveIntervalMs: 60 },
    );
    const second = await persistence.saveProject(
      "project-1",
      "Starter Story",
      {
        sceneObjects: [{ name: "ground" }],
        methods: [],
      },
      { autoSaveIntervalMs: 120 },
    );

    const projects = await persistence.listProjects();
    const versions = await persistence.getProjectVersions("project-1");

    expect(first.createdVersion).toBe(true);
    expect(second.createdVersion).toBe(false);
    expect(second.version.versionId).toBe("project-1-v1");
    expect(projects).toEqual([
      {
        projectId: "project-1",
        name: "Starter Story",
        currentSnapshot: {
          sceneObjects: [{ name: "ground" }],
          methods: [],
        },
        latestVersionId: "project-1-v1",
        updatedAt: 100,
        sizeBytes: projects[0]!.sizeBytes,
        versionCount: 1,
        autoSaveIntervalMs: 120,
      },
    ]);
    expect(versions).toHaveLength(1);
  });

  it("force saves duplicate snapshots and deleteProject clears persisted state", async () => {
    const persistence = new ProjectPersistence({
      store: new MemoryStateStore(),
      now: createNow([10, 20]),
      createVersionId: (projectId, sequence) => `${projectId}-v${sequence}`,
      quotaProvider: async () => ({ usage: 512, quota: 1024 }),
    });
    const autoSaver = persistence.createAutoSaver({
      projectId: "project-1",
      name: "Autosave Story",
      capture: () => ({ sceneObjects: [], methods: [] }),
      forceVersion: true,
      intervalMs: 25,
    });

    await autoSaver.flush();
    await autoSaver.flush();

    const versionsBeforeDelete = await persistence.getProjectVersions("project-1");
    const quotaInfo = await persistence.getQuotaInfo();
    await persistence.deleteProject("project-1");

    expect(versionsBeforeDelete.map((version) => version.versionId)).toEqual([
      "project-1-v2",
      "project-1-v1",
    ]);
    expect(quotaInfo.quotaBytes).toBe(1024);
    expect(await persistence.listProjects()).toEqual([]);
    expect(await persistence.getProjectVersions("project-1")).toEqual([]);
  });
});

function createNow(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}
