import type { Position } from "./story-api/types.js";

export const VALID_EVENT_TYPES = ["sceneActivated", "keyPress", "proximity"] as const;
export type EventType = (typeof VALID_EVENT_TYPES)[number];

export interface EventRegistration {
  id: string;
  eventType: EventType;
  handlerName: string;
  key?: string;
  targetObjects?: [string, string];
  threshold?: number;
}

export interface EventRegistrationRequest {
  eventType?: string;
  handlerName?: string;
  key?: string;
  targetObjects?: string[];
  threshold?: number;
}

export interface EventTriggerPayload {
  key?: string;
  sourceObject?: string;
}

export interface TriggeredEventHandler {
  id: string;
  eventType: EventType;
  handlerName: string;
}

export interface EventFireResult {
  registrationsEvaluated: number;
  triggered: TriggeredEventHandler[];
}

export interface EventSystemBindings {
  hasObject?: (name: string) => boolean;
  getObjectPosition?: (name: string) => Position | null | undefined;
}

export class EventSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventSystemError";
  }
}

const MAX_REGISTRATIONS = 1000;
const DEFAULT_THRESHOLD = 2.0;

export class EventSystem {
  private readonly registrationsByType = new Map<EventType, EventRegistration[]>();
  private registrationCount = 0;
  private nextEventId = 1;

  constructor(private readonly bindings: EventSystemBindings = {}) {}

  get totalRegistrations(): number {
    return this.registrationCount;
  }

  reset(): void {
    this.registrationsByType.clear();
    this.registrationCount = 0;
    this.nextEventId = 1;
  }

  register(request: EventRegistrationRequest): EventRegistration {
    const eventType = this.parseEventType(request.eventType);
    const handlerName = request.handlerName ?? "handler";

    if (eventType === "keyPress" && !request.key) {
      throw new EventSystemError("key is required for keyPress events");
    }

    let resolvedThreshold = DEFAULT_THRESHOLD;
    if (eventType === "proximity") {
      if (!Array.isArray(request.targetObjects) || request.targetObjects.length !== 2) {
        throw new EventSystemError("proximity requires targetObjects with exactly 2 entries");
      }
      for (const objectName of request.targetObjects) {
        if (this.bindings.hasObject && !this.bindings.hasObject(objectName)) {
          throw new EventSystemError(`unknown object: ${objectName}`);
        }
      }
      if (request.threshold !== undefined) {
        if (request.threshold <= 0 || request.threshold > 1000) {
          throw new EventSystemError("threshold must be > 0 and <= 1000");
        }
        resolvedThreshold = request.threshold;
      }
    }

    if (this.registrationCount >= MAX_REGISTRATIONS) {
      throw new EventSystemError(`registration limit reached (${MAX_REGISTRATIONS})`);
    }

    const registration: EventRegistration = {
      id: `evt-${this.nextEventId++}`,
      eventType,
      handlerName,
      ...(eventType === "keyPress" ? { key: request.key } : {}),
      ...(eventType === "proximity"
        ? {
            targetObjects: request.targetObjects as [string, string],
            threshold: resolvedThreshold,
          }
        : {}),
    };

    const registrations = this.registrationsByType.get(eventType);
    if (registrations) {
      registrations.push(registration);
    } else {
      this.registrationsByType.set(eventType, [registration]);
    }
    this.registrationCount++;

    return { ...registration };
  }

  fire(eventTypeInput?: string, payload: EventTriggerPayload = {}): EventFireResult {
    const eventType = this.parseEventType(eventTypeInput);
    const candidates = this.registrationsByType.get(eventType) ?? [];

    let triggered: EventRegistration[];
    switch (eventType) {
      case "sceneActivated":
        triggered = candidates;
        break;
      case "keyPress":
        triggered = payload.key
          ? candidates.filter((registration) => registration.key === payload.key)
          : [];
        break;
      case "proximity":
        triggered = candidates.filter((registration) => {
          const targets = registration.targetObjects;
          if (!targets) {
            return false;
          }
          if (payload.sourceObject && !targets.includes(payload.sourceObject)) {
            return false;
          }
          const left = this.bindings.getObjectPosition?.(targets[0]) ?? null;
          const right = this.bindings.getObjectPosition?.(targets[1]) ?? null;
          return left !== null && right !== null && euclideanDistance(left, right) <= (registration.threshold ?? DEFAULT_THRESHOLD);
        });
        break;
    }

    return {
      registrationsEvaluated: candidates.length,
      triggered: triggered.map((registration) => ({
        id: registration.id,
        eventType: registration.eventType,
        handlerName: registration.handlerName,
      })),
    };
  }

  private parseEventType(eventType?: string): EventType {
    if (!eventType) {
      throw new EventSystemError("eventType is required");
    }
    if (!VALID_EVENT_TYPES.includes(eventType as EventType)) {
      throw new EventSystemError(`unknown eventType: ${eventType}`);
    }
    return eventType as EventType;
  }
}

function euclideanDistance(left: Position, right: Position): number {
  return Math.sqrt(
    (left.x - right.x) ** 2 +
      (left.y - right.y) ** 2 +
      (left.z - right.z) ** 2,
  );
}
