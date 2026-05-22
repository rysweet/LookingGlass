// ═══════════════════════════════════════════════════════════════════════════
// resource-manager.ts — Manage texture/model/audio resources with caching
//
// Provides: ResourceManager with lazy loading, concurrent load deduplication,
// catalog metadata, reference counting, and eviction that respects pinned data.
// Pure computation, no filesystem or network I/O.
// ═══════════════════════════════════════════════════════════════════════════

export type ResourceType = "texture" | "model" | "audio";

export interface ResourceMetadata {
  name?: string;
  fileName?: string | null;
  format?: string | null;
  uuid?: string | null;
  provenance?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ResourceRegistration extends ResourceMetadata {
  key: string;
  type: ResourceType;
}

export interface ResourceEntry extends ResourceRegistration {
  data: Uint8Array | null;
  loaded: boolean;
  referenceCount: number;
  lastAccessed: number | null;
  metadata: ResourceMetadata;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  catalogSize: number;
  pinned: number;
}

export interface ResourceManagerOptions {
  maxCacheSize?: number;
}

export interface ResourceManager {
  register(key: string, type: ResourceType, metadata?: ResourceMetadata): void;
  registerEntry(entry: ResourceRegistration): void;
  get(key: string): Promise<Uint8Array>;
  acquire(key: string): Promise<Uint8Array>;
  release(key: string): number;
  referenceCount(key: string): number;
  getIfLoaded(key: string): Uint8Array | null;
  getEntry(key: string): ResourceEntry | null;
  has(key: string): boolean;
  remove(key: string): boolean;
  clear(): void;
  stats(): CacheStats;
  entries(): ResourceEntry[];
  entriesByType(type: ResourceType): ResourceEntry[];
}

interface ResourceRecord {
  key: string;
  type: ResourceType;
  metadata: ResourceMetadata;
  data: Uint8Array | null;
  loaded: boolean;
  referenceCount: number;
  lastAccessed: number | null;
}

export function createResourceManager(
  loader: (key: string, entry?: ResourceEntry) => Promise<Uint8Array> | Uint8Array,
  options?: ResourceManagerOptions,
): ResourceManager {
  const maxCacheSize =
    options?.maxCacheSize !== undefined
      ? Math.max(0, options.maxCacheSize)
      : 0;

  const registry = new Map<string, ResourceRecord>();
  const cache = new Map<string, Uint8Array>();
  const pending = new Map<string, Promise<Uint8Array>>();

  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let accessClock = 0;

  function cloneMetadata(metadata: ResourceMetadata): ResourceMetadata {
    return { ...metadata };
  }

  function entryFromRecord(record: ResourceRecord): ResourceEntry {
    const metadata = cloneMetadata(record.metadata);
    return {
      key: record.key,
      type: record.type,
      data: record.data,
      loaded: record.loaded,
      referenceCount: record.referenceCount,
      lastAccessed: record.lastAccessed,
      metadata,
      name: typeof metadata.name === "string" ? metadata.name : record.key,
      fileName: typeof metadata.fileName === "string" ? metadata.fileName : null,
      format: typeof metadata.format === "string" ? metadata.format : null,
      uuid: typeof metadata.uuid === "string" ? metadata.uuid : null,
      provenance: typeof metadata.provenance === "string" ? metadata.provenance : null,
      width: typeof metadata.width === "number" ? metadata.width : null,
      height: typeof metadata.height === "number" ? metadata.height : null,
      duration: typeof metadata.duration === "number" ? metadata.duration : null,
    };
  }

  function requireRecord(key: string): ResourceRecord {
    const record = registry.get(key);
    if (!record) {
      throw new Error(`Unknown resource '${key}'`);
    }
    return record;
  }

  function touch(key: string): void {
    const data = cache.get(key);
    if (!data) {
      return;
    }
    cache.delete(key);
    cache.set(key, data);
    const record = registry.get(key);
    if (record) {
      record.lastAccessed = ++accessClock;
    }
  }

  function evictIfNeeded(preferredKey: string): void {
    if (maxCacheSize === 0) {
      return;
    }
    while (cache.size > maxCacheSize) {
      let evicted = false;
      for (const [candidate] of cache) {
        if (candidate === preferredKey) {
          continue;
        }
        const record = registry.get(candidate);
        if (!record || record.referenceCount > 0) {
          continue;
        }
        cache.delete(candidate);
        record.data = null;
        record.loaded = false;
        record.lastAccessed = null;
        evictions++;
        evicted = true;
        break;
      }
      if (!evicted) {
        break;
      }
    }
  }

  function storeLoadedData(key: string, data: Uint8Array): Uint8Array {
    const record = requireRecord(key);
    record.data = data;
    record.loaded = true;
    record.lastAccessed = ++accessClock;
    cache.delete(key);
    cache.set(key, data);
    evictIfNeeded(key);
    return data;
  }

  async function load(key: string): Promise<Uint8Array> {
    const record = requireRecord(key);
    const cached = cache.get(key);
    if (cached) {
      hits++;
      touch(key);
      return cached;
    }

    const inflight = pending.get(key);
    if (inflight) {
      return inflight;
    }

    misses++;
    const promise = Promise.resolve(
      loader.length >= 2 ? loader(key, entryFromRecord(record)) : loader(key),
    ).then((data) => {
        pending.delete(key);
        return storeLoadedData(key, data);
      })
      .catch((error) => {
        pending.delete(key);
        throw error;
      });

    pending.set(key, promise);
    return promise;
  }

  function registerEntry(entry: ResourceRegistration): void {
    if (!entry.key) {
      throw new Error("Resource key cannot be empty");
    }
    if (registry.has(entry.key)) {
      throw new Error(`Resource '${entry.key}' is already registered`);
    }

    const { key, type, ...metadata } = entry;
    registry.set(key, {
      key,
      type,
      metadata,
      data: null,
      loaded: false,
      referenceCount: 0,
      lastAccessed: null,
    });
  }

  return {
    register(key: string, type: ResourceType, metadata: ResourceMetadata = {}): void {
      registerEntry({ key, type, ...metadata });
    },

    registerEntry,

    async get(key: string): Promise<Uint8Array> {
      return load(key);
    },

    async acquire(key: string): Promise<Uint8Array> {
      const record = requireRecord(key);
      record.referenceCount += 1;
      try {
        return await load(key);
      } catch (error) {
        record.referenceCount -= 1;
        throw error;
      }
    },

    release(key: string): number {
      const record = requireRecord(key);
      if (record.referenceCount > 0) {
        record.referenceCount -= 1;
      }
      evictIfNeeded("");
      return record.referenceCount;
    },

    referenceCount(key: string): number {
      return requireRecord(key).referenceCount;
    },

    getIfLoaded(key: string): Uint8Array | null {
      return cache.get(key) ?? null;
    },

    getEntry(key: string): ResourceEntry | null {
      const record = registry.get(key);
      return record ? entryFromRecord(record) : null;
    },

    has(key: string): boolean {
      return registry.has(key);
    },

    remove(key: string): boolean {
      if (!registry.has(key)) {
        return false;
      }
      registry.delete(key);
      cache.delete(key);
      pending.delete(key);
      return true;
    },

    clear(): void {
      registry.clear();
      cache.clear();
      pending.clear();
      hits = 0;
      misses = 0;
      evictions = 0;
      accessClock = 0;
    },

    stats(): CacheStats {
      let pinned = 0;
      for (const record of registry.values()) {
        if (record.referenceCount > 0) {
          pinned += 1;
        }
      }
      return {
        hits,
        misses,
        evictions,
        size: cache.size,
        catalogSize: registry.size,
        pinned,
      };
    },

    entries(): ResourceEntry[] {
      return Array.from(registry.values(), entryFromRecord);
    },

    entriesByType(type: ResourceType): ResourceEntry[] {
      const result: ResourceEntry[] = [];
      for (const record of registry.values()) {
        if (record.type === type) {
          result.push(entryFromRecord(record));
        }
      }
      return result;
    },
  };
}
