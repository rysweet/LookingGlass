import {
  DOMImplementation,
  XMLSerializer,
  type Document as XmlDocument,
  type Element as XmlElement,
} from "@xmldom/xmldom";
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
  type Parameter,
} from "../ast-nodes.js";
import { type AstSerializableNode } from "./types.js";
import { appendTypeRef, setOptionalAttribute, type XmlDocument as XmlDoc, type XmlElement as XmlEl } from "./xml.js";

export function encodeAstNode(node: AstSerializableNode): string {
  const implementation = new DOMImplementation();
  const doc = implementation.createDocument(null, "ast");
  const root = doc.documentElement;
  if (!root) {
    throw new Error("Expected <ast> root element");
  }
  root.appendChild(encodeNode(doc as unknown as XmlDoc, node));
  return new XMLSerializer().serializeToString(root);
}

export function encodeClassDeclaration(node: ClassDeclaration): string {
  return encodeAstNode(node);
}

function encodeNode(doc: XmlDoc, node: AstSerializableNode): XmlEl {
  const element = doc.createElement("node") as XmlEl;
  element.setAttribute("kind", node.constructor.name);
  if ("type" in node) {
    element.setAttribute("type", node.type);
  }

  if (node instanceof ClassDeclaration) {
    setOptionalAttribute(element, "name", node.name);
    setOptionalAttribute(element, "superClass", node.superClass);
    setOptionalAttribute(element, "modelType", node.modelType);
    setOptionalAttribute(element, "visibility", node.visibility);
    appendArray(doc, element, "constructors", node.constructors as ConstructorDeclaration[], encodeNode);
    appendArray(doc, element, "methods", node.methods as MethodDeclaration[], encodeNode);
    appendArray(doc, element, "fields", node.fields as FieldDeclaration[], encodeNode);
    return element;
  }
  if (node instanceof ConstructorDeclaration) {
    setOptionalAttribute(element, "name", node.name);
    setOptionalAttribute(element, "visibility", node.visibility);
    appendParameters(doc, element, node.parameters);
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof MethodDeclaration) {
    setOptionalAttribute(element, "name", node.name);
    setOptionalAttribute(element, "visibility", node.visibility);
    element.setAttribute("isStatic", String(node.isStatic));
    appendTypeRef(doc, element, "returnType", node.returnType);
    appendParameters(doc, element, node.parameters);
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof FieldDeclaration) {
    setOptionalAttribute(element, "name", node.name);
    setOptionalAttribute(element, "visibility", node.visibility);
    element.setAttribute("isStatic", String(node.isStatic));
    element.setAttribute("isConstant", String(node.isConstant));
    appendTypeRef(doc, element, "fieldType", node.fieldType);
    appendOptionalNode(doc, element, "initializer", node.initializer);
    return element;
  }
  if (node instanceof DoInOrderStatement || node instanceof DoTogetherStatement || node instanceof BlockStatement) {
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof ConditionalStatement) {
    appendSingleNode(doc, element, "condition", node.condition);
    appendArray(doc, element, "ifBody", node.ifBody, encodeNode);
    appendOptionalArray(doc, element, "elseBody", node.elseBody, encodeNode);
    return element;
  }
  if (node instanceof ForEachLoop) {
    setOptionalAttribute(element, "itemName", node.itemName);
    appendTypeRef(doc, element, "itemType", node.itemType);
    appendSingleNode(doc, element, "collection", node.collection);
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof CountUpToStatement) {
    appendSingleNode(doc, element, "count", node.count);
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof WhileLoopStatement) {
    appendSingleNode(doc, element, "condition", node.condition);
    appendArray(doc, element, "body", node.body, encodeNode);
    return element;
  }
  if (node instanceof TryCatchStatement) {
    setOptionalAttribute(element, "catchVariable", node.catchVariable);
    appendArray(doc, element, "tryBody", node.tryBody, encodeNode);
    appendTypeRef(doc, element, "catchType", node.catchType);
    appendArray(doc, element, "catchBody", node.catchBody, encodeNode);
    return element;
  }
  if (node instanceof SwitchCaseStatement) {
    appendSingleNode(doc, element, "expression", node.expression);
    const casesElement = doc.createElement("cases") as XmlEl;
    for (const switchCase of node.cases) {
      const caseElement = doc.createElement("case") as XmlEl;
      appendSingleNode(doc, caseElement, "value", switchCase.value);
      appendArray(doc, caseElement, "body", switchCase.body, encodeNode);
      casesElement.appendChild(caseElement);
    }
    element.appendChild(casesElement);
    appendOptionalArray(doc, element, "defaultCase", node.defaultCase, encodeNode);
    return element;
  }
  if (node instanceof ReturnStatement) {
    appendOptionalNode(doc, element, "expression", node.expression);
    return element;
  }
  if (node instanceof ExpressionStatement) {
    appendSingleNode(doc, element, "expression", node.expression);
    return element;
  }
  if (node instanceof LocalVariableDeclarationStatement) {
    setOptionalAttribute(element, "name", node.name);
    element.setAttribute("isConstant", String(node.isConstant));
    appendTypeRef(doc, element, "varType", node.varType);
    appendSingleNode(doc, element, "initializer", node.initializer);
    return element;
  }
  if (node instanceof DisabledBlockStatement) {
    setOptionalAttribute(element, "raw", node.raw);
    return element;
  }
  if (node instanceof CommentStatement) {
    setOptionalAttribute(element, "text", node.text);
    return element;
  }
  if (node instanceof IntegerLiteral || node instanceof DoubleLiteral || node instanceof StringLiteral || node instanceof BooleanLiteral) {
    element.setAttribute("value", String(node.value));
    return element;
  }
  if (node instanceof NullLiteral || node instanceof ThisExpression || node instanceof SuperExpression) {
    return element;
  }
  if (node instanceof IdentifierExpression) {
    setOptionalAttribute(element, "name", node.name);
    return element;
  }
  if (node instanceof FieldAccess) {
    setOptionalAttribute(element, "memberName", node.memberName);
    appendSingleNode(doc, element, "target", node.target);
    return element;
  }
  if (node instanceof MethodInvocation) {
    setOptionalAttribute(element, "methodName", node.methodName);
    appendOptionalNode(doc, element, "target", node.target);
    appendArguments(doc, element, node.arguments);
    return element;
  }
  if (node instanceof NewInstanceExpression) {
    setOptionalAttribute(element, "className", node.className);
    appendArguments(doc, element, node.arguments);
    return element;
  }
  if (node instanceof NewArrayExpression) {
    appendTypeRef(doc, element, "elementType", node.elementType);
    appendArray(doc, element, "elements", node.elements, encodeNode);
    appendOptionalNode(doc, element, "size", node.size);
    return element;
  }
  if (node instanceof ArrayLiteralExpression) {
    appendArray(doc, element, "elements", node.elements, encodeNode);
    return element;
  }
  if (node instanceof BinaryOpExpression) {
    setOptionalAttribute(element, "operator", node.operator);
    appendSingleNode(doc, element, "left", node.left);
    appendSingleNode(doc, element, "right", node.right);
    return element;
  }
  if (node instanceof UnaryOpExpression) {
    setOptionalAttribute(element, "operator", node.operator);
    appendSingleNode(doc, element, "operand", node.operand);
    return element;
  }
  if (node instanceof AssignmentExpression) {
    appendSingleNode(doc, element, "target", node.target);
    appendSingleNode(doc, element, "value", node.value);
    return element;
  }
  if (node instanceof ArrayAccessExpression) {
    appendSingleNode(doc, element, "target", node.target);
    appendSingleNode(doc, element, "index", node.index);
    return element;
  }
  if (node instanceof TypeCastExpression) {
    appendSingleNode(doc, element, "expression", node.expression);
    appendTypeRef(doc, element, "targetType", node.targetType);
    return element;
  }
  if (node instanceof InstanceOfExpression) {
    appendSingleNode(doc, element, "expression", node.expression);
    appendTypeRef(doc, element, "testType", node.testType);
    return element;
  }
  if (node instanceof ParenthesizedExpression) {
    appendSingleNode(doc, element, "expression", node.expression);
    return element;
  }
  throw new Error(`Unsupported AST node: ${node.constructor.name}`);
}

function appendParameters(doc: XmlDoc, parent: XmlEl, parameters: Parameter[]): void {
  const parametersElement = doc.createElement("parameters") as XmlEl;
  for (const parameter of parameters) {
    const parameterElement = doc.createElement("parameter") as XmlEl;
    parameterElement.setAttribute("name", parameter.name);
    parameterElement.setAttribute("isVarArgs", String(parameter.isVarArgs));
    appendTypeRef(doc, parameterElement, "paramType", parameter.paramType);
    appendOptionalNode(doc, parameterElement, "defaultValue", parameter.defaultValue);
    parametersElement.appendChild(parameterElement);
  }
  parent.appendChild(parametersElement);
}

function appendArguments(doc: XmlDoc, parent: XmlEl, argumentsList: Argument[]): void {
  const argumentsElement = doc.createElement("arguments") as XmlEl;
  for (const argument of argumentsList) {
    const argumentElement = doc.createElement("argument") as XmlEl;
    if (argument.name !== null) {
      argumentElement.setAttribute("name", argument.name);
    }
    appendSingleNode(doc, argumentElement, "value", argument.value);
    argumentsElement.appendChild(argumentElement);
  }
  parent.appendChild(argumentsElement);
}

function appendSingleNode(doc: XmlDoc, parent: XmlEl, tagName: string, node: AstSerializableNode): void {
  const container = doc.createElement(tagName) as XmlEl;
  container.appendChild(encodeNode(doc, node));
  parent.appendChild(container);
}

function appendOptionalNode(doc: XmlDoc, parent: XmlEl, tagName: string, node: AstSerializableNode | null): void {
  if (node) {
    appendSingleNode(doc, parent, tagName, node);
  }
}

function appendArray<T extends AstSerializableNode>(
  doc: XmlDoc,
  parent: XmlEl,
  tagName: string,
  values: T[],
  encoder: (doc: XmlDoc, value: T) => XmlEl,
): void {
  const container = doc.createElement(tagName) as XmlEl;
  for (const value of values) {
    container.appendChild(encoder(doc, value));
  }
  parent.appendChild(container);
}

function appendOptionalArray<T extends AstSerializableNode>(
  doc: XmlDoc,
  parent: XmlEl,
  tagName: string,
  values: T[] | null,
  encoder: (doc: XmlDoc, value: T) => XmlEl,
): void {
  if (values) {
    appendArray(doc, parent, tagName, values, encoder);
  }
}
