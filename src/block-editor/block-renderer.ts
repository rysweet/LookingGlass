import {
  CommentStatement,
  ConditionalStatement,
  CountLoop,
  DoInOrder,
  DoTogether,
  ExpressionStatement,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  ForEachLoop,
  LocalDeclarationStatement,
  MethodInvocation,
  ReturnStatement,
  WhileLoop,
  type Expression,
} from "../ast-nodes.js";
import type { BlockNode, StatementNode } from "../ast-editing-operations.js";
import { ExpressionRenderer } from "../alice-string-resources.js";

const COLORS = {
  control: "#F59E0B",
  method: "#8B5CF6",
  expression: "#10B981",
  declaration: "#3B82F6",
  comment: "#6B7280",
} as const;

const STYLE_ELEMENT_ID = "alice-block-editor-styles";

export class BlockRenderer {
  render(block: BlockNode): HTMLElement {
    const documentRef = resolveDocument();
    ensureBlockEditorStyles(documentRef);

    const root = documentRef.createElement("div");
    root.className = "alice-block-renderer";
    root.dataset.blockOwnerId = block.id;
    root.append(this.renderStatementList(documentRef, block.body, block, 0, true));
    return root;
  }

  private renderStatementList(
    documentRef: Document,
    statements: readonly StatementNode[],
    owner: BlockNode,
    depth: number,
    editable: boolean,
  ): HTMLElement {
    const list = documentRef.createElement("div");
    list.className = "alice-block-statement-list";
    list.dataset.blockOwnerId = owner.id;
    list.style.marginLeft = `${depth * 20}px`;

    if (editable) {
      list.append(this.createDropIndicator(documentRef, owner, 0, depth));
    }
    statements.forEach((statement, index) => {
      list.append(this.renderStatement(documentRef, statement, owner, index, depth));
      if (editable) {
        list.append(this.createDropIndicator(documentRef, owner, index + 1, depth));
      }
    });

    return list;
  }

  private renderStatement(
    documentRef: Document,
    statement: StatementNode,
    owner: BlockNode,
    index: number,
    depth: number,
  ): HTMLElement {
    const block = documentRef.createElement("div");
    const category = statementCategory(statement);
    block.className = `alice-block alice-block--${category}`;
    block.draggable = true;
    block.dataset.nodeId = statement.id;
    block.dataset.ownerId = owner.id;
    block.dataset.index = String(index);
    block.dataset.statementType = statement.type;
    block.dataset.dragSource = "statement";
    block.style.setProperty("--alice-block-color", COLORS[category]);
    block.style.backgroundColor = COLORS[category];
    block.style.marginLeft = `${depth * 4}px`;

    const header = documentRef.createElement("div");
    header.className = "alice-block__header";

    const notch = documentRef.createElement("span");
    notch.className = "alice-block__notch";
    notch.setAttribute("aria-hidden", "true");
    header.append(notch);

    const label = documentRef.createElement("span");
    label.className = "alice-block__label";
    label.textContent = statementText(statement);
    header.append(label);
    block.append(header);

    const nested = this.renderNestedBlocks(documentRef, statement, depth + 1);
    if (nested.length > 0) {
      const nestedContainer = documentRef.createElement("div");
      nestedContainer.className = "alice-block__nested";
      nestedContainer.style.marginLeft = "20px";
      nested.forEach((entry) => nestedContainer.append(entry));
      block.append(nestedContainer);
    }

    return block;
  }

  private renderNestedBlocks(documentRef: Document, statement: StatementNode, depth: number): HTMLElement[] {
    if (statement instanceof ConditionalStatement) {
      const fragments: HTMLElement[] = [];
      fragments.push(this.renderReadonlyBranch(documentRef, "if", statement.ifBody, depth));
      if (statement.elseBody) {
        fragments.push(this.renderReadonlyBranch(documentRef, "else", statement.elseBody, depth));
      }
      return fragments;
    }
    if (statement instanceof CountLoop || statement instanceof WhileLoop || statement instanceof DoInOrder || statement instanceof DoTogether || statement instanceof ForEachLoop || statement instanceof ForEachInArrayLoop || statement instanceof ForEachInIterableLoop) {
      return [this.renderStatementList(documentRef, statement.body, statement, depth, true)];
    }
    return [];
  }

  private renderReadonlyBranch(documentRef: Document, label: string, statements: readonly StatementNode[], depth: number): HTMLElement {
    const branch = documentRef.createElement("div");
    branch.className = "alice-block-branch";

    const title = documentRef.createElement("div");
    title.className = "alice-block-branch__label";
    title.textContent = label;
    branch.append(title);

    const owner = { id: `${label}-${depth}`, body: [...statements] } as BlockNode;
    branch.append(this.renderStatementList(documentRef, statements, owner, depth, false));
    return branch;
  }

  private createDropIndicator(documentRef: Document, owner: BlockNode, index: number, depth: number): HTMLElement {
    const indicator = documentRef.createElement("div");
    indicator.className = "alice-block-drop-indicator";
    indicator.dataset.dropZone = "statement-list";
    indicator.dataset.ownerId = owner.id;
    indicator.dataset.insertIndex = String(index);
    indicator.style.marginLeft = `${depth * 20}px`;
    return indicator;
  }
}

export function ensureBlockEditorStyles(documentRef: Document): void {
  if (documentRef.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const style = documentRef.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    .alice-block-renderer {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: Inter, system-ui, sans-serif;
    }
    .alice-block-statement-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-height: 0.75rem;
    }
    .alice-block {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #111827;
      border-radius: 0.6rem;
      padding: 0.55rem 0.75rem;
      box-shadow: inset 0 -2px 0 rgba(17, 24, 39, 0.14);
      position: relative;
    }
    .alice-block::before {
      content: "";
      position: absolute;
      left: -10px;
      top: 8px;
      width: 12px;
      height: 18px;
      background: var(--alice-block-color, #9ca3af);
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
      clip-path: polygon(0 0, 100% 0, 100% 35%, 50% 35%, 50% 65%, 100% 65%, 100% 100%, 0 100%);
    }
    .alice-block__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }
    .alice-block__notch {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.6);
      box-shadow: inset 0 -1px 0 rgba(17, 24, 39, 0.12);
      flex: 0 0 auto;
    }
    .alice-block__nested {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      border-left: 2px solid rgba(17, 24, 39, 0.15);
      padding-left: 0.75rem;
    }
    .alice-block-drop-indicator {
      height: 0.3rem;
      border-radius: 999px;
      background: transparent;
      transition: background-color 120ms ease;
    }
    .alice-block-drop-indicator.is-active {
      background: #2563eb;
    }
    .alice-block-branch {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .alice-block-branch__label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #4b5563;
    }
  `;
  documentRef.head.append(style);
}

function statementCategory(statement: StatementNode): keyof typeof COLORS {
  if (statement instanceof CommentStatement) {
    return "comment";
  }
  if (statement instanceof LocalDeclarationStatement) {
    return "declaration";
  }
  if (statement instanceof ConditionalStatement || statement instanceof CountLoop || statement instanceof WhileLoop || statement instanceof DoInOrder || statement instanceof DoTogether || statement instanceof ForEachLoop || statement instanceof ForEachInArrayLoop || statement instanceof ForEachInIterableLoop) {
    return "control";
  }
  if (statement instanceof ExpressionStatement && statement.expression instanceof MethodInvocation) {
    return "method";
  }
  return "expression";
}

function statementText(statement: StatementNode): string {
  if (statement instanceof ExpressionStatement) {
    return renderExpression(statement.expression);
  }
  if (statement instanceof ReturnStatement) {
    return statement.expression ? `return ${renderExpression(statement.expression)}` : "return";
  }
  if (statement instanceof ConditionalStatement) {
    return `if ${renderExpression(statement.condition)}`;
  }
  if (statement instanceof CountLoop) {
    return `count ${renderExpression(statement.count)} times`;
  }
  if (statement instanceof WhileLoop) {
    return `while ${renderExpression(statement.condition)}`;
  }
  if (statement instanceof ForEachLoop || statement instanceof ForEachInArrayLoop || statement instanceof ForEachInIterableLoop) {
    return `for each ${statement.item.name} in ${renderExpression(statement.collection)}`;
  }
  if (statement instanceof LocalDeclarationStatement) {
    return `let ${statement.local.name} = ${renderExpression(statement.initializer)}`;
  }
  if (statement instanceof DoInOrder) {
    return "do in order";
  }
  if (statement instanceof DoTogether) {
    return "do together";
  }
  if (statement instanceof CommentStatement) {
    return `// ${statement.text}`;
  }
  return statement.type;
}

function renderExpression(expression: Expression): string {
  return ExpressionRenderer.render(expression);
}

function resolveDocument(): Document {
  if (typeof document === "undefined") {
    throw new Error("BlockRenderer requires a DOM-capable environment.");
  }
  return document;
}
