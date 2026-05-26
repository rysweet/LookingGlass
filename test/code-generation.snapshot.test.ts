import { describe, expect, it } from "vitest";
import { generateJavaSource } from "../src/code-generation.js";

function simpleType(name: string, extra: Record<string, unknown> = {}) {
  return { type: "SimpleTypeRef", name, isArray: false, ...extra };
}

function arrayType(name: string, extra: Record<string, unknown> = {}) {
  return { type: "SimpleTypeRef", name, isArray: true, ...extra };
}

function literal(literalType: "string" | "number" | "boolean" | "null", value: string | number | boolean | null = null) {
  return { type: "Literal", literalType, value };
}

function identifier(name: string) {
  return { type: "Identifier", name };
}

function argument(value: Record<string, unknown>, name: string | null = null) {
  return { name, value };
}

function methodInvocation(methodName: string, args: Array<Record<string, unknown>> = [], target: Record<string, unknown> | null = null) {
  return { type: "MethodInvocation", methodName, arguments: args, target };
}

function expressionStatement(expression: Record<string, unknown>) {
  return { type: "ExpressionStatement", expression };
}

describe("code-generation snapshots", () => {
  it("renders class members and control flow", () => {
    const ast = {
      type: "ClassDeclaration",
      name: "WorkflowRunner",
      superClass: "BaseRunner",
      visibility: "@Public",
      finalAbstractOrNeither: "final",
      typeParameters: ["T"],
      fields: [
        {
          type: "FieldDeclaration",
          visibility: "@Private",
          isStatic: true,
          isConstant: true,
          fieldType: simpleType("WholeNumber"),
          name: "MAX_STEPS",
          initializer: literal("number", 3),
        },
      ],
      constructors: [
        {
          type: "ConstructorDeclaration",
          visibility: "@Protected",
          name: "WorkflowRunner",
          parameters: [
            {
              name: "title",
              paramType: simpleType("String"),
              isVarArgs: false,
              defaultValue: literal("string", "demo"),
            },
          ],
          body: [
            {
              type: "SuperConstructorInvocationStatement",
              arguments: [argument(identifier("title"))],
            },
          ],
        },
      ],
      methods: [
        {
          type: "MethodDeclaration",
          visibility: "@Public",
          isStatic: false,
          isAbstract: false,
          isFinal: true,
          returnType: { type: "VoidTypeRef" },
          name: "run",
          parameters: [
            { name: "ready", paramType: simpleType("Boolean"), isVarArgs: false },
            { name: "names", paramType: arrayType("String"), isVarArgs: false },
          ],
          body: [
            { type: "Comment", text: "prepare state" },
            {
              type: "IfElse",
              condition: identifier("ready"),
              ifBody: [expressionStatement(methodInvocation("start", [], { type: "This" }))],
              elseBody: [expressionStatement(methodInvocation("stop", [], { type: "This" }))],
            },
            {
              type: "ForEach",
              itemType: simpleType("String"),
              itemName: "name",
              collection: identifier("names"),
              body: [expressionStatement(methodInvocation("visit", [argument(identifier("name"), "priority")], { type: "This" }))],
            },
            {
              type: "WhileLoop",
              condition: identifier("keepGoing"),
              body: [
                expressionStatement({
                  type: "Assignment",
                  target: identifier("steps"),
                  value: {
                    type: "BinaryOp",
                    left: identifier("steps"),
                    operator: "+",
                    right: literal("number", 1),
                  },
                }),
              ],
            },
            {
              type: "TryCatch",
              tryBody: [expressionStatement(methodInvocation("save", [], { type: "This" }))],
              catchType: simpleType("Exception"),
              catchVariable: "ex",
              catchBody: [expressionStatement(methodInvocation("report", [argument(identifier("ex"))], { type: "This" }))],
            },
            {
              type: "SwitchCase",
              expression: identifier("mode"),
              cases: [
                {
                  value: literal("string", "fast"),
                  body: [expressionStatement(methodInvocation("accelerate", [], { type: "This" }))],
                },
              ],
              defaultCase: [expressionStatement(methodInvocation("idle", [], { type: "This" }))],
            },
          ],
        },
      ],
    };

    expect(generateJavaSource(ast)).toMatchInlineSnapshot(`
      "public final class WorkflowRunner<T> extends BaseRunner {
        private static final int MAX_STEPS = 3;
      
        protected WorkflowRunner(String title /* default \"demo\" */) {
          super(title);
        }
      
        public final void run(boolean ready, String[] names) {
          // prepare state
          if (ready) {
            this.start();
          } else {
            this.stop();
          }
          for (String name : names) {
            this.visit(/* priority */ name);
          }
          while (keepGoing) {
            steps = steps + 1;
          }
          try {
            this.save();
          } catch (Exception ex) {
            this.report(ex);
          }
          switch (mode) {
            case \"fast\":
              this.accelerate();
              break;
            default:
              this.idle();
          }
        }
      }"
    `);
  });

  it("renders constructor chaining, arrays, and commented blocks", () => {
    const ast = {
      type: "ClassDeclaration",
      name: "BatchJob",
      superClass: "Object",
      visibility: "@Package",
      fields: [],
      constructors: [
        {
          type: "ConstructorDeclaration",
          visibility: "@Public",
          name: "BatchJob",
          parameters: [{ name: "count", paramType: simpleType("WholeNumber"), isVarArgs: false }],
          body: [
            { type: "ThisConstructorInvocationStatement", arguments: [argument(identifier("count"))] },
            { type: "Comment", text: "single line" },
            { type: "DisabledBlock", raw: "count <- count + 1;" },
          ],
        },
      ],
      methods: [
        {
          type: "MethodDeclaration",
          visibility: "@Protected",
          isStatic: true,
          isAbstract: false,
          isFinal: false,
          returnType: arrayType("WholeNumber"),
          name: "build",
          parameters: [],
          body: [
            {
              type: "LocalVariableDeclaration",
              name: "values",
              varType: arrayType("WholeNumber"),
              isConstant: true,
              initializer: {
                type: "NewArray",
                elementType: simpleType("WholeNumber"),
                elements: [literal("number", 1), literal("number", 2), literal("number", 3)],
                size: null,
              },
            },
            {
              type: "CountUpTo",
              count: literal("number", 2),
              body: [expressionStatement(methodInvocation("tick"))],
            },
            {
              type: "DoTogether",
              body: [
                expressionStatement(methodInvocation("log", [argument({ type: "TypeLiteral", valueType: simpleType("String") })])),
                { type: "Block", body: [expressionStatement(methodInvocation("flush"))] },
              ],
            },
            { type: "Return", expression: identifier("values") },
          ],
        },
      ],
    };

    expect(generateJavaSource(ast)).toMatchInlineSnapshot(`
      "class BatchJob {
        public BatchJob(int count) {
          this(count);
          // single line
          /* disabled: count <- count + 1; */
        }
      
        protected static int[] build() {
          final int[] values = new int[] { 1, 2, 3 };
          for (int index = 0; index < 2; index++) {
            tick();
          }
          // doTogether
          {
            log(String.class);
            {
              flush();
            }
          }
          return values;
        }
      }"
    `);
  });

  it("renders expression-heavy methods with generics", () => {
    const ast = {
      type: "MethodDeclaration",
      visibility: "@Public",
      isStatic: false,
      isAbstract: false,
      isFinal: false,
      returnType: simpleType("List", { typeArguments: [simpleType("String")] }),
      name: "convert",
      typeParameters: ["T"],
      parameters: [{ name: "rawValues", paramType: arrayType("Object", { arrayDimensions: 1 }), isVarArgs: false }],
      body: [
        {
          type: "LocalVariableDeclaration",
          name: "label",
          varType: simpleType("String"),
          isConstant: false,
          initializer: {
            type: "Parenthesized",
            expression: {
              type: "BinaryOp",
              left: literal("string", "item-"),
              operator: "+",
              right: { type: "ArrayAccess", target: identifier("rawValues"), index: literal("number", 0) },
            },
          },
        },
        expressionStatement({ type: "Assignment", target: identifier("consumer"), value: { type: "LambdaExpression", raw: "(value) -> value.trim()" } }),
        expressionStatement(methodInvocation("accept", [argument({ type: "TypeCast", targetType: simpleType("String"), expression: identifier("label") })], identifier("sink"))),
        expressionStatement(methodInvocation("check", [argument({ type: "InstanceOf", expression: identifier("label"), testType: simpleType("String") })], { type: "This" })),
        {
          type: "Return",
          expression: {
            type: "NewInstance",
            className: "ArrayList",
            arguments: [argument({ type: "NewArray", elementType: simpleType("String"), elements: [], size: literal("number", 2) })],
          },
        },
      ],
    };

    expect(generateJavaSource(ast)).toMatchInlineSnapshot(`
      "public List<String> convert<T>(Object[] rawValues) {
        String label = (\"item-\" + rawValues[0]);
        consumer = (value) -> value.trim();
        sink.accept(((String) label));
        this.check(label instanceof String);
        return new ArrayList(new String[2]);
      }"
    `);
  });
});
