/**
 * TDD tests for A3P round-trip statement serialization.
 *
 * These 16 tests define the expected behavior for:
 * - Writer: appendSupportedStatements must emit ALL statement kinds (not just Comment)
 * - Reader: parseStatement must extract real data (not "unknown" placeholders)
 * - syncMethodSignature: must handle missing body + empty statements cases
 *
 * Tests are written FIRST (TDD red phase). They will FAIL until the
 * writer/reader fixes are implemented.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { parseA3P, type AliceMethod, type AliceProject, type AliceStatement } from "../src/a3p-parser";
import { writeA3P } from "../src/a3p-writer";
import { buildProjectXml } from "../src/a3p-writer/document";
import { ensureXmlTools } from "../src/a3p-writer/xml-tools";

beforeAll(async () => {
  if (typeof globalThis.DOMParser === "undefined" || typeof globalThis.XMLSerializer === "undefined") {
    const { JSDOM } = await import("jsdom");
    const window = new JSDOM().window;
    globalThis.DOMParser = window.DOMParser;
    globalThis.XMLSerializer = window.XMLSerializer;
  }
  await ensureXmlTools();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSceneType(project: AliceProject) {
  return project.types?.find((t) => t.superTypeName?.includes("SScene")) ?? null;
}

/** Build a minimal AliceProject with one scene method containing the given statements. */
function projectWithStatements(methodName: string, statements: AliceStatement[]): AliceProject {
  const method: AliceMethod = {
    name: methodName,
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements,
  };
  return {
    version: "3.6.0.0",
    projectName: "StmtTest",
    sceneObjects: [],
    methods: [method],
    types: [
      {
        name: "Scene",
        superTypeName: "org.lgna.story.SScene",
        fields: [],
        methods: [method],
        constructors: [],
      },
    ],
  };
}

/** Write→parse round-trip and return the statements from the named method. */
async function roundTripStatements(methodName: string, statements: AliceStatement[]): Promise<AliceStatement[]> {
  const project = projectWithStatements(methodName, statements);
  const written = await writeA3P(project);
  const reparsed = await parseA3P(written);
  const sceneType = findSceneType(reparsed);
  const method = sceneType?.methods?.find((m) => m.name === methodName);
  return method?.statements ?? [];
}

/** Get the raw XML string from a project (for XML-shape assertions). */
function getXml(project: AliceProject): string {
  return buildProjectXml(project, null);
}

// ---------------------------------------------------------------------------
// 1. Comment round-trip (baseline — already works)
// ---------------------------------------------------------------------------
describe("a3p statement round-trip", { timeout: 60_000 }, () => {
  it("1: Comment round-trips with text preserved", async () => {
    const result = await roundTripStatements("testComment", [
      { kind: "Comment", expression: "hello world" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("Comment");
    expect(result[0].expression).toBe("hello world");
  });

  // ---------------------------------------------------------------------------
  // 2. MethodCall with caller, method name, and multiple arguments
  // ---------------------------------------------------------------------------
  it("2: MethodCall round-trips with caller, method, and arguments", async () => {
    const statements: AliceStatement[] = [
      {
        kind: "MethodCall",
        object: "this",
        method: "say",
        arguments: ["Hello", "2.0"],
      },
    ];
    const project = projectWithStatements("testMethodCall", statements);

    // XML-shape: must use JavaMethod (not UserMethod) to avoid indexNodes pollution
    const xml = getXml(project);
    expect(xml).toContain("org.lgna.project.ast.ExpressionStatement");
    expect(xml).toContain("org.lgna.project.ast.MethodInvocation");
    expect(xml).not.toMatch(/type="org\.lgna\.project\.ast\.UserMethod"[^>]*>(?:[^<]*<(?:property|value))/s);

    // Round-trip
    const written = await writeA3P(project);
    const reparsed = await parseA3P(written);
    const sceneType = findSceneType(reparsed);
    const method = sceneType?.methods?.find((m) => m.name === "testMethodCall");
    const result = method?.statements ?? [];

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("MethodCall");
    expect(result[0].method).toBe("say");
    expect(result[0].arguments).toEqual(["Hello", "2.0"]);

    // No spurious methods from inline UserMethod nodes
    const allMethodNames = (sceneType?.methods ?? []).map((m) => m.name);
    expect(allMethodNames).not.toContain("say");
  });

  // ---------------------------------------------------------------------------
  // 3. CountLoop with numeric count and nested body
  // ---------------------------------------------------------------------------
  it("3: CountLoop round-trips with count and body", async () => {
    const result = await roundTripStatements("testCountLoop", [
      {
        kind: "CountLoop",
        count: 3,
        body: [{ kind: "Comment", expression: "inside loop" }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("CountLoop");
    expect(result[0].count).toBe(3);
    expect(result[0].body).toHaveLength(1);
    expect(result[0].body![0].kind).toBe("Comment");
    expect(result[0].body![0].expression).toBe("inside loop");
  });

  // ---------------------------------------------------------------------------
  // 4. DoInOrder with nested statements
  // ---------------------------------------------------------------------------
  it("4: DoInOrder round-trips with body statements", async () => {
    const result = await roundTripStatements("testDoInOrder", [
      {
        kind: "DoInOrder",
        body: [
          { kind: "Comment", expression: "step 1" },
          { kind: "Comment", expression: "step 2" },
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("DoInOrder");
    expect(result[0].body).toHaveLength(2);
    expect(result[0].body![0].expression).toBe("step 1");
    expect(result[0].body![1].expression).toBe("step 2");
  });

  // ---------------------------------------------------------------------------
  // 5. DoTogether with nested statements
  // ---------------------------------------------------------------------------
  it("5: DoTogether round-trips with body statements", async () => {
    const result = await roundTripStatements("testDoTogether", [
      {
        kind: "DoTogether",
        body: [
          { kind: "Comment", expression: "parallel A" },
          { kind: "Comment", expression: "parallel B" },
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("DoTogether");
    expect(result[0].body).toHaveLength(2);
    expect(result[0].body![0].expression).toBe("parallel A");
    expect(result[0].body![1].expression).toBe("parallel B");
  });

  // ---------------------------------------------------------------------------
  // 6. WhileLoop with condition and body
  // ---------------------------------------------------------------------------
  it("6: WhileLoop round-trips with condition and body", async () => {
    const result = await roundTripStatements("testWhileLoop", [
      {
        kind: "WhileLoop",
        condition: "true",
        body: [{ kind: "Comment", expression: "looping" }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("WhileLoop");
    expect(result[0].condition).toBe("true");
    expect(result[0].body).toHaveLength(1);
    expect(result[0].body![0].expression).toBe("looping");
  });

  // ---------------------------------------------------------------------------
  // 7. ForEachLoop with item, collection, and body
  // ---------------------------------------------------------------------------
  it("7: ForEachLoop round-trips with item, collection, and body", async () => {
    const result = await roundTripStatements("testForEachLoop", [
      {
        kind: "ForEachLoop",
        itemType: "org.lgna.story.SBiped",
        itemName: "character",
        collection: "characters",
        body: [{ kind: "Comment", expression: "for each" }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("ForEachLoop");
    expect(result[0].itemName).toBe("character");
    expect(result[0].collection).toBe("characters");
    expect(result[0].body).toHaveLength(1);
    expect(result[0].body![0].expression).toBe("for each");
  });

  // ---------------------------------------------------------------------------
  // 8. EachInArrayTogether with item, collection, and body
  // ---------------------------------------------------------------------------
  it("8: EachInArrayTogether round-trips with item, collection, and body", async () => {
    const result = await roundTripStatements("testEachTogether", [
      {
        kind: "EachInArrayTogether",
        itemType: "org.lgna.story.SBiped",
        itemName: "actor",
        collection: "actors",
        body: [{ kind: "Comment", expression: "each together" }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("EachInArrayTogether");
    expect(result[0].itemName).toBe("actor");
    expect(result[0].collection).toBe("actors");
    expect(result[0].body).toHaveLength(1);
    expect(result[0].body![0].expression).toBe("each together");
  });

  // ---------------------------------------------------------------------------
  // 9. IfElse with condition, ifBody, elseBody
  // ---------------------------------------------------------------------------
  it("9: IfElse round-trips with condition, ifBody, and elseBody", async () => {
    const statements: AliceStatement[] = [
      {
        kind: "IfElse",
        condition: "true",
        ifBody: [{ kind: "Comment", expression: "then" }],
        elseBody: [{ kind: "Comment", expression: "otherwise" }],
      },
    ];
    const project = projectWithStatements("testIfElse", statements);

    // XML-shape: must use booleanExpressionBodyPairs (not simplified condition/body)
    const xml = getXml(project);
    expect(xml).toContain("org.lgna.project.ast.ConditionalStatement");

    const result = await roundTripStatements("testIfElse", statements);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("IfElse");
    expect(result[0].condition).toBe("true");
    expect(result[0].ifBody).toHaveLength(1);
    expect(result[0].ifBody![0].expression).toBe("then");
    expect(result[0].elseBody).toHaveLength(1);
    expect(result[0].elseBody![0].expression).toBe("otherwise");
  });

  // ---------------------------------------------------------------------------
  // 10. ReturnStatement with expression
  // ---------------------------------------------------------------------------
  it("10: ReturnStatement round-trips with expression", async () => {
    const method: AliceMethod = {
      name: "testReturn",
      isFunction: true,
      returnType: "java.lang.String",
      parameters: [],
      statements: [{ kind: "ReturnStatement", expression: "hello" }],
    };
    const project: AliceProject = {
      version: "3.6.0.0",
      projectName: "ReturnTest",
      sceneObjects: [],
      methods: [method],
      types: [
        {
          name: "Scene",
          superTypeName: "org.lgna.story.SScene",
          fields: [],
          methods: [method],
          constructors: [],
        },
      ],
    };
    const written = await writeA3P(project);
    const reparsed = await parseA3P(written);
    const sceneType = findSceneType(reparsed);
    const reparsedMethod = sceneType?.methods?.find((m) => m.name === "testReturn");
    const result = reparsedMethod?.statements ?? [];

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("ReturnStatement");
    expect(result[0].expression).toBe("hello");
  });

  // ---------------------------------------------------------------------------
  // 11. VariableDeclaration with name, type, value
  // ---------------------------------------------------------------------------
  it("11: VariableDeclaration round-trips with name, type, and value", async () => {
    const result = await roundTripStatements("testVarDecl", [
      {
        kind: "VariableDeclaration",
        name: "myVar",
        varType: "java.lang.String",
        value: "initial",
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("VariableDeclaration");
    expect(result[0].name).toBe("myVar");
    expect(result[0].varType).toBe("java.lang.String");
    expect(result[0].value).toBe("initial");
  });

  // ---------------------------------------------------------------------------
  // 12. Mixed statements preserve order and data
  // ---------------------------------------------------------------------------
  it("12: mixed statements in one method preserve order and data", async () => {
    const stmts: AliceStatement[] = [
      { kind: "Comment", expression: "first" },
      { kind: "MethodCall", object: "this", method: "wave", arguments: [] },
      { kind: "DoInOrder", body: [{ kind: "Comment", expression: "inner" }] },
      { kind: "ReturnStatement", expression: "done" },
    ];
    const method: AliceMethod = {
      name: "testMixed",
      isFunction: true,
      returnType: "java.lang.String",
      parameters: [],
      statements: stmts,
    };
    const project: AliceProject = {
      version: "3.6.0.0",
      projectName: "MixedTest",
      sceneObjects: [],
      methods: [method],
      types: [
        {
          name: "Scene",
          superTypeName: "org.lgna.story.SScene",
          fields: [],
          methods: [method],
          constructors: [],
        },
      ],
    };
    const written = await writeA3P(project);
    const reparsed = await parseA3P(written);
    const result = findSceneType(reparsed)?.methods?.find((m) => m.name === "testMixed")?.statements ?? [];

    expect(result).toHaveLength(4);
    expect(result[0].kind).toBe("Comment");
    expect(result[0].expression).toBe("first");
    expect(result[1].kind).toBe("MethodCall");
    expect(result[1].method).toBe("wave");
    expect(result[2].kind).toBe("DoInOrder");
    expect(result[2].body).toHaveLength(1);
    expect(result[3].kind).toBe("ReturnStatement");
    expect(result[3].expression).toBe("done");
  });

  // ---------------------------------------------------------------------------
  // 13. Deeply nested statements (DoInOrder → IfElse → MethodCall)
  // ---------------------------------------------------------------------------
  it("13: deeply nested statements round-trip correctly", async () => {
    const result = await roundTripStatements("testDeepNest", [
      {
        kind: "DoInOrder",
        body: [
          {
            kind: "IfElse",
            condition: "true",
            ifBody: [
              { kind: "MethodCall", object: "this", method: "speak", arguments: ["hi"] },
            ],
            elseBody: [],
          },
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("DoInOrder");

    const ifElse = result[0].body![0];
    expect(ifElse.kind).toBe("IfElse");
    expect(ifElse.condition).toBe("true");

    const methodCall = ifElse.ifBody![0];
    expect(methodCall.kind).toBe("MethodCall");
    expect(methodCall.method).toBe("speak");
    expect(methodCall.arguments).toEqual(["hi"]);
    expect(ifElse.elseBody).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 14. syncMethodSignature creates body when missing but statements exist
  // ---------------------------------------------------------------------------
  it("14: syncMethodSignature creates body when missing but statements exist", async () => {
    // Start from a project that already has a method — parse real template,
    // then add statements to the method, write, and reparse.
    const emptyMethod: AliceMethod = {
      name: "growingMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [],
    };
    const project: AliceProject = {
      version: "3.6.0.0",
      projectName: "SyncBodyTest",
      sceneObjects: [],
      methods: [emptyMethod],
      types: [
        {
          name: "Scene",
          superTypeName: "org.lgna.story.SScene",
          fields: [],
          methods: [emptyMethod],
          constructors: [],
        },
      ],
    };

    // First write — creates the method with empty body
    const firstWrite = await writeA3P(project);
    const firstParse = await parseA3P(firstWrite);

    // Verify empty method was created
    const firstMethod = findSceneType(firstParse)?.methods?.find((m) => m.name === "growingMethod");
    expect(firstMethod?.statements ?? []).toEqual([]);

    // Now add statements and write again FROM THE SAME PARSED PROJECT
    // This exercises syncMethodSignature because the base XML already has the method
    const updatedMethod: AliceMethod = {
      name: "growingMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [{ kind: "Comment", expression: "new statement" }],
    };
    firstParse.methods = [updatedMethod];
    const sceneType = findSceneType(firstParse);
    if (sceneType) {
      sceneType.methods = [updatedMethod];
    }

    const secondWrite = await writeA3P(firstParse);
    const secondParse = await parseA3P(secondWrite);
    const result = findSceneType(secondParse)?.methods?.find((m) => m.name === "growingMethod");

    expect(result?.statements).toHaveLength(1);
    expect(result?.statements[0].kind).toBe("Comment");
    expect(result?.statements[0].expression).toBe("new statement");
  });

  // ---------------------------------------------------------------------------
  // 15. syncMethodSignature clears stale statements when desired is empty
  // ---------------------------------------------------------------------------
  it("15: syncMethodSignature clears stale statements when desired is empty", async () => {
    // Start with a method that has statements
    const populatedMethod: AliceMethod = {
      name: "shrinkingMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [{ kind: "Comment", expression: "will be removed" }],
    };
    const project: AliceProject = {
      version: "3.6.0.0",
      projectName: "ClearBodyTest",
      sceneObjects: [],
      methods: [populatedMethod],
      types: [
        {
          name: "Scene",
          superTypeName: "org.lgna.story.SScene",
          fields: [],
          methods: [populatedMethod],
          constructors: [],
        },
      ],
    };

    const firstWrite = await writeA3P(project);
    const firstParse = await parseA3P(firstWrite);

    // Confirm statement exists
    const firstResult = findSceneType(firstParse)?.methods?.find((m) => m.name === "shrinkingMethod");
    expect(firstResult?.statements).toHaveLength(1);

    // Clear statements
    const emptyMethod: AliceMethod = {
      name: "shrinkingMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [],
    };
    firstParse.methods = [emptyMethod];
    const sceneType = findSceneType(firstParse);
    if (sceneType) {
      sceneType.methods = [emptyMethod];
    }

    const secondWrite = await writeA3P(firstParse);
    const secondParse = await parseA3P(secondWrite);
    const result = findSceneType(secondParse)?.methods?.find((m) => m.name === "shrinkingMethod");

    expect(result?.statements ?? []).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 16. Empty method round-trip (no statements)
  // ---------------------------------------------------------------------------
  it("16: empty method round-trips correctly", async () => {
    const result = await roundTripStatements("emptyMethod", []);
    expect(result).toEqual([]);
  });
});
