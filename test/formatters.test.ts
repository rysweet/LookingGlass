import { describe, expect, it } from "vitest";
import {
  AliceFormatter,
  Formatter,
  FormatterRegistry,
  JavaFormatter,
  createDefaultFormatterRegistry,
} from "../src/formatters.js";

describe("formatters", () => {
  it("formats Alice headers, localized text, and method invocations", () => {
    const formatter = new AliceFormatter("es");

    expect(
      formatter.getHeaderTextForCode({
        kind: "function",
        name: "getDistanceTo",
        returnType: "java.lang.Double",
        parameters: ["target"],
      }),
    ).toBe("declare NúmeroDecimal function obtener distancia a(target)");
    expect(formatter.getTrailerTextForCode({ kind: "procedure" })).toBeNull();
    expect(formatter.getTextForThis()).toBe("este");
    expect(formatter.getTextForNull()).toBe("no establecido");
    expect(formatter.getFinalText()).toBe("constante");
    expect(formatter.getTemplateText("DoInOrder")).toContain("hacer en orden");
    expect(
      formatter.formatMethodInvocation({ target: "conejo", methodName: "move", arguments: ["1 meter"] }),
    ).toBe("conejo mover 1 meter");
    expect(formatter.formatNewExpression({ typeName: "Scene", arguments: ["camera"] })).toBe(
      "nuevo Escena( camera )",
    );
  });

  it("formats Java headers, trailers, templates, and method invocations", () => {
    const formatter = new JavaFormatter();

    expect(
      formatter.getHeaderTextForCode({
        kind: "method",
        name: "sayHello",
        returnType: "String",
        parameters: ["String name"],
      }),
    ).toBe("String sayHello( String name ) {");
    expect(formatter.getHeaderTextForCode({ kind: "constructor", declaringType: "Program" })).toBe(
      "Program(  ) {",
    );
    expect(formatter.getTrailerTextForCode({ kind: "method" })).toBe("}");
    expect(formatter.getTemplateText("WhileLoop")).toContain("while(");
    expect(
      formatter.formatMethodInvocation({ target: "program", methodName: "sayHello", arguments: ["name"] }),
    ).toBe("program.sayHello(name)");
    expect(formatter.formatNewExpression({ typeName: "Scene", arguments: ["camera"] })).toBe(
      "new Scene( camera )",
    );
    expect(formatter.galleryLabelFor("Bunny")).toBe("Bunny classes");
  });

  it("tracks the active formatter in the registry", () => {
    const registry = createDefaultFormatterRegistry("zh");

    expect(registry.getDefault()).toBeInstanceOf(AliceFormatter);
    expect(registry.list().map((formatter) => formatter.id)).toEqual(["alice", "java"]);
    expect(registry.setDefault("java")).toBeInstanceOf(JavaFormatter);
    expect(registry.getDefault()).toBeInstanceOf(JavaFormatter);
    expect(() => registry.require("missing")).toThrow("Unknown formatter: missing");
  });

  it("defaults Alice locale and formats enum gallery labels", () => {
    const aliceFormatter = new AliceFormatter(null);
    const javaFormatter = new JavaFormatter();

    expect(aliceFormatter.locale).toBe("en");
    expect(javaFormatter.galleryLabelFor("Color", { isEnum: true, isLeaf: true })).toBe("new Color(  )");
    expect(javaFormatter.galleryLabelFor("Color", { isEnum: true, isLeaf: false })).toBe("new Color( ␣ )");
  });

  it("rejects empty formatter registries", () => {
    expect(() => new FormatterRegistry([])).toThrow("FormatterRegistry requires at least one formatter");
  });

  it("allows custom formatter registration", () => {
    class TestFormatter extends Formatter {
      constructor() {
        super("test", "Test");
      }

      getHeaderTextForCode(): string {
        return "header";
      }

      getTrailerTextForCode(): string {
        return "trailer";
      }

      getTemplateText(key: string): string {
        return key;
      }

      getNameForMethod(name: string): string {
        return name;
      }

      getNameForField(name: string): string {
        return name;
      }

      getNameForType(typeName: string): string {
        return typeName;
      }

      getNameForParameter(name: string): string {
        return name;
      }

      isTypeExpressionDesired(): boolean {
        return false;
      }

      getTextForThis(): string {
        return "this";
      }

      getTextForNull(): string {
        return "null";
      }

      getFinalText(): string {
        return "final";
      }

      protected getClassesFormat(): string {
        return "%s test";
      }

      getNewFormat(): string {
        return "new %s( %s )";
      }
    }

    const registry = new FormatterRegistry([new JavaFormatter()]);
    const formatter = registry.register(new TestFormatter());

    expect(formatter.id).toBe("test");
    expect(registry.require("test")).toBe(formatter);
  });
});
