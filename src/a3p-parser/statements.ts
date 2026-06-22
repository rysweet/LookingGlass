import {
  getCollectionNodesResolved,
  getProperty,
  getPropertyNode,
  getPropertyText,
  directChild,
  resolve,
} from "./dom.js";
import type { AliceStatement } from "./types.js";

export const PARSED_A3P_STATEMENT_KINDS = [
  "Comment",
  "MethodCall",
  "CountLoop",
  "IfElse",
  "ReturnStatement",
  "VariableDeclaration",
  "DoInOrder",
  "DoTogether",
  "WhileLoop",
  "ForEachInArrayLoop",
  "ForEachInIterableLoop",
  "EachInArrayTogether",
  "EachInIterableTogether",
] as const;

export function extractStatements(methodNode: Element, keyMap: Map<string, Element>): AliceStatement[] {
  const bodyNode = getPropertyNode(methodNode, "body", keyMap);
  if (!bodyNode) return [];

  const statementsProperty = getProperty(bodyNode, "statements");
  if (!statementsProperty) return [];

  return parseStatementCollection(statementsProperty, keyMap);
}

function parseStatement(node: Element, keyMap: Map<string, Element>): AliceStatement | null {
  const metadataStatement = parseMetadataStatement(node);
  if (metadataStatement) return metadataStatement;

  const nodeType = node.getAttribute("type") ?? "";

  if (nodeType === "org.lgna.project.ast.ExpressionStatement") {
    const expressionNode = getPropertyNode(node, "expression", keyMap);
    if (!expressionNode) return null;
    if (expressionNode.getAttribute("type") === "org.lgna.project.ast.MethodInvocation") {
      const methodNode = getPropertyNode(expressionNode, "method", keyMap);
      const callerObject = getPropertyText(expressionNode, "callerObject") ?? "this";
      const args = extractArguments(expressionNode, keyMap);
      return {
        kind: "MethodCall",
        method: methodNode ? getPropertyText(methodNode, "name") || "unknown" : "unknown",
        object: callerObject,
        arguments: args,
      };
    }
  }

  if (nodeType === "org.lgna.project.ast.Comment") {
    return { kind: "Comment", expression: getPropertyText(node, "text") ?? "" };
  }
  if (nodeType === "org.lgna.project.ast.CountLoop") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "CountLoop", count: 1, body };
  }
  if (nodeType === "org.lgna.project.ast.ConditionalStatement") {
    const firstPair = getCollectionNodesResolved(node, "booleanExpressionBodyPairs", keyMap)[0] ?? null;
    const ifBody = firstPair ? parseStatementBlock(firstPair, "body", keyMap) : [];
    const elseBody = parseStatementBlock(node, "elseBody", keyMap);
    return { kind: "IfElse", condition: "unknown", ifBody, elseBody };
  }
  if (nodeType === "org.lgna.project.ast.ReturnStatement") {
    return { kind: "ReturnStatement", expression: "unknown" };
  }
  if (nodeType === "org.lgna.project.ast.LocalDeclarationStatement") {
    return { kind: "VariableDeclaration", name: "unknown", varType: "Object", value: "" };
  }
  if (nodeType === "org.lgna.project.ast.DoInOrder") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "DoInOrder", body };
  }
  if (nodeType === "org.lgna.project.ast.DoTogether") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "DoTogether", body };
  }
  if (nodeType === "org.lgna.project.ast.WhileLoop") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "WhileLoop", condition: "unknown", body };
  }
  if (nodeType === "org.lgna.project.ast.ForEachInArrayLoop") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "ForEachInArrayLoop", itemType: "Object", itemName: "item", collection: "unknown", body };
  }
  if (nodeType === "org.lgna.project.ast.ForEachInIterableLoop") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "ForEachInIterableLoop", itemType: "Object", itemName: "item", collection: "unknown", body };
  }
  if (nodeType === "org.lgna.project.ast.EachInArrayTogether") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "EachInArrayTogether", itemType: "Object", itemName: "item", collection: "unknown", body };
  }
  if (nodeType === "org.lgna.project.ast.EachInIterableTogether") {
    const body = parseStatementBlock(node, "body", keyMap);
    return { kind: "EachInIterableTogether", itemType: "Object", itemName: "item", collection: "unknown", body };
  }

  return { kind: nodeType.split(".").pop() ?? "Unknown" };
}

function parseMetadataStatement(node: Element): AliceStatement | null {
  const metadata = node.getAttribute("alice-web-statement-json");
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as unknown;
    if (parsed && typeof parsed === "object" && typeof (parsed as AliceStatement).kind === "string") {
      return parsed as AliceStatement;
    }
  } catch {
    return null;
  }
  return null;
}

function extractArguments(invocationNode: Element, keyMap: Map<string, Element>): string[] {
  const args: string[] = [];
  const argNodes = getCollectionNodesResolved(invocationNode, "requiredArguments", keyMap);
  for (const argNode of argNodes) {
    const value = getPropertyText(argNode, "value");
    if (value !== null && value !== undefined) {
      args.push(value);
    }
  }
  return args;
}

function parseStatementBlock(parentNode: Element, propertyName: string, keyMap: Map<string, Element>): AliceStatement[] {
  const bodyNode = getPropertyNode(parentNode, propertyName, keyMap);
  if (!bodyNode) return [];
  const statementsProperty = getProperty(bodyNode, "statements");
  if (!statementsProperty) return [];
  return parseStatementCollection(statementsProperty, keyMap);
}

function parseStatementCollection(statementsProperty: Element, keyMap: Map<string, Element>): AliceStatement[] {
  const results: AliceStatement[] = [];
  const collection = directChild(statementsProperty, "collection");
  const container = collection ?? statementsProperty;

  for (let i = 0; i < container.childNodes.length; i++) {
    const child = container.childNodes[i] as Element;
    if (child.nodeType !== 1 || child.tagName !== "node") continue;
    const statement = parseStatement(resolve(child, keyMap), keyMap);
    if (statement) results.push(statement);
  }

  return results;
}
