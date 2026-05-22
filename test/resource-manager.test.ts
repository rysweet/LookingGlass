import { describe, it, expect, vi } from "vitest";
import {
  createResourceManager,
} from "../src/resource-manager.js";
import type {
  ResourceManager,
  ResourceEntry,
  CacheStats,
  ResourceType,
  ResourceManagerOptions,
} from "../src/resource-manager.js";

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function fakeLoader(data = new Uint8Array([1, 2, 3])) {
  return vi.fn(async (_key: string) => data);
}

function bytesOf(n: number): Uint8Array {
  return new Uint8Array(Array.from({ length: n }, (_, i) => i % 256));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PUBLIC API & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

describe("createResourceManager – public API", () => {
  it("exports createResourceManager as a function", () => {
    expect(typeof createResourceManager).toBe("function");
  });

  it("returns an object with all required methods", () => {
    const mgr = createResourceManager(fakeLoader());
    expect(typeof mgr.register).toBe("function");
    expect(typeof mgr.get).toBe("function");
    expect(typeof mgr.getIfLoaded).toBe("function");
    expect(typeof mgr.has).toBe("function");
    expect(typeof mgr.remove).toBe("function");
    expect(typeof mgr.clear).toBe("function");
    expect(typeof mgr.stats).toBe("function");
    expect(typeof mgr.entries).toBe("function");
    expect(typeof mgr.entriesByType).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

describe("register()", () => {
  it("registers a resource by key and type", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("models/Bunny.dae", "model");
    expect(mgr.has("models/Bunny.dae")).toBe(true);
  });

  it("registers multiple resources of different types", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    mgr.register("b.dae", "model");
    mgr.register("c.wav", "audio");
    expect(mgr.has("a.png")).toBe(true);
    expect(mgr.has("b.dae")).toBe(true);
    expect(mgr.has("c.wav")).toBe(true);
  });

  it("throws on empty key", () => {
    const mgr = createResourceManager(fakeLoader());
    expect(() => mgr.register("", "texture")).toThrow(/empty/i);
  });

  it("throws on duplicate key", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    expect(() => mgr.register("a.png", "texture")).toThrow(/already registered/i);
  });

  it("registered resource is not yet loaded", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    expect(mgr.getIfLoaded("a.png")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. LAZY LOADING — get()
// ═══════════════════════════════════════════════════════════════════════════

describe("get() – lazy loading", () => {
  it("first get() triggers loader and returns data", async () => {
    const data = new Uint8Array([10, 20, 30]);
    const loader = fakeLoader(data);
    const mgr = createResourceManager(loader);
    mgr.register("a.png", "texture");

    const result = await mgr.get("a.png");
    expect(result).toBe(data);
    expect(loader).toHaveBeenCalledWith("a.png");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("second get() returns cached data without calling loader", async () => {
    const loader = fakeLoader();
    const mgr = createResourceManager(loader);
    mgr.register("a.png", "texture");

    await mgr.get("a.png");
    await mgr.get("a.png");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("rejects for unregistered key", async () => {
    const mgr = createResourceManager(fakeLoader());
    await expect(mgr.get("unknown")).rejects.toThrow(/unknown/i);
  });

  it("getIfLoaded returns data after get()", async () => {
    const data = new Uint8Array([1]);
    const mgr = createResourceManager(fakeLoader(data));
    mgr.register("a.png", "texture");

    await mgr.get("a.png");
    expect(mgr.getIfLoaded("a.png")).toBe(data);
  });

  it("getIfLoaded returns null before get()", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    expect(mgr.getIfLoaded("a.png")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CACHE STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

describe("stats()", () => {
  it("initial stats are all zero", () => {
    const mgr = createResourceManager(fakeLoader());
    const s = mgr.stats();
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.evictions).toBe(0);
    expect(s.size).toBe(0);
  });

  it("miss increments on first get()", async () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    await mgr.get("a.png");
    expect(mgr.stats().misses).toBe(1);
    expect(mgr.stats().hits).toBe(0);
    expect(mgr.stats().size).toBe(1);
  });

  it("hit increments on second get()", async () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    await mgr.get("a.png");
    await mgr.get("a.png");
    expect(mgr.stats().misses).toBe(1);
    expect(mgr.stats().hits).toBe(1);
  });

  it("size tracks number of loaded entries", async () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    mgr.register("b.png", "texture");
    await mgr.get("a.png");
    expect(mgr.stats().size).toBe(1);
    await mgr.get("b.png");
    expect(mgr.stats().size).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. LRU EVICTION
// ═══════════════════════════════════════════════════════════════════════════

describe("LRU eviction", () => {
  it("evicts LRU entry when cache is full", async () => {
    const mgr = createResourceManager(fakeLoader(), { maxCacheSize: 2 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");
    mgr.register("c", "texture");

    await mgr.get("a"); // [a]
    await mgr.get("b"); // [a, b] — full
    await mgr.get("c"); // evicts a → [b, c]

    expect(mgr.getIfLoaded("a")).toBeNull();
    expect(mgr.getIfLoaded("b")).not.toBeNull();
    expect(mgr.getIfLoaded("c")).not.toBeNull();
    expect(mgr.stats().evictions).toBe(1);
  });

  it("access updates LRU order", async () => {
    const mgr = createResourceManager(fakeLoader(), { maxCacheSize: 3 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");
    mgr.register("c", "texture");
    mgr.register("d", "texture");

    await mgr.get("a"); // [a]
    await mgr.get("b"); // [a, b]
    await mgr.get("c"); // [a, b, c] — full
    await mgr.get("a"); // [b, c, a] — a moves to most-recent
    await mgr.get("d"); // evicts b (LRU) → [c, a, d]

    expect(mgr.getIfLoaded("b")).toBeNull(); // evicted
    expect(mgr.getIfLoaded("a")).not.toBeNull(); // still cached
    expect(mgr.stats().evictions).toBe(1);
  });

  it("evicted entry can be re-loaded", async () => {
    let callCount = 0;
    const loader = vi.fn(async () => {
      callCount++;
      return new Uint8Array([callCount]);
    });
    const mgr = createResourceManager(loader, { maxCacheSize: 1 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");

    await mgr.get("a"); // load a
    await mgr.get("b"); // evict a, load b
    const data = await mgr.get("a"); // re-load a, evict b

    expect(loader).toHaveBeenCalledTimes(3);
    expect(mgr.stats().evictions).toBe(2);
  });

  it("evicted entry remains registered (has returns true)", async () => {
    const mgr = createResourceManager(fakeLoader(), { maxCacheSize: 1 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");

    await mgr.get("a");
    await mgr.get("b"); // evicts a

    expect(mgr.has("a")).toBe(true);
    expect(mgr.getIfLoaded("a")).toBeNull();
  });

  it("maxCacheSize 0 means unlimited (no eviction)", async () => {
    const mgr = createResourceManager(fakeLoader(), { maxCacheSize: 0 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");
    mgr.register("c", "texture");

    await mgr.get("a");
    await mgr.get("b");
    await mgr.get("c");

    expect(mgr.stats().evictions).toBe(0);
    expect(mgr.stats().size).toBe(3);
  });

  it("negative maxCacheSize is clamped to 0 (unlimited)", async () => {
    const mgr = createResourceManager(fakeLoader(), { maxCacheSize: -5 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");

    await mgr.get("a");
    await mgr.get("b");
    expect(mgr.stats().evictions).toBe(0);
    expect(mgr.stats().size).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. CONCURRENT LOAD DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("concurrent load deduplication", () => {
  it("concurrent get() calls for same key call loader once", async () => {
    const loader = vi.fn(async () => new Uint8Array([42]));
    const mgr = createResourceManager(loader);
    mgr.register("big.dae", "model");

    const [r1, r2, r3] = await Promise.all([
      mgr.get("big.dae"),
      mgr.get("big.dae"),
      mgr.get("big.dae"),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
    expect(mgr.stats().misses).toBe(1);
  });

  it("loader rejection clears pending promise for retry", async () => {
    let attempt = 0;
    const loader = vi.fn(async () => {
      attempt++;
      if (attempt === 1) throw new Error("network error");
      return new Uint8Array([1, 2, 3]);
    });
    const mgr = createResourceManager(loader);
    mgr.register("flaky.png", "texture");

    await expect(mgr.get("flaky.png")).rejects.toThrow("network error");

    const data = await mgr.get("flaky.png");
    expect(data).toEqual(new Uint8Array([1, 2, 3]));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. remove() AND clear()
// ═══════════════════════════════════════════════════════════════════════════

describe("remove() and clear()", () => {
  it("remove returns true when entry exists", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    expect(mgr.remove("a.png")).toBe(true);
    expect(mgr.has("a.png")).toBe(false);
  });

  it("remove returns false when entry does not exist", () => {
    const mgr = createResourceManager(fakeLoader());
    expect(mgr.remove("nonexistent")).toBe(false);
  });

  it("clear removes all entries and resets stats", async () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    mgr.register("b.wav", "audio");
    await mgr.get("a.png");

    mgr.clear();

    expect(mgr.has("a.png")).toBe(false);
    expect(mgr.has("b.wav")).toBe(false);
    expect(mgr.stats().size).toBe(0);
    expect(mgr.stats().hits).toBe(0);
    expect(mgr.stats().misses).toBe(0);
    expect(mgr.stats().evictions).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. entries() AND entriesByType()
// ═══════════════════════════════════════════════════════════════════════════

describe("entries() and entriesByType()", () => {
  it("entries() returns all registered entries", async () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    mgr.register("b.dae", "model");
    mgr.register("c.wav", "audio");

    const entries = mgr.entries();
    expect(entries.length).toBe(3);
  });

  it("entry has correct shape before loading", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    const [entry] = mgr.entries();
    expect(entry.key).toBe("a.png");
    expect(entry.type).toBe("texture");
    expect(entry.data).toBeNull();
    expect(entry.loaded).toBe(false);
  });

  it("entry has data after loading", async () => {
    const data = new Uint8Array([99]);
    const mgr = createResourceManager(fakeLoader(data));
    mgr.register("a.png", "texture");
    await mgr.get("a.png");
    const [entry] = mgr.entries();
    expect(entry.loaded).toBe(true);
    expect(entry.data).toBe(data);
  });

  it("entriesByType filters correctly", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    mgr.register("b.dae", "model");
    mgr.register("c.wav", "audio");
    mgr.register("d.png", "texture");

    expect(mgr.entriesByType("texture").length).toBe(2);
    expect(mgr.entriesByType("model").length).toBe(1);
    expect(mgr.entriesByType("audio").length).toBe(1);
  });

  it("entriesByType returns empty array for unused type", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("a.png", "texture");
    expect(mgr.entriesByType("audio").length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. NO OPTIONS (DEFAULTS)
// ═══════════════════════════════════════════════════════════════════════════

describe("default options", () => {
  it("no options means unlimited cache", async () => {
    const mgr = createResourceManager(fakeLoader());
    for (let i = 0; i < 100; i++) {
      mgr.register(`r${i}`, "texture");
    }
    for (let i = 0; i < 100; i++) {
      await mgr.get(`r${i}`);
    }
    expect(mgr.stats().evictions).toBe(0);
    expect(mgr.stats().size).toBe(100);
  });
});

describe("resource catalog metadata and reference counting", () => {
  it("stores manifest-style metadata in the catalog", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.register("textures/bunny.png", "texture", {
      name: "bunny-texture",
      fileName: "bunny.png",
      format: "image/png",
      uuid: "uuid-1",
      width: 256,
      height: 128,
      provenance: "gallery",
    });

    expect(mgr.getEntry("textures/bunny.png")).toMatchObject({
      key: "textures/bunny.png",
      type: "texture",
      name: "bunny-texture",
      fileName: "bunny.png",
      format: "image/png",
      uuid: "uuid-1",
      width: 256,
      height: 128,
      metadata: {
        provenance: "gallery",
      },
    });
  });

  it("registerEntry accepts model and audio catalog entries", () => {
    const mgr = createResourceManager(fakeLoader());
    mgr.registerEntry({
      key: "models/Bunny.a3r",
      type: "model",
      name: "Bunny",
      fileName: "Bunny.a3r",
      format: "model",
      provenance: "library",
    });
    mgr.registerEntry({
      key: "audio/bounce.wav",
      type: "audio",
      name: "bounce",
      fileName: "bounce.wav",
      format: "audio/wav",
      duration: 1.25,
    });

    expect(mgr.entriesByType("model")[0].metadata.provenance).toBe("library");
    expect(mgr.entriesByType("audio")[0].duration).toBe(1.25);
  });

  it("acquire and release maintain reference counts and pin cached entries", async () => {
    const loader = vi.fn(async (key: string) => new Uint8Array([key.length]));
    const mgr = createResourceManager(loader, { maxCacheSize: 1 });
    mgr.register("a", "texture");
    mgr.register("b", "texture");

    await mgr.acquire("a");
    expect(mgr.referenceCount("a")).toBe(1);

    await mgr.get("b");
    expect(mgr.getIfLoaded("a")).not.toBeNull();
    expect(mgr.getIfLoaded("b")).not.toBeNull();
    expect(mgr.stats().pinned).toBe(1);

    expect(mgr.release("a")).toBe(0);
    expect(mgr.getIfLoaded("a")).toBeNull();
    expect(mgr.stats().size).toBe(1);
  });

  it("passes catalog metadata snapshots to the loader", async () => {
    let seenEntryKey: string | null = null;
    let seenWidth: number | null = null;
    const loader = vi.fn(async (_key: string, entry) => {
      seenEntryKey = entry?.key ?? null;
      seenWidth = entry?.width ?? null;
      return new Uint8Array([7, 8, 9]);
    });
    const mgr = createResourceManager(loader);
    mgr.register("textures/cat.png", "texture", { width: 64, height: 32 });

    await mgr.get("textures/cat.png");

    expect(seenEntryKey).toBe("textures/cat.png");
    expect(seenWidth).toBe(64);
  });
});
