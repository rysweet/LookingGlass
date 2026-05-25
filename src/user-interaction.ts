export interface TransferData<T = unknown> {
  type: string;
  payload: T;
}

export interface DragSession<T = unknown> {
  sourceId: string;
  data: TransferData<T>;
  currentTargetId: string | null;
}

export interface DragSourceOptions<T = unknown> {
  id: string;
  createTransferData: () => TransferData<T>;
  canStart?: () => boolean;
}

export interface DropTargetOptions<T = unknown> {
  id: string;
  accepts?: (data: TransferData<T>) => boolean;
  onDrop?: (data: TransferData<T>, session: DragSession<T>) => void;
}

export class DragSource<T = unknown> {
  readonly id: string;
  private readonly createTransferData: () => TransferData<T>;
  private readonly canStart: () => boolean;

  constructor(options: DragSourceOptions<T>) {
    this.id = options.id;
    this.createTransferData = options.createTransferData;
    this.canStart = options.canStart ?? (() => true);
  }

  startDrag(): DragSession<T> | null {
    if (!this.canStart()) {
      return null;
    }
    return {
      sourceId: this.id,
      data: this.createTransferData(),
      currentTargetId: null,
    };
  }
}

export class DropTarget<T = unknown> {
  readonly id: string;
  private readonly accepts: (data: TransferData<T>) => boolean;
  private readonly onDrop: (data: TransferData<T>, session: DragSession<T>) => void;

  constructor(options: DropTargetOptions<T>) {
    this.id = options.id;
    this.accepts = options.accepts ?? (() => true);
    this.onDrop = options.onDrop ?? (() => undefined);
  }

  canAccept(session: DragSession<T>): boolean {
    return this.accepts(session.data);
  }

  drop(session: DragSession<T>): void {
    this.onDrop(session.data, session);
  }
}

export class DragDropManager<T = unknown> {
  private readonly sources = new Map<string, DragSource<T>>();
  private readonly targets = new Map<string, DropTarget<T>>();
  private active: DragSession<T> | null = null;

  registerSource(source: DragSource<T>): void {
    this.sources.set(source.id, source);
  }

  registerTarget(target: DropTarget<T>): void {
    this.targets.set(target.id, target);
  }

  beginDrag(sourceId: string): DragSession<T> | null {
    const source = this.sources.get(sourceId);
    if (!source) {
      return null;
    }
    this.active = source.startDrag();
    return this.activeSession;
  }

  hover(targetId: string): boolean {
    if (!this.active) {
      return false;
    }
    const target = this.targets.get(targetId);
    if (!target || !target.canAccept(this.active)) {
      return false;
    }
    this.active.currentTargetId = targetId;
    return true;
  }

  drop(targetId?: string): boolean {
    if (!this.active) {
      return false;
    }
    const resolvedTargetId = targetId ?? this.active.currentTargetId;
    if (!resolvedTargetId) {
      return false;
    }
    const target = this.targets.get(resolvedTargetId);
    if (!target || !target.canAccept(this.active)) {
      return false;
    }
    this.active.currentTargetId = resolvedTargetId;
    target.drop(this.cloneSession(this.active));
    this.active = null;
    return true;
  }

  cancel(): void {
    this.active = null;
  }

  get activeSession(): DragSession<T> | null {
    return this.active ? this.cloneSession(this.active) : null;
  }

  private cloneSession(session: DragSession<T>): DragSession<T> {
    return {
      sourceId: session.sourceId,
      data: {
        type: session.data.type,
        payload: cloneValue(session.data.payload),
      },
      currentTargetId: session.currentTargetId,
    };
  }
}

export interface ContextMenuContext {
  x: number;
  y: number;
  button?: number;
  targetId?: string;
  [key: string]: unknown;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  shortcut?: string;
  children?: ContextMenuItem[];
  action?: (context: ContextMenuContext) => void;
}

export interface OpenContextMenu {
  context: ContextMenuContext;
  items: ContextMenuItem[];
}

interface EventTargetLike {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export class ContextMenuManager {
  private openMenu: OpenContextMenu | null = null;

  open(context: ContextMenuContext, items: ContextMenuItem[]): OpenContextMenu {
    this.openMenu = {
      context: { ...context },
      items: cloneMenuItems(items),
    };
    return this.currentMenu!;
  }

  bind(target: EventTargetLike, buildItems: (context: ContextMenuContext) => ContextMenuItem[]): () => void {
    const listener = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      mouseEvent.preventDefault();
      const currentTarget = mouseEvent.currentTarget as HTMLElement | null;
      this.open(
        {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
          button: mouseEvent.button,
          targetId: currentTarget?.id,
        },
        buildItems({
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
          button: mouseEvent.button,
          targetId: currentTarget?.id,
        }),
      );
    };
    target.addEventListener("contextmenu", listener);
    return () => target.removeEventListener("contextmenu", listener);
  }

  select(itemId: string): boolean {
    if (!this.openMenu) {
      return false;
    }
    const item = findMenuItem(this.openMenu.items, itemId);
    if (!item || item.enabled === false) {
      return false;
    }
    item.action?.({ ...this.openMenu.context });
    this.close();
    return true;
  }

  close(): void {
    this.openMenu = null;
  }

  get currentMenu(): OpenContextMenu | null {
    return this.openMenu
      ? {
          context: { ...this.openMenu.context },
          items: cloneMenuItems(this.openMenu.items),
        }
      : null;
  }
}

export interface KeyboardShortcutContext {
  [key: string]: unknown;
}

export interface KeyboardShortcut {
  id: string;
  chord: string;
  description?: string;
  when?: (context: KeyboardShortcutContext) => boolean;
  handler: (event: KeyboardEvent, context: KeyboardShortcutContext) => void;
}

export interface RegisteredKeyboardShortcut {
  id: string;
  chord: string;
  description?: string;
}

export function normalizeShortcut(shortcut: string): string {
  const tokens = shortcut
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean)
    .map(normalizeShortcutToken);
  const modifiers = MODIFIER_ORDER.filter((modifier) => tokens.includes(modifier));
  const keys = tokens.filter((token) => !MODIFIER_ORDER.includes(token));
  return [...modifiers, ...keys].join("+");
}

export function shortcutFromKeyboardEvent(event: Pick<KeyboardEvent, "ctrlKey" | "altKey" | "shiftKey" | "metaKey" | "key">): string {
  const tokens: string[] = [];
  if (event.ctrlKey) tokens.push("Ctrl");
  if (event.altKey) tokens.push("Alt");
  if (event.shiftKey) tokens.push("Shift");
  if (event.metaKey) tokens.push("Meta");
  const key = normalizeShortcutToken(event.key);
  if (!MODIFIER_ORDER.includes(key)) {
    tokens.push(key);
  }
  return tokens.join("+");
}

export class KeyboardShortcutManager {
  private readonly shortcuts = new Map<string, KeyboardShortcut>();

  register(shortcut: KeyboardShortcut): () => void {
    this.shortcuts.set(shortcut.id, {
      ...shortcut,
      chord: normalizeShortcut(shortcut.chord),
    });
    return () => this.unregister(shortcut.id);
  }

  unregister(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  bind(target: EventTargetLike, context: KeyboardShortcutContext = {}): () => void {
    const listener = (event: Event) => {
      this.handle(event as KeyboardEvent, context);
    };
    target.addEventListener("keydown", listener);
    return () => target.removeEventListener("keydown", listener);
  }

  handle(event: KeyboardEvent, context: KeyboardShortcutContext = {}): boolean {
    const chord = shortcutFromKeyboardEvent(event);
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.chord !== chord) {
        continue;
      }
      if (shortcut.when && !shortcut.when(context)) {
        continue;
      }
      event.preventDefault();
      shortcut.handler(event, { ...context });
      return true;
    }
    return false;
  }

  listShortcuts(): RegisteredKeyboardShortcut[] {
    return [...this.shortcuts.values()].map((shortcut) => ({
      id: shortcut.id,
      chord: shortcut.chord,
      description: shortcut.description,
    }));
  }
}

const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Meta"];

function normalizeShortcutToken(token: string): string {
  const normalized = token.trim().toLowerCase();
  switch (normalized) {
    case "control":
    case "ctrl":
      return "Ctrl";
    case "option":
    case "alt":
      return "Alt";
    case "shift":
      return "Shift";
    case "command":
    case "cmd":
    case "meta":
      return "Meta";
    case " ":
    case "space":
    case "spacebar":
      return "Space";
    default:
      if (token.length === 1) {
        return token.toUpperCase();
      }
      return token.charAt(0).toUpperCase() + token.slice(1);
  }
}

function cloneMenuItems(items: ContextMenuItem[]): ContextMenuItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneMenuItems(item.children) : undefined,
  }));
}

function findMenuItem(items: ContextMenuItem[], itemId: string): ContextMenuItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    if (item.children) {
      const child = findMenuItem(item.children, itemId);
      if (child) {
        return child;
      }
    }
  }
  return null;
}

function cloneValue<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
