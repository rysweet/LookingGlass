import type { EditableUserType } from "../ast-editing-operations.js";
import { MethodDeclaration } from "../ast-nodes.js";
import { BlockDragHandler } from "./block-drag-handler.js";
import { BlockRenderer, ensureBlockEditorStyles } from "./block-renderer.js";
import { BlockToolbox } from "./block-toolbox.js";

export class ProcedureBlockView {
  readonly element: HTMLElement;
  private readonly bodyHost: HTMLElement;
  private readonly toolboxHost: HTMLElement;
  private readonly trashZone: HTMLElement;
  private readonly renderer = new BlockRenderer();
  private readonly dragHandler: BlockDragHandler;

  constructor(
    readonly procedure: MethodDeclaration,
    readonly currentType: EditableUserType | null = procedure.getDeclaringType(),
  ) {
    const documentRef = resolveDocument();
    ensureBlockEditorStyles(documentRef);

    this.element = documentRef.createElement("section");
    this.element.className = "alice-procedure-block-view";

    this.toolboxHost = documentRef.createElement("div");
    this.toolboxHost.className = "alice-procedure-block-view__toolbox";

    this.bodyHost = documentRef.createElement("div");
    this.bodyHost.className = "alice-procedure-block-view__body";

    this.trashZone = documentRef.createElement("div");
    this.trashZone.className = "alice-procedure-block-view__trash";
    this.trashZone.dataset.dropZone = "trash";
    this.trashZone.textContent = "Trash";

    this.dragHandler = new BlockDragHandler({
      procedure: this.procedure,
      currentType: this.currentType,
      root: this.element,
      trashZone: this.trashZone,
      onMutate: () => this.refresh(),
    });

    this.refresh();
    this.dragHandler.connect();
  }

  mount(container: HTMLElement): void {
    container.append(this.element);
  }

  refresh(): void {
    this.element.replaceChildren();
    this.toolboxHost.replaceChildren();
    this.bodyHost.replaceChildren();

    const toolbox = new BlockToolbox(this.procedure, this.currentType);
    this.toolboxHost.append(toolbox.render());

    const header = this.renderHeader();
    this.bodyHost.append(this.renderer.render(this.procedure));

    this.element.append(header, this.toolboxHost, this.bodyHost, this.trashZone);
  }

  private renderHeader(): HTMLElement {
    const documentRef = resolveDocument();
    const header = documentRef.createElement("header");
    header.className = "alice-procedure-block-view__header";
    const parameters = this.procedure.parameters.map((parameter) => `${parameter.name}: ${describeType(parameter.paramType)}`).join(", ");
    header.textContent = parameters.length > 0
      ? `${this.procedure.name}(${parameters})`
      : `${this.procedure.name}()`;
    return header;
  }
}

function describeType(typeRef: MethodDeclaration["returnType"]): string {
  switch (typeRef.type) {
    case "SimpleTypeRef":
      return `${typeRef.name}${typeRef.isArray ? "[]" : ""}`;
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw;
  }
}

function resolveDocument(): Document {
  if (typeof document === "undefined") {
    throw new Error("ProcedureBlockView requires a DOM-capable environment.");
  }
  return document;
}
