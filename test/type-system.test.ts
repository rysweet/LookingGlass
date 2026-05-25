import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ConstructorDeclaration,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { parseTweedle } from "../src/tweedle-parser.js";
import {
  createTweedleTypeAuthority,
  resolveTypeInputName,
  typeRefsAssignable,
} from "../src/type-system.js";
import { TypeBrowser } from "../src/type-browser.js";

describe("type-system", () => {
  it("normalizes names from strings type refs and declarations", () => {
    const bunny = parseTweedle("class Bunny extends SBiped { Bunny() {} }");

    expect(resolveTypeInputName("SThing")).toBe("SThing");
    expect(resolveTypeInputName(simpleTypeRef("Bunny"))).toBe("Bunny");
    expect(
      resolveTypeInputName({
        type: "SimpleTypeRef",
        name: "SBiped",
        isArray: true,
        arrayDimensions: 2,
      }),
    ).toBe("SBiped[][]");
    expect(resolveTypeInputName(bunny)).toBe("Bunny");
  });

  it("uses shared type-ref assignability rules for object numeric and array checks", () => {
    expect(typeRefsAssignable(simpleTypeRef("Object"), simpleTypeRef("String"))).toBe(true);
    expect(typeRefsAssignable(simpleTypeRef("DecimalNumber"), simpleTypeRef("WholeNumber"))).toBe(true);
    expect(typeRefsAssignable(simpleTypeRef("WholeNumber"), simpleTypeRef("DecimalNumber"))).toBe(true);
    expect(
      typeRefsAssignable(
        { type: "SimpleTypeRef", name: "String", isArray: true },
        { type: "SimpleTypeRef", name: "String", isArray: true },
      ),
    ).toBe(true);
    expect(
      typeRefsAssignable(
        { type: "SimpleTypeRef", name: "String", isArray: true },
        simpleTypeRef("String"),
      ),
    ).toBe(false);
  });

  it("provides a canonical Tweedle authority for resolution assignability and dispatch", () => {
    const animal = parseTweedle(`
      class Animal extends SThing {
        Animal() {}
        void move(SThing target) {}
      }
    `);
    const dog = parseTweedle(`
      class Dog extends Animal {
        Dog() {}
        DecimalNumber wag(WholeNumber beats) { return 1.0; }
      }
    `);
    const authority = createTweedleTypeAuthority([animal, dog]);

    expect(authority.resolveType("Dog")?.name).toBe("Dog");
    expect(authority.isAssignable("Dog", "Animal")).toBe(true);
    expect(authority.isAssignable("WholeNumber", "DecimalNumber")).toBe(true);
    expect(authority.hasMethodNamed("Dog", "move")).toBe(true);

    const dispatch = authority.resolveMethodDispatch("Dog", "wag", ["WholeNumber"]);
    expect(dispatch?.ownerType.name).toBe("Dog");
    expect(dispatch?.method.name).toBe("wag");
    expect(dispatch?.usesVarArgs).toBe(false);
  });

  it("keeps the type browser aligned with the canonical assignability helpers", () => {
    const actor = new ClassDeclaration(
      "Actor",
      "SThing",
      null,
      null,
      [new ConstructorDeclaration("Actor", [], [])],
      [],
      [],
    );
    const browser = new TypeBrowser([actor]);

    expect(browser.isAssignable(actor, "SThing")).toBe(true);
    expect(browser.isAssignable("WholeNumber", "DecimalNumber")).toBe(true);
    expect(browser.resolveType(simpleTypeRef("Actor"))?.name).toBe("Actor");
  });
});
