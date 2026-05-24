import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  StringLiteral,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { TypeBrowser } from "../src/type-browser.js";

function makeType(name: string, superClass: string | null, fieldNames: string[] = [], methodNames: string[] = []): ClassDeclaration {
  return new ClassDeclaration(
    name,
    superClass,
    null,
    null,
    [new ConstructorDeclaration(name, [], [])],
    methodNames.map((methodName) => new MethodDeclaration(methodName, { type: "VoidTypeRef" }, [], [], false)),
    fieldNames.map((fieldName) => new FieldDeclaration(fieldName, simpleTypeRef("String"), new StringLiteral(fieldName), false, false)),
  );
}

describe("type-browser", () => {
  it("builds a type hierarchy and inherited member listing", () => {
    const vehicle = makeType("Vehicle", "Object", ["name"], ["move"]);
    const car = makeType("Car", "Vehicle", ["doors"], ["honk"]);
    const sportsCar = makeType("SportsCar", "Car", ["turbo"], ["boost"]);
    const browser = new TypeBrowser([vehicle, car, sportsCar]);

    const hierarchy = browser.listHierarchy("Vehicle");
    expect(hierarchy[0].type.name).toBe("Vehicle");
    expect(hierarchy[0].children[0].type.name).toBe("Car");
    expect(hierarchy[0].children[0].children[0].type.name).toBe("SportsCar");

    const members = browser.listMembers("SportsCar");
    expect(members.filter((member) => member.kind === "field").map((member) => `${member.name}:${member.inherited}`)).toEqual([
      "turbo:false",
      "doors:true",
      "name:true",
    ]);
  });

  it("creates new user types and resolves assignability", () => {
    const browser = new TypeBrowser();
    const actor = browser.createType("Actor", "SThing");

    expect(browser.resolveType("Actor")).toBe(actor);
    expect(browser.isAssignable(actor, "SThing")).toBe(true);
    expect(browser.isAssignable(actor, "String")).toBe(false);
  });

  it("merges imported types with rename conflict handling", () => {
    const existing = makeType("Actor", "Object", ["name"], ["wave"]);
    const imported = makeType("Actor", "Object", ["name", "mood"], ["wave", "jump"]);
    const browser = new TypeBrowser([existing]);

    const wizard = browser.createImportWizard(imported);
    const plan = wizard.plan({ onTypeConflict: "merge", onMemberConflict: "rename" });
    expect(plan.action).toBe("merge-type");
    expect(plan.memberPlans.find((member) => member.kind === "field" && member.sourceName === "name")?.action).toBe("rename");

    const merged = wizard.apply({ onTypeConflict: "merge", onMemberConflict: "rename" });
    expect(merged.fields.map((field) => field.name).sort()).toEqual(["mood", "name", "name2"]);
    expect(merged.methods.map((method) => method.name).sort()).toEqual(["jump", "wave", "wave2"]);
  });
});
