import { describe, expect, it } from "vitest";
import {
  RuntimeEnvironment,
  detectRuntimeEnvironment,
  normalizeFeatureFlags,
} from "../src/runtime-environment.js";

describe("runtime-environment", () => {
  it("detects browser capabilities including WebGL and file access", () => {
    const canvasContexts: string[] = [];
    const globalObject: Record<string, unknown> = {
      document: {
        createElement: () => ({
          getContext: (type: string) => {
            canvasContexts.push(type);
            return type === "webgl" ? { context: type } : null;
          },
        }),
      },
      navigator: { maxTouchPoints: 2 },
      localStorage: { getItem: () => "value" },
      showOpenFilePicker: () => Promise.resolve([]),
      OffscreenCanvas: class {},
      ontouchstart: null,
    };
    globalObject.window = globalObject;

    const runtime = RuntimeEnvironment.detect({
      globalObject,
      featureFlags: { immersivePreview: "true", telemetry: "off" },
    });

    expect(runtime.runtimeLabel).toBe("browser");
    expect(runtime.isBrowser).toBe(true);
    expect(runtime.isNode).toBe(false);
    expect(runtime.capabilities.hasDom).toBe(true);
    expect(runtime.capabilities.hasNavigator).toBe(true);
    expect(runtime.capabilities.supportsWebGL).toBe(true);
    expect(runtime.capabilities.supportsOffscreenCanvas).toBe(true);
    expect(runtime.capabilities.supportsLocalStorage).toBe(true);
    expect(runtime.capabilities.supportsFileSystemAccess).toBe(true);
    expect(runtime.capabilities.hasTouchInput).toBe(true);
    expect(runtime.supports("immersivePreview")).toBe(true);
    expect(runtime.supports("telemetry")).toBe(false);
    expect(runtime.listEnabledFeatures()).toEqual(["immersivePreview"]);
    expect(canvasContexts).toEqual(["webgl"]);
  });

  it("detects node environments and falls back when browser APIs are absent", () => {
    const runtime = detectRuntimeEnvironment({
      globalObject: {
        process: { versions: { node: "22.0.0" }, env: { CLI_MODE: "1", WEBGL: "false" } },
      },
    });

    expect(runtime.runtimeLabel).toBe("node");
    expect(runtime.isBrowser).toBe(false);
    expect(runtime.isNode).toBe(true);
    expect(runtime.capabilities.hasDom).toBe(false);
    expect(runtime.capabilities.supportsWebGL).toBe(false);
    expect(runtime.capabilities.supportsLocalStorage).toBe(false);
    expect(runtime.capabilities.hasTouchInput).toBe(false);
    expect(runtime.supports("CLI_MODE")).toBe(true);
    expect(runtime.supports("WEBGL")).toBe(false);
  });

  it("reports hybrid runtimes and tolerates missing WebGL contexts", () => {
    const globalObject: Record<string, unknown> = {
      document: {
        createElement: () => ({
          getContext: () => null,
        }),
      },
      navigator: { maxTouchPoints: 0 },
      process: { versions: { node: "22.0.0" } },
    };
    globalObject.window = globalObject;

    const runtime = RuntimeEnvironment.detect({ globalObject, featureFlags: { diagnostics: 1 } });

    expect(runtime.runtimeLabel).toBe("hybrid");
    expect(runtime.capabilities.supportsWebGL).toBe(false);
    expect(runtime.capabilities.hasTouchInput).toBe(false);
    expect(runtime.supports("diagnostics")).toBe(true);
    expect(runtime.supports("missing-flag")).toBe(false);
  });

  it("normalizes feature flag values from mixed sources", () => {
    expect(normalizeFeatureFlags({
      enabled: true,
      disabled: false,
      numericOn: 1,
      numericOff: 0,
      wordOn: "enabled",
      wordOff: "disabled",
      blank: "",
      unknown: "maybe",
    })).toEqual({
      enabled: true,
      disabled: false,
      numericOn: true,
      numericOff: false,
      wordOn: true,
      wordOff: false,
      blank: false,
      unknown: false,
    });
  });
});
