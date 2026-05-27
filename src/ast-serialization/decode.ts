import { DOMParser } from "@xmldom/xmldom";
import {
  ArrayAccessExpression,
  ArrayLiteralExpression,
  AssignmentExpression,
  BinaryOpExpression,
  BlockStatement,
  BooleanLiteral,
  ClassDeclaration,
  CommentStatement,
  ConditionalStatement,
  ConstructorDeclaration,
  CountUpToStatement,
  DisabledBlockStatement,
  DoInOrderStatement,
  DoTogetherStatement,
  DoubleLiteral,
  ExpressionStatement,
  FieldAccess,
  FieldDeclaration,
  ForEachLoop,
  IdentifierExpression,
  InstanceOfExpression,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  NewArrayExpression,
  NewInstanceExpression,
  NullLiteral,
  ParenthesizedExpression,
  ReturnStatement,
  StringLiteral,
  SuperExpression,
  SwitchCaseStatement,
  ThisExpression,
  TryCatchStatement,
  TypeCastExpression,
  UnaryOpExpression,
  WhileLoopStatement,
  type Argument,
  type Expression,
  type Parameter,
  type Statement,
} from "../ast-nodes.js";
import { AstSerializationError, type AstSerializableNode } from "./types.js";
import {
  childElement,
  childElements,
  optionalAttribute,
  optionalChildElement,
  parseBoolean,
  readTypeRef,
  requiredAttribute,
  type XmlElement,
} from "./xml.js";

export function decodeAstNode(xml: string): AstSerializableNode {
  const document = new DOMParser().parseFromString(xml, "text/xml");
  const root = document.documentElement as XmlElement;
  if (!root || root.tagName !== "ast") {
    throw new AstSerializationError("Expected <ast> root element");
  }
  return decodeNode(childElement(root, "node"));
}

export function decodeClassDeclaration(xml: string): ClassDeclaration {
  const node = decodeAstNode(xml);
  if (!(node instanceof ClassDeclaration)) {
    throw new AstSerializationError("Expected a ClassDeclaration root node");
  }
  return node;
}

function decodeNode(element: XmlElement): AstSerializableNode {
  const kind = requiredAttribute(element, "kind");
  switch (kind) {
    case "ClassDeclaration":
      return new ClassDeclaration(
        requiredAttribute(element, "name"),
        optionalAttribute(element, "superClass"),
        optionalAttribute(element, "modelType"),
        optionalAttribute(element, "visibility"),
        readNodeArray(childElement(element, "constructors")) as ConstructorDeclaration[],
        readNodeArray(childElement(element, "methods")) as MethodDeclaration[],
        readNodeArray(childElement(element, "fields")) as FieldDeclaration[],
      );
    case "ConstructorDeclaration":
      return new ConstructorDeclaration(
        requiredAttribute(element, "name"),
        readParameters(childElement(element, "parameters")),
        readNodeArray(childElement(element, "body")) as Statement[],
        optionalAttribute(element, "visibility"),
      );
    case "MethodDeclaration":
      return new MethodDeclaration(
        requiredAttribute(element, "name"),
        readTypeRef(childElement(element, "returnType")),
        readParameters(childElement(element, "parameters")),
        readNodeArray(childElement(element, "body")) as Statement[],
        parseBoolean(requiredAttribute(element, "isStatic")),
        optionalAttribute(element, "visibility"),
      );
    case "FieldDeclaration":
      return new FieldDeclaration(
        requiredAttribute(element, "name"),
        readTypeRef(childElement(element, "fieldType")),
        readOptionalNode(element, "initializer") as Expression | null,
        parseBoolean(requiredAttribute(element, "isStatic")),
        parseBoolean(requiredAttribute(element, "isConstant")),
        optionalAttribute(element, "visibility"),
      );
    case "DoInOrderStatement":
      return new DoInOrderStatement(readNodeArray(childElement(element, "body")) as Statement[]);
    case "DoTogetherStatement":
      return new DoTogetherStatement(readNodeArray(childElement(element, "body")) as Statement[]);
    case "ConditionalStatement":
      return new ConditionalStatement(
        readSingleNode(element, "condition") as Expression,
        readNodeArray(childElement(element, "ifBody")) as Statement[],
        readOptionalNodeArray(element, "elseBody") as Statement[] | null,
      );
    case "ForEachLoop":
      return new ForEachLoop(
        readTypeRef(childElement(element, "itemType")),
        requiredAttribute(element, "itemName"),
        readSingleNode(element, "collection") as Expression,
        readNodeArray(childElement(element, "body")) as Statement[],
      );
    case "CountUpToStatement":
      return new CountUpToStatement(
        readSingleNode(element, "count") as Expression,
        readNodeArray(childElement(element, "body")) as Statement[],
      );
    case "WhileLoopStatement":
      return new WhileLoopStatement(
        readSingleNode(element, "condition") as Expression,
        readNodeArray(childElement(element, "body")) as Statement[],
      );
    case "TryCatchStatement":
      return new TryCatchStatement(
        readNodeArray(childElement(element, "tryBody")) as Statement[],
        readTypeRef(childElement(element, "catchType")),
        requiredAttribute(element, "catchVariable"),
        readNodeArray(childElement(element, "catchBody")) as Statement[],
      );
    case "SwitchCaseStatement": {
      const casesElement = childElement(element, "cases");
      return new SwitchCaseStatement(
        readSingleNode(element, "expression") as Expression,
        childElements(casesElement, "case").map((caseElement) => ({
          value: readSingleNode(caseElement, "value") as Expression,
          body: readNodeArray(childElement(caseElement, "body")) as Statement[],
        })),
        readOptionalNodeArray(element, "defaultCase") as Statement[] | null,
      );
    }
    case "ReturnStatement":
      return new ReturnStatement(readOptionalNode(element, "expression") as Expression | null);
    case "ExpressionStatement":
      return new ExpressionStatement(readSingleNode(element, "expression") as Expression);
    case "LocalVariableDeclarationStatement":
      return new LocalVariableDeclarationStatement(
        requiredAttribute(element, "name"),
        readTypeRef(childElement(element, "varType")),
        readSingleNode(element, "initializer") as Expression,
        parseBoolean(requiredAttribute(element, "isConstant")),
      );
    case "BlockStatement":
      return new BlockStatement(readNodeArray(childElement(element, "body")) as Statement[]);
    case "DisabledBlockStatement":
      return new DisabledBlockStatement(requiredAttribute(element, "raw"));
    case "CommentStatement":
      return new CommentStatement(requiredAttribute(element, "text"));
    case "IntegerLiteral":
      return new IntegerLiteral(Number(requiredAttribute(element, "value")));
    case "DoubleLiteral":
      return new DoubleLiteral(Number(requiredAttribute(element, "value")));
    case "StringLiteral":
      return new StringLiteral(requiredAttribute(element, "value"));
    case "BooleanLiteral":
      return new BooleanLiteral(parseBoolean(requiredAttribute(element, "value")));
    case "NullLiteral":
      return new NullLiteral();
    case "ThisExpression":
      return new ThisExpression();
    case "SuperExpression":
      return new SuperExpression();
    case "IdentifierExpression":
      return new IdentifierExpression(requiredAttribute(element, "name"));
    case "FieldAccess":
      return new FieldAccess(readSingleNode(element, "target") as Expression, requiredAttribute(element, "memberName"));
    case "MethodInvocation":
      return new MethodInvocation(
        readOptionalNode(element, "target") as Expression | null,
        requiredAttribute(element, "methodName"),
        readArguments(childElement(element, "arguments")),
      );
    case "NewInstanceExpression":
      return new NewInstanceExpression(requiredAttribute(element, "className"), readArguments(childElement(element, "arguments")));
    case "NewArrayExpression":
      return new NewArrayExpression(
        readTypeRef(childElement(element, "elementType")),
        readNodeArray(childElement(element, "elements")) as Expression[],
        readOptionalNode(element, "size") as Expression | null,
      );
    case "ArrayLiteralExpression":
      return new ArrayLiteralExpression(readNodeArray(childElement(element, "elements")) as Expression[]);
    case "BinaryOpExpression":
      return new BinaryOpExpression(
        requiredAttribute(element, "operator"),
        readSingleNode(element, "left") as Expression,
        readSingleNode(element, "right") as Expression,
      );
    case "UnaryOpExpression":
      return new UnaryOpExpression(requiredAttribute(element, "operator"), readSingleNode(element, "operand") as Expression);
    case "AssignmentExpression":
      return new AssignmentExpression(readSingleNode(element, "target") as Expression, readSingleNode(element, "value") as Expression);
    case "ArrayAccessExpression":
      return new ArrayAccessExpression(readSingleNode(element, "target") as Expression, readSingleNode(element, "index") as Expression);
    case "TypeCastExpression":
      return new TypeCastExpression(readSingleNode(element, "expression") as Expression, readTypeRef(childElement(element, "targetType")));
    case "InstanceOfExpression":
      return new InstanceOfExpression(readSingleNode(element, "expression") as Expression, readTypeRef(childElement(element, "testType")));
    case "ParenthesizedExpression":
      return new ParenthesizedExpression(readSingleNode(element, "expression") as Expression);
    default:
      throw new AstSerializationError(`Unsupported AST node kind: ${kind}`);
  }
}

function readParameters(parametersElement: XmlElement): Parameter[] {
  return childElements(parametersElement, "parameter").map((parameterElement) => ({
    name: requiredAttribute(parameterElement, "name"),
    paramType: readTypeRef(childElement(parameterElement, "paramType")),
    isVarArgs: parseBoolean(requiredAttribute(parameterElement, "isVarArgs")),
    defaultValue: readOptionalNode(parameterElement, "defaultValue") as Expression | null,
  }));
}

function readArguments(argumentsElement: XmlElement): Argument[] {
  return childElements(argumentsElement, "argument").map((argumentElement) => ({
    name: optionalAttribute(argumentElement, "name"),
    value: readSingleNode(argumentElement, "value") as Expression,
  }));
}

function readSingleNode(parent: XmlElement, tagName: string): AstSerializableNode {
  return decodeNode(childElement(childElement(parent, tagName), "node"));
}

function readOptionalNode(parent: XmlElement, tagName: string): AstSerializableNode | null {
  const container = optionalChildElement(parent, tagName);
  return container ? decodeNode(childElement(container, "node")) : null;
}

function readNodeArray(container: XmlElement): AstSerializableNode[] {
  return childElements(container, "node").map((nodeElement) => decodeNode(nodeElement));
}

function readOptionalNodeArray(parent: XmlElement, tagName: string): AstSerializableNode[] | null {
  const container = optionalChildElement(parent, tagName);
  return container ? readNodeArray(container) : null;
}
