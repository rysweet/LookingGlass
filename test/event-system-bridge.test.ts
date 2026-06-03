import { describe, expect, it } from "vitest";
import {
  AWT_KEY_CODES,
  DOMEventAdapter,
  InputMapBridge,
  awtKeyToDomKey,
  awtToDomEventType,
  domToAliceEventType,
  keyboardEventToPayload,
  mouseEventToPayload,
  wheelEventToPayload,
  type DOMEventLike,
  type DOMKeyboardEventLike,
  type DOMMouseEventLike,
  type DOMWheelEventLike,
} from "../src/event-system-bridge";
import { EventSystem } from "../src/events";

function makeKeyEvent(overrides: Partial<DOMKeyboardEventLike> & { key: string }): DOMKeyboardEventLike {
  return {
    type: "keydown",
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

function makeMouseEvent(overrides: Partial<DOMMouseEventLike> = {}): DOMMouseEventLike {
  return {
    type: "click",
    clientX: 0,
    clientY: 0,
    button: 0,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

function makeWheelEvent(overrides: Partial<DOMWheelEventLike> = {}): DOMWheelEventLike {
  return {
    ...makeMouseEvent({ type: "wheel" }),
    deltaY: 0,
    ...overrides,
  };
}

describe("event-system-bridge", () => {
  // ---------- AWT ↔ DOM Event Type Mapping ----------

  it("maps AWT event types to DOM event types", () => {
    expect(awtToDomEventType("KEY_PRESSED")).toBe("keydown");
    expect(awtToDomEventType("KEY_RELEASED")).toBe("keyup");
    expect(awtToDomEventType("KEY_TYPED")).toBe("keypress");
    expect(awtToDomEventType("MOUSE_CLICKED")).toBe("click");
    expect(awtToDomEventType("MOUSE_PRESSED")).toBe("mousedown");
    expect(awtToDomEventType("MOUSE_RELEASED")).toBe("mouseup");
    expect(awtToDomEventType("MOUSE_ENTERED")).toBe("mouseenter");
    expect(awtToDomEventType("MOUSE_EXITED")).toBe("mouseleave");
    expect(awtToDomEventType("MOUSE_MOVED")).toBe("mousemove");
    expect(awtToDomEventType("MOUSE_DRAGGED")).toBe("drag");
    expect(awtToDomEventType("MOUSE_WHEEL")).toBe("wheel");
  });

  it("returns null for unknown AWT event types", () => {
    expect(awtToDomEventType("UNKNOWN" as any)).toBeNull();
  });

  it("maps DOM event types to Alice EventSystem types", () => {
    expect(domToAliceEventType("keydown")).toBe("keyPressed");
    expect(domToAliceEventType("keyup")).toBe("keyReleased");
    expect(domToAliceEventType("click")).toBe("mouseClicked");
    expect(domToAliceEventType("mouseenter")).toBe("mouseEntered");
    expect(domToAliceEventType("mouseleave")).toBe("mouseExited");
    expect(domToAliceEventType("wheel")).toBe("mouseWheel");
  });

  it("returns null for unknown DOM event types", () => {
    expect(domToAliceEventType("focus" as any)).toBeNull();
  });

  // ---------- AWT Key Code Mapping ----------

  it("maps AWT key codes to DOM key values", () => {
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_ENTER)).toBe("Enter");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_ESCAPE)).toBe("Escape");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_SPACE)).toBe(" ");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_LEFT)).toBe("ArrowLeft");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_UP)).toBe("ArrowUp");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_RIGHT)).toBe("ArrowRight");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_DOWN)).toBe("ArrowDown");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_F1)).toBe("F1");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_DELETE)).toBe("Delete");
  });

  it("maps letter key codes (A–Z)", () => {
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_A)).toBe("a");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_S)).toBe("s");
    expect(awtKeyToDomKey(AWT_KEY_CODES.VK_Z)).toBe("z");
  });

  it("maps digit key codes (0–9)", () => {
    expect(awtKeyToDomKey(48)).toBe("0");
    expect(awtKeyToDomKey(57)).toBe("9");
  });

  it("returns null for unmapped key codes", () => {
    expect(awtKeyToDomKey(999)).toBeNull();
  });

  // ---------- Event Payload Converters ----------

  it("converts keyboard events to payloads", () => {
    const payload = keyboardEventToPayload(
      makeKeyEvent({ key: "s", ctrlKey: true, code: "KeyS" }),
    );
    expect(payload.key).toBe("s");
    expect(payload.code).toBe("KeyS");
    expect(payload.ctrlKey).toBe(true);
    expect(payload.shiftKey).toBe(false);
  });

  it("converts mouse events to payloads", () => {
    const payload = mouseEventToPayload(
      makeMouseEvent({ clientX: 100, clientY: 200, button: 2, shiftKey: true }),
    );
    expect(payload.x).toBe(100);
    expect(payload.y).toBe(200);
    expect(payload.button).toBe(2);
    expect(payload.shiftKey).toBe(true);
  });

  it("converts wheel events to payloads", () => {
    const payload = wheelEventToPayload(
      makeWheelEvent({ clientX: 50, clientY: 60, deltaY: -120 }),
    );
    expect(payload.x).toBe(50);
    expect(payload.y).toBe(60);
    expect(payload.wheelRotation).toBe(-120);
  });

  // ---------- DOMEventAdapter ----------

  it("attaches to a target and dispatches keyboard events to EventSystem", () => {
    const eventSystem = new EventSystem();
    eventSystem.register({ eventType: "keyPressed", handlerName: "onKey", key: "s" });

    const adapter = new DOMEventAdapter(eventSystem);
    const listeners = new Map<string, (event: DOMEventLike) => void>();
    const target = {
      addEventListener(type: string, fn: (event: DOMEventLike) => void) { listeners.set(type, fn); },
      removeEventListener(type: string, _fn: (event: DOMEventLike) => void) { listeners.delete(type); },
    };

    adapter.attach(target, ["keydown"]);
    expect(adapter.attachedTypes).toEqual(["keydown"]);

    const keyHandler = listeners.get("keydown")!;
    keyHandler(makeKeyEvent({ key: "s", ctrlKey: true }));

    expect(adapter.firedResults.length).toBe(1);
    expect(adapter.firedResults[0].triggered.length).toBe(1);
    expect(adapter.firedResults[0].triggered[0].handlerName).toBe("onKey");
  });

  it("attaches to a target and dispatches mouse events to EventSystem", () => {
    const eventSystem = new EventSystem();
    eventSystem.register({ eventType: "mouseClicked", handlerName: "onClick" });

    const adapter = new DOMEventAdapter(eventSystem);
    const listeners = new Map<string, (event: DOMEventLike) => void>();
    const target = {
      addEventListener(type: string, fn: (event: DOMEventLike) => void) { listeners.set(type, fn); },
      removeEventListener(type: string, _fn: (event: DOMEventLike) => void) { listeners.delete(type); },
    };

    adapter.attach(target, ["click"]);
    listeners.get("click")!(makeMouseEvent({ clientX: 50, clientY: 75 }));

    expect(adapter.firedResults.length).toBe(1);
    expect(adapter.firedResults[0].triggered[0].handlerName).toBe("onClick");
  });

  it("sets object target on dispatched payloads", () => {
    const eventSystem = new EventSystem({
      hasObject: () => true,
    });
    eventSystem.register({ eventType: "mouseClicked", handlerName: "onClick", target: "rabbit" });

    const adapter = new DOMEventAdapter(eventSystem, "rabbit");
    const listeners = new Map<string, (event: DOMEventLike) => void>();
    const target = {
      addEventListener(type: string, fn: (event: DOMEventLike) => void) { listeners.set(type, fn); },
      removeEventListener(type: string, _fn: (event: DOMEventLike) => void) { listeners.delete(type); },
    };

    adapter.attach(target, ["click"]);
    listeners.get("click")!(makeMouseEvent());

    expect(adapter.firedResults[0].triggered.length).toBe(1);
  });

  it("dispatches wheel events correctly", () => {
    const eventSystem = new EventSystem();
    eventSystem.register({ eventType: "mouseWheel", handlerName: "onWheel" });

    const adapter = new DOMEventAdapter(eventSystem);
    const listeners = new Map<string, (event: DOMEventLike) => void>();
    const target = {
      addEventListener(type: string, fn: (event: DOMEventLike) => void) { listeners.set(type, fn); },
      removeEventListener(type: string, _fn: (event: DOMEventLike) => void) { listeners.delete(type); },
    };

    adapter.attach(target, ["wheel"]);
    listeners.get("wheel")!(makeWheelEvent({ deltaY: -120 }));

    expect(adapter.firedResults[0].triggered[0].handlerName).toBe("onWheel");
  });

  it("detaches all listeners on detach()", () => {
    const eventSystem = new EventSystem();
    const adapter = new DOMEventAdapter(eventSystem);
    const listeners = new Map<string, (event: DOMEventLike) => void>();
    const target = {
      addEventListener(type: string, fn: (event: DOMEventLike) => void) { listeners.set(type, fn); },
      removeEventListener(type: string, _fn: (event: DOMEventLike) => void) { listeners.delete(type); },
    };

    adapter.attach(target, ["keydown", "click"]);
    expect(adapter.attachedTypes.length).toBe(2);

    adapter.detach();
    expect(adapter.attachedTypes).toEqual([]);
    expect(listeners.size).toBe(0);
  });

  it("skips unknown DOM event types in attach", () => {
    const eventSystem = new EventSystem();
    const adapter = new DOMEventAdapter(eventSystem);
    const target = {
      addEventListener() {},
      removeEventListener() {},
    };

    adapter.attach(target, ["focus" as any]);
    expect(adapter.attachedTypes).toEqual([]);
  });

  // ---------- InputMapBridge ----------

  it("resolves AWT-style key bindings to action names", () => {
    const bridge = new InputMapBridge();
    bridge.bind(AWT_KEY_CODES.VK_S, "save", { ctrl: true });
    bridge.bind(AWT_KEY_CODES.VK_Z, "undo", { ctrl: true });
    bridge.bind(AWT_KEY_CODES.VK_Z, "redo", { ctrl: true, shift: true });

    expect(bridge.resolve(makeKeyEvent({ key: "s", ctrlKey: true }))).toEqual(["save"]);
    expect(bridge.resolve(makeKeyEvent({ key: "z", ctrlKey: true }))).toEqual(["undo"]);
    expect(bridge.resolve(makeKeyEvent({ key: "z", ctrlKey: true, shiftKey: true }))).toEqual(["redo"]);
  });

  it("returns empty array for unmatched key events", () => {
    const bridge = new InputMapBridge();
    bridge.bind(AWT_KEY_CODES.VK_S, "save", { ctrl: true });

    expect(bridge.resolve(makeKeyEvent({ key: "s" }))).toEqual([]);
    expect(bridge.resolve(makeKeyEvent({ key: "x", ctrlKey: true }))).toEqual([]);
  });

  it("lists all registered bindings", () => {
    const bridge = new InputMapBridge();
    bridge.bind(AWT_KEY_CODES.VK_S, "save", { ctrl: true });
    bridge.bind(AWT_KEY_CODES.VK_F5, "run");

    expect(bridge.allBindings.length).toBe(2);
    expect(bridge.allBindings[0].actionName).toBe("save");
    expect(bridge.allBindings[1].actionName).toBe("run");
  });
});
