import type { Vec3 } from "./story-api/types";

export type AudioClipState = "idle" | "playing" | "paused" | "stopped";
export type VideoTextureState = "idle" | "playing" | "paused" | "stopped";
export type TimelineAction = "play" | "pause" | "stop" | "seek" | "callback";

export interface AudioSource {
  readonly id: string;
  readonly url: string;
  readonly durationMs: number;
}

export interface SpatialMix {
  readonly volume: number;
  readonly pan: number;
  readonly distance: number;
}

export interface VideoSource {
  readonly id: string;
  readonly url: string;
  readonly durationMs: number;
  readonly width: number;
  readonly height: number;
  readonly frameRate?: number;
}

export interface TimelineCue {
  readonly id: string;
  readonly atMs: number;
  readonly target: string;
  readonly action: TimelineAction;
  readonly value?: number;
}

export interface TimelineTarget {
  play?(): void;
  pause?(): void;
  stop?(): void;
  seek?(ms: number): void;
  callback?(value?: number): void;
}

const ZERO_VEC3: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(left: Vec3, right: Vec3): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  const dz = left.z - right.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function cloneVec3(value: Vec3): Vec3 {
  return { x: value.x, y: value.y, z: value.z };
}

function ensureFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite`);
  }
}

export class AudioClip {
  private _source: AudioSource | null = null;
  private _state: AudioClipState = "idle";
  private _currentTimeMs = 0;
  private _loop = false;
  private _volume = 1;
  private _pan = 0;

  get source(): AudioSource | null {
    return this._source;
  }

  get state(): AudioClipState {
    return this._state;
  }

  get currentTimeMs(): number {
    return this._currentTimeMs;
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = clamp(value, 0, 1);
  }

  get pan(): number {
    return this._pan;
  }

  set pan(value: number) {
    this._pan = clamp(value, -1, 1);
  }

  load(source: AudioSource): this {
    ensureFinite(source.durationMs, "durationMs");
    this._source = { ...source };
    this._state = "stopped";
    this._currentTimeMs = 0;
    return this;
  }

  play(): void {
    if (!this._source) {
      throw new Error("Cannot play without a loaded source");
    }
    this._state = "playing";
  }

  pause(): void {
    if (this._state === "playing") {
      this._state = "paused";
    }
  }

  stop(): void {
    if (this._source) {
      this._state = "stopped";
    }
    this._currentTimeMs = 0;
  }

  seek(timeMs: number): void {
    ensureFinite(timeMs, "timeMs");
    if (!this._source) {
      this._currentTimeMs = 0;
      return;
    }
    this._currentTimeMs = clamp(timeMs, 0, this._source.durationMs);
  }

  update(deltaMs: number): void {
    if (this._state !== "playing" || !this._source || !Number.isFinite(deltaMs) || deltaMs < 0) {
      return;
    }
    this._currentTimeMs += deltaMs;
    if (this._currentTimeMs < this._source.durationMs) {
      return;
    }
    if (this._loop && this._source.durationMs > 0) {
      this._currentTimeMs %= this._source.durationMs;
      return;
    }
    this._currentTimeMs = this._source.durationMs;
    this._state = "stopped";
  }
}

export class AudioManager {
  private readonly clips = new Map<string, AudioClip>();
  private _listenerPosition: Vec3 = ZERO_VEC3;
  private _masterVolume = 1;

  constructor(
    readonly maxDistance = 24,
    readonly rolloff = 1,
  ) {}

  get listenerPosition(): Vec3 {
    return cloneVec3(this._listenerPosition);
  }

  get masterVolume(): number {
    return this._masterVolume;
  }

  set masterVolume(value: number) {
    this._masterVolume = clamp(value, 0, 1);
  }

  registerClip(id: string, clip: AudioClip): void {
    this.clips.set(id, clip);
  }

  getClip(id: string): AudioClip | undefined {
    return this.clips.get(id);
  }

  setListenerPosition(position: Vec3): void {
    this._listenerPosition = cloneVec3(position);
  }

  calculateSpatialMix(sourcePosition: Vec3, baseVolume = 1): SpatialMix {
    const totalDistance = distance(this._listenerPosition, sourcePosition);
    const attenuation = Math.pow(clamp(1 - totalDistance / this.maxDistance, 0, 1), this.rolloff);
    const pan = clamp((sourcePosition.x - this._listenerPosition.x) / this.maxDistance, -1, 1);
    return {
      volume: clamp(baseVolume * this._masterVolume * attenuation, 0, 1),
      pan,
      distance: totalDistance,
    };
  }

  update(deltaMs: number): void {
    for (const clip of this.clips.values()) {
      clip.update(deltaMs);
    }
  }
}

export class MusicPlayer {
  private _current: AudioClip | null = null;
  private _incoming: AudioClip | null = null;
  private _crossfadeDurationMs = 0;
  private _crossfadeElapsedMs = 0;

  get currentClip(): AudioClip | null {
    return this._current;
  }

  get incomingClip(): AudioClip | null {
    return this._incoming;
  }

  get isCrossfading(): boolean {
    return this._incoming !== null;
  }

  play(clip: AudioClip, crossfadeDurationMs = 0): void {
    ensureFinite(crossfadeDurationMs, "crossfadeDurationMs");
    if (!this._current || this._current === clip || crossfadeDurationMs <= 0) {
      this._current?.stop();
      this._current = clip;
      this._incoming = null;
      this._crossfadeDurationMs = 0;
      this._crossfadeElapsedMs = 0;
      clip.volume = 1;
      clip.play();
      return;
    }
    this._incoming = clip;
    this._crossfadeDurationMs = crossfadeDurationMs;
    this._crossfadeElapsedMs = 0;
    clip.stop();
    clip.volume = 0;
    clip.play();
  }

  update(deltaMs: number): void {
    this._current?.update(deltaMs);
    this._incoming?.update(deltaMs);
    if (!this._incoming || !this._current || this._crossfadeDurationMs <= 0) {
      return;
    }
    this._crossfadeElapsedMs = clamp(this._crossfadeElapsedMs + deltaMs, 0, this._crossfadeDurationMs);
    const portion = this._crossfadeElapsedMs / this._crossfadeDurationMs;
    this._current.volume = 1 - portion;
    this._incoming.volume = portion;
    if (portion >= 1) {
      this._current.stop();
      this._current = this._incoming;
      this._incoming = null;
      this._crossfadeDurationMs = 0;
      this._crossfadeElapsedMs = 0;
      this._current.volume = 1;
    }
  }
}

export class SoundEffect {
  private _triggerCount = 0;

  constructor(
    readonly clip: AudioClip,
    readonly baseVolume = 1,
  ) {}

  get triggerCount(): number {
    return this._triggerCount;
  }

  trigger(volumeScale = 1): void {
    this.clip.stop();
    this.clip.volume = clamp(this.baseVolume * volumeScale, 0, 1);
    this.clip.play();
    this._triggerCount += 1;
  }
}

export class VideoTexture {
  private _source: VideoSource | null = null;
  private _state: VideoTextureState = "idle";
  private _currentTimeMs = 0;
  private _loop = false;
  private _materialId: string | null = null;

  get source(): VideoSource | null {
    return this._source;
  }

  get state(): VideoTextureState {
    return this._state;
  }

  get currentTimeMs(): number {
    return this._currentTimeMs;
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
  }

  get materialId(): string | null {
    return this._materialId;
  }

  get currentFrame(): number {
    if (!this._source) {
      return 0;
    }
    const fps = this._source.frameRate ?? 30;
    return Math.floor((this._currentTimeMs / 1000) * fps);
  }

  load(source: VideoSource): this {
    ensureFinite(source.durationMs, "durationMs");
    this._source = { ...source };
    this._state = "stopped";
    this._currentTimeMs = 0;
    return this;
  }

  assignToMaterial(materialId: string): void {
    this._materialId = materialId;
  }

  play(): void {
    if (!this._source) {
      throw new Error("Cannot play without a loaded video source");
    }
    this._state = "playing";
  }

  pause(): void {
    if (this._state === "playing") {
      this._state = "paused";
    }
  }

  stop(): void {
    if (this._source) {
      this._state = "stopped";
    }
    this._currentTimeMs = 0;
  }

  seek(timeMs: number): void {
    ensureFinite(timeMs, "timeMs");
    if (!this._source) {
      this._currentTimeMs = 0;
      return;
    }
    this._currentTimeMs = clamp(timeMs, 0, this._source.durationMs);
  }

  update(deltaMs: number): void {
    if (this._state !== "playing" || !this._source || !Number.isFinite(deltaMs) || deltaMs < 0) {
      return;
    }
    this._currentTimeMs += deltaMs;
    if (this._currentTimeMs < this._source.durationMs) {
      return;
    }
    if (this._loop && this._source.durationMs > 0) {
      this._currentTimeMs %= this._source.durationMs;
      return;
    }
    this._currentTimeMs = this._source.durationMs;
    this._state = "stopped";
  }
}

export class MediaTimeline {
  private readonly targets = new Map<string, TimelineTarget>();
  private readonly cues: TimelineCue[] = [];
  private readonly fired = new Set<string>();
  private _elapsedMs = 0;

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  registerTarget(id: string, target: TimelineTarget): void {
    this.targets.set(id, target);
  }

  addCue(cue: TimelineCue): void {
    ensureFinite(cue.atMs, "atMs");
    this.cues.push({ ...cue });
    this.cues.sort((left, right) => left.atMs - right.atMs || left.id.localeCompare(right.id));
  }

  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      return;
    }
    this._elapsedMs += deltaMs;
    this.executeDueCues();
  }

  seek(timeMs: number): void {
    ensureFinite(timeMs, "timeMs");
    this._elapsedMs = Math.max(0, timeMs);
    this.fired.clear();
    this.executeDueCues();
  }

  reset(): void {
    this._elapsedMs = 0;
    this.fired.clear();
  }

  private executeDueCues(): void {
    for (const cue of this.cues) {
      if (cue.atMs > this._elapsedMs || this.fired.has(cue.id)) {
        continue;
      }
      const target = this.targets.get(cue.target);
      if (!target) {
        continue;
      }
      switch (cue.action) {
        case "play":
          target.play?.();
          break;
        case "pause":
          target.pause?.();
          break;
        case "stop":
          target.stop?.();
          break;
        case "seek":
          target.seek?.(cue.value ?? cue.atMs);
          break;
        case "callback":
          target.callback?.(cue.value);
          break;
      }
      this.fired.add(cue.id);
    }
  }
}
