export interface NodeIndex {
  keyMap: Map<string, Element>;
  namedUserTypes: Element[];
  userMethods: Element[];
  jointImplementations: Element[];
  modelResourceInfos: Element[];
  textureReferences: Element[];
}

export function indexNodes(root: Element): NodeIndex {
  const keyMap = new Map<string, Element>();
  const namedUserTypes: Element[] = [];
  const userMethods: Element[] = [];
  const jointImplementations: Element[] = [];
  const modelResourceInfos: Element[] = [];
  const textureReferences: Element[] = [];

  const allNodes = root.getElementsByTagName("node");
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const nodeType = node.getAttribute("type");
    const key = node.getAttribute("key");

    if (key && !keyMap.has(key) && (nodeType || node.childNodes.length > 0)) {
      keyMap.set(key, node);
    }

    switch (nodeType) {
      case "org.lgna.project.ast.NamedUserType":
        namedUserTypes.push(node);
        break;
      case "org.lgna.project.ast.UserMethod":
        userMethods.push(node);
        break;
      case "org.lgna.story.resourceutilities.JointImplementation":
        jointImplementations.push(node);
        break;
      case "org.lgna.story.resourceutilities.ModelResourceInfo":
        modelResourceInfos.push(node);
        break;
      case "org.lgna.story.resourceutilities.TextureReference":
        textureReferences.push(node);
        break;
    }
  }

  return { keyMap, namedUserTypes, userMethods, jointImplementations, modelResourceInfos, textureReferences };
}

export function resolve(node: Element, keyMap: Map<string, Element>): Element {
  const key = node.getAttribute("key");
  if (!key) return node;
  if (node.getAttribute("type") || node.childNodes.length > 0) return node;
  return keyMap.get(key) ?? node;
}

export function getProjectName(doc: Document): string {
  const root = doc.documentElement;
  if (root.tagName !== "node") return "Unknown";
  return getPropertyText(root, "name") ?? "Unknown";
}

export function getPropertyText(node: Element, propName: string): string | null {
  const prop = getProperty(node, propName);
  if (!prop) return null;
  const value = directChild(prop, "value");
  return value?.textContent?.trim() ?? null;
}

export function getProperty(node: Element, name: string): Element | null {
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i] as Element;
    if (child.nodeType === 1 && child.tagName === "property" && child.getAttribute("name") === name) {
      return child;
    }
  }
  return null;
}

export function directChild(node: Element, tagName: string): Element | null {
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i] as Element;
    if (child.nodeType === 1 && child.tagName === tagName) return child;
  }
  return null;
}

export function getPropertyNode(node: Element, propName: string, keyMap: Map<string, Element>): Element | null {
  const prop = getProperty(node, propName);
  if (!prop) return null;
  const child = directChild(prop, "node");
  return child ? resolve(child, keyMap) : null;
}

export function getCollectionNodesResolved(parent: Element, propName: string, keyMap: Map<string, Element>): Element[] {
  const prop = getProperty(parent, propName);
  if (!prop) return [];
  const collection = directChild(prop, "collection");
  if (!collection) return [];
  const result: Element[] = [];
  for (let i = 0; i < collection.childNodes.length; i++) {
    const child = collection.childNodes[i] as Element;
    if (child.nodeType === 1 && child.tagName === "node") {
      result.push(resolve(child, keyMap));
    }
  }
  return result;
}

export function extractResolvedTypeName(node: Element, keyMap: Map<string, Element>): string | null {
  const resolved = resolve(node, keyMap);
  const typeElement = directChild(resolved, "type");
  if (typeElement?.getAttribute("name")) {
    return typeElement.getAttribute("name");
  }

  const classText = getPropertyText(resolved, "class");
  if (classText) return classText;

  if (resolved.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
    return getPropertyText(resolved, "name");
  }

  return null;
}
