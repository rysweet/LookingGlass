// Outside-in scenario 1: Simple user-perspective test of new modules
import { describe, it, expect } from "vitest";
import { AudioPlayer, type AudioResource } from "../src/audio.js";
import { SceneManager } from "../src/scene-manager.js";

describe("Outside-In Scenario 1: Simple user perspective", () => {
  it("AudioPlayer full lifecycle: load → play → pause → stop", () => {
    const player = new AudioPlayer();
    expect(player.state).toBe("stopped");

    const res: AudioResource = {
      id: "test", name: "bell.mp3",
      buffer: new ArrayBuffer(100), duration: 2.5, format: "mp3",
    };
    player.load(res);
    expect(player.state).toBe("stopped");
    expect(player.resource?.name).toBe("bell.mp3");

    player.play();
    expect(player.state).toBe("playing");

    player.pause();
    expect(player.state).toBe("paused");

    player.stop();
    expect(player.state).toBe("stopped");
  });

  it("AudioPlayer volume clamps to [0, 1]", () => {
    const player = new AudioPlayer();
    player.volume = 1.5;
    expect(player.volume).toBe(1.0);
    player.volume = -0.5;
    expect(player.volume).toBe(0.0);
    player.volume = 0.5;
    expect(player.volume).toBe(0.5);
  });

  it("AudioPlayer throws on play without resource", () => {
    const player = new AudioPlayer();
    expect(() => player.play()).toThrow("no audio resource loaded");
  });

  it("SceneManager starts empty", () => {
    const mgr = new SceneManager();
    expect(mgr.sceneCount).toBe(0);
    expect(mgr.activeSceneName).toBeNull();
    expect(mgr.sceneNames).toEqual([]);
    expect(mgr.getActiveScene()).toBeNull();
  });

  it("SceneManager setActive throws for non-existent scene", () => {
    const mgr = new SceneManager();
    expect(() => mgr.setActive("nope")).toThrow('does not exist');
  });

  it("SceneManager removeScene returns false for non-existent", () => {
    const mgr = new SceneManager();
    expect(mgr.removeScene("nope")).toBe(false);
  });
});
