import { describe, expect, it } from "vitest";
import {
  AudioPlayer,
  SoundGroup,
  SoundResourceManager,
  type AudioResource,
} from "../src/audio.js";

function makeResource(overrides?: Partial<AudioResource>): AudioResource {
  return {
    id: "laser",
    name: "laser.wav",
    buffer: new ArrayBuffer(16),
    duration: 2,
    format: "wav",
    ...overrides,
  };
}

describe("SoundResourceManager", () => {
  it("registers, replaces, lists, and removes resources", () => {
    const manager = new SoundResourceManager();
    const laser = makeResource();
    const boom = makeResource({ id: "boom", name: "boom.mp3", format: "mp3" });

    manager.register(laser);
    manager.registerAll([boom, makeResource({ id: "laser", name: "laser-2.wav" })]);

    expect(manager.size).toBe(2);
    expect(manager.get("laser")?.name).toBe("laser-2.wav");
    expect(manager.list().map((resource) => resource.id).sort()).toEqual(["boom", "laser"]);
    expect(manager.remove("boom")).toBe(true);
    expect(manager.has("boom")).toBe(false);
  });
});

describe("AudioPlayer pan and spatial audio", () => {
  it("clamps pan and computes spatial mix from source/listener positions", () => {
    const player = new AudioPlayer();
    player.pan = 2;
    expect(player.pan).toBe(1);

    player.configureSpatialAudio({
      sourcePosition: { x: 4, y: 0, z: 0 },
      listenerPosition: { x: 0, y: 0, z: 0 },
      maxDistance: 8,
    });

    expect(player.getSpatialMix()).toEqual({
      distance: 4,
      volume: 0.5,
      pan: 0.5,
    });
    expect(player.effectivePan).toBe(1);
  });

  it("allows spatial audio to be disabled back to a neutral mix", () => {
    const player = new AudioPlayer();
    player.setSourcePosition({ x: 5, y: 0, z: 0 });
    player.setListenerPosition({ x: 0, y: 0, z: 0 });
    expect(player.spatialEnabled).toBe(true);

    player.disableSpatialAudio();

    expect(player.spatialEnabled).toBe(false);
    expect(player.getSpatialMix()).toEqual({ distance: 0, volume: 1, pan: 0 });
  });
});

describe("AudioPlayer resource loading and group management", () => {
  it("loads resources by id and combines group + spatial gain", () => {
    const manager = new SoundResourceManager();
    manager.register(makeResource());

    const player = new AudioPlayer();
    player.loadFromManager(manager, "laser");
    player.volume = 0.8;
    player.configureSpatialAudio({
      sourcePosition: { x: 0, y: 0, z: 5 },
      listenerPosition: { x: 0, y: 0, z: 0 },
      maxDistance: 10,
    });

    const group = new SoundGroup("effects");
    group.volume = 0.5;
    group.addPlayer(player);

    expect(player.resource?.id).toBe("laser");
    expect(player.group).toBe(group);
    expect(player.effectiveVolume).toBeCloseTo(0.2, 10);
  });

  it("propagates stopAll and mute across grouped players", () => {
    const group = new SoundGroup("ambience");
    const one = new AudioPlayer();
    const two = new AudioPlayer();
    one.load(makeResource({ id: "one" }));
    two.load(makeResource({ id: "two" }));
    one.play();
    two.play();

    group.addPlayer(one);
    group.addPlayer(two);
    group.muted = true;
    group.stopAll();

    expect(group.hasPlayer(one)).toBe(true);
    expect(group.hasPlayer(two)).toBe(true);
    expect(one.state).toBe("stopped");
    expect(two.state).toBe("stopped");
    expect(one.effectiveVolume).toBe(0);
    expect(two.effectiveVolume).toBe(0);

    group.removePlayer(two);
    expect(two.group).toBeNull();
  });

  it("throws when loading a missing managed resource", () => {
    const player = new AudioPlayer();
    expect(() => player.loadFromManager(new SoundResourceManager(), "missing")).toThrow(
      "Audio resource not found: missing",
    );
  });
});
