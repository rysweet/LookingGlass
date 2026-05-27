import { describe, expect, it } from "vitest";
import {
  AudioClip,
  AudioManager,
  MediaTimeline,
  MusicPlayer,
  SoundEffect,
  VideoTexture,
} from "../src/multimedia.js";

function audioSource(id: string, durationMs: number) {
  return { id, url: `${id}.ogg`, durationMs };
}

describe("multimedia module", () => {
  it("audio clips load, play, pause, stop, and loop", () => {
    const clip = new AudioClip().load(audioSource("sfx", 1000));
    clip.loop = true;
    clip.play();
    clip.update(1250);
    expect(clip.state).toBe("playing");
    expect(clip.currentTimeMs).toBe(250);

    clip.pause();
    expect(clip.state).toBe("paused");
    clip.stop();
    expect(clip.state).toBe("stopped");
    expect(clip.currentTimeMs).toBe(0);
  });

  it("audio manager computes spatial attenuation and pan", () => {
    const manager = new AudioManager(10, 1);
    manager.masterVolume = 0.5;
    manager.setListenerPosition({ x: 0, y: 0, z: 0 });
    const mix = manager.calculateSpatialMix({ x: 5, y: 0, z: 0 }, 0.8);

    expect(mix.distance).toBeCloseTo(5);
    expect(mix.volume).toBeCloseTo(0.2);
    expect(mix.pan).toBeCloseTo(0.5);
  });

  it("music player crossfades between tracks", () => {
    const first = new AudioClip().load(audioSource("intro", 5000));
    const second = new AudioClip().load(audioSource("loop", 5000));
    const player = new MusicPlayer();

    player.play(first);
    player.play(second, 200);
    player.update(100);

    expect(player.isCrossfading).toBe(true);
    expect(first.volume).toBeCloseTo(0.5);
    expect(second.volume).toBeCloseTo(0.5);

    player.update(100);
    expect(player.isCrossfading).toBe(false);
    expect(player.currentClip).toBe(second);
    expect(first.state).toBe("stopped");
    expect(second.volume).toBe(1);
  });

  it("sound effects retrigger clips from the start", () => {
    const clip = new AudioClip().load(audioSource("coin", 400));
    const effect = new SoundEffect(clip, 0.75);

    effect.trigger();
    clip.update(100);
    effect.trigger(0.5);

    expect(effect.triggerCount).toBe(2);
    expect(clip.currentTimeMs).toBe(0);
    expect(clip.volume).toBeCloseTo(0.375);
    expect(clip.state).toBe("playing");
  });

  it("video textures track playback, seek, and material assignment", () => {
    const texture = new VideoTexture().load({
      id: "cutscene",
      url: "cutscene.mp4",
      durationMs: 2000,
      width: 1280,
      height: 720,
      frameRate: 20,
    });
    texture.assignToMaterial("screen-1");
    texture.play();
    texture.update(500);
    texture.seek(1000);

    expect(texture.materialId).toBe("screen-1");
    expect(texture.currentFrame).toBe(20);
    expect(texture.currentTimeMs).toBe(1000);
  });

  it("media timeline synchronizes play, seek, and callback targets", () => {
    const clip = new AudioClip().load(audioSource("voiceover", 3000));
    const texture = new VideoTexture().load({ id: "panel", url: "panel.webm", durationMs: 3000, width: 640, height: 480 });
    const events: number[] = [];
    const timeline = new MediaTimeline();
    timeline.registerTarget("audio", clip);
    timeline.registerTarget("video", texture);
    timeline.registerTarget("callback", { callback: (value) => events.push(value ?? 0) });
    timeline.addCue({ id: "play-audio", atMs: 100, target: "audio", action: "play" });
    timeline.addCue({ id: "seek-video", atMs: 200, target: "video", action: "seek", value: 1200 });
    timeline.addCue({ id: "marker", atMs: 300, target: "callback", action: "callback", value: 7 });

    timeline.update(100);
    expect(clip.state).toBe("playing");

    timeline.seek(250);
    expect(texture.currentTimeMs).toBe(1200);

    timeline.update(50);
    expect(events).toEqual([7]);
  });
});
