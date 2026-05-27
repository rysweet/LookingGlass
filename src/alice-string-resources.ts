export type PlaceholderValue = string | number | boolean | null | undefined;
export type PlaceholderMap = Readonly<Record<string, PlaceholderValue>>;
export type PlaceholderValues = PlaceholderMap | readonly PlaceholderValue[];
export type LocaleResources = Readonly<Record<string, string>>;
export type ResourceCatalog = Readonly<Record<string, LocaleResources>>;

export interface MethodParameterDescriptor {
  readonly name: string;
  readonly type?: string | null;
  readonly optional?: boolean;
  readonly variadic?: boolean;
}

export interface MethodSignatureDescriptor {
  readonly name: string;
  readonly parameters?: readonly MethodParameterDescriptor[];
  readonly returnType?: string | null;
  readonly declaringType?: string | null;
  readonly accessLevel?: string | null;
  readonly isStatic?: boolean;
}

export interface ErrorMessageDescriptor {
  readonly message: string;
  readonly context?: string | null;
  readonly line?: number;
  readonly column?: number;
  readonly pointerWidth?: number;
  readonly sourceLine?: string | null;
  readonly suggestion?: string | null;
}

type NodeRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is NodeRecord {
  return typeof value === "object" && value !== null;
}

function getTypeName(value: unknown): string | null {
  return isRecord(value) && typeof value.type === "string"
    ? value.type
    : null;
}

function getString(value: NodeRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string") {
      return candidate;
    }
  }
  return null;
}

function getNode(value: NodeRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in value) {
      return value[key];
    }
  }
  return undefined;
}

function getNodeArray(value: NodeRecord, ...keys: string[]): readonly unknown[] {
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
}

function stringifyPlaceholder(value: PlaceholderValue): string {
  return value == null ? "" : String(value);
}

function formatParameter(parameter: MethodParameterDescriptor): string {
  const prefix = parameter.variadic ? "..." : "";
  const suffix = parameter.optional ? "?" : "";
  if (parameter.type) {
    return `${prefix}${parameter.name}${suffix}: ${parameter.type}`;
  }
  return `${prefix}${parameter.name}${suffix}`;
}

function resolveArguments(node: NodeRecord): readonly unknown[] {
  const direct = getNodeArray(node, "arguments", "requiredArguments", "values");
  if (direct.length > 0) {
    return direct;
  }
  const elements = getNodeArray(node, "elements");
  return elements;
}

function resolveArgumentValue(argument: unknown): unknown {
  if (!isRecord(argument)) {
    return argument;
  }
  return getNode(argument, "value", "expression", "initializer") ?? argument;
}

function joinRendered(values: readonly unknown[]): string {
  return values.map((value) => ExpressionRenderer.render(resolveArgumentValue(value))).join(", ");
}

function indent(level: number): string {
  return "  ".repeat(Math.max(0, level));
}

function normalizeLocale(locale: string | null | undefined): string {
  return (locale ?? "").trim();
}

function localeCandidates(locale: string, fallbackLocale: string): string[] {
  const candidates: string[] = [];
  const normalized = normalizeLocale(locale);
  if (normalized.length > 0) {
    candidates.push(normalized);
    const hyphen = normalized.indexOf("-");
    if (hyphen > 0) {
      candidates.push(normalized.slice(0, hyphen));
    }
  }
  if (!candidates.includes(fallbackLocale)) {
    candidates.push(fallbackLocale);
  }
  return candidates;
}

export class StringFormatter {
  format(template: string, values: PlaceholderValues = {}): string {
    return StringFormatter.format(template, values);
  }

  static format(template: string, values: PlaceholderValues = {}): string {
    let result = "";
    for (let index = 0; index < template.length; index += 1) {
      const character = template[index];
      const next = template[index + 1];
      if (character === "{" && next === "{") {
        result += "{";
        index += 1;
        continue;
      }
      if (character === "}" && next === "}") {
        result += "}";
        index += 1;
        continue;
      }
      if (character !== "{") {
        result += character;
        continue;
      }
      const end = template.indexOf("}", index + 1);
      if (end < 0) {
        result += template.slice(index);
        break;
      }
      const token = template.slice(index + 1, end).trim();
      let replacement: PlaceholderValue;
      if (Array.isArray(values)) {
        replacement = /^\d+$/.test(token)
          ? values[Number.parseInt(token, 10)]
          : undefined;
      } else {
        replacement = (values as PlaceholderMap)[token];
      }
      result += stringifyPlaceholder(replacement);
      index = end;
    }
    return result;
  }
}

export class StringResourceBundle {
  constructor(
    private readonly resources: ResourceCatalog,
    private readonly fallbackLocale = "en",
    private readonly formatter = new StringFormatter(),
  ) {}

  has(locale: string, key: string): boolean {
    return this.lookup(locale, key) !== null;
  }

  getLocale(locale: string): LocaleResources {
    for (const candidate of localeCandidates(locale, this.fallbackLocale)) {
      const resources = this.resources[candidate];
      if (resources) {
        return resources;
      }
    }
    return {};
  }

  get(
    locale: string,
    key: string,
    values?: PlaceholderValues,
  ): string {
    const template = this.lookup(locale, key) ?? key;
    return values === undefined
      ? template
      : this.formatter.format(template, values);
  }

  private lookup(locale: string, key: string): string | null {
    for (const candidate of localeCandidates(locale, this.fallbackLocale)) {
      const value = this.resources[candidate]?.[key];
      if (typeof value === "string") {
        return value;
      }
    }
    return null;
  }
}

export class MethodSignatureFormatter {
  format(signature: MethodSignatureDescriptor): string {
    return MethodSignatureFormatter.format(signature);
  }

  static format(signature: MethodSignatureDescriptor): string {
    const modifiers = [
      signature.accessLevel ?? null,
      signature.isStatic ? "static" : null,
    ].filter((value): value is string => value !== null);
    const owner = signature.declaringType ? `${signature.declaringType}.` : "";
    const parameters = (signature.parameters ?? []).map(formatParameter).join(", ");
    const returnType = signature.returnType ? `: ${signature.returnType}` : "";
    const prefix = modifiers.length > 0 ? `${modifiers.join(" ")} ` : "";
    return `${prefix}${owner}${signature.name}(${parameters})${returnType}`;
  }
}

export class ExpressionRenderer {
  render(expression: unknown): string {
    return ExpressionRenderer.render(expression);
  }

  static render(expression: unknown): string {
    if (expression === null) {
      return "null";
    }
    if (typeof expression === "string") {
      return JSON.stringify(expression);
    }
    if (
      typeof expression === "number"
      || typeof expression === "boolean"
      || typeof expression === "bigint"
    ) {
      return String(expression);
    }
    if (Array.isArray(expression)) {
      return `[${joinRendered(expression)}]`;
    }
    if (!isRecord(expression)) {
      return String(expression);
    }

    const typeName = getTypeName(expression);
    switch (typeName) {
      case "ThisExpression":
        return "this";
      case "SuperExpression":
        return "super";
      case "IdentifierExpression":
      case "LocalAccess":
      case "ParameterAccess":
        return getString(expression, "name", "identifier") ?? "identifier";
      case "TypeExpression":
      case "TypeLiteral":
        return getString(expression, "typeName", "name")
          ?? ExpressionRenderer.render(getNode(expression, "value"));
      case "FieldAccess": {
        const target = getNode(expression, "target", "expression");
        const fieldName = getString(expression, "fieldName", "name", "field");
        return target
          ? `${ExpressionRenderer.render(target)}.${fieldName ?? "field"}`
          : fieldName ?? "field";
      }
      case "MethodInvocation": {
        const target = getNode(expression, "target", "expression");
        const methodName = getString(expression, "methodName", "name", "method");
        const prefix = target ? `${ExpressionRenderer.render(target)}.` : "";
        return `${prefix}${methodName ?? "call"}(${joinRendered(resolveArguments(expression))})`;
      }
      case "InstanceCreation":
      case "NewInstanceExpression": {
        const typeText = getString(expression, "typeName", "name") ?? "Object";
        return `new ${typeText}(${joinRendered(resolveArguments(expression))})`;
      }
      case "NewArrayExpression":
      case "ArrayLiteralExpression":
        return `[${joinRendered(resolveArguments(expression))}]`;
      case "ArrayAccess":
      case "ArrayAccessExpression":
        return `${ExpressionRenderer.render(getNode(expression, "array"))}[${ExpressionRenderer.render(getNode(expression, "index"))}]`;
      case "ArithmeticInfixExpression":
      case "BitwiseInfixExpression":
      case "ShiftInfixExpression":
      case "RelationalInfixExpression":
      case "ConditionalInfixExpression":
      case "BinaryOpExpression":
      case "StringConcatenation":
        return `${ExpressionRenderer.render(getNode(expression, "left", "leftOperand"))} ${getString(expression, "operator") ?? "?"} ${ExpressionRenderer.render(getNode(expression, "right", "rightOperand"))}`;
      case "LogicalComplement":
      case "UnaryOpExpression":
        return `${getString(expression, "operator") ?? "!"}${ExpressionRenderer.render(getNode(expression, "operand", "expression"))}`;
      case "AssignmentExpression":
        return `${ExpressionRenderer.render(getNode(expression, "left", "target"))} = ${ExpressionRenderer.render(getNode(expression, "right", "value"))}`;
      case "TypeCastExpression":
        return `(${getString(expression, "typeName", "type") ?? "Object"}) ${ExpressionRenderer.render(getNode(expression, "expression", "value"))}`;
      case "InstanceOfExpression":
        return `${ExpressionRenderer.render(getNode(expression, "expression", "value"))} instanceof ${getString(expression, "typeName", "type") ?? "Object"}`;
      case "ParenthesizedExpression":
        return `(${ExpressionRenderer.render(getNode(expression, "expression", "value"))})`;
      case "LambdaExpression": {
        const parameters = getNodeArray(expression, "parameters")
          .map((parameter) => {
            if (isRecord(parameter)) {
              return getString(parameter, "name", "identifier") ?? "arg";
            }
            return String(parameter);
          })
          .join(", ");
        return `lambda (${parameters}) -> ${ExpressionRenderer.render(getNode(expression, "body", "expression", "value"))}`;
      }
      case "ResourceExpression":
        return getString(expression, "resourceName", "name") ?? "resource";
      default:
        return getString(expression, "name", "label") ?? `[${typeName ?? "expression"}]`;
    }
  }
}

export class PseudocodeRenderer {
  render(node: unknown): string {
    return this.renderNode(node, 0);
  }

  static render(node: unknown): string {
    return new PseudocodeRenderer().render(node);
  }

  private renderBody(node: unknown, level: number): string {
    const rendered = this.renderNode(node, level);
    return rendered.length > 0 ? rendered : `${indent(level)}do nothing`;
  }

  private renderNode(node: unknown, level: number): string {
    if (Array.isArray(node)) {
      return node.map((entry) => this.renderNode(entry, level)).filter(Boolean).join("\n");
    }
    if (!isRecord(node)) {
      return `${indent(level)}${ExpressionRenderer.render(node)}`;
    }

    const typeName = getTypeName(node);
    switch (typeName) {
      case "BlockStatement":
        return this.renderBody(getNodeArray(node, "statements", "body"), level);
      case "DoInOrder":
      case "DoTogether": {
        const header = typeName === "DoTogether" ? "do together:" : "do in order:";
        return `${indent(level)}${header}\n${this.renderBody(getNode(node, "body", "statements"), level + 1)}`;
      }
      case "ExpressionStatement":
        return `${indent(level)}${ExpressionRenderer.render(getNode(node, "expression", "value"))}`;
      case "LocalDeclarationStatement": {
        const name = getString(node, "name", "localName") ?? "value";
        const initializer = ExpressionRenderer.render(
          getNode(node, "initializer", "expression", "value"),
        );
        return `${indent(level)}let ${name} = ${initializer}`;
      }
      case "ReturnStatement": {
        const expression = getNode(node, "expression", "value");
        return expression === undefined
          ? `${indent(level)}return`
          : `${indent(level)}return ${ExpressionRenderer.render(expression)}`;
      }
      case "WhileLoop": {
        const condition = ExpressionRenderer.render(
          getNode(node, "condition", "conditional", "expression"),
        );
        return `${indent(level)}while ${condition}:\n${this.renderBody(getNode(node, "body", "statements"), level + 1)}`;
      }
      case "CountLoop": {
        const count = ExpressionRenderer.render(getNode(node, "count", "expression"));
        return `${indent(level)}repeat ${count} times:\n${this.renderBody(getNode(node, "body", "statements"), level + 1)}`;
      }
      case "ConditionalStatement": {
        const condition = ExpressionRenderer.render(
          getNode(node, "condition", "expression"),
        );
        const thenText = this.renderBody(
          getNode(node, "body", "thenBody", "thenStatements"),
          level + 1,
        );
        const elseNode = getNode(node, "elseBody", "elseStatements");
        const elseText = elseNode === undefined
          ? ""
          : `\n${indent(level)}else:\n${this.renderBody(elseNode, level + 1)}`;
        return `${indent(level)}if ${condition}:\n${thenText}${elseText}`;
      }
      case "ForEachInArrayLoop":
      case "ForEachInIterableLoop": {
        const itemName = getString(node, "itemName", "item", "variableName") ?? "item";
        const collection = ExpressionRenderer.render(
          getNode(node, "array", "iterable", "collection"),
        );
        return `${indent(level)}for each ${itemName} in ${collection}:\n${this.renderBody(getNode(node, "body", "statements"), level + 1)}`;
      }
      default:
        return `${indent(level)}${ExpressionRenderer.render(node)}`;
    }
  }
}

export class ErrorMessageFormatter {
  format(message: string | ErrorMessageDescriptor): string {
    return ErrorMessageFormatter.format(message);
  }

  static format(message: string | ErrorMessageDescriptor): string {
    const descriptor = typeof message === "string"
      ? { message }
      : message;
    const locationParts: string[] = [];
    if (typeof descriptor.line === "number") {
      locationParts.push(`line ${descriptor.line}`);
    }
    if (typeof descriptor.column === "number") {
      locationParts.push(`column ${descriptor.column}`);
    }

    const context = descriptor.context ? ` in ${descriptor.context}` : "";
    const location = locationParts.length > 0
      ? ` (${locationParts.join(", ")})`
      : "";
    const lines = [`Problem${context}${location}: ${descriptor.message}`];

    if (descriptor.sourceLine) {
      lines.push(`> ${descriptor.sourceLine}`);
      if (typeof descriptor.column === "number") {
        const pointerWidth = Math.max(1, descriptor.pointerWidth ?? 1);
        lines.push(`  ${" ".repeat(Math.max(0, descriptor.column - 1))}${"^".repeat(pointerWidth)}`);
      }
    }
    if (descriptor.suggestion) {
      lines.push(`Try: ${descriptor.suggestion}`);
    }
    return lines.join("\n");
  }
}
