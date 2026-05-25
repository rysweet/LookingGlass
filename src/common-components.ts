import {
  AbstractNode,
  AbstractType,
  ClassDeclaration,
  ExpressionProperty,
  FieldAccess,
  ManagementLevel,
  MethodInvocation,
  NodeListProperty,
  StringLiteral,
  ThisExpression,
  type Expression,
  type TypeRef,
  typeRefName,
} from "./ast-nodes.js";
import { AliceFormatter, type Formatter } from "./formatters.js";
import { TypeBrowser } from "./type-browser.js";

const INDENT_PER_DEPTH = 12;
const BONUS_GAP = 4;

export type TypeIconBorderKind = "user" | "java" | "null";

export interface TypeIconAppearance {
  readonly label: string;
  readonly borderKind: TypeIconBorderKind;
  readonly depth: number;
  readonly memberCount: number;
  readonly bonusLabel: string | null;
  readonly indentOffset: number;
  readonly extraWidth: number;
}

export interface TypeIconOptions {
  readonly browser?: TypeBrowser;
  readonly formatter?: Formatter;
  readonly indentForDepthAndMemberCountTextDesired?: boolean;
}

export interface ExpressionPropertyDisplay {
  readonly expression: Expression | null;
  readonly empty: boolean;
  readonly summary: string;
  readonly typeName: string | null;
}

export interface NodeListDisplayEntry<T extends AbstractNode> {
  readonly index: number;
  readonly node: T;
  readonly id: string;
}

function resolveTypeLabel(type: AbstractType | null, original: AbstractType | TypeRef | string | null): string {
  if (type) {
    return type.name;
  }
  if (typeof original === "string") {
    return original;
  }
  return typeRefName(original as TypeRef | null) ?? "null";
}

function countDisplayableMembers(type: ClassDeclaration): number {
  return type.fields.length + type.methods.filter((method) => method.managementLevel === ManagementLevel.NONE).length;
}

function getUserTypeDepth(type: AbstractType | null, browser: TypeBrowser): number {
  if (!(type instanceof ClassDeclaration)) {
    return -1;
  }
  return 1 + getUserTypeDepth(browser.getResolvedSuperType(type), browser);
}

export function computeTypeIconAppearance(
  typeOrRef: AbstractType | TypeRef | string | null,
  options: TypeIconOptions = {},
): TypeIconAppearance {
  const browser = options.browser ?? new TypeBrowser();
  const formatter = options.formatter ?? new AliceFormatter();
  const indentDesired = options.indentForDepthAndMemberCountTextDesired ?? false;
  const resolved = typeOrRef instanceof AbstractType ? typeOrRef : browser.resolveType(typeOrRef);
  const memberCount = indentDesired && resolved instanceof ClassDeclaration ? countDisplayableMembers(resolved) : 0;
  const bonusLabel = memberCount > 0 ? `(${memberCount})` : null;
  const depth = getUserTypeDepth(resolved, browser);
  const indentOffset = indentDesired && depth > 0 ? depth * INDENT_PER_DEPTH : 0;
  const extraWidth = indentDesired
    ? indentOffset + (bonusLabel ? BONUS_GAP + bonusLabel.length : 0)
    : 0;

  return {
    label: formatter.getNameForType(resolveTypeLabel(resolved, typeOrRef)),
    borderKind: resolved ? (resolved instanceof ClassDeclaration ? "user" : "java") : "null",
    depth,
    memberCount,
    bonusLabel,
    indentOffset,
    extraWidth,
  };
}

export function summarizeExpressionForDisplay(
  expression: Expression | null,
  formatter: Formatter = new AliceFormatter(),
): string {
  if (!expression) {
    return "";
  }
  if (expression instanceof StringLiteral) {
    return JSON.stringify(expression.value);
  }
  if (expression instanceof ThisExpression) {
    return formatter.getTextForThis();
  }
  if (expression instanceof FieldAccess) {
    return `${summarizeExpressionForDisplay(expression.target, formatter)}.${expression.memberName}`;
  }
  if (expression instanceof MethodInvocation) {
    return formatter.formatMethodInvocation({
      target: expression.target ? summarizeExpressionForDisplay(expression.target, formatter) : null,
      methodName: expression.methodName,
      arguments: expression.arguments.map((argument) => summarizeExpressionForDisplay(argument.value, formatter)),
    });
  }
  if ("value" in expression && typeof expression.value !== "object") {
    return String(expression.value);
  }
  if ("name" in expression && typeof expression.name === "string") {
    return expression.name;
  }
  return expression.type;
}

export class ExpressionPropertyView {
  constructor(
    private readonly property: ExpressionProperty,
    private readonly formatter: Formatter = new AliceFormatter(),
  ) {}

  getDisplay(): ExpressionPropertyDisplay {
    const expression = this.property.getValue();
    return {
      expression,
      empty: expression === null,
      summary: summarizeExpressionForDisplay(expression, this.formatter),
      typeName: typeRefName(this.property.getExpressionType()) ?? typeRefName(expression?.getType() ?? null),
    };
  }
}

export class NodeListPropertyView<T extends AbstractNode> {
  constructor(private readonly property: NodeListProperty<T>) {}

  getEntries(): NodeListDisplayEntry<T>[] {
    return this.property.getValue().map((node, index) => ({ index, node, id: node.id }));
  }

  getNodes(): T[] {
    return this.getEntries().map((entry) => entry.node);
  }

  isEmpty(): boolean {
    return this.property.size() === 0;
  }
}
