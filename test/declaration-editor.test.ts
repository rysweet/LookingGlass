import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  StringLiteral,
  UserParameter,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { DeclarationEditor } from "../src/declaration-editor.js";
import { TypeBrowserError } from "../src/type-browser.js";

function createType(): ClassDeclaration {
  return new ClassDeclaration(
    "Actor",
    "SThing",
    null,
    null,
    [],
    [new MethodDeclaration("move", { type: "VoidTypeRef" }, [], [], false)],
    [new FieldDeclaration("name", simpleTypeRef("String"), new StringLiteral("alice"), false, false)],
  );
}

describe("declaration-editor", () => {
  it("edits method signatures and parameters", () => {
    const editor = new DeclarationEditor(createType());
    const methodEditor = editor.getMethodEditor("move");

    methodEditor.rename("walk");
    methodEditor.setReturnType(simpleTypeRef("String"));
    methodEditor.addParameter("distance", simpleTypeRef("WholeNumber"));
    methodEditor.addParameter("target", simpleTypeRef("String"));
    methodEditor.reorderParameter(1, 0);

    expect(methodEditor.snapshot()).toEqual({
      name: "walk",
      returnType: "String",
      parameters: [
        { name: "target", type: "String", isVarArgs: false },
        { name: "distance", type: "WholeNumber", isVarArgs: false },
      ],
    });
  });

  it("edits fields and manages declarations", () => {
    const editor = new DeclarationEditor(createType());
    const fieldEditor = editor.getFieldEditor("name");

    fieldEditor.rename("title");
    fieldEditor.setFieldType(simpleTypeRef("String"));
    fieldEditor.setConstant(true);

    const createdMethod = editor.createMethod({
      name: "say",
      returnType: simpleTypeRef("String"),
      parameters: [new UserParameter("message", simpleTypeRef("String"))],
    });
    const createdField = editor.createField({ name: "score", fieldType: simpleTypeRef("WholeNumber") });

    expect(editor.listFields().map((field) => field.name).sort()).toEqual(["score", "title"]);
    expect(editor.listMethods().map((method) => method.name).sort()).toEqual(["move", "say"]);
    expect(editor.removeMethod(createdMethod)).toBe(true);
    expect(editor.removeField(createdField)).toBe(true);
    expect(editor.listMethods().map((method) => method.name)).toEqual(["move"]);
    expect(editor.listFields().map((field) => field.name)).toEqual(["title"]);
  });

  it("rejects conflicting signatures and rolls back failed parameter edits", () => {
    const editor = new DeclarationEditor(createType());
    editor.createMethod({
      name: "walk",
      parameters: [
        new UserParameter("distance", simpleTypeRef("WholeNumber")),
        new UserParameter("target", simpleTypeRef("String")),
      ],
    });
    const methodEditor = editor.getMethodEditor("walk");

    expect(() => methodEditor.updateParameter(1, { name: "distance" })).toThrowError(TypeBrowserError);
    expect(methodEditor.snapshot().parameters).toEqual([
      { name: "distance", type: "WholeNumber", isVarArgs: false },
      { name: "target", type: "String", isVarArgs: false },
    ]);

    editor.createMethod({
      name: "move2",
      parameters: [new UserParameter("distance", simpleTypeRef("WholeNumber"))],
    });
    const moveEditor = editor.getMethodEditor("move");
    moveEditor.addParameter("distance", simpleTypeRef("WholeNumber"));

    expect(() => moveEditor.rename("move2")).toThrowError(/already exists/);
    expect(moveEditor.snapshot().name).toBe("move");
  });

  it("tracks field initializer ownership and missing declaration lookups", () => {
    const editor = new DeclarationEditor(createType());
    const fieldEditor = editor.getFieldEditor("name");
    const initializer = new StringLiteral("rabbit");

    fieldEditor.setInitializer(initializer);

    expect(fieldEditor.snapshot().hasInitializer).toBe(true);
    expect(initializer.parent).toBe(fieldEditor.field);
    expect(editor.removeMethod("missing")).toBe(false);
    expect(editor.removeField("missing")).toBe(false);
    expect(() => editor.getMethodEditor("missing")).toThrowError(/not found/);
    expect(() => editor.getFieldEditor("missing")).toThrowError(/not found/);
  });

  it("provides type selection and unique name helpers", () => {
    const editor = new DeclarationEditor(createType());

    const options = editor.typeSelector.options("s", "SThing");
    expect(options.some((option) => option.name === "SThing" && option.assignable)).toBe(true);
    expect(editor.typeSelector.select("String")).toEqual(simpleTypeRef("String"));
    expect(editor.typeSelector.select("MissingType")).toEqual(simpleTypeRef("MissingType"));
    expect(editor.ensureUniqueMethodName("move")).toBe("move2");
    expect(editor.ensureUniqueFieldName("name")).toBe("name2");
  });
});
