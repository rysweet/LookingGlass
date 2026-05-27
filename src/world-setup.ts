import {
  type GroundImp,
  IDENTITY_ORIENTATION,
  type Orientation,
  type Position,
  SCamera,
  SGround,
  SScene,
  SSun,
} from "./story-api";
import { orientationFromLookDirection } from "./story-api/expanded-math";

export type LightKind = "directional" | "point" | "spot";

export interface AtmosphereConfig {
  readonly fogDensity: number;
  readonly ambientColor: string;
  readonly atmosphereColor: string;
  readonly skybox: string | null;
}

export interface GroundConfig {
  readonly texture: string;
  readonly color: string;
  readonly opacity: number;
}

export interface LightConfig {
  readonly name: string;
  readonly type: LightKind;
  readonly color: string;
  readonly intensity: number;
  readonly position: Position;
  readonly target: Position;
  readonly angle: number;
  readonly range: number;
  readonly shadows: boolean;
}

export interface CameraConfig {
  readonly position: Position;
  readonly orientation: Orientation;
}

export interface SceneConfiguration {
  readonly name: string;
  readonly atmosphere: AtmosphereConfig;
  readonly ground: GroundConfig;
  readonly camera: CameraConfig;
  readonly lights: readonly LightConfig[];
}

export interface WorldState {
  readonly scene: SScene;
  readonly ground: SGround;
  readonly camera: SCamera;
  readonly sun: SSun;
  readonly atmosphere: AtmosphereConfig;
  readonly groundConfig: GroundConfig;
  readonly lights: readonly LightConfig[];
  readonly templateName: string;
}

function clonePosition(value: Position): Position {
  return { x: value.x, y: value.y, z: value.z };
}

function cloneOrientation(value: Orientation): Orientation {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}

function cloneAtmosphere(value: AtmosphereConfig): AtmosphereConfig {
  return { ...value };
}

function cloneGround(value: GroundConfig): GroundConfig {
  return { ...value };
}

function cloneLight(value: LightConfig): LightConfig {
  return {
    ...value,
    position: clonePosition(value.position),
    target: clonePosition(value.target),
  };
}

function cloneCamera(value: CameraConfig): CameraConfig {
  return {
    position: clonePosition(value.position),
    orientation: cloneOrientation(value.orientation),
  };
}

const STANDARD_TEMPLATE: SceneConfiguration = {
  name: "standard",
  atmosphere: {
    fogDensity: 0.01,
    ambientColor: "#DDEEFF",
    atmosphereColor: "#87CEEB",
    skybox: "clear-sky",
  },
  ground: {
    texture: "grass",
    color: "#5C8C3B",
    opacity: 1,
  },
  camera: {
    position: { x: 0, y: 5, z: 20 },
    orientation: IDENTITY_ORIENTATION,
  },
  lights: [
    { name: "sun", type: "directional", color: "#FFFFFF", intensity: 0.9, position: { x: 8, y: 12, z: 6 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, range: 100, shadows: true },
    { name: "fill", type: "point", color: "#FFD9B3", intensity: 0.5, position: { x: -4, y: 4, z: 4 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 2, range: 40, shadows: true },
    { name: "rim", type: "spot", color: "#E6F1FF", intensity: 0.35, position: { x: 0, y: 8, z: 12 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 6, range: 60, shadows: true },
  ],
};

const SUNSET_TEMPLATE: SceneConfiguration = {
  name: "sunset",
  atmosphere: {
    fogDensity: 0.02,
    ambientColor: "#FFCCAA",
    atmosphereColor: "#FF9966",
    skybox: "sunset-glow",
  },
  ground: {
    texture: "sand",
    color: "#C9A26B",
    opacity: 1,
  },
  camera: {
    position: { x: 4, y: 6, z: 18 },
    orientation: IDENTITY_ORIENTATION,
  },
  lights: [
    { name: "sunset-key", type: "directional", color: "#FFB347", intensity: 1, position: { x: 10, y: 6, z: 4 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, range: 120, shadows: true },
    { name: "warm-fill", type: "point", color: "#FFD7A1", intensity: 0.4, position: { x: -3, y: 3, z: 6 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 2, range: 30, shadows: false },
    { name: "sunset-rim", type: "spot", color: "#FFE9D6", intensity: 0.3, position: { x: 0, y: 9, z: 10 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 5, range: 45, shadows: true },
  ],
};

const STUDIO_TEMPLATE: SceneConfiguration = {
  name: "studio",
  atmosphere: {
    fogDensity: 0,
    ambientColor: "#FFFFFF",
    atmosphereColor: "#F4F6F8",
    skybox: null,
  },
  ground: {
    texture: "matte-floor",
    color: "#D8DCE2",
    opacity: 0.95,
  },
  camera: {
    position: { x: 0, y: 4, z: 14 },
    orientation: IDENTITY_ORIENTATION,
  },
  lights: [
    { name: "studio-key", type: "directional", color: "#FFFFFF", intensity: 0.8, position: { x: 4, y: 10, z: 8 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, range: 100, shadows: true },
    { name: "studio-fill", type: "point", color: "#F8FBFF", intensity: 0.6, position: { x: -5, y: 6, z: 4 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 2, range: 35, shadows: false },
    { name: "studio-spot", type: "spot", color: "#FFFFFF", intensity: 0.5, position: { x: 0, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 8, range: 30, shadows: true },
  ],
};

export class AtmosphereSetup {
  apply(scene: SScene, config: AtmosphereConfig): AtmosphereConfig {
    const applied = cloneAtmosphere(config);
    scene.fogDensity = applied.fogDensity;
    scene.ambientLightColor = applied.ambientColor;
    scene.atmosphereColor = applied.atmosphereColor;
    scene.fromAboveLightColor = applied.ambientColor;
    scene.fromBelowLightColor = applied.skybox;
    return applied;
  }
}

export class GroundSetup {
  apply(ground: SGround, config: GroundConfig): GroundConfig {
    const applied = cloneGround(config);
    ground.opacity = applied.opacity;
    const groundImp = ground.imp as GroundImp;
    groundImp.paint.value = `${applied.texture}:${applied.color}`;
    return applied;
  }
}

export class LightingSetup {
  directional(name: string, position: Position, color = "#FFFFFF", intensity = 1, shadows = true): LightConfig {
    return { name, type: "directional", color, intensity, position: clonePosition(position), target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, range: 100, shadows };
  }

  point(name: string, position: Position, color = "#FFFFFF", intensity = 0.5, range = 30, shadows = false): LightConfig {
    return { name, type: "point", color, intensity, position: clonePosition(position), target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 2, range, shadows };
  }

  spot(name: string, position: Position, target: Position, color = "#FFFFFF", intensity = 0.5, angle = Math.PI / 6, range = 40, shadows = true): LightConfig {
    return { name, type: "spot", color, intensity, position: clonePosition(position), target: clonePosition(target), angle, range, shadows };
  }

  applySun(sun: SSun, directionalLight: LightConfig): void {
    sun.orientation = orientationFromLookDirection({
      x: directionalLight.target.x - directionalLight.position.x,
      y: directionalLight.target.y - directionalLight.position.y,
      z: directionalLight.target.z - directionalLight.position.z,
    });
  }
}

export class SceneTemplate {
  static standard(): SceneConfiguration {
    return {
      name: STANDARD_TEMPLATE.name,
      atmosphere: cloneAtmosphere(STANDARD_TEMPLATE.atmosphere),
      ground: cloneGround(STANDARD_TEMPLATE.ground),
      camera: cloneCamera(STANDARD_TEMPLATE.camera),
      lights: STANDARD_TEMPLATE.lights.map(cloneLight),
    };
  }

  static sunset(): SceneConfiguration {
    return {
      name: SUNSET_TEMPLATE.name,
      atmosphere: cloneAtmosphere(SUNSET_TEMPLATE.atmosphere),
      ground: cloneGround(SUNSET_TEMPLATE.ground),
      camera: cloneCamera(SUNSET_TEMPLATE.camera),
      lights: SUNSET_TEMPLATE.lights.map(cloneLight),
    };
  }

  static studio(): SceneConfiguration {
    return {
      name: STUDIO_TEMPLATE.name,
      atmosphere: cloneAtmosphere(STUDIO_TEMPLATE.atmosphere),
      ground: cloneGround(STUDIO_TEMPLATE.ground),
      camera: cloneCamera(STUDIO_TEMPLATE.camera),
      lights: STUDIO_TEMPLATE.lights.map(cloneLight),
    };
  }

  static named(name: string): SceneConfiguration {
    switch (name) {
      case "standard":
        return this.standard();
      case "sunset":
        return this.sunset();
      case "studio":
        return this.studio();
      default:
        throw new TypeError(`unknown scene template: ${name}`);
    }
  }
}

export class WorldBuilder {
  #template = SceneTemplate.standard();

  withTemplate(template: SceneConfiguration | string): this {
    this.#template = typeof template === "string"
      ? SceneTemplate.named(template)
      : {
        name: template.name,
        atmosphere: cloneAtmosphere(template.atmosphere),
        ground: cloneGround(template.ground),
        camera: cloneCamera(template.camera),
        lights: template.lights.map(cloneLight),
      };
    return this;
  }

  withAtmosphere(config: Partial<AtmosphereConfig>): this {
    this.#template = {
      ...this.#template,
      atmosphere: {
        ...this.#template.atmosphere,
        ...config,
      },
    };
    return this;
  }

  withGround(config: Partial<GroundConfig>): this {
    this.#template = {
      ...this.#template,
      ground: {
        ...this.#template.ground,
        ...config,
      },
    };
    return this;
  }

  withLighting(lights: readonly LightConfig[]): this {
    this.#template = {
      ...this.#template,
      lights: lights.map(cloneLight),
    };
    return this;
  }

  withCamera(camera: Partial<CameraConfig>): this {
    this.#template = {
      ...this.#template,
      camera: {
        position: camera.position ? clonePosition(camera.position) : clonePosition(this.#template.camera.position),
        orientation: camera.orientation ? cloneOrientation(camera.orientation) : cloneOrientation(this.#template.camera.orientation),
      },
    };
    return this;
  }

  build(): WorldState {
    const scene = new SScene(this.#template.name);
    const ground = new SGround();
    const camera = new SCamera();
    const sun = new SSun();

    const atmosphere = new AtmosphereSetup().apply(scene, this.#template.atmosphere);
    const groundConfig = new GroundSetup().apply(ground, this.#template.ground);
    camera.position = clonePosition(this.#template.camera.position);
    camera.orientation = cloneOrientation(this.#template.camera.orientation);
    const lights = this.#template.lights.map(cloneLight);
    const directional = lights.find((light) => light.type === "directional");
    if (directional) {
      new LightingSetup().applySun(sun, directional);
    }

    return {
      scene,
      ground,
      camera,
      sun,
      atmosphere,
      groundConfig,
      lights,
      templateName: this.#template.name,
    };
  }
}

export class DefaultScene {
  static create(): WorldState {
    return new WorldBuilder().withTemplate(SceneTemplate.standard()).build();
  }
}
