import { describe, expect, it } from "vitest";
import {
  BuiltInTypeDeclaration,
  EnumDeclaration,
  GenericTypeParameter,
  InterfaceDeclaration,
  TypeMember,
  TypeModifier,
  UserTypeDeclaration,
} from "../src/type-declarations.js";

describe("type-declarations", () => {
  it("models user-defined classes with fields methods constructors and generics", () => {
    const typeParameter = new GenericTypeParameter("TModel", "SThing", "SBiped");
    const userType = new UserTypeDeclaration("FlyingBunny", {
      superTypeName: "SBiped",
      interfaceNames: ["Turnable"],
      genericParameters: [typeParameter],
    })
      .addField("health", "number")
      .addMethod("takeDamage", "void", ["number"])
      .addConstructor(["BunnyResource"]);

    expect(userType.describe()).toBe("class FlyingBunny<TModel extends SThing = SBiped> extends SBiped implements Turnable");
    expect(userType.listMembers("field").map((member) => member.signature())).toEqual(["health: number"]);
    expect(userType.findMember("takeDamage", "method")?.signature()).toBe("takeDamage(number): void");
    expect(userType.findMember("FlyingBunny", "constructor")?.signature()).toBe("FlyingBunny(BunnyResource)");
    expect(typeParameter.describe()).toBe("TModel extends SThing = SBiped");
  });

  it("captures built-in declarations enums and interface constraints", () => {
    const builtIn = new BuiltInTypeDeclaration("SBiped", {
      storyQualifiedName: "org.lgna.story.SBiped",
      resourceTypeName: "org.lgna.story.resources.biped.BipedResource",
      modifiers: [TypeModifier.PUBLIC, TypeModifier.ABSTRACT],
      interfaceNames: ["Turnable"],
    });
    const directions = new EnumDeclaration("Direction", ["LEFT", "RIGHT"]).addLiteral("UP");
    const turnable = new InterfaceDeclaration("Turnable").addMethod("turn", "void", ["number"]);
    const candidate = new UserTypeDeclaration("Bunny").addMethod("turn", "void", ["number"]);
    const missingMethod = new UserTypeDeclaration("StaticBunny");

    expect(builtIn.isAbstract).toBe(true);
    expect(builtIn.describe()).toContain("mapped-to org.lgna.story.SBiped");
    expect(directions.values()).toEqual(["LEFT", "RIGHT", "UP"]);
    expect(directions.hasLiteral("UP")).toBe(true);
    expect(directions.ordinalOf("RIGHT")).toBe(1);
    expect(turnable.isSatisfiedBy(candidate)).toBe(true);
    expect(turnable.isSatisfiedBy(missingMethod)).toBe(false);
  });

  it("tracks member modifiers signatures and validation", () => {
    const field = new TypeMember("field", "sharedColor", {
      typeName: "Color",
      modifiers: [TypeModifier.PUBLIC, TypeModifier.STATIC],
    });
    const method = new TypeMember("method", "move", {
      typeName: "void",
      parameterTypes: ["Direction", "number"],
      modifiers: [TypeModifier.PRIVATE],
      genericParameters: [new GenericTypeParameter("TStep")],
    });
    const constructor = new TypeMember("constructor", "Bunny", {
      parameterTypes: ["BunnyResource"],
    });

    expect(field.hasModifier(TypeModifier.STATIC)).toBe(true);
    expect(field.signature()).toBe("sharedColor: Color");
    expect(method.hasModifier(TypeModifier.PRIVATE)).toBe(true);
    expect(method.signature()).toBe("<TStep>move(Direction, number): void");
    expect(constructor.signature()).toBe("Bunny(BunnyResource)");
    expect(() => new GenericTypeParameter("9invalid")).toThrow("Invalid type parameter");
    expect(() => new UserTypeDeclaration("Repeat").addMethod("hop", "void").addMethod("hop", "void")).toThrow(
      "Duplicate member signature on Repeat: hop(): void",
    );
  });
});
