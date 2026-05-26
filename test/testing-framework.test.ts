import { describe, expect, it } from "vitest";
import {
  AliceProjectTestingFramework,
  formatTestReport,
  runPropertyTests,
  runSceneSnapshotTests,
  runTweedleUnitTests,
  snapshotSceneState,
} from "../src/testing-framework.js";

describe("testing framework", () => {
  it("runs Tweedle unit tests with the Alice VM", () => {
    const [result] = runTweedleUnitTests([
      {
        name: "empty program runs",
        source: `class Demo { void myFirstMethod() { } }`,
        assert: ({ declaration, execution }) => {
          expect(declaration.name).toBe("Demo");
          expect(execution.execution_log).toEqual([]);
        },
      },
    ]);

    expect(result.status).toBe("passed");
    expect(result.executionLog).toEqual([]);
    expect(result.returnValueEntries).toEqual([]);
  });

  it("runs deterministic property-based tests with a seed", () => {
    const [first] = runPropertyTests([
      {
        name: "normalized coordinates stay bounded",
        seed: 7,
        iterations: 5,
        generate: (random) => ({
          x: random.nextInt(-10, 10),
          y: random.nextInt(-10, 10),
        }),
        property: ({ x, y }) => Math.abs(x) <= 10 && Math.abs(y) <= 10,
      },
    ]);
    const [second] = runPropertyTests([
      {
        name: "normalized coordinates stay bounded",
        seed: 7,
        iterations: 5,
        generate: (random) => ({
          x: random.nextInt(-10, 10),
          y: random.nextInt(-10, 10),
        }),
        property: ({ x, y }) => Math.abs(x) <= 10 && Math.abs(y) <= 10,
      },
    ]);

    expect(first.status).toBe("passed");
    expect(second.status).toBe("passed");
    expect(first.seed).toBe(second.seed);
    expect(first.iterations).toBe(second.iterations);
  });

  it("captures stable scene snapshots with sorted keys", () => {
    const expected = `{
  "entities": [
    {
      "name": "bunny",
      "position": {
        "x": 2,
        "y": 1,
        "z": 0
      }
    }
  ],
  "lighting": {
    "ambient": 0.5
  }
}`;

    const actual = snapshotSceneState({
      lighting: { ambient: 0.5 },
      entities: [{ position: { z: 0, y: 1, x: 2 }, name: "bunny" }],
    });
    const [result] = runSceneSnapshotTests([
      {
        name: "scene-state",
        sceneState: {
          lighting: { ambient: 0.5 },
          entities: [{ position: { z: 0, y: 1, x: 2 }, name: "bunny" }],
        },
        expected,
      },
    ]);

    expect(actual).toBe(expected);
    expect(result.status).toBe("passed");
  });

  it("generates a combined report for unit, property, and snapshot suites", () => {
    const framework = new AliceProjectTestingFramework();
    const report = framework.runSuite({
      unitTests: [
        {
          name: "suite-unit",
          source: `class SuiteDemo { void myFirstMethod() { } }`,
        },
      ],
      propertyTests: [
        {
          name: "suite-property",
          seed: 11,
          iterations: 3,
          generate: (random) => random.nextInt(0, 5),
          property: (value: number) => value >= 0,
        },
      ],
      snapshotTests: [
        {
          name: "suite-snapshot",
          sceneState: { camera: { x: 1, y: 2, z: 3 } },
          expected: `{
  "camera": {
    "x": 1,
    "y": 2,
    "z": 3
  }
}`,
        },
      ],
    });
    const text = formatTestReport(report);

    expect(report.total).toBe(3);
    expect(report.failed).toBe(0);
    expect(report.passed).toBe(3);
    expect(text).toContain("Alice project tests: 3/3 passed");
    expect(text).toContain("unit:suite-unit");
    expect(text).toContain("property:suite-property");
    expect(text).toContain("snapshot:suite-snapshot");
  });
});
