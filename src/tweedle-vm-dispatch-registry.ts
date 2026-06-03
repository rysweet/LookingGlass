import type { AliceMethod } from "./a3p-parser.js";
import type { RuntimeObject, VMState } from "./tweedle-vm-core-types.js";

export interface TweedleVmDispatchRegistry {
  dispatchMethod: ((
    target: AliceMethod,
    args: string[],
    state: VMState,
    self?: RuntimeObject | null,
    declaringTypeName?: string | null,
  ) => void) | null;
  resolveRuntimeMethod: ((
    state: VMState,
    typeName: string,
    methodName: string,
    argCount: number,
  ) => AliceMethod | null) | null;
}

export const tweedleVmDispatchRegistry: TweedleVmDispatchRegistry = {
  dispatchMethod: null,
  resolveRuntimeMethod: null,
};

export function registerTweedleVmDispatch(registry: Required<TweedleVmDispatchRegistry>): void {
  tweedleVmDispatchRegistry.dispatchMethod = registry.dispatchMethod;
  tweedleVmDispatchRegistry.resolveRuntimeMethod = registry.resolveRuntimeMethod;
}

export function requireDispatchMethod(): NonNullable<TweedleVmDispatchRegistry["dispatchMethod"]> {
  const { dispatchMethod } = tweedleVmDispatchRegistry;
  if (!dispatchMethod) {
    throw new Error("Tweedle VM dispatch registry is not initialized.");
  }
  return dispatchMethod;
}

export function requireResolveRuntimeMethod(): NonNullable<TweedleVmDispatchRegistry["resolveRuntimeMethod"]> {
  const { resolveRuntimeMethod } = tweedleVmDispatchRegistry;
  if (!resolveRuntimeMethod) {
    throw new Error("Tweedle VM dispatch registry is not initialized.");
  }
  return resolveRuntimeMethod;
}
