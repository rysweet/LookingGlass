export type CollaborationOperation = "upsert" | "delete";
export type PresenceStatus = "active" | "idle";

export interface CollaborationPeerOptions {
  readonly id: string;
  readonly name: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp?: number;
}

export interface CollaborationPeer {
  readonly id: string;
  readonly name: string;
  readonly metadata: Record<string, unknown>;
  readonly joinedAt: number;
}

export interface PresenceUpdate {
  readonly resourceId?: string | null;
  readonly selection?: readonly [number, number] | null;
  readonly status?: PresenceStatus;
  readonly timestamp?: number;
}

export interface CollaborationPresence {
  readonly peerId: string;
  readonly resourceId: string | null;
  readonly selection: readonly [number, number] | null;
  readonly status: PresenceStatus;
  readonly updatedAt: number;
}

export interface CollaborationChangeInput {
  readonly peerId: string;
  readonly resourceId: string;
  readonly operation?: CollaborationOperation;
  readonly content?: string | null;
  readonly timestamp?: number;
  readonly changeId?: string;
}

export interface CollaborationChange {
  readonly changeId: string;
  readonly sessionId: string;
  readonly peerId: string;
  readonly resourceId: string;
  readonly operation: CollaborationOperation;
  readonly content: string | null;
  readonly timestamp: number;
  readonly version: number;
  readonly tombstone: boolean;
}

export interface CollaborationDocument {
  readonly resourceId: string;
  readonly content: string | null;
  readonly tombstone: boolean;
  readonly version: number;
  readonly updatedAt: number;
  readonly lastAuthorId: string;
  readonly lastChangeId: string;
}

export interface CollaborationApplyResult {
  readonly applied: boolean;
  readonly change: CollaborationChange;
  readonly recipients: readonly string[];
  readonly document: CollaborationDocument;
}

export interface CollaborationSessionSnapshot {
  readonly id: string;
  readonly name: string;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly peers: readonly CollaborationPeer[];
  readonly presence: readonly CollaborationPresence[];
  readonly documents: readonly CollaborationDocument[];
}

export interface CollaborationSessionOptions {
  readonly id?: string;
  readonly name: string;
  readonly createdBy: CollaborationPeerOptions;
  readonly timestamp?: number;
}

let nextSessionId = 0;
let nextChangeSequence = 0;

function createSessionId(): string {
  nextSessionId += 1;
  return `session-${nextSessionId}`;
}

function createChangeId(sessionId: string): string {
  nextChangeSequence += 1;
  return `${sessionId}-change-${nextChangeSequence}`;
}

function cloneMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  return metadata ? { ...metadata } : {};
}

function clonePeer(peer: CollaborationPeer): CollaborationPeer {
  return {
    id: peer.id,
    name: peer.name,
    metadata: cloneMetadata(peer.metadata),
    joinedAt: peer.joinedAt,
  };
}

function clonePresence(presence: CollaborationPresence): CollaborationPresence {
  return {
    peerId: presence.peerId,
    resourceId: presence.resourceId,
    selection: presence.selection ? [...presence.selection] as [number, number] : null,
    status: presence.status,
    updatedAt: presence.updatedAt,
  };
}

function cloneChange(change: CollaborationChange): CollaborationChange {
  return {
    changeId: change.changeId,
    sessionId: change.sessionId,
    peerId: change.peerId,
    resourceId: change.resourceId,
    operation: change.operation,
    content: change.content,
    timestamp: change.timestamp,
    version: change.version,
    tombstone: change.tombstone,
  };
}

function cloneDocument(document: CollaborationDocument): CollaborationDocument {
  return {
    resourceId: document.resourceId,
    content: document.content,
    tombstone: document.tombstone,
    version: document.version,
    updatedAt: document.updatedAt,
    lastAuthorId: document.lastAuthorId,
    lastChangeId: document.lastChangeId,
  };
}

function normalizeTimestamp(timestamp: number | undefined, fallback: number): number {
  return Number.isFinite(timestamp) ? Math.max(0, timestamp as number) : fallback;
}

function compareChanges(
  timestamp: number,
  changeId: string,
  document: CollaborationDocument,
): number {
  if (timestamp !== document.updatedAt) {
    return timestamp - document.updatedAt;
  }
  return changeId.localeCompare(document.lastChangeId);
}

function createPeer(options: CollaborationPeerOptions, fallbackTimestamp: number): CollaborationPeer {
  return {
    id: options.id,
    name: options.name,
    metadata: cloneMetadata(options.metadata),
    joinedAt: normalizeTimestamp(options.timestamp, fallbackTimestamp),
  };
}

export class CollaborationSession {
  readonly id: string;
  readonly name: string;
  readonly createdBy: string;
  readonly createdAt: number;

  private readonly peers = new Map<string, CollaborationPeer>();
  private readonly presenceByPeer = new Map<string, CollaborationPresence>();
  private readonly documents = new Map<string, CollaborationDocument>();
  private readonly mailboxes = new Map<string, CollaborationChange[]>();

  constructor(options: CollaborationSessionOptions) {
    const createdAt = normalizeTimestamp(options.timestamp, Date.now());
    const owner = createPeer(options.createdBy, createdAt);
    this.id = options.id ?? createSessionId();
    this.name = options.name;
    this.createdBy = owner.id;
    this.createdAt = createdAt;
    this.peers.set(owner.id, owner);
    this.mailboxes.set(owner.id, []);
  }

  get peerCount(): number {
    return this.peers.size;
  }

  createSnapshot(): CollaborationSessionSnapshot {
    return {
      id: this.id,
      name: this.name,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      peers: [...this.peers.values()].map(clonePeer),
      presence: [...this.presenceByPeer.values()].map(clonePresence),
      documents: [...this.documents.values()].map(cloneDocument),
    };
  }

  join(peer: CollaborationPeerOptions): CollaborationPeer {
    const joinedPeer = createPeer(peer, Date.now());
    this.peers.set(joinedPeer.id, joinedPeer);
    if (!this.mailboxes.has(joinedPeer.id)) {
      this.mailboxes.set(joinedPeer.id, []);
    }
    return clonePeer(joinedPeer);
  }

  leave(peerId: string): CollaborationPeer | null {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return null;
    }
    this.peers.delete(peerId);
    this.presenceByPeer.delete(peerId);
    this.mailboxes.delete(peerId);
    return clonePeer(peer);
  }

  updatePresence(peerId: string, update: PresenceUpdate): CollaborationPresence {
    this.requirePeer(peerId);
    const current = this.presenceByPeer.get(peerId);
    const next: CollaborationPresence = {
      peerId,
      resourceId: update.resourceId ?? current?.resourceId ?? null,
      selection: update.selection
        ? ([...update.selection] as [number, number])
        : update.selection === null
          ? null
          : current?.selection ?? null,
      status: update.status ?? current?.status ?? "active",
      updatedAt: normalizeTimestamp(update.timestamp, Date.now()),
    };
    this.presenceByPeer.set(peerId, next);
    return clonePresence(next);
  }

  getPresence(): CollaborationPresence[] {
    return [...this.presenceByPeer.values()].map(clonePresence);
  }

  getDocument(resourceId: string): CollaborationDocument | null {
    const document = this.documents.get(resourceId);
    return document ? cloneDocument(document) : null;
  }

  applyChange(input: CollaborationChangeInput): CollaborationApplyResult {
    this.requirePeer(input.peerId);
    const timestamp = normalizeTimestamp(input.timestamp, Date.now());
    const changeId = input.changeId ?? createChangeId(this.id);
    const operation = input.operation ?? "upsert";
    const existing = this.documents.get(input.resourceId);

    if (existing && compareChanges(timestamp, changeId, existing) < 0) {
      return {
        applied: false,
        change: {
          changeId,
          sessionId: this.id,
          peerId: input.peerId,
          resourceId: input.resourceId,
          operation,
          content: operation === "delete" ? null : input.content ?? null,
          timestamp,
          version: existing.version,
          tombstone: existing.tombstone,
        },
        recipients: [],
        document: cloneDocument(existing),
      };
    }

    const nextDocument: CollaborationDocument = {
      resourceId: input.resourceId,
      content: operation === "delete" ? null : input.content ?? "",
      tombstone: operation === "delete",
      version: (existing?.version ?? 0) + 1,
      updatedAt: timestamp,
      lastAuthorId: input.peerId,
      lastChangeId: changeId,
    };
    this.documents.set(input.resourceId, nextDocument);

    const change: CollaborationChange = {
      changeId,
      sessionId: this.id,
      peerId: input.peerId,
      resourceId: input.resourceId,
      operation,
      content: nextDocument.content,
      timestamp,
      version: nextDocument.version,
      tombstone: nextDocument.tombstone,
    };

    const recipients = [...this.peers.keys()].filter((peerId) => peerId !== input.peerId);
    for (const peerId of recipients) {
      const mailbox = this.mailboxes.get(peerId);
      if (mailbox) {
        mailbox.push(cloneChange(change));
      }
    }

    return {
      applied: true,
      change,
      recipients,
      document: cloneDocument(nextDocument),
    };
  }

  pullPendingChanges(peerId: string): CollaborationChange[] {
    this.requirePeer(peerId);
    const mailbox = this.mailboxes.get(peerId);
    if (!mailbox || mailbox.length === 0) {
      return [];
    }
    const pending = mailbox.map(cloneChange);
    mailbox.length = 0;
    return pending;
  }

  private requirePeer(peerId: string): void {
    if (!this.peers.has(peerId)) {
      throw new Error(`peer '${peerId}' is not part of session '${this.id}'`);
    }
  }
}

export class CollaborationManager {
  private readonly sessions = new Map<string, CollaborationSession>();

  createSession(options: CollaborationSessionOptions): CollaborationSession {
    const session = new CollaborationSession(options);
    this.sessions.set(session.id, session);
    return session;
  }

  listSessions(): CollaborationSessionSnapshot[] {
    return [...this.sessions.values()].map((session) => session.createSnapshot());
  }

  getSession(sessionId: string): CollaborationSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`unknown collaboration session: ${sessionId}`);
    }
    return session;
  }

  getSessionSnapshot(sessionId: string): CollaborationSessionSnapshot {
    return this.getSession(sessionId).createSnapshot();
  }

  joinSession(sessionId: string, peer: CollaborationPeerOptions): CollaborationPeer {
    return this.getSession(sessionId).join(peer);
  }

  leaveSession(sessionId: string, peerId: string): CollaborationPeer | null {
    return this.getSession(sessionId).leave(peerId);
  }
}
