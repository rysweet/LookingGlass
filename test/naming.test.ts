import { describe, expect, it } from "vitest";
import {
  IdentifierNameGenerator,
  applyNamingConvention,
  identifierNameGenerator,
  isValidIdentifierName,
  resolveNameCollision,
  sanitizeJavaIdentifier,
  sanitizePackageName,
  toCamelCase,
  toPascalCase,
} from "../src/naming.js";

describe("naming utilities", () => {
  it("ports constant-to-method conversion behavior from Java", () => {
    expect(identifierNameGenerator.convertConstantNameToMethodName("MY_VALUE", "get")).toBe("getMyValue");
    expect(identifierNameGenerator.convertConstantNameToMethodName("AB__C")).toBe("abC");
    expect(identifierNameGenerator.convertConstantNameToMethodName("____")).toBe("");
    expect(identifierNameGenerator.convertConstantNameToMethodName("READY", "is")).toBe("isReady");
  });

  it("creates identifier names from class names by lowercasing the first character", () => {
    expect(identifierNameGenerator.createIdentifierNameFromClassName("MyWidget")).toBe("myWidget");
    expect(identifierNameGenerator.createIdentifierNameFromClassName("ABC")).toBe("aBC");
    expect(identifierNameGenerator.createIdentifierNameFromClassName(null)).toBeNull();
  });

  it("applies method, field, type, and parameter naming conventions", () => {
    expect(applyNamingConvention("say hello", "method")).toBe("sayHello");
    expect(applyNamingConvention("hero field", "field")).toBe("heroField");
    expect(applyNamingConvention("scene object", "type")).toBe("SceneObject");
    expect(applyNamingConvention("target entity", "parameter")).toBe("targetEntity");
  });

  it("builds valid identifiers from invalid raw text", () => {
    expect(identifierNameGenerator.suggestMethodName("3D spin!")).toBe("_3DSpin");
    expect(identifierNameGenerator.suggestFieldName("class")).toBe("classValue");
    expect(identifierNameGenerator.suggestTypeName("123 scene actor")).toBe("_123SceneActor");
  });

  it("resolves collisions by appending numeric suffixes", () => {
    expect(resolveNameCollision("bunny", ["camera", "bunny", "bunny2"])).toBe("bunny3");
    expect(resolveNameCollision("hero", ["Hero"], { caseSensitive: false })).toBe("hero2");
  });

  it("exposes camelCase and PascalCase helpers", () => {
    expect(toCamelCase("My first method")).toBe("myFirstMethod");
    expect(toPascalCase("my first type")).toBe("MyFirstType");
  });

  it("sanitizes identifiers and package names for Java exports", () => {
    expect(sanitizeJavaIdentifier("demo project", "fallback")).toBe("demo_project");
    expect(sanitizeJavaIdentifier("9lives", "fallback")).toBe("_9lives");
    expect(sanitizeJavaIdentifier("class", "fallback")).toBe("class_");
    expect(sanitizePackageName("Org.Alice Demo.3D-World")).toBe("org.alicedemo._3dworld");
  });

  it("supports custom collision suffix starts and empty-name fallbacks", () => {
    expect(resolveNameCollision("bunny", ["bunny", "bunny5"], { startAt: 5 })).toBe("bunny6");
    expect(identifierNameGenerator.suggestParameterName("", ["value", "value2"])).toBe("value3");
  });

  it("reports identifier validity", () => {
    expect(isValidIdentifierName("myScene")).toBe(true);
    expect(isValidIdentifierName("class")).toBe(false);
    expect(isValidIdentifierName("3dScene")).toBe(false);
  });

  it("keeps singleton access available", () => {
    expect(IdentifierNameGenerator.SINGLETON).toBe(identifierNameGenerator);
  });
});
