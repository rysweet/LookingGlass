import { describe, expect, it } from "vitest";
import {
  AudioResource,
  ImageResource,
  LazyResource,
  ModelResource,
  ResourceBundle,
  ResourceManager,
  ResourceManifest,
} from "../src/resource-system.js";

describe("resource-system", () => {
  it("groups image audio and model resources into bundles and manifests", () => {
    const bark = new AudioResource("bark", "Dog Bark", 1.5, "wav", false, ["effect"]);
    const fur = new ImageResource("fur", "Fur Texture", 1024, 512, "texture", ["coat"]);
    const dog = new ModelResource("dog", "Dog", ["root", "tail"], ["animal"])
      .addJoint("head")
      .addAnimation("wagTail")
      .attachTexture("body", fur);
    const bundle = new ResourceBundle("pets", "Pets")
      .add(bark)
      .add(fur)
      .add(dog);
    const manifest = new ResourceManifest().registerBundle(bundle);

    expect(bark.playbackFrames(48_000)).toBe(72_000);
    expect(fur.aspectRatio).toBe(2);
    expect(dog.joints).toEqual(["root", "tail", "head"]);
    expect(dog.animations).toEqual(["wagTail"]);
    expect(dog.textures.get("body")).toBe(fur);
    expect(bundle.list("image").map((resource) => resource.id)).toEqual(["fur"]);
    expect(manifest.listBundleIds()).toEqual(["pets"]);
    expect(manifest.listResources("model").map((resource) => resource.id)).toEqual(["dog"]);
    expect(manifest.findResource("bark")).toBe(bark);
  });

  it("loads lazy resources through the manager and caches the resolved instance", async () => {
    const gallery = new ResourceBundle("gallery", "Gallery");
    const manager = new ResourceManager([gallery]);
    const placeholder = new ModelResource("dragon", "Dragon (placeholder)", ["root"]);
    const lazyDragon = new LazyResource(placeholder, async () => new ModelResource("dragon", "Dragon", ["root", "jaw"])
      .addAnimation("roar"));

    manager.registerLazyResource("gallery", lazyDragon);

    expect(manager.getResource("dragon")?.name).toBe("Dragon (placeholder)");
    const firstLoad = await manager.load("dragon");
    const secondLoad = await manager.load("dragon");

    expect(firstLoad).toBe(secondLoad);
    expect(firstLoad).toBeInstanceOf(ModelResource);
    expect((firstLoad as ModelResource).animations).toEqual(["roar"]);
    expect(lazyDragon.loadCount).toBe(1);
    expect(manager.cacheSize).toBe(1);
    expect(manager.manifest.findResource("dragon")).toBe(firstLoad);
  });

  it("preloads bundles and resets lazy entries back to placeholders when clearing cache", async () => {
    const gallery = new ResourceBundle("gallery", "Gallery").add(new AudioResource("theme", "Theme", 10, "mp3", true));
    const manager = new ResourceManager([gallery]);
    const placeholderIcon = new ImageResource("icon", "Placeholder Icon", 32, 32, "icon");
    const lazyIcon = new LazyResource(placeholderIcon, () => new ImageResource("icon", "Full Icon", 128, 128, "icon"));

    manager.registerLazyResource("gallery", lazyIcon);

    const preloaded = await manager.preloadBundle("gallery");

    expect(preloaded.map((resource) => resource.name).sort()).toEqual(["Full Icon", "Theme"]);
    expect(manager.requireResource("icon").name).toBe("Full Icon");

    manager.clearCache();

    expect(manager.getResource("icon")?.name).toBe("Placeholder Icon");
    expect(lazyIcon.isLoaded).toBe(false);
    expect(manager.getResource("theme")?.name).toBe("Theme");
    expect(manager.cacheSize).toBe(1);
  });
});
