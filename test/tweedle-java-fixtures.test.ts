import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ConstructorDeclaration,
  ExpressionStatement,
  LambdaExpression,
  MethodInvocation,
  NullLiteral,
  StringLiteral,
} from "../src/ast-nodes.js";
import { parseTweedle } from "../src/tweedle-parser.js";

const CONSTRUCTOR_FIXTURE = `class Scene extends SScene models Scene {
  Scene() {
    super();
  }
}`;

const OPTIONAL_PARAMETER_FIXTURE = `class Scene extends SScene {
  void sayCount(WholeNumber count, TextString label <- "times") {
    return;
  }
}`;

const ADVANCED_FIXTURE = `class Scene extends SScene {
  static WholeNumber build(WholeNumber amount, TextString label <- "hello") {
    return amount;
  }
  Scene(WholeNumber amount) {
    return;
  }
  TextString title <- null;
}`;

const LAMBDA_FIXTURE = `class Scene extends SScene {
  Scene() {
    super();
  }

  void initializeEventListeners() {
    this.addSceneActivationListener(listener: (SceneActivationEvent event)-> {
      this.myFirstMethod();
    });
    this.addArrowKeyPressListener(listener: (ArrowKeyEvent event)-> {
      this.camera.move(direction: event.getMoveDirection(movedirectionplane: MoveDirectionPlane.FORWARD_BACKWARD_LEFT_RIGHT), amount: 0.25);
    });
  }
}`;

describe("parseTweedle on Java Tweedle fixtures", () => {
  it("parses the constructor/models fixture from TweedleParseTest#somethingShouldBeCreatedForClassWithConstructor", () => {
    const ast = parseTweedle(CONSTRUCTOR_FIXTURE);

    expect(ast).toBeInstanceOf(ClassDeclaration);
    expect(ast.name).toBe("Scene");
    expect(ast.superClass).toBe("SScene");
    expect(ast.modelType).toBe("Scene");
    expect(ast.constructors).toHaveLength(1);
    expect(ast.constructors[0]).toBeInstanceOf(ConstructorDeclaration);
    expect(ast.constructors[0].body).toHaveLength(1);
    expect(ast.constructors[0].body[0].type).toBe("SuperConstructorInvocationStatement");
  });

  it("parses the optional-parameter fixture from TweedleParseTest#classMethodShouldPreserveOptionalParameterNameAndType", () => {
    const ast = parseTweedle(OPTIONAL_PARAMETER_FIXTURE);
    const method = ast.methods[0];
    const optional = method.parameters[1];

    expect(ast.name).toBe("Scene");
    expect(method.name).toBe("sayCount");
    expect(method.parameters).toHaveLength(2);
    expect(method.parameters[0].name).toBe("count");
    expect(method.parameters[0].paramType).toMatchObject({ type: "SimpleTypeRef", name: "WholeNumber", isArray: false });
    expect(optional.name).toBe("label");
    expect(optional.paramType).toMatchObject({ type: "SimpleTypeRef", name: "TextString", isArray: false });
    expect(optional.defaultValue).toBeInstanceOf(StringLiteral);
    if (!(optional.defaultValue instanceof StringLiteral)) {
      throw new Error("Expected optional parameter default value to remain a string literal");
    }
    expect(optional.defaultValue.value).toBe("times");
  });

  it("parses the advanced coverage fixture from TweedleAdvancedParseCoverageTest#parseTypeCapturesStaticMethodsOptionalParametersAndConstructors", () => {
    const ast = parseTweedle(ADVANCED_FIXTURE);
    const method = ast.methods[0];
    const field = ast.fields[0];

    expect(ast.superClass).toBe("SScene");
    expect(method.isStatic).toBe(true);
    expect(method.name).toBe("build");
    expect(method.parameters).toHaveLength(2);
    expect(method.parameters[1].defaultValue).toBeInstanceOf(StringLiteral);
    expect(ast.constructors).toHaveLength(1);
    expect(ast.constructors[0].parameters[0].name).toBe("amount");
    expect(field.name).toBe("title");
    expect(field.initializer).toBeInstanceOf(NullLiteral);
  });

  it("parses the listener fixture from TweedleLambdaTest#parsedType", () => {
    const ast = parseTweedle(LAMBDA_FIXTURE);
    const listenerMethod = ast.methods[0];
    const firstStatement = listenerMethod.body[0];

    expect(listenerMethod.name).toBe("initializeEventListeners");
    expect(listenerMethod.body).toHaveLength(2);
    expect(firstStatement).toBeInstanceOf(ExpressionStatement);
    if (!(firstStatement instanceof ExpressionStatement)) {
      throw new Error("Expected listener body to keep an expression statement");
    }
    expect(firstStatement.expression).toBeInstanceOf(MethodInvocation);
    if (!(firstStatement.expression instanceof MethodInvocation)) {
      throw new Error("Expected listener registration to remain a method invocation");
    }

    expect(firstStatement.expression.methodName).toBe("addSceneActivationListener");
    expect(firstStatement.expression.arguments).toHaveLength(1);
    expect(firstStatement.expression.arguments[0].name).toBe("listener");
    expect(firstStatement.expression.arguments[0].value).toBeInstanceOf(LambdaExpression);
    if (!(firstStatement.expression.arguments[0].value instanceof LambdaExpression)) {
      throw new Error("Expected listener argument to stay a lambda expression");
    }

    const lambda = firstStatement.expression.arguments[0].value;
    expect(lambda.value.name).toContain("SceneActivationEvent event");
    expect(lambda.value.name).toContain("myFirstMethod");
    expect(listenerMethod.body[1]).toBeInstanceOf(ExpressionStatement);
  });
});
