import {
  type AliceFieldDefinition,
  type AliceMethod,
  type AliceObject,
  type AliceProject,
  type AliceStatement,
  type AliceTypeDefinition,
  getA3PSource,
  snapshotAliceProject,
} from "../a3p-parser.js";
import {
  MINIMAL_PROJECT_XML_TEMPLATE,
  directChild,
  directCollectionNodes,
  ensureXmlTools,
  findSceneTypeDefinition,
  findSceneTypeNode,
  generateUuid,
  getNamedUserTypeNodes,
  getProperty,
  getPropertyNode,
  getPropertyText,
  parseXmlString,
  preserveXmlDeclaration,
  serializeXmlString,
} from "./xml-tools.js";

export function buildProjectXml(project: AliceProject, baseXmlText: string | null): string {
  const source = getA3PSource(project);
  if (baseXmlText !== null && source?.snapshot === snapshotAliceProject(project)) {
    return baseXmlText;
  }

  const doc = parseXmlString(baseXmlText ?? MINIMAL_PROJECT_XML_TEMPLATE);
  const root = doc.documentElement;
  setPropertyText(doc, root, "name", project.projectName || "Program");

  let typeNodes = getNamedUserTypeNodes(doc);
  const sceneTypeNode = findSceneTypeNode(typeNodes);
  const sceneType = findSceneTypeDefinition(project.types);

  if (sceneTypeNode) {
    const desiredFields = buildDesiredSceneFields(project, sceneType);
    const desiredMethods = buildDesiredSceneMethods(project, sceneType);
    if (sceneType?.name) {
      setPropertyText(doc, sceneTypeNode, "name", sceneType.name);
    }
    syncFields(doc, sceneTypeNode, desiredFields);
    syncMethods(doc, sceneTypeNode, desiredMethods);
  }

  if (project.types?.length) {
    // Re-read type nodes only if new types were appended above; reuse initial scan otherwise
    typeNodes = getNamedUserTypeNodes(doc);
    const typeMap = new Map<string, Element>();
    for (const node of typeNodes) {
      const name = getPropertyText(node, "name");
      if (name) typeMap.set(name, node);
    }

    for (const type of project.types) {
      const isSceneType = type.superTypeName?.includes("SScene") ?? false;
      let targetNode = isSceneType ? sceneTypeNode : typeMap.get(type.name) ?? null;
      if (!targetNode && !isSceneType) {
        targetNode = createNamedUserTypeNode(doc, type, root.getAttribute("version"));
        ensureCollectionProperty(doc, root, "declaredTypes").appendChild(targetNode);
        typeMap.set(type.name, targetNode);
      }
      if (targetNode) {
        syncNamedUserType(doc, targetNode, type);
      }
    }
  }

  return preserveXmlDeclaration(baseXmlText, serializeXmlString(doc));
}

function buildDesiredSceneFields(project: AliceProject, sceneType: AliceTypeDefinition | null): AliceFieldDefinition[] {
  const fields = [...(sceneType?.fields ?? [])];
  const seen = new Set(fields.map((field) => field.name));
  for (const object of project.sceneObjects) {
    if (!seen.has(object.name)) {
      fields.push(fieldFromSceneObject(object));
      seen.add(object.name);
    }
  }
  return fields;
}

function buildDesiredSceneMethods(project: AliceProject, sceneType: AliceTypeDefinition | null): AliceMethod[] {
  const methods = [...(sceneType?.methods ?? [])];
  const seen = new Set(methods.map((method) => method.name));
  const knownTypeMethodNames = new Set<string>();
  for (const type of project.types ?? []) {
    for (const method of type.methods ?? []) {
      knownTypeMethodNames.add(method.name);
    }
  }
  for (const method of project.methods) {
    if (!knownTypeMethodNames.has(method.name) && !seen.has(method.name)) {
      methods.push(method);
      seen.add(method.name);
    }
  }
  return methods;
}

function fieldFromSceneObject(object: AliceObject): AliceFieldDefinition {
  return {
    name: object.name,
    typeName: object.typeName,
    resourceType: object.resourceType,
    initializer: object.resourceType ?? null,
  };
}

function syncNamedUserType(doc: Document, typeNode: Element, desired: AliceTypeDefinition): void {
  setPropertyText(doc, typeNode, "name", desired.name);
  if (desired.superTypeName) {
    setTypeProperty(doc, typeNode, "superType", desired.superTypeName);
  }
  if (desired.fields) syncFields(doc, typeNode, desired.fields);
  if (desired.methods) syncMethods(doc, typeNode, desired.methods);
  if (desired.constructors) syncConstructors(doc, typeNode, desired);
}

function syncFields(doc: Document, typeNode: Element, desiredFields: AliceFieldDefinition[]): void {
  const collection = ensureCollectionProperty(doc, typeNode, "fields");
  const existingFields = directCollectionNodes(collection)
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.UserField");

  for (let index = 0; index < existingFields.length && index < desiredFields.length; index += 1) {
    updateFieldNode(doc, existingFields[index], desiredFields[index]);
  }
  for (let index = existingFields.length; index < desiredFields.length; index += 1) {
    collection.appendChild(createFieldNode(doc, desiredFields[index]));
  }
}

function updateFieldNode(doc: Document, fieldNode: Element, desired: AliceFieldDefinition): void {
  setPropertyText(doc, fieldNode, "name", desired.name);
  if (desired.typeName) setTypeProperty(doc, fieldNode, "valueType", desired.typeName);
  if (desired.resourceType) setResourceInitializer(doc, fieldNode, desired.resourceType);
}

function syncMethods(doc: Document, typeNode: Element, desiredMethods: AliceMethod[]): void {
  const collection = ensureCollectionProperty(doc, typeNode, "methods");
  const existingMethods = directCollectionNodes(collection)
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.UserMethod");
  const desiredNames = new Set(desiredMethods.map((method) => method.name));
  const existingByName = new Map<string, Element>();

  for (const methodNode of existingMethods) {
    const name = getPropertyText(methodNode, "name");
    if (name) existingByName.set(name, methodNode);
  }

  for (let index = 0; index < Math.min(existingMethods.length, desiredMethods.length); index += 1) {
    const existingNode = existingMethods[index];
    const existingName = getPropertyText(existingNode, "name");
    const desired = desiredMethods[index];
    if (existingName && existingName !== desired.name && !desiredNames.has(existingName) && !existingByName.has(desired.name)) {
      setPropertyText(doc, existingNode, "name", desired.name);
      syncMethodSignature(doc, existingNode, desired);
      existingByName.delete(existingName);
      existingByName.set(desired.name, existingNode);
    }
  }

  for (const desired of desiredMethods) {
    const existingNode = existingByName.get(desired.name);
    if (existingNode) {
      syncMethodSignature(doc, existingNode, desired);
    } else {
      collection.appendChild(createMethodNode(doc, desired));
    }
  }
}

function syncMethodSignature(doc: Document, methodNode: Element, desired: AliceMethod): void {
  setPropertyText(doc, methodNode, "name", desired.name);
  setTypeProperty(doc, methodNode, "returnType", desired.isFunction ? desired.returnType : "void");
  const paramsCollection = ensureCollectionProperty(doc, methodNode, "requiredParameters");
  while (paramsCollection.firstChild) paramsCollection.removeChild(paramsCollection.firstChild);
  for (const parameter of desired.parameters) {
    paramsCollection.appendChild(createParameterNode(doc, parameter.name, parameter.type));
  }

  let existingBody = getPropertyNode(methodNode, "body");
  if (!existingBody && desired.statements.length === 0) {
    return;
  }

  if (!existingBody && desired.statements.length > 0) {
    appendBlockBodyProperty(doc, methodNode, desired.statements);
    return;
  }

  if (existingBody) {
    const statementsCollection = ensureCollectionProperty(doc, existingBody, "statements");
    while (statementsCollection.firstChild) statementsCollection.removeChild(statementsCollection.firstChild);
    appendSupportedStatements(doc, statementsCollection, desired.statements);
  }
}

function syncConstructors(doc: Document, typeNode: Element, desiredType: AliceTypeDefinition): void {
  const desiredConstructors = desiredType.constructors ?? [];
  const collection = ensureCollectionProperty(doc, typeNode, "constructors");
  const existingConstructors = directCollectionNodes(collection)
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.NamedUserConstructor");

  for (let index = 0; index < existingConstructors.length && index < desiredConstructors.length; index += 1) {
    syncConstructorSignature(doc, existingConstructors[index], desiredConstructors[index], desiredType.superTypeName ?? null);
  }
  for (let index = existingConstructors.length; index < desiredConstructors.length; index += 1) {
    collection.appendChild(createConstructorNode(doc, desiredConstructors[index], desiredType.superTypeName ?? null));
  }
}

function syncConstructorSignature(
  doc: Document,
  constructorNode: Element,
  desired: AliceMethod,
  superTypeName: string | null,
): void {
  const paramsCollection = ensureCollectionProperty(doc, constructorNode, "requiredParameters");
  while (paramsCollection.firstChild) paramsCollection.removeChild(paramsCollection.firstChild);
  for (const parameter of desired.parameters) {
    paramsCollection.appendChild(createParameterNode(doc, parameter.name, parameter.type));
  }

  const bodyNode = ensureConstructorBodyNode(doc, constructorNode, superTypeName);
  const statementsCollection = ensureCollectionProperty(doc, bodyNode, "statements");
  while (statementsCollection.firstChild) statementsCollection.removeChild(statementsCollection.firstChild);
  appendSupportedStatements(doc, statementsCollection, desired.statements);
}

function createMethodNode(doc: Document, method: AliceMethod): Element {
  const methodNode = createAstNode(doc, "org.lgna.project.ast.UserMethod");
  appendBooleanProperty(doc, methodNode, "isStatic", false);
  appendBooleanProperty(doc, methodNode, "isAbstract", false);
  appendBooleanProperty(doc, methodNode, "isFinal", false);
  appendStringProperty(doc, methodNode, "name", method.name);
  appendStringProperty(doc, methodNode, "accessLevel", "PRIVATE", "org.lgna.project.ast.AccessLevel");
  appendBooleanProperty(doc, methodNode, "isSynchronized", false);
  appendBooleanProperty(doc, methodNode, "isStrictFloatingPoint", false);
  appendTypeProperty(doc, methodNode, "returnType", method.isFunction ? method.returnType : "void");

  const paramsProperty = doc.createElement("property");
  paramsProperty.setAttribute("name", "requiredParameters");
  const paramsCollection = doc.createElement("collection");
  paramsCollection.setAttribute("type", "java.util.ArrayList");
  for (const parameter of method.parameters) {
    paramsCollection.appendChild(createParameterNode(doc, parameter.name, parameter.type));
  }
  paramsProperty.appendChild(paramsCollection);
  methodNode.appendChild(paramsProperty);

  const bodyProperty = doc.createElement("property");
  bodyProperty.setAttribute("name", "body");
  bodyProperty.appendChild(createBlockStatementNode(doc, method.statements));
  methodNode.appendChild(bodyProperty);

  appendStringProperty(doc, methodNode, "managementLevel", "NONE", "org.lgna.project.ast.ManagementLevel");
  appendBooleanProperty(doc, methodNode, "isSignatureLocked", false);
  appendBooleanProperty(doc, methodNode, "isDeletionAllowed", true);
  return methodNode;
}

function createConstructorNode(doc: Document, constructor: AliceMethod, superTypeName: string | null): Element {
  const constructorNode = createAstNode(doc, "org.lgna.project.ast.NamedUserConstructor");

  const paramsCollection = appendCollectionProperty(doc, constructorNode, "requiredParameters");
  for (const parameter of constructor.parameters) {
    paramsCollection.appendChild(createParameterNode(doc, parameter.name, parameter.type));
  }
  const bodyProperty = doc.createElement("property");
  bodyProperty.setAttribute("name", "body");
  bodyProperty.appendChild(createConstructorBodyNode(doc, superTypeName, constructor.statements));
  constructorNode.appendChild(bodyProperty);

  appendStringProperty(doc, constructorNode, "accessLevel", "PUBLIC", "org.lgna.project.ast.AccessLevel");
  appendStringProperty(doc, constructorNode, "managementLevel", "NONE", "org.lgna.project.ast.ManagementLevel");
  appendBooleanProperty(doc, constructorNode, "isSignatureLocked", false);
  appendBooleanProperty(doc, constructorNode, "isDeletionAllowed", false);
  return constructorNode;
}

function createConstructorBodyNode(
  doc: Document,
  superTypeName: string | null,
  statements: AliceMethod["statements"] = [],
): Element {
  const bodyNode = createAstNode(doc, "org.lgna.project.ast.ConstructorBlockStatement");

  const constructorInvocationProperty = doc.createElement("property");
  constructorInvocationProperty.setAttribute("name", "constructorInvocationStatement");
  const invocationNode = createAstNode(doc, "org.lgna.project.ast.SuperConstructorInvocationStatement");
  const constructorProperty = doc.createElement("property");
  constructorProperty.setAttribute("name", "constructor");
  constructorProperty.appendChild(createJavaConstructorNode(doc, superTypeName));
  invocationNode.appendChild(constructorProperty);
  appendCollectionProperty(doc, invocationNode, "requiredArguments");
  appendCollectionProperty(doc, invocationNode, "variableArguments");
  appendCollectionProperty(doc, invocationNode, "keyedArguments");
  appendBooleanProperty(doc, invocationNode, "isEnabled", true);
  constructorInvocationProperty.appendChild(invocationNode);
  bodyNode.appendChild(constructorInvocationProperty);

  const statementsCollection = appendCollectionProperty(doc, bodyNode, "statements");
  appendSupportedStatements(doc, statementsCollection, statements);
  appendBooleanProperty(doc, bodyNode, "isEnabled", true);
  return bodyNode;
}

function ensureConstructorBodyNode(doc: Document, constructorNode: Element, superTypeName: string | null): Element {
  const bodyProperty = ensureProperty(doc, constructorNode, "body");
  let bodyNode = directChild(bodyProperty, "node");
  if (!bodyNode) {
    while (bodyProperty.firstChild) bodyProperty.removeChild(bodyProperty.firstChild);
    bodyNode = createConstructorBodyNode(doc, superTypeName);
    bodyProperty.appendChild(bodyNode);
  }
  return bodyNode;
}

function createJavaConstructorNode(doc: Document, declaringClassName: string | null): Element {
  const constructorNode = createAstNode(doc, "org.lgna.project.ast.JavaConstructor");
  const constructorElement = doc.createElement("constructor");
  constructorElement.setAttribute("isVarArgs", "false");
  const declaringClass = doc.createElement("declaringClass");
  declaringClass.setAttribute("name", declaringClassName || "java.lang.Object");
  constructorElement.appendChild(declaringClass);
  constructorElement.appendChild(doc.createElement("parameters"));
  constructorNode.appendChild(constructorElement);
  return constructorNode;
}

function createNamedUserTypeNode(doc: Document, type: AliceTypeDefinition, version: string | null): Element {
  const typeNode = createAstNode(doc, "org.lgna.project.ast.NamedUserType");
  if (version) {
    typeNode.setAttribute("version", version);
  }
  appendStringProperty(doc, typeNode, "name", type.name);
  appendNullProperty(doc, typeNode, "_package");
  appendCollectionProperty(doc, typeNode, "constructors");
  appendStringProperty(doc, typeNode, "accessLevel", "PUBLIC", "org.lgna.project.ast.AccessLevel");
  appendStringProperty(doc, typeNode, "finalAbstractOrNeither", "NEITHER", "org.lgna.project.ast.TypeModifierFinalAbstractOrNeither");
  appendBooleanProperty(doc, typeNode, "isStrictFloatingPoint", false);
  appendTypeProperty(doc, typeNode, "superType", type.superTypeName || "java.lang.Object");
  appendCollectionProperty(doc, typeNode, "methods");
  appendCollectionProperty(doc, typeNode, "fields");
  return typeNode;
}

function createAstNode(doc: Document, astType: string): Element {
  const node = doc.createElement("node");
  node.setAttribute("type", astType);
  node.setAttribute("uuid", generateUuid());
  return node;
}

function appendBlockBodyProperty(
  doc: Document,
  parent: Element,
  statements: AliceStatement[],
): void {
  const bodyProp = doc.createElement("property");
  bodyProp.setAttribute("name", "body");
  bodyProp.appendChild(createBlockStatementNode(doc, statements));
  parent.appendChild(bodyProp);
}

function appendSupportedStatements(doc: Document, collection: Element, statements: AliceMethod["statements"]): void {
  for (const statement of statements) {
    const node = serializeStatement(doc, statement);
    if (node) collection.appendChild(node);
  }
}

function serializeStatement(doc: Document, statement: AliceStatement): Element | null {
  switch (statement.kind) {
    case "Comment":
      return createCommentNode(doc, statement.expression ?? "");
    case "MethodCall":
      return createMethodCallNode(doc, statement);
    case "DoInOrder":
      return createBlockContainerNode(doc, "org.lgna.project.ast.DoInOrder", statement.body ?? []);
    case "DoTogether":
      return createBlockContainerNode(doc, "org.lgna.project.ast.DoTogether", statement.body ?? []);
    case "WhileLoop":
      return createWhileLoopNode(doc, statement);
    case "CountLoop":
      return createCountLoopNode(doc, statement);
    case "IfElse":
      return createConditionalNode(doc, statement);
    case "ForEachLoop":
      return createForEachNode(doc, "org.lgna.project.ast.ForEachInArrayLoop", statement);
    case "EachInArrayTogether":
      return createForEachNode(doc, "org.lgna.project.ast.EachInArrayTogether", statement);
    case "ReturnStatement":
      return createReturnNode(doc, statement.expression ?? "");
    case "VariableDeclaration":
      return createLocalDeclarationNode(doc, statement);
    default:
      console.warn(`[a3p-writer] Skipping unsupported statement kind: "${statement.kind}"`);
      return null;
  }
}

function createCommentNode(doc: Document, text: string): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.Comment");
  appendStringProperty(doc, node, "text", text);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createMethodCallNode(doc: Document, statement: AliceStatement): Element {
  const exprStmt = createAstNode(doc, "org.lgna.project.ast.ExpressionStatement");

  const exprProp = doc.createElement("property");
  exprProp.setAttribute("name", "expression");
  const invocation = createAstNode(doc, "org.lgna.project.ast.MethodInvocation");

  // expression (caller object)
  const callerProp = doc.createElement("property");
  callerProp.setAttribute("name", "expression");
  if (statement.object && statement.object !== "this") {
    const fieldAccess = createAstNode(doc, "org.lgna.project.ast.FieldAccess");
    const fieldProp = doc.createElement("property");
    fieldProp.setAttribute("name", "field");
    const userField = createAstNode(doc, "org.lgna.project.ast.UserField");
    appendStringProperty(doc, userField, "name", statement.object);
    fieldProp.appendChild(userField);
    fieldAccess.appendChild(fieldProp);
    callerProp.appendChild(fieldAccess);
  } else {
    const thisExpr = createAstNode(doc, "org.lgna.project.ast.ThisExpression");
    callerProp.appendChild(thisExpr);
  }
  invocation.appendChild(callerProp);

  // method
  const methodProp = doc.createElement("property");
  methodProp.setAttribute("name", "method");
  const methodNode = createAstNode(doc, "org.lgna.project.ast.JavaMethod");
  const methodElement = doc.createElement("method");
  methodElement.setAttribute("name", statement.method ?? "unknown");
  methodNode.appendChild(methodElement);
  methodProp.appendChild(methodNode);
  invocation.appendChild(methodProp);

  // requiredArguments
  const argsProp = doc.createElement("property");
  argsProp.setAttribute("name", "requiredArguments");
  const argsCollection = doc.createElement("collection");
  argsCollection.setAttribute("type", "java.util.ArrayList");
  for (const arg of statement.arguments ?? []) {
    argsCollection.appendChild(createSimpleArgumentNode(doc, arg));
  }
  argsProp.appendChild(argsCollection);
  invocation.appendChild(argsProp);

  appendCollectionProperty(doc, invocation, "variableArguments");
  appendCollectionProperty(doc, invocation, "keyedArguments");

  exprProp.appendChild(invocation);
  exprStmt.appendChild(exprProp);
  appendBooleanProperty(doc, exprStmt, "isEnabled", true);
  return exprStmt;
}

function createSimpleArgumentNode(doc: Document, value: string): Element {
  const argNode = createAstNode(doc, "org.lgna.project.ast.SimpleArgument");
  const exprProp = doc.createElement("property");
  exprProp.setAttribute("name", "expression");
  exprProp.appendChild(createLiteralNode(doc, value));
  argNode.appendChild(exprProp);
  return argNode;
}

function createLiteralNode(doc: Document, value: string): Element {
  let astType: string;
  if (value === "true" || value === "false") {
    astType = "org.lgna.project.ast.BooleanLiteral";
  } else if (/^-?\d+$/.test(value)) {
    astType = "org.lgna.project.ast.IntegerLiteral";
  } else if (/^-?\d+\.\d+$/.test(value)) {
    astType = "org.lgna.project.ast.DoubleLiteral";
  } else {
    astType = "org.lgna.project.ast.StringLiteral";
  }
  const node = createAstNode(doc, astType);
  appendStringProperty(doc, node, "value", value);
  return node;
}

function createBlockStatementNode(doc: Document, statements: AliceStatement[]): Element {
  const block = createAstNode(doc, "org.lgna.project.ast.BlockStatement");
  const stmtsProp = doc.createElement("property");
  stmtsProp.setAttribute("name", "statements");
  const collection = doc.createElement("collection");
  collection.setAttribute("type", "java.util.ArrayList");
  appendSupportedStatements(doc, collection, statements);
  stmtsProp.appendChild(collection);
  block.appendChild(stmtsProp);
  appendBooleanProperty(doc, block, "isEnabled", true);
  return block;
}

function createBlockContainerNode(doc: Document, nodeType: string, body: AliceStatement[]): Element {
  const node = createAstNode(doc, nodeType);
  appendBlockBodyProperty(doc, node, body);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createWhileLoopNode(doc: Document, statement: AliceStatement): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.WhileLoop");

  const condProp = doc.createElement("property");
  condProp.setAttribute("name", "conditional");
  condProp.appendChild(createLiteralNode(doc, statement.condition ?? "true"));
  node.appendChild(condProp);

  appendBlockBodyProperty(doc, node, statement.body ?? []);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createCountLoopNode(doc: Document, statement: AliceStatement): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.CountLoop");

  // variable (UserLocal)
  const varProp = doc.createElement("property");
  varProp.setAttribute("name", "variable");
  const localNode = createAstNode(doc, "org.lgna.project.ast.UserLocal");
  appendStringProperty(doc, localNode, "name", "index");
  appendTypeProperty(doc, localNode, "valueType", "java.lang.Integer");
  appendBooleanProperty(doc, localNode, "isFinal", false);
  varProp.appendChild(localNode);
  node.appendChild(varProp);

  // constant (IntegerLiteral for count)
  const constProp = doc.createElement("property");
  constProp.setAttribute("name", "constant");
  const countValue = statement.countExpression ?? String(statement.count ?? 1);
  constProp.appendChild(createLiteralNode(doc, countValue));
  node.appendChild(constProp);

  appendBlockBodyProperty(doc, node, statement.body ?? []);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createConditionalNode(doc: Document, statement: AliceStatement): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.ConditionalStatement");

  // booleanExpressionBodyPairs
  const pairsProp = doc.createElement("property");
  pairsProp.setAttribute("name", "booleanExpressionBodyPairs");
  const pairsCollection = doc.createElement("collection");
  pairsCollection.setAttribute("type", "java.util.ArrayList");

  const pair = createAstNode(doc, "org.lgna.project.ast.BooleanExpressionBodyPair");

  const exprProp = doc.createElement("property");
  exprProp.setAttribute("name", "expression");
  exprProp.appendChild(createLiteralNode(doc, statement.condition ?? "true"));
  pair.appendChild(exprProp);

  appendBlockBodyProperty(doc, pair, statement.ifBody ?? []);

  pairsCollection.appendChild(pair);
  pairsProp.appendChild(pairsCollection);
  node.appendChild(pairsProp);

  // elseBody
  const elseProp = doc.createElement("property");
  elseProp.setAttribute("name", "elseBody");
  elseProp.appendChild(createBlockStatementNode(doc, statement.elseBody ?? []));
  node.appendChild(elseProp);

  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createForEachNode(doc: Document, nodeType: string, statement: AliceStatement): Element {
  const node = createAstNode(doc, nodeType);

  // item (UserLocal)
  const itemProp = doc.createElement("property");
  itemProp.setAttribute("name", "item");
  const localNode = createAstNode(doc, "org.lgna.project.ast.UserLocal");
  appendStringProperty(doc, localNode, "name", statement.itemName ?? "item");
  if (statement.itemType) {
    appendTypeProperty(doc, localNode, "valueType", statement.itemType);
  }
  appendBooleanProperty(doc, localNode, "isFinal", false);
  itemProp.appendChild(localNode);
  node.appendChild(itemProp);

  // array expression
  const arrayProp = doc.createElement("property");
  arrayProp.setAttribute("name", "array");
  arrayProp.appendChild(createLiteralNode(doc, statement.collection ?? ""));
  node.appendChild(arrayProp);

  appendBlockBodyProperty(doc, node, statement.body ?? []);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createReturnNode(doc: Document, expression: string): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.ReturnStatement");
  const exprProp = doc.createElement("property");
  exprProp.setAttribute("name", "expression");
  exprProp.appendChild(createLiteralNode(doc, expression));
  node.appendChild(exprProp);
  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createLocalDeclarationNode(doc: Document, statement: AliceStatement): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.LocalDeclarationStatement");

  // local (UserLocal)
  const localProp = doc.createElement("property");
  localProp.setAttribute("name", "local");
  const localNode = createAstNode(doc, "org.lgna.project.ast.UserLocal");
  appendStringProperty(doc, localNode, "name", statement.name ?? "x");
  appendTypeProperty(doc, localNode, "valueType", statement.varType ?? "java.lang.Object");
  appendBooleanProperty(doc, localNode, "isFinal", false);
  localProp.appendChild(localNode);
  node.appendChild(localProp);

  // initializer
  const initProp = doc.createElement("property");
  initProp.setAttribute("name", "initializer");
  initProp.appendChild(createLiteralNode(doc, statement.value ?? ""));
  node.appendChild(initProp);

  appendBooleanProperty(doc, node, "isEnabled", true);
  return node;
}

function createParameterNode(doc: Document, name: string, typeName: string): Element {
  const parameterNode = createAstNode(doc, "org.lgna.project.ast.UserParameter");
  appendStringProperty(doc, parameterNode, "name", name);
  appendTypeProperty(doc, parameterNode, "valueType", typeName || "java.lang.Object");
  return parameterNode;
}

function createFieldNode(doc: Document, field: AliceFieldDefinition): Element {
  const fieldNode = createAstNode(doc, "org.lgna.project.ast.UserField");
  appendStringProperty(doc, fieldNode, "name", field.name);
  appendTypeProperty(doc, fieldNode, "valueType", field.typeName || "java.lang.Object");
  if (field.resourceType) setResourceInitializer(doc, fieldNode, field.resourceType);
  return fieldNode;
}

function setResourceInitializer(doc: Document, fieldNode: Element, resourceType: string): void {
  const property = ensureProperty(doc, fieldNode, "initializer");
  while (property.firstChild) property.removeChild(property.firstChild);
  const initNode = createAstNode(doc, "org.lgna.project.ast.InstanceCreation");
  const ref = doc.createElement("resourceReference");
  ref.setAttribute("name", resourceType);
  initNode.appendChild(ref);
  property.appendChild(initNode);
}

function setTypeProperty(doc: Document, parent: Element, propertyName: string, typeName: string): void {
  const property = ensureProperty(doc, parent, propertyName);
  while (property.firstChild) property.removeChild(property.firstChild);
  property.appendChild(createTypeNode(doc, typeName));
}

function appendTypeProperty(doc: Document, parent: Element, propertyName: string, typeName: string): void {
  const property = doc.createElement("property");
  property.setAttribute("name", propertyName);
  property.appendChild(createTypeNode(doc, typeName));
  parent.appendChild(property);
}

function appendCollectionProperty(doc: Document, parent: Element, propertyName: string): Element {
  const property = doc.createElement("property");
  property.setAttribute("name", propertyName);
  const collection = doc.createElement("collection");
  collection.setAttribute("type", "java.util.ArrayList");
  property.appendChild(collection);
  parent.appendChild(property);
  return collection;
}

function createTypeNode(doc: Document, typeName: string): Element {
  const node = createAstNode(doc, "org.lgna.project.ast.JavaType");
  const type = doc.createElement("type");
  type.setAttribute("name", typeName || "java.lang.Object");
  node.appendChild(type);
  return node;
}

function appendStringProperty(doc: Document, parent: Element, propertyName: string, value: string, valueType = "java.lang.String"): void {
  const property = doc.createElement("property");
  property.setAttribute("name", propertyName);
  const valueNode = doc.createElement("value");
  valueNode.setAttribute("type", valueType);
  valueNode.appendChild(doc.createTextNode(value));
  property.appendChild(valueNode);
  parent.appendChild(property);
}

function appendNullProperty(doc: Document, parent: Element, propertyName: string): void {
  const property = doc.createElement("property");
  property.setAttribute("name", propertyName);
  const valueNode = doc.createElement("value");
  valueNode.setAttribute("isNull", "true");
  property.appendChild(valueNode);
  parent.appendChild(property);
}

function appendBooleanProperty(doc: Document, parent: Element, propertyName: string, value: boolean): void {
  appendStringProperty(doc, parent, propertyName, String(value), "java.lang.Boolean");
}

function setPropertyText(doc: Document, parent: Element, propertyName: string, value: string): void {
  const property = ensureProperty(doc, parent, propertyName);
  const valueNode = ensureValueNode(doc, property, "java.lang.String");
  valueNode.textContent = value;
}

function ensureCollectionProperty(doc: Document, parent: Element, propertyName: string): Element {
  const property = ensureProperty(doc, parent, propertyName);
  let collection = directChild(property, "collection");
  if (!collection) {
    collection = doc.createElement("collection");
    collection.setAttribute("type", "java.util.ArrayList");
    while (property.firstChild) property.removeChild(property.firstChild);
    property.appendChild(collection);
  }
  return collection;
}

function ensureProperty(doc: Document, parent: Element, propertyName: string): Element {
  let property = getProperty(parent, propertyName);
  if (!property) {
    property = doc.createElement("property");
    property.setAttribute("name", propertyName);
    parent.appendChild(property);
  }
  return property;
}

function ensureValueNode(doc: Document, property: Element, valueType: string): Element {
  let valueNode = directChild(property, "value");
  if (!valueNode) {
    while (property.firstChild) property.removeChild(property.firstChild);
    valueNode = doc.createElement("value");
    property.appendChild(valueNode);
  }
  valueNode.setAttribute("type", valueType);
  return valueNode;
}

export function appendCommentToMethod(baseXmlText: string | null, methodName: string, commentText: string): string {
  const doc = parseXmlString(baseXmlText ?? MINIMAL_PROJECT_XML_TEMPLATE);
  const methodNodes = getNamedUserTypeNodes(doc).flatMap((typeNode) => directCollectionNodes(ensureCollectionProperty(doc, typeNode, "methods")))
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.UserMethod");

  for (const methodNode of methodNodes) {
    if (getPropertyText(methodNode, "name") !== methodName) continue;
    const bodyNode = getPropertyNode(methodNode, "body");
    if (!bodyNode) break;
    const collection = ensureCollectionProperty(doc, bodyNode, "statements");
    appendSupportedStatements(doc, collection, [{ kind: "Comment", expression: commentText }]);
    break;
  }

  return preserveXmlDeclaration(baseXmlText, serializeXmlString(doc));
}

export { ensureXmlTools };
