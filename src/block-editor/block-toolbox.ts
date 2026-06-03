import { type EditableUserType } from "../ast-editing-operations.js";
import type { MethodDeclaration } from "../ast-nodes.js";
import { ensureBlockEditorStyles } from "./block-renderer.js";

export type ToolboxCategory = "Control" | "Actions" | "Variables" | "Comments";

export interface ToolboxTemplateDescriptor {
  readonly kind: string;
  readonly category: ToolboxCategory;
  readonly label: string;
  readonly methodName?: string;
  readonly parameterTypes?: readonly string[];
}

const CONTROL_TEMPLATES: readonly ToolboxTemplateDescriptor[] = [
  { kind: "if", category: "Control", label: "if / else" },
  { kind: "while", category: "Control", label: "while" },
  { kind: "for-each", category: "Control", label: "for each" },
  { kind: "count", category: "Control", label: "count" },
  { kind: "do-in-order", category: "Control", label: "do in order" },
  { kind: "do-together", category: "Control", label: "do together" },
];

const VARIABLE_TEMPLATES: readonly ToolboxTemplateDescriptor[] = [
  { kind: "local", category: "Variables", label: "local variable" },
];

const COMMENT_TEMPLATES: readonly ToolboxTemplateDescriptor[] = [
  { kind: "comment", category: "Comments", label: "comment" },
];

export class BlockToolbox {
  constructor(
    private readonly procedure: MethodDeclaration,
    private readonly currentType: EditableUserType | null,
  ) {}

  descriptors(): ToolboxTemplateDescriptor[] {
    return [
      ...CONTROL_TEMPLATES,
      ...this.actionTemplates(),
      ...VARIABLE_TEMPLATES,
      ...COMMENT_TEMPLATES,
    ];
  }

  render(): HTMLElement {
    const documentRef = resolveDocument();
    ensureBlockEditorStyles(documentRef);

    const root = documentRef.createElement("aside");
    root.className = "alice-block-toolbox";

    const descriptors = this.descriptors();
    const categories = ["Control", "Actions", "Variables", "Comments"] as const;
    categories.forEach((category) => {
      const section = documentRef.createElement("section");
      section.className = "alice-block-toolbox__section";

      const header = documentRef.createElement("h3");
      header.className = "alice-block-toolbox__heading";
      header.textContent = category;
      section.append(header);

      descriptors.filter((descriptor) => descriptor.category === category).forEach((descriptor) => {
        section.append(this.renderItem(documentRef, descriptor));
      });

      root.append(section);
    });

    return root;
  }

  private renderItem(documentRef: Document, descriptor: ToolboxTemplateDescriptor): HTMLElement {
    const item = documentRef.createElement("div");
    item.className = "alice-block-toolbox__item";
    item.draggable = true;
    item.textContent = descriptor.label;
    item.dataset.dragSource = "toolbox";
    item.dataset.template = JSON.stringify(descriptor);
    item.dataset.statementKind = descriptor.kind;
    return item;
  }

  private actionTemplates(): ToolboxTemplateDescriptor[] {
    if (!this.currentType) {
      return [{ kind: "method-call", category: "Actions", label: "call method" }];
    }
    return this.currentType.methods
      .filter((method) => method !== this.procedure)
      .map((method) => ({
        kind: "method-call",
        category: "Actions" as const,
        label: method.name,
        methodName: method.name,
        parameterTypes: method.parameters.map((parameter) => parameter.paramType.type === "SimpleTypeRef"
          ? `${parameter.paramType.name}${parameter.paramType.isArray ? "[]" : ""}`
          : parameter.paramType.type === "VoidTypeRef"
            ? "void"
            : parameter.paramType.raw),
      }));
  }
}

function resolveDocument(): Document {
  if (typeof document === "undefined") {
    throw new Error("BlockToolbox requires a DOM-capable environment.");
  }
  return document;
}
