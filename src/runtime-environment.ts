export interface RuntimeEnvironmentOptions {
  readonly globalObject?: Record<string, unknown>;
  readonly featureFlags?: Record<string, unknown>;
}

export interface RuntimeCapabilities {
  readonly hasDom: boolean;
  readonly hasNavigator: boolean;
  readonly supportsWebGL: boolean;
  readonly supportsOffscreenCanvas: boolean;
  readonly supportsLocalStorage: boolean;
  readonly supportsFileSystemAccess: boolean;
  readonly hasTouchInput: boolean;
}

export class RuntimeEnvironment {
  readonly isBrowser: boolean;
  readonly isNode: boolean;
  readonly capabilities: RuntimeCapabilities;
  readonly featureFlags: Readonly<Record<string, boolean>>;

  private constructor(
    isBrowser: boolean,
    isNode: boolean,
    capabilities: RuntimeCapabilities,
    featureFlags: Record<string, boolean>,
  ) {
    this.isBrowser = isBrowser;
    this.isNode = isNode;
    this.capabilities = capabilities;
    this.featureFlags = Object.freeze({ ...featureFlags });
  }

  static detect(options: RuntimeEnvironmentOptions = {}): RuntimeEnvironment {
    const globalObject = options.globalObject ?? (globalThis as unknown as Record<string, unknown>);
    const navigatorValue = asRecord(globalObject.navigator);
    const documentValue = asRecord(globalObject.document);
    const processValue = asRecord(globalObject.process);
    const processVersions = asRecord(processValue?.versions);
    const windowValue = asRecord(globalObject.window);

    const isNode = typeof processVersions?.node === "string";
    const hasDom = typeof documentValue?.createElement === "function";
    const hasNavigator = navigatorValue !== null;
    const isBrowser = hasDom || hasNavigator || windowValue === globalObject;

    const capabilities: RuntimeCapabilities = {
      hasDom,
      hasNavigator,
      supportsWebGL: detectWebGLSupport(globalObject, documentValue),
      supportsOffscreenCanvas: typeof globalObject.OffscreenCanvas === "function",
      supportsLocalStorage: typeof asRecord(globalObject.localStorage)?.getItem === "function",
      supportsFileSystemAccess:
        typeof globalObject.showOpenFilePicker === "function"
        || typeof globalObject.showSaveFilePicker === "function",
      hasTouchInput:
        typeof navigatorValue?.maxTouchPoints === "number" && navigatorValue.maxTouchPoints > 0
        || Object.prototype.hasOwnProperty.call(globalObject, "ontouchstart"),
    };

    const featureFlags = normalizeFeatureFlags(options.featureFlags ?? asRecord(processValue?.env) ?? {});
    return new RuntimeEnvironment(isBrowser, isNode, capabilities, featureFlags);
  }

  get runtimeLabel(): "browser" | "node" | "hybrid" | "unknown" {
    if (this.isBrowser && this.isNode) {
      return "hybrid";
    }
    if (this.isBrowser) {
      return "browser";
    }
    if (this.isNode) {
      return "node";
    }
    return "unknown";
  }

  supports(feature: keyof RuntimeCapabilities | string): boolean {
    if (feature in this.capabilities) {
      return this.capabilities[feature as keyof RuntimeCapabilities];
    }
    return this.featureFlags[feature] ?? false;
  }

  listEnabledFeatures(): string[] {
    return Object.entries(this.featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .sort();
  }
}

export function detectRuntimeEnvironment(options: RuntimeEnvironmentOptions = {}): RuntimeEnvironment {
  return RuntimeEnvironment.detect(options);
}

export function normalizeFeatureFlags(source: Record<string, unknown>): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!key.trim()) {
      continue;
    }
    normalized[key] = parseBooleanFlag(value);
  }
  return normalized;
}

function detectWebGLSupport(
  globalObject: Record<string, unknown>,
  documentValue: Record<string, unknown> | null,
): boolean {
  if (typeof globalObject.WebGLRenderingContext === "function") {
    return true;
  }

  if (typeof documentValue?.createElement !== "function") {
    return false;
  }

  try {
    const canvas = documentValue.createElement("canvas") as { getContext?: (type: string) => unknown };
    if (typeof canvas?.getContext !== "function") {
      return false;
    }
    return canvas.getContext("webgl") != null || canvas.getContext("experimental-webgl") != null;
  } catch {
    return false;
  }
}

function parseBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off", "disabled", ""].includes(normalized)) {
      return false;
    }
  }
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
