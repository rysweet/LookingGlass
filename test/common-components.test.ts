import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ExpressionProperty,
  FieldDeclaration,
  ManagementLevel,
  MethodDeclaration,
  NodeListProperty,
  StringLiteral,
  ThisExpression,
  UserParameter,
  simpleTypeRef,
  type AbstractNode,
} from "../src/ast-nodes.js";
import {
  ExpressionPropertyView,
  NodeListPropertyView,
  computeTypeIconAppearance,
} from "../src/common-components.js";
import { JavaFormatter } from "../src/formatters.js";
import { TypeBrowser } from "../src/type-browser.js";
import { MethodInvocation } from "../src/ast-nodes.js";

function createTypeHierarchy() {
  const visibleMethod = new MethodDeclaration("storyAction", { type: "VoidTypeRef" }, [], [], false);
  const managedMethod = new MethodDeclaration("generatedSetup", { type: "VoidTypeRef" }, [], [], false);
  managedMethod.managementLevel = ManagementLevel.MANAGED;
  const scene = new ClassDeclaration(
    "Scene",
    "Object",
    null,
    null,
    [],
    [visibleMethod, managedMethod],
    [new FieldDeclaration("hero", simpleTypeRef("String"), new StringLiteral("alice"), false, false)],
  );
  const actor = new ClassDeclaration("Actor", "Scene", null, null, [], [], []);
  const browser = new TypeBrowser([scene, actor]);
  return { browser, scene, actor };
}

describe("common-components", () => {
  it("computes type icon appearance for user and builtin types", () => {
    const { browser, scene, actor } = createTypeHierarchy();

    const sceneAppearance = computeTypeIconAppearance(scene, {
      browser,
      indentForDepthAndMemberCountTextDesired: true,
    });
    const actorAppearance = computeTypeIconAppearance(actor, {
      browser,
      indentForDepthAndMemberCountTextDesired: true,
    });
    const builtinAppearance = computeTypeIconAppearance("String", { browser });

    expect(sceneAppearance).toMatchObject({
      label: "Scene",
      borderKind: "user",
      depth: 0,
      memberCount: 2,
      bonusLabel: "(2)",
      indentOffset: 0,
    });
    expect(actorAppearance).toMatchObject({
      label: "Actor",
      borderKind: "user",
      depth: 1,
      memberCount: 0,
      bonusLabel: null,
      indentOffset: 12,
    });
    expect(builtinAppearance).toMatchObject({
      label: "String",
      borderKind: "java",
      depth: -1,
      memberCount: 0,
      bonusLabel: null,
      indentOffset: 0,
      extraWidth: 0,
    });
    expect(sceneAppearance.extraWidth).toBeGreaterThan(0);
  });

  it("formats expression property displays from the current expression", () => {
    const owner = new ClassDeclaration("Owner", "Object", null, null, [], [], []);
    const property = new ExpressionProperty(
      owner,
      () => simpleTypeRef("String"),
      new MethodInvocation(
        new ThisExpression(simpleTypeRef("Owner")),
        "say",
        [{ name: null, value: new StringLiteral("hello") }],
      ),
    );

    const view = new ExpressionPropertyView(property, new JavaFormatter());
    const display = view.getDisplay();

    expect(display.empty).toBe(false);
    expect(display.summary).toBe('this.say("hello")');
    expect(display.typeName).toBe("String");
  });

  it("treats empty expression properties as empty displays", () => {
    const owner = new ClassDeclaration("Owner", "Object", null, null, [], [], []);
    const property = new ExpressionProperty(owner, () => simpleTypeRef("String"), null);

    const display = new ExpressionPropertyView(property).getDisplay();

    expect(display).toMatchObject({
      empty: true,
      summary: "",
      typeName: "String",
      expression: null,
    });
  });

  it("preserves node list ordering when building view entries", () => {
    const owner = new ClassDeclaration("Owner", "Object", null, null, [], [], []);
    const property = new NodeListProperty<AbstractNode>(owner);
    const field = new FieldDeclaration("score", simpleTypeRef("WholeNumber"), null, false, false);
    const method = new MethodDeclaration("update", { type: "VoidTypeRef" }, [], [], false);
    const parameter = new UserParameter("amount", simpleTypeRef("WholeNumber"));
    property.add(field, [method, parameter]);

    const view = new NodeListPropertyView(property);
    const entries = view.getEntries();

    expect(entries.map((entry) => entry.index)).toEqual([0, 1, 2]);
    expect(entries.map((entry) => entry.node)).toEqual([field, method, parameter]);
    expect(entries.map((entry) => entry.id)).toEqual([field.id, method.id, parameter.id]);
    expect(view.isEmpty()).toBe(false);
  });
});
