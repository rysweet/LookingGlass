/**
 * Bridges Alice's AWT/Swing event model to browser DOM events.
 *
 * Java Alice uses AWT KeyEvent, MouseEvent, and FocusEvent with Swing's
 * InputMap/ActionMap binding system. This module provides:
 * - Mapping tables from AWT event constants to DOM event types
 * - Adapters that convert DOM events into EventSystem-compatible payloads
 * - A DOMEventAdapter that attaches to a DOM-like target and dispatches
 *   events through the existing EventSystem
 */
import type {
  EventSystem,
  EventTriggerPayload,
  EventFireResult,
  EventType,
} from "./events";

// ---------------------------------------------------------------------------
// AWT Event Type Constants
// ---------------------------------------------------------------------------

/** AWT KeyEvent virtual key codes used in Java Alice. */
export const AWT_KEY_CODES = {
  VK_ENTER: 10,
  VK_BACK_SPACE: 8,
  VK_TAB: 9,
  VK_ESCAPE: 27,
  VK_SPACE: 32,
  VK_DELETE: 127,
  VK_LEFT: 37,
  VK_UP: 38,
  VK_RIGHT: 39,
  VK_DOWN: 40,
  VK_A: 65,
  VK_C: 67,
  VK_D: 68,
  VK_S: 83,
  VK_V: 86,
  VK_X: 88,
  VK_Z: 90,
  VK_F1: 112,
  VK_F5: 116,
} as const;

export type AwtKeyCode = (typeof AWT_KEY_CODES)[keyof typeof AWT_KEY_CODES];

/** Maps AWT KeyEvent codes to DOM KeyboardEvent.key values. */
const AWT_TO_DOM_KEY: ReadonlyMap<number, string> = new Map([
  [AWT_KEY_CODES.VK_ENTER, "Enter"],
  [AWT_KEY_CODES.VK_BACK_SPACE, "Backspace"],
  [AWT_KEY_CODES.VK_TAB, "Tab"],
  [AWT_KEY_CODES.VK_ESCAPE, "Escape"],
  [AWT_KEY_CODES.VK_SPACE, " "],
  [AWT_KEY_CODES.VK_DELETE, "Delete"],
  [AWT_KEY_CODES.VK_LEFT, "ArrowLeft"],
  [AWT_KEY_CODES.VK_UP, "ArrowUp"],
  [AWT_KEY_CODES.VK_RIGHT, "ArrowRight"],
  [AWT_KEY_CODES.VK_DOWN, "ArrowDown"],
  [AWT_KEY_CODES.VK_F1, "F1"],
  [AWT_KEY_CODES.VK_F5, "F5"],
]);

// ---------------------------------------------------------------------------
// AWT ↔ DOM Event Type Mapping
// ---------------------------------------------------------------------------

export type AwtEventType =
  | "KEY_PRESSED"
  | "KEY_RELEASED"
  | "KEY_TYPED"
  | "MOUSE_CLICKED"
  | "MOUSE_PRESSED"
  | "MOUSE_RELEASED"
  | "MOUSE_ENTERED"
  | "MOUSE_EXITED"
  | "MOUSE_MOVED"
  | "MOUSE_DRAGGED"
  | "MOUSE_WHEEL";

export type DomEventType =
  | "keydown"
  | "keyup"
  | "keypress"
  | "click"
  | "mousedown"
  | "mouseup"
  | "mouseenter"
  | "mouseleave"
  | "mousemove"
  | "drag"
  | "wheel";

const AWT_TO_DOM_EVENT: ReadonlyMap<AwtEventType, DomEventType> = new Map([
  ["KEY_PRESSED", "keydown"],
  ["KEY_RELEASED", "keyup"],
  ["KEY_TYPED", "keypress"],
  ["MOUSE_CLICKED", "click"],
  ["MOUSE_PRESSED", "mousedown"],
  ["MOUSE_RELEASED", "mouseup"],
  ["MOUSE_ENTERED", "mouseenter"],
  ["MOUSE_EXITED", "mouseleave"],
  ["MOUSE_MOVED", "mousemove"],
  ["MOUSE_DRAGGED", "drag"],
  ["MOUSE_WHEEL", "wheel"],
]);

const DOM_TO_ALICE_EVENT: ReadonlyMap<DomEventType, EventType> = new Map([
  ["keydown", "keyPressed"],
  ["keyup", "keyReleased"],
  ["keypress", "keyTyped"],
  ["click", "mouseClicked"],
  ["mousedown", "mousePressed"],
  ["mouseup", "mouseReleased"],
  ["mouseenter", "mouseEntered"],
  ["mouseleave", "mouseExited"],
  ["mousemove", "mouseMoved"],
  ["drag", "mouseDragged"],
  ["wheel", "mouseWheel"],
]);

/** Convert an AWT event type to its DOM equivalent. */
export function awtToDomEventType(awtType: AwtEventType): DomEventType | null {
  return AWT_TO_DOM_EVENT.get(awtType) ?? null;
}

/** Convert a DOM event type to Alice's EventSystem event type. */
export function domToAliceEventType(domType: DomEventType): EventType | null {
  return DOM_TO_ALICE_EVENT.get(domType) ?? null;
}

/** Convert an AWT key code to a DOM KeyboardEvent.key value. */
export function awtKeyToDomKey(awtKeyCode: number): string | null {
  // Letter keys A–Z
  if (awtKeyCode >= 65 && awtKeyCode <= 90) {
    return String.fromCharCode(awtKeyCode).toLowerCase();
  }
  // Digit keys 0–9
  if (awtKeyCode >= 48 && awtKeyCode <= 57) {
    return String(awtKeyCode - 48);
  }
  return AWT_TO_DOM_KEY.get(awtKeyCode) ?? null;
}

// ---------------------------------------------------------------------------
// DOM Event Interfaces (minimal, for testability)
// ---------------------------------------------------------------------------

export interface DOMKeyboardEventLike {
  readonly type: string;
  readonly key: string;
  readonly code?: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface DOMMouseEventLike {
  readonly type: string;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface DOMWheelEventLike extends DOMMouseEventLike {
  readonly deltaY: number;
}

export type DOMEventLike = DOMKeyboardEventLike | DOMMouseEventLike | DOMWheelEventLike;

// ---------------------------------------------------------------------------
// Event Payload Converters
// ---------------------------------------------------------------------------

/** Convert a DOM keyboard event to an Alice EventTriggerPayload. */
export function keyboardEventToPayload(event: DOMKeyboardEventLike): EventTriggerPayload {
  return {
    key: event.key,
    code: event.code,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/** Convert a DOM mouse event to an Alice EventTriggerPayload. */
export function mouseEventToPayload(event: DOMMouseEventLike): EventTriggerPayload {
  return {
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/** Convert a DOM wheel event to an Alice EventTriggerPayload. */
export function wheelEventToPayload(event: DOMWheelEventLike): EventTriggerPayload {
  return {
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    wheelRotation: event.deltaY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

// ---------------------------------------------------------------------------
// DOM Event Adapter
// ---------------------------------------------------------------------------

export interface DOMEventTargetLike {
  addEventListener(type: string, listener: (event: DOMEventLike) => void): void;
  removeEventListener(type: string, listener: (event: DOMEventLike) => void): void;
}

const KEYBOARD_TYPES = new Set<DomEventType>(["keydown", "keyup", "keypress"]);
const WHEEL_TYPES = new Set<DomEventType>(["wheel"]);

/**
 * Attaches to a DOM-like event target and converts DOM events into
 * Alice EventSystem fire() calls, bridging the Swing→web event gap.
 */
export class DOMEventAdapter {
  private readonly listeners = new Map<string, (event: DOMEventLike) => void>();
  private target: DOMEventTargetLike | null = null;
  readonly firedResults: EventFireResult[] = [];

  constructor(
    private readonly eventSystem: EventSystem,
    private readonly objectTarget?: string,
  ) {}

  /** Attach to a DOM target and start listening for the given event types. */
  attach(target: DOMEventTargetLike, eventTypes: DomEventType[]): void {
    this.detach();
    this.target = target;
    for (const domType of eventTypes) {
      const aliceType = domToAliceEventType(domType);
      if (!aliceType) continue;

      const listener = (event: DOMEventLike) => {
        const payload = this.convertEvent(domType, event);
        if (this.objectTarget) {
          payload.target = this.objectTarget;
        }
        const result = this.eventSystem.fire(aliceType, payload);
        this.firedResults.push(result);
      };
      this.listeners.set(domType, listener);
      target.addEventListener(domType, listener);
    }
  }

  /** Detach all listeners. */
  detach(): void {
    if (this.target) {
      for (const [type, listener] of this.listeners) {
        this.target.removeEventListener(type, listener);
      }
    }
    this.listeners.clear();
    this.target = null;
  }

  /** Get the list of currently attached DOM event types. */
  get attachedTypes(): string[] {
    return [...this.listeners.keys()];
  }

  /** Convert a single DOM event without dispatching. */
  convertEvent(domType: DomEventType, event: DOMEventLike): EventTriggerPayload {
    if (KEYBOARD_TYPES.has(domType)) {
      return keyboardEventToPayload(event as DOMKeyboardEventLike);
    }
    if (WHEEL_TYPES.has(domType)) {
      return wheelEventToPayload(event as DOMWheelEventLike);
    }
    return mouseEventToPayload(event as DOMMouseEventLike);
  }
}

// ---------------------------------------------------------------------------
// AWT InputMap/ActionMap Bridge
// ---------------------------------------------------------------------------

export interface InputBinding {
  readonly awtKeyCode: number;
  readonly modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  readonly actionName: string;
}

/**
 * Maps Java Alice's InputMap/ActionMap binding patterns to browser
 * DOM keyboard listeners. Stores AWT-style key bindings and resolves
 * them against DOM keyboard events.
 */
export class InputMapBridge {
  private readonly bindings: InputBinding[] = [];

  /** Register an AWT-style key binding. */
  bind(awtKeyCode: number, actionName: string, modifiers: InputBinding["modifiers"] = {}): void {
    this.bindings.push({ awtKeyCode, actionName, modifiers });
  }

  /** Resolve a DOM keyboard event to matching action names. */
  resolve(event: DOMKeyboardEventLike): string[] {
    const domKey = event.key.toLowerCase();
    return this.bindings
      .filter((binding) => {
        const expectedKey = awtKeyToDomKey(binding.awtKeyCode);
        if (!expectedKey || expectedKey.toLowerCase() !== domKey) return false;
        if (!!binding.modifiers.ctrl !== event.ctrlKey) return false;
        if (!!binding.modifiers.shift !== event.shiftKey) return false;
        if (!!binding.modifiers.alt !== event.altKey) return false;
        return true;
      })
      .map((binding) => binding.actionName);
  }

  /** Get all registered bindings. */
  get allBindings(): readonly InputBinding[] {
    return [...this.bindings];
  }
}
