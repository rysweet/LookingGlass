import {
  DOMImplementation,
  DOMParser,
  XMLSerializer,
  Document as XmlDocument,
  Element as XmlElement,
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
  type Expression,
  type Parameter,
  type Statement,
  type TypeRef,
} from "./ast-nodes.js";

export class AstSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AstSerializationError";
  }
}

export type AstSerializableNode = ClassDeclaration | Statement | Expression;

export function encodeAstNode(node: AstSerializableNode): string {
  const impl = new DOMImplementation();
  const doc = impl.createDocument(null, "ast");
  const root = doc.documentElement;
  root.appendChild(encodeNode(doc, node));
  return new XMLSerializer().serializeToString(root);
}

export function encodeClassDeclaration(node: ClassDeclaration): string {
  return encodeAstNode(node);
}

export function decodeAstNode(xml: string): AstSerializableNode {
  const document = new DOMParser().parseFromString(xml, "text/xml");
  const root = document.documentElement;
  if (!root || root.tagName !== "ast") {
    throw new AstSerializationError("Expected <ast> root element");
  }
  const nodeElement = childElement(root, "node");
  return decodeNode(nodeElement);
}

export function decodeClassDeclaration(xml: string): ClassDeclaration {
  const node = decodeAstNode(xml);
  if (!(node instanceof ClassDeclaration)) {
    throw new AstSerializationError("Expected a ClassDeclaration root node");
  }
  return node;
}

function encodeNode(doc: XmlDocument, node: AstSerializableNode): XmlElement {
  const element = doc.createElement("node");
  element.setAttribute("kind", node.constructor.name);
  if ("type" in node) {
    element.setAttribute("type", node.type);
  }

  if (node instanceof ClassDeclaration) {
    setOptionalAttribute(element, "name", node.name);
    setOptionalAttribute(element, "superClass", node.superClass);
    setOptionalAttribute(element, "modelType", node.modelType);
    setOptionalAttribute(element, "visibility", node.visibility);
    appendArray(doc, element, "constructors", node.constructors, encodeNode);
    appendArray(doc, element, "methods", node.methods, encodeNode);
    appendArray(doc, element, "fields", node.fields, encodeNode);
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
    const casesElement = doc.createElement("cases");
    for (const switchCase of node.cases) {
      const caseElement = doc.createElement("case");
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

  throw new AstSerializationError(`Unsupported AST node: ${node.constructor.name}`);
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
      return new AssignmentExpression(
        readSingleNode(element, "target") as Expression,
        readSingleNode(element, "value") as Expression,
      );
    case "ArrayAccessExpression":
      return new ArrayAccessExpression(
        readSingleNode(element, "target") as Expression,
        readSingleNode(element, "index") as Expression,
      );
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

function appendParameters(doc: XmlDocument, parent: XmlElement, parameters: Parameter[]): void {
  const parametersElement = doc.createElement("parameters");
  for (const parameter of parameters) {
    const parameterElement = doc.createElement("parameter");
    parameterElement.setAttribute("name", parameter.name);
    parameterElement.setAttribute("isVarArgs", String(parameter.isVarArgs));
    appendTypeRef(doc, parameterElement, "paramType", parameter.paramType);
    appendOptionalNode(doc, parameterElement, "defaultValue", parameter.defaultValue);
    parametersElement.appendChild(parameterElement);
  }
  parent.appendChild(parametersElement);
}

function readParameters(parametersElement: XmlElement): Parameter[] {
  return childElements(parametersElement, "parameter").map((parameterElement) => ({
    name: requiredAttribute(parameterElement, "name"),
    paramType: readTypeRef(childElement(parameterElement, "paramType")),
    isVarArgs: parseBoolean(requiredAttribute(parameterElement, "isVarArgs")),
    defaultValue: readOptionalNode(parameterElement, "defaultValue") as Expression | null,
  }));
}

function appendArguments(doc: XmlDocument, parent: XmlElement, argumentsList: Argument[]): void {
  const argumentsElement = doc.createElement("arguments");
  for (const argument of argumentsList) {
    const argumentElement = doc.createElement("argument");
    if (argument.name !== null) {
      argumentElement.setAttribute("name", argument.name);
    }
    appendSingleNode(doc, argumentElement, "value", argument.value);
    argumentsElement.appendChild(argumentElement);
  }
  parent.appendChild(argumentsElement);
}

function readArguments(argumentsElement: XmlElement): Argument[] {
  return childElements(argumentsElement, "argument").map((argumentElement) => ({
    name: optionalAttribute(argumentElement, "name"),
    value: readSingleNode(argumentElement, "value") as Expression,
  }));
}

function appendTypeRef(doc: XmlDocument, parent: XmlElement, tagName: string, typeRef: TypeRef): void {
  const element = doc.createElement(tagName);
  element.setAttribute("kind", typeRef.type);
  if (typeRef.type === "SimpleTypeRef") {
    element.setAttribute("name", typeRef.name);
    element.setAttribute("isArray", String(typeRef.isArray));
  } else if (typeRef.type === "LambdaTypeRef") {
    element.setAttribute("raw", typeRef.raw);
  }
  parent.appendChild(element);
}

function readTypeRef(element: XmlElement): TypeRef {
  const kind = requiredAttribute(element, "kind");
  if (kind === "SimpleTypeRef") {
    return {
      type: "SimpleTypeRef",
      name: requiredAttribute(element, "name"),
      isArray: parseBoolean(requiredAttribute(element, "isArray")),
    };
  }
  if (kind === "VoidTypeRef") {
    return { type: "VoidTypeRef" };
  }
  if (kind === "LambdaTypeRef") {
    return { type: "LambdaTypeRef", raw: requiredAttribute(element, "raw") };
  }
  throw new AstSerializationError(`Unsupported type reference: ${kind}`);
}

function appendSingleNode(doc: XmlDocument, parent: XmlElement, tagName: string, node: AstSerializableNode): void {
  const container = doc.createElement(tagName);
  container.appendChild(encodeNode(doc, node));
  parent.appendChild(container);
}

function appendOptionalNode(doc: XmlDocument, parent: XmlElement, tagName: string, node: AstSerializableNode | null): void {
  if (!node) {
    return;
  }
  appendSingleNode(doc, parent, tagName, node);
}

function readSingleNode(parent: XmlElement, tagName: string): AstSerializableNode {
  return decodeNode(childElement(childElement(parent, tagName), "node"));
}

function readOptionalNode(parent: XmlElement, tagName: string): AstSerializableNode | null {
  const container = optionalChildElement(parent, tagName);
  if (!container) {
    return null;
  }
  return decodeNode(childElement(container, "node"));
}

function appendArray<T extends AstSerializableNode>(
  doc: XmlDocument,
  parent: XmlElement,
  tagName: string,
  values: T[],
  encoder: (doc: XmlDocument, value: T) => XmlElement,
): void {
  const container = doc.createElement(tagName);
  for (const value of values) {
    container.appendChild(encoder(doc, value));
  }
  parent.appendChild(container);
}

function appendOptionalArray<T extends AstSerializableNode>(
  doc: XmlDocument,
  parent: XmlElement,
  tagName: string,
  values: T[] | null,
  encoder: (doc: XmlDocument, value: T) => XmlElement,
): void {
  if (!values) {
    return;
  }
  appendArray(doc, parent, tagName, values, encoder);
}

function readNodeArray(container: XmlElement): AstSerializableNode[] {
  return childElements(container, "node").map((nodeElement) => decodeNode(nodeElement));
}

function readOptionalNodeArray(parent: XmlElement, tagName: string): AstSerializableNode[] | null {
  const container = optionalChildElement(parent, tagName);
  return container ? readNodeArray(container) : null;
}

function childElements(parent: XmlElement, tagName?: string): XmlElement[] {
  const result: XmlElement[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === 1) {
      const element = child as XmlElement;
      if (!tagName || element.tagName === tagName) {
        result.push(element);
      }
    }
  }
  return result;
}

function childElement(parent: XmlElement, tagName: string): XmlElement {
  const element = optionalChildElement(parent, tagName);
  if (!element) {
    throw new AstSerializationError(`Missing <${tagName}> element under <${parent.tagName}>`);
  }
  return element;
}

function optionalChildElement(parent: XmlElement, tagName: string): XmlElement | null {
  return childElements(parent, tagName)[0] ?? null;
}

function requiredAttribute(element: XmlElement, name: string): string {
  const value = element.getAttribute(name);
  if (value === null || value === "") {
    throw new AstSerializationError(`Missing '${name}' attribute on <${element.tagName}>`);
  }
  return value;
}

function optionalAttribute(element: XmlElement, name: string): string | null {
  const value = element.getAttribute(name);
  return value === null || value === "" ? null : value;
}

function setOptionalAttribute(element: XmlElement, name: string, value: string | null): void {
  if (value !== null) {
    element.setAttribute(name, value);
  }
}

function parseBoolean(value: string): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new AstSerializationError(`Expected boolean attribute but found '${value}'`);
}
