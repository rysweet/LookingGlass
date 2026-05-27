import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { AliceTypeDefinition } from "../a3p-parser.js";

const INTERNAL_AST_VERSION = "3.10062";

export function preserveXmlDeclaration(baseXmlText: string | null, serialized: string): string {
  const declaration = baseXmlText?.match(/^<\?xml[^>]*\?>/u)?.[0] ?? null;
  if (!declaration || serialized.startsWith("<?xml")) {
    return serialized;
  }
  return `${declaration}${serialized.startsWith("\n") ? "" : "\n"}${serialized}`;
}

let xmlDomParser: InstanceType<typeof DOMParser> | null = null;
let xmlSerializerCtor: (new () => XMLSerializer) | null = null;

export function parseXmlString(xml: string): Document {
  if (typeof globalThis.DOMParser !== "undefined") {
    return new globalThis.DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
  }
  if (!xmlDomParser) {
    throw new Error("XML parser not initialized");
  }
  return xmlDomParser.parseFromString(xml, "application/xml") as unknown as Document;
}

export function serializeXmlString(doc: Document): string {
  if (typeof globalThis.XMLSerializer !== "undefined") {
    return new globalThis.XMLSerializer().serializeToString(doc as unknown as Node);
  }
  if (!xmlSerializerCtor) {
    throw new Error("XML serializer not initialized");
  }
  return new xmlSerializerCtor().serializeToString(doc as never);
}

export async function ensureXmlTools(): Promise<void> {
  if (typeof globalThis.DOMParser !== "undefined" && typeof globalThis.XMLSerializer !== "undefined") {
    return;
  }
  if (xmlDomParser && xmlSerializerCtor) return;
  const mod = await import("@xmldom/xmldom");
  xmlDomParser = new (mod.DOMParser as unknown as typeof DOMParser)();
  xmlSerializerCtor = mod.XMLSerializer as unknown as new () => XMLSerializer;
}

export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getNamedUserTypeNodes(doc: Document): Element[] {
  return elementsByTagName(doc, "node")
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.NamedUserType");
}

export function findSceneTypeNode(typeNodes: Element[]): Element | null {
  for (const node of typeNodes) {
    const superType = getTypePropertyName(node, "superType");
    if (superType?.includes("SScene")) return node;
  }
  return null;
}

export function findSceneTypeDefinition(types: AliceTypeDefinition[] | undefined): AliceTypeDefinition | null {
  if (!types?.length) return null;
  return types.find((type) => type.superTypeName?.includes("SScene"))
    ?? types.find((type) => type.name === "Scene")
    ?? null;
}

function getTypePropertyName(parent: Element, propertyName: string): string | null {
  const propertyNode = getPropertyNode(parent, propertyName);
  if (!propertyNode) return null;
  const typeNode = directChild(propertyNode, "type");
  return typeNode?.getAttribute("name") ?? getPropertyText(propertyNode, "name");
}

export function getProperty(parent: Element, propertyName: string): Element | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index] as Element;
    if (child.nodeType === 1 && child.tagName === "property" && child.getAttribute("name") === propertyName) {
      return child;
    }
  }
  return null;
}

export function getPropertyNode(parent: Element, propertyName: string): Element | null {
  const property = getProperty(parent, propertyName);
  return property ? directChild(property, "node") : null;
}

export function getPropertyText(parent: Element, propertyName: string): string | null {
  const property = getProperty(parent, propertyName);
  if (!property) return null;
  const valueNode = directChild(property, "value");
  return valueNode?.textContent?.trim() ?? null;
}

export function directChild(parent: Element, tagName: string): Element | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index] as Element;
    if (child.nodeType === 1 && child.tagName === tagName) return child;
  }
  return null;
}

export function directCollectionNodes(collection: Element): Element[] {
  const nodes: Element[] = [];
  for (let index = 0; index < collection.childNodes.length; index += 1) {
    const child = collection.childNodes[index] as Element;
    if (child.nodeType === 1 && child.tagName === "node") {
      nodes.push(child);
    }
  }
  return nodes;
}

export function elementsByTagName(parent: Document | Element, tagName: string): Element[] {
  const result: Element[] = [];
  const nodes = parent.getElementsByTagName(tagName);
  for (let index = 0; index < nodes.length; index += 1) {
    result.push(nodes[index]);
  }
  return result;
}

export const MINIMAL_PROJECT_XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<node key="1" type="org.lgna.project.ast.NamedUserType" uuid="program-root" version="${INTERNAL_AST_VERSION}">
  <property name="name"><value type="java.lang.String">Program</value></property>
  <property name="_package"><value isNull="true"/></property>
  <property name="constructors"><collection type="java.util.ArrayList"><node key="2" type="org.lgna.project.ast.NamedUserConstructor" uuid="program-ctor"><property name="requiredParameters"><collection type="java.util.ArrayList"/></property><property name="accessLevel"><value type="org.lgna.project.ast.AccessLevel">PUBLIC</value></property><property name="body"><node type="org.lgna.project.ast.ConstructorBlockStatement" uuid="program-ctor-body"><property name="constructorInvocationStatement"><node type="org.lgna.project.ast.SuperConstructorInvocationStatement" uuid="program-super-call"><property name="constructor"><node key="3" type="org.lgna.project.ast.JavaConstructor" uuid="program-super-constructor"><constructor isVarArgs="false"><declaringClass name="org.lgna.story.SProgram"/><parameters/></constructor></node></property><property name="requiredArguments"><collection type="java.util.ArrayList"/></property><property name="variableArguments"><collection type="java.util.ArrayList"/></property><property name="keyedArguments"><collection type="java.util.ArrayList"/></property><property name="isEnabled"><value type="java.lang.Boolean">true</value></property></node></property><property name="statements"><collection type="java.util.ArrayList"/></property><property name="isEnabled"><value type="java.lang.Boolean">true</value></property></node></property><property name="managementLevel"><value type="org.lgna.project.ast.ManagementLevel">NONE</value></property><property name="isSignatureLocked"><value type="java.lang.Boolean">false</value></property><property name="isDeletionAllowed"><value type="java.lang.Boolean">false</value></property></node></collection></property>
  <property name="accessLevel"><value type="org.lgna.project.ast.AccessLevel">PUBLIC</value></property>
  <property name="finalAbstractOrNeither"><value type="org.lgna.project.ast.TypeModifierFinalAbstractOrNeither">NEITHER</value></property>
  <property name="isStrictFloatingPoint"><value type="java.lang.Boolean">false</value></property>
  <property name="superType"><node key="4" type="org.lgna.project.ast.JavaType" uuid="program-super-type"><type name="org.lgna.story.SProgram"/></node></property>
  <property name="methods"><collection type="java.util.ArrayList"/></property>
  <property name="fields"><collection type="java.util.ArrayList"><node key="5" type="org.lgna.project.ast.UserField" uuid="scene-field"><property name="name"><value type="java.lang.String">myScene</value></property><property name="valueType"><node key="6" type="org.lgna.project.ast.NamedUserType" uuid="scene-type" version="${INTERNAL_AST_VERSION}"><property name="name"><value type="java.lang.String">Scene</value></property><property name="_package"><value isNull="true"/></property><property name="constructors"><collection type="java.util.ArrayList"><node key="7" type="org.lgna.project.ast.NamedUserConstructor" uuid="scene-ctor"><property name="requiredParameters"><collection type="java.util.ArrayList"/></property><property name="accessLevel"><value type="org.lgna.project.ast.AccessLevel">PUBLIC</value></property><property name="body"><node type="org.lgna.project.ast.ConstructorBlockStatement" uuid="scene-ctor-body"><property name="constructorInvocationStatement"><node type="org.lgna.project.ast.SuperConstructorInvocationStatement" uuid="scene-super-call"><property name="constructor"><node key="8" type="org.lgna.project.ast.JavaConstructor" uuid="scene-super-constructor"><constructor isVarArgs="false"><declaringClass name="org.lgna.story.SScene"/><parameters/></constructor></node></property><property name="requiredArguments"><collection type="java.util.ArrayList"/></property><property name="variableArguments"><collection type="java.util.ArrayList"/></property><property name="keyedArguments"><collection type="java.util.ArrayList"/></property><property name="isEnabled"><value type="java.lang.Boolean">true</value></property></node></property><property name="statements"><collection type="java.util.ArrayList"/></property><property name="isEnabled"><value type="java.lang.Boolean">true</value></property></node></property><property name="managementLevel"><value type="org.lgna.project.ast.ManagementLevel">NONE</value></property><property name="isSignatureLocked"><value type="java.lang.Boolean">false</value></property><property name="isDeletionAllowed"><value type="java.lang.Boolean">false</value></property></node></collection></property><property name="accessLevel"><value type="org.lgna.project.ast.AccessLevel">PUBLIC</value></property><property name="finalAbstractOrNeither"><value type="org.lgna.project.ast.TypeModifierFinalAbstractOrNeither">NEITHER</value></property><property name="isStrictFloatingPoint"><value type="java.lang.Boolean">false</value></property><property name="superType"><node key="9" type="org.lgna.project.ast.JavaType" uuid="scene-super-type"><type name="org.lgna.story.SScene"/></node></property><property name="methods"><collection type="java.util.ArrayList"/></property><property name="fields"><collection type="java.util.ArrayList"/></property></node></property></node></collection></property>
</node>`;
