import { describe, expect, it } from "vitest";
import { type GroundImp, SGround, SScene, SSun } from "../src/story-api/index.js";
import {
  AtmosphereSetup,
  DefaultScene,
  GroundSetup,
  LightingSetup,
  SceneTemplate,
  WorldBuilder,
} from "../src/world-setup.js";

describe("world setup", () => {
  it("applies atmosphere and ground configuration", () => {
    const scene = new SScene("scene");
    const ground = new SGround();

    const atmosphere = new AtmosphereSetup().apply(scene, {
      fogDensity: 0.2,
      ambientColor: "#112233",
      atmosphereColor: "#445566",
      skybox: "nebula",
    });
    const groundConfig = new GroundSetup().apply(ground, {
      texture: "stone",
      color: "#AAAAAA",
      opacity: 0.8,
    });

    expect(atmosphere.skybox).toBe("nebula");
    expect(scene.fogDensity).toBeCloseTo(0.2, 6);
    expect(scene.ambientLightColor).toBe("#112233");
    expect(scene.atmosphereColor).toBe("#445566");
    expect(scene.fromBelowLightColor).toBe("nebula");

    expect(groundConfig.texture).toBe("stone");
    expect(ground.opacity).toBeCloseTo(0.8, 6);
    expect((ground.imp as GroundImp).paint.value).toBe("stone:#AAAAAA");
  });

  it("creates directional, point, and spot lights and orients the sun", () => {
    const lighting = new LightingSetup();
    const directional = lighting.directional("key", { x: 5, y: 10, z: 2 }, "#FFFFFF", 0.9, true);
    const point = lighting.point("fill", { x: -2, y: 4, z: 3 }, "#FFEEDD", 0.4, 25, false);
    const spot = lighting.spot("rim", { x: 0, y: 6, z: 8 }, { x: 0, y: 0, z: 0 }, "#CCDDEE", 0.5, Math.PI / 7, 50, true);
    const sun = new SSun();
    lighting.applySun(sun, directional);

    expect(directional.type).toBe("directional");
    expect(directional.shadows).toBe(true);
    expect(point.type).toBe("point");
    expect(point.range).toBe(25);
    expect(spot.type).toBe("spot");
    expect(spot.angle).toBeCloseTo(Math.PI / 7, 6);
    expect(sun.orientation.w).not.toBeCloseTo(1, 6);
  });

  it("builds a world from templates and overrides", () => {
    const lighting = new LightingSetup();
    const world = new WorldBuilder()
      .withTemplate("studio")
      .withAtmosphere({ skybox: "aurora" })
      .withGround({ texture: "snow" })
      .withLighting([
        lighting.directional("key", { x: 4, y: 8, z: 6 }),
        lighting.point("fill", { x: -3, y: 2, z: 1 }),
        lighting.spot("rim", { x: 0, y: 7, z: 5 }, { x: 0, y: 0, z: 0 }),
      ])
      .withCamera({ position: { x: 1, y: 2, z: 3 } })
      .build();

    expect(world.templateName).toBe("studio");
    expect(world.atmosphere.skybox).toBe("aurora");
    expect(world.groundConfig.texture).toBe("snow");
    expect(world.camera.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(world.lights).toHaveLength(3);
    expect(world.scene.name).toBe("studio");
  });

  it("provides predefined scene templates and a default scene", () => {
    expect(SceneTemplate.standard().lights).toHaveLength(3);
    expect(SceneTemplate.sunset().atmosphere.skybox).toBe("sunset-glow");
    expect(SceneTemplate.studio().ground.texture).toBe("matte-floor");
    expect(() => SceneTemplate.named("unknown")).toThrow(/unknown scene template/);

    const world = DefaultScene.create();
    expect(world.templateName).toBe("standard");
    expect(world.groundConfig.texture).toBe("grass");
    expect(world.scene).toBeInstanceOf(SScene);
  });
});
