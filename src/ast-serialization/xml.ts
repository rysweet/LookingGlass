import type { Element as XmlElement, Document as XmlDocument } from "@xmldom/xmldom";
import type { TypeRef } from "../ast-nodes.js";
import { AstSerializationError } from "./types.js";

export type { XmlDocument, XmlElement };

export function appendTypeRef(doc: XmlDocument, parent: XmlElement, tagName: string, typeRef: TypeRef): void {
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

export function readTypeRef(element: XmlElement): TypeRef {
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

export function childElements(parent: XmlElement, tagName?: string): XmlElement[] {
  const result: XmlElement[] = [];
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index];
    if (child.nodeType !== 1) continue;
    const element = child as XmlElement;
    if (!tagName || element.tagName === tagName) {
      result.push(element);
    }
  }
  return result;
}

export function optionalChildElement(parent: XmlElement, tagName: string): XmlElement | null {
  return childElements(parent, tagName)[0] ?? null;
}

export function childElement(parent: XmlElement, tagName: string): XmlElement {
  const element = optionalChildElement(parent, tagName);
  if (!element) {
    throw new AstSerializationError(`Missing <${tagName}> element under <${parent.tagName}>`);
  }
  return element;
}

export function requiredAttribute(element: XmlElement, name: string): string {
  const value = element.getAttribute(name);
  if (value === null || value === "") {
    throw new AstSerializationError(`Missing '${name}' attribute on <${element.tagName}>`);
  }
  return value;
}

export function optionalAttribute(element: XmlElement, name: string): string | null {
  const value = element.getAttribute(name);
  return value === null || value === "" ? null : value;
}

export function setOptionalAttribute(element: XmlElement, name: string, value: string | null): void {
  if (value !== null) {
    element.setAttribute(name, value);
  }
}

export function parseBoolean(value: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AstSerializationError(`Expected boolean attribute but found '${value}'`);
}
