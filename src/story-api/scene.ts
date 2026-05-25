export * from "./expanded-scene";

import { Scene } from "./expanded-scene";
import type { SThing } from "./expanded-entities";

export interface SceneEnvironmentOptions {
  readonly atmosphereColor?: string;
  readonly fogDensity?: number;
  readonly ambientLightColor?: string;
  readonly fromAboveLightColor?: string;
  readonly fromBelowLightColor?: string;
}

export interface SceneSnapshot extends SceneEnvironmentOptions {
  readonly entityNames: string[];
  readonly fogDensity: number;
  readonly isActive: boolean;
}

export function applySceneEnvironment(
  scene: Scene,
  options: SceneEnvironmentOptions,
): Scene {
  if (options.atmosphereColor !== undefined) {
    scene.setAtmosphereColor(options.atmosphereColor);
  }
  if (options.fogDensity !== undefined) {
    scene.setFogDensity(options.fogDensity);
  }
  if (options.ambientLightColor !== undefined) {
    scene.setAmbientLightColor(options.ambientLightColor);
  }
  if (options.fromAboveLightColor !== undefined) {
    scene.setFromAboveLightColor(options.fromAboveLightColor);
  }
  if (options.fromBelowLightColor !== undefined) {
    scene.setFromBelowLightColor(options.fromBelowLightColor);
  }
  return scene;
}

export function snapshotScene(scene: Scene): SceneSnapshot {
  return {
    entityNames: Array.from(scene.entities.keys()),
    isActive: scene.isActive,
    atmosphereColor: scene.getAtmosphereColor(),
    fogDensity: scene.getFogDensity(),
    ambientLightColor: scene.getAmbientLightColor(),
    fromAboveLightColor: scene.getFromAboveLightColor(),
    fromBelowLightColor: scene.getFromBelowLightColor(),
  };
}

export function requireSceneEntity<T extends SThing>(
  scene: Scene,
  name: string,
  ctor?: new (...args: any[]) => T,
): T {
  const entity = scene.getEntity(name);
  if (!entity) {
    throw new TypeError(`entity "${name}" not found`);
  }
  if (ctor && !(entity instanceof ctor)) {
    throw new TypeError(`entity "${name}" is not a ${ctor.name}`);
  }
  return entity as T;
}
