import {
  insertStatement,
  moveStatement,
  removeStatement,
  type BlockNode,
  type EditableUserType,
} from "../ast-editing-operations.js";
import {
  BooleanLiteral,
  CommentStatement,
  ConditionalStatement,
  CountLoop,
  DoInOrder,
  DoTogether,
  ExpressionStatement,
  ForEachLoop,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  NullLiteral,
  StringLiteral,
  ThisExpression,
  WhileLoop,
  simpleTypeRef,
} from "../ast-nodes.js";
import { DataTransferHelper, HTML5DragSourceAdapter, HTML5DropZoneAdapter, type DataTransferLike, type DragEventLike } from "../drag-drop-html5-adapter.js";
import type { CodeBlockPayload } from "../drag-drop-bridge.js";
import type { ToolboxTemplateDescriptor } from "./block-toolbox.js";

interface DragDescriptor {
  readonly source: "toolbox" | "statement";
  readonly template?: ToolboxTemplateDescriptor;
  readonly statementId?: string;
  readonly ownerId?: string;
  readonly index?: number;
}

export interface BlockDragHandlerOptions {
  readonly procedure: MethodDeclaration;
  readonly currentType: EditableUserType | null;
  readonly root: HTMLElement;
  readonly trashZone: HTMLElement;
  readonly onMutate: () => void;
}

export class BlockDragHandler {
  private activeIndicator: HTMLElement | null = null;

  constructor(private readonly options: BlockDragHandlerOptions) {}

  connect(): void {
    this.options.root.addEventListener("dragstart", this.handleDragStart);
    this.options.root.addEventListener("dragover", this.handleDragOver);
    this.options.root.addEventListener("drop", this.handleDrop);
    this.options.root.addEventListener("dragleave", this.handleDragLeave);
    this.options.root.addEventListener("dragend", this.handleDragEnd);
  }

  disconnect(): void {
    this.options.root.removeEventListener("dragstart", this.handleDragStart);
    this.options.root.removeEventListener("dragover", this.handleDragOver);
    this.options.root.removeEventListener("drop", this.handleDrop);
    this.options.root.removeEventListener("dragleave", this.handleDragLeave);
    this.options.root.removeEventListener("dragend", this.handleDragEnd);
  }

  private readonly handleDragStart = (event: Event): void => {
    const dragEvent = event as unknown as DragEventLike & { target: EventTarget | null };
    const element = dragEvent.target instanceof Element ? dragEvent.target.closest<HTMLElement>("[data-drag-source]") : null;
    if (!element) {
      return;
    }

    const payload = this.createPayload(element);
    const source = new HTML5DragSourceAdapter({
      elementId: element.dataset.nodeId ?? element.dataset.statementKind ?? "toolbox-item",
      payload,
      label: element.textContent ?? payload.statementKind,
    });
    source.handleDragStart(dragEvent);
  };

  private readonly handleDragOver = (event: Event): void => {
    const dragEvent = event as unknown as DragEventLike & { target: EventTarget | null };
    const zone = this.findDropZone(dragEvent.target);
    if (!zone) {
      return;
    }
    const adapter = this.createDropAdapter(zone, () => undefined);
    if (adapter.handleDragOver(dragEvent)) {
      this.setActiveIndicator(zone);
    }
  };

  private readonly handleDrop = (event: Event): void => {
    const dragEvent = event as unknown as DragEventLike & { target: EventTarget | null };
    const zone = this.findDropZone(dragEvent.target);
    if (!zone) {
      return;
    }
    const adapter = this.createDropAdapter(zone, (payload) => this.commitDrop(zone, payload));
    if (adapter.handleDrop(dragEvent)) {
      this.clearIndicators();
    }
  };

  private readonly handleDragLeave = (): void => {
    this.clearIndicators();
  };

  private readonly handleDragEnd = (): void => {
    this.clearIndicators();
  };

  private createPayload(element: HTMLElement): CodeBlockPayload {
    const descriptor = element.dataset.dragSource === "toolbox"
      ? { source: "toolbox", template: parseTemplateDescriptor(element.dataset.template) }
      : {
        source: "statement",
        statementId: element.dataset.nodeId,
        ownerId: element.dataset.ownerId,
        index: Number(element.dataset.index ?? "0"),
      };
    return {
      type: "code-block",
      statementKind: element.dataset.statementKind ?? element.dataset.statementType ?? "statement",
      template: JSON.stringify(descriptor),
    };
  }

  private findDropZone(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
      return null;
    }
    return target.closest<HTMLElement>("[data-drop-zone]");
  }

  private createDropAdapter(zone: HTMLElement, onDrop: (payload: CodeBlockPayload) => void): HTML5DropZoneAdapter {
    return new HTML5DropZoneAdapter(
      zone.dataset.ownerId ?? zone.id ?? "drop-zone",
      zone.dataset.dropZone ?? "code-editor",
      ["code-block"],
      {
        onDrop: (payload) => {
          if (payload.type === "code-block") {
            onDrop(payload);
          }
        },
      },
    );
  }

  private commitDrop(zone: HTMLElement, payload: CodeBlockPayload): void {
    const descriptor = parseDragDescriptor(payload.template);
    if (zone.dataset.dropZone === "trash") {
      if (descriptor.source === "statement" && descriptor.ownerId && typeof descriptor.index === "number") {
        const owner = this.findOwnerById(descriptor.ownerId);
        if (owner) {
          removeStatement(owner, descriptor.index);
          this.options.onMutate();
        }
      }
      return;
    }

    const ownerId = zone.dataset.ownerId;
    const insertIndex = Number(zone.dataset.insertIndex ?? "0");
    if (!ownerId) {
      return;
    }
    const owner = this.findOwnerById(ownerId);
    if (!owner) {
      return;
    }

    if (descriptor.source === "toolbox" && descriptor.template) {
      insertStatement(owner, insertIndex, this.createStatement(descriptor.template));
      this.options.onMutate();
      return;
    }

    if (descriptor.source === "statement" && descriptor.ownerId && typeof descriptor.index === "number") {
      const sourceOwner = this.findOwnerById(descriptor.ownerId);
      if (!sourceOwner) {
        return;
      }
      if (sourceOwner === owner) {
        moveStatement(owner, descriptor.index, insertIndex);
      } else {
        const statement = removeStatement(sourceOwner, descriptor.index);
        insertStatement(owner, insertIndex, statement);
      }
      this.options.onMutate();
    }
  }

  private createStatement(template: ToolboxTemplateDescriptor) {
    const currentType = this.options.currentType;
    switch (template.kind) {
      case "if":
        return new ConditionalStatement(new BooleanLiteral(true), [], []);
      case "while":
        return new WhileLoop(new BooleanLiteral(true), []);
      case "for-each":
        return new ForEachLoop(simpleTypeRef("String"), "item", new NullLiteral(), []);
      case "count":
        return new CountLoop(null, null, new IntegerLiteral(3), []);
      case "do-in-order":
        return new DoInOrder([]);
      case "do-together":
        return new DoTogether([]);
      case "local":
        return new LocalVariableDeclarationStatement("value", simpleTypeRef("String"), new StringLiteral(""), false);
      case "comment":
        return new CommentStatement("comment");
      case "method-call": {
        const target = currentType ? new ThisExpression(currentType.toTypeRef()) : null;
        const method = currentType?.methods.find((candidate) => candidate.name === template.methodName) ?? null;
        return new ExpressionStatement(new MethodInvocation(target, template.methodName ?? "call", [], method));
      }
      default:
        return new ExpressionStatement(new MethodInvocation(null, template.kind, [], null));
    }
  }

  private findOwnerById(ownerId: string): BlockNode | null {
    if (this.options.procedure.id === ownerId) {
      return this.options.procedure;
    }
    let found: BlockNode | null = null;
    this.options.procedure.traverse((node) => {
      if (!found && "body" in node && Array.isArray((node as BlockNode).body) && node.id === ownerId) {
        found = node as BlockNode;
      }
    });
    return found;
  }

  private setActiveIndicator(zone: HTMLElement): void {
    if (this.activeIndicator === zone) {
      return;
    }
    this.clearIndicators();
    this.activeIndicator = zone;
    zone.classList.add("is-active");
  }

  private clearIndicators(): void {
    this.activeIndicator?.classList.remove("is-active");
    this.activeIndicator = null;
    this.options.trashZone.classList.remove("is-active");
  }
}

function parseDragDescriptor(raw: string): DragDescriptor {
  const parsed = JSON.parse(raw) as Partial<DragDescriptor>;
  if (parsed.source === "toolbox") {
    return { source: "toolbox", template: parsed.template ? coerceTemplate(parsed.template) : undefined };
  }
  return {
    source: "statement",
    statementId: typeof parsed.statementId === "string" ? parsed.statementId : undefined,
    ownerId: typeof parsed.ownerId === "string" ? parsed.ownerId : undefined,
    index: typeof parsed.index === "number" ? parsed.index : undefined,
  };
}

function parseTemplateDescriptor(raw: string | undefined): ToolboxTemplateDescriptor {
  return raw ? coerceTemplate(JSON.parse(raw) as Partial<ToolboxTemplateDescriptor>) : { kind: "method-call", category: "Actions", label: "call method" };
}

function coerceTemplate(template: Partial<ToolboxTemplateDescriptor>): ToolboxTemplateDescriptor {
  return {
    kind: template.kind ?? "method-call",
    category: template.category ?? "Actions",
    label: template.label ?? template.methodName ?? template.kind ?? "statement",
    methodName: template.methodName,
    parameterTypes: template.parameterTypes,
  };
}

export function createDataTransferStore(initialData: Record<string, string> = {}): DataTransferLike {
  const store = new Map<string, string>(Object.entries(initialData));
  return {
    get types() {
      return [...store.keys()];
    },
    effectAllowed: "uninitialized",
    dropEffect: "none",
    setData(type, value) {
      store.set(type, value);
    },
    getData(type) {
      return store.get(type) ?? "";
    },
    clearData(type) {
      if (type) {
        store.delete(type);
      } else {
        store.clear();
      }
    },
  };
}

export function createDragEvent(type: string, dataTransfer: DataTransferLike, target: HTMLElement): DragEventLike & Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: dataTransfer },
    target: { value: target },
    clientX: { value: 0 },
    clientY: { value: 0 },
  });
  return event as DragEventLike & Event;
}

export function primeDataTransfer(payload: CodeBlockPayload, dataTransfer: DataTransferLike): void {
  DataTransferHelper.writePayload(dataTransfer, payload);
}
