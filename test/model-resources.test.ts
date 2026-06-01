import { describe, expect, it } from "vitest";
import { createMaterialDefinition } from "../src/materials";
import {
  enumToCamelCase,
  getArrayEntries,
  getThumbnailResourceFileName,
  getTextureResourceFileName,
  getVisualResourceFileNameFromModelName,
  makeCodeReadyJointDefinitions,
  makeEnumName,
  MODEL_CLASS_DATA,
  ModelResourceCatalog,
} from "../src/model-resources";
import {
  BipedResource,
  FlyerResource,
  QuadrupedResource,
  SwimmerResource,
  FishResource,
  MarineMammalResource,
  SlithererResource,
  PropResource,
  AutomobileResource,
  AircraftResource,
  WatercraftResource,
  TrainResource,
} from "../src/model-resources";

describe("model resources", () => {
  it("builds resource filenames using Alice naming rules", () => {
    expect(enumToCamelCase("HELLO_WORLD")).toBe("HelloWorld");
    expect(makeEnumName("HelloWorld")).toBe("HELLO_WORLD");
    expect(getThumbnailResourceFileName("MyModel", "RED")).toBe("mymodel_RED.png");
    expect(getThumbnailResourceFileName("MyModel", "DEFAULT")).toBe("mymodel.png");
    expect(getThumbnailResourceFileName("MyModel", null)).toBe("mymodel_cls.png");
    expect(getTextureResourceFileName("MyModel", "RED")).toBe("mymodel_RED.a3t");
    expect(getVisualResourceFileNameFromModelName("MyModel")).toBe("mymodel.a3r");
  });

  it("orders joint trees and groups joint arrays", () => {
    const ordered = makeCodeReadyJointDefinitions([
      { name: "ROOT", parentName: null },
      { name: "SPINE", parentName: "ROOT" },
      { name: "WING_02", parentName: "SPINE" },
      { name: "WING_01", parentName: "SPINE" },
    ], true);
    const arrays = getArrayEntries(ordered.map((joint) => joint.name));

    expect(ordered[0]).toEqual({ name: "SPINE", parentName: null });
    expect(ordered.slice(1).map((joint) => joint.name).sort()).toEqual(["WING_01", "WING_02"]);
    expect(arrays).toEqual({ WING: ["WING_01", "WING_02"] });
  });

  it("discovers resources by category, builds a browser tree, and caches loads", async () => {
    let loads = 0;
    const catalog = new ModelResourceCatalog([
      {
        id: "animals/eagle",
        name: "Eagle",
        modelName: "Eagle",
        category: "animals",
        modelClass: "FLYER",
        tags: ["bird", "flying"],
        treePath: ["Animals", "Birds"],
        classInfo: {
          joints: [
            { name: "ROOT", parentName: null },
            { name: "SPINE", parentName: "ROOT" },
            { name: "WING_01", parentName: "SPINE" },
            { name: "WING_02", parentName: "SPINE" },
          ],
          removeRootJoints: true,
        },
        loader: async () => {
          loads += 1;
          return {
            geometry: {
              vertices: [-1, 0, -1, 1, 0, -1, 0, 2, 1],
              indices: [0, 1, 2],
            },
            materials: [createMaterialDefinition({ diffuseColor: 0xffcc00 })],
            textures: { feather: new Uint8Array([1, 2, 3, 4]) },
          };
        },
      },
      {
        id: "props/tree",
        name: "Tree",
        modelName: "Tree",
        category: "props",
        modelClass: "PROP",
        geometry: {
          vertices: [-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 3, 0.5],
          indices: [0, 1, 2],
        },
      },
    ]);

    expect(catalog.byCategory("animals").map((resource) => resource.name)).toEqual(["Eagle"]);
    expect(catalog.discover({ tags: ["bird"], query: "eag" }).map((resource) => resource.id)).toEqual([
      "animals/eagle",
    ]);

    const tree = catalog.buildTree();
    expect(tree.children.map((child) => child.name)).toEqual(["Animals", "props"]);
    expect(tree.children[0].children[0].children[0].resourceId).toBe("animals/eagle");

    const firstLoad = await catalog.load("animals/eagle");
    const secondLoad = await catalog.load("animals/eagle");

    expect(loads).toBe(1);
    expect(firstLoad.geometry.bounds).toEqual({
      min: { x: -1, y: 0, z: -1 },
      max: { x: 1, y: 2, z: 1 },
    });
    expect(firstLoad.classInfo.jointArrays).toEqual({ WING: ["WING_01", "WING_02"] });
    expect(firstLoad.classInfo.hierarchy[0].children.map((child) => child.name)).toEqual(["WING_01", "WING_02"]);
    expect(secondLoad.materials).toEqual(firstLoad.materials);
    expect(catalog.getIfLoaded("animals/eagle")).not.toBeNull();
  });

  it("provides frozen individual model resource enums with valid entries", () => {
    const allResourceEnums = {
      BipedResource,
      FlyerResource,
      QuadrupedResource,
      SwimmerResource,
      FishResource,
      MarineMammalResource,
      SlithererResource,
      PropResource,
      AutomobileResource,
      AircraftResource,
      WatercraftResource,
      TrainResource,
    };

    for (const [enumName, resourceEnum] of Object.entries(allResourceEnums)) {
      // Each enum is a frozen object
      expect(Object.isFrozen(resourceEnum), `${enumName} should be frozen`).toBe(true);

      // Each enum has at least one entry
      const entries = Object.entries(resourceEnum);
      expect(entries.length, `${enumName} should have entries`).toBeGreaterThan(0);

      // Every entry has non-empty id, name, modelName strings
      for (const [key, resource] of entries) {
        expect(typeof resource.id, `${enumName}.${key}.id should be string`).toBe("string");
        expect(resource.id.trim().length, `${enumName}.${key}.id should be non-empty`).toBeGreaterThan(0);
        expect(typeof resource.name, `${enumName}.${key}.name should be string`).toBe("string");
        expect(resource.name.trim().length, `${enumName}.${key}.name should be non-empty`).toBeGreaterThan(0);
        expect(typeof resource.modelName, `${enumName}.${key}.modelName should be string`).toBe("string");
        expect(resource.modelName.trim().length, `${enumName}.${key}.modelName should be non-empty`).toBeGreaterThan(0);
      }

      // No duplicate IDs within an enum
      const ids = entries.map(([, resource]) => resource.id);
      expect(new Set(ids).size, `${enumName} should have unique IDs`).toBe(ids.length);
    }
  });

  it("contains representative entries for each resource class", () => {
    // BipedResource has expected entries
    expect(BipedResource.ALIEN).toBeDefined();
    expect(BipedResource.BUNNY).toBeDefined();
    expect(BipedResource.OGRE).toBeDefined();
    expect(BipedResource.WITCH).toBeDefined();
    expect(BipedResource.ZOMBIE).toBeDefined();
    expect(BipedResource.BUNNY.name).toBe("Bunny");
    expect(BipedResource.BUNNY.id).toBe("BUNNY");

    // FlyerResource
    expect(FlyerResource.EAGLE).toBeDefined();
    expect(FlyerResource.OWL).toBeDefined();
    expect(FlyerResource.EAGLE.name).toBe("Eagle");

    // QuadrupedResource
    expect(QuadrupedResource.CAT).toBeDefined();
    expect(QuadrupedResource.DOG).toBeDefined();
    expect(QuadrupedResource.HORSE).toBeDefined();
    expect(QuadrupedResource.DOG.name).toBe("Dog");

    // SwimmerResource
    expect(SwimmerResource.CLOWNFISH).toBeDefined();
    expect(SwimmerResource.SHARK).toBeDefined();

    // SlithererResource
    expect(SlithererResource.COBRA).toBeDefined();
    expect(SlithererResource.PYTHON).toBeDefined();

    // PropResource
    expect(PropResource.CHAIR).toBeDefined();
    expect(PropResource.TABLE).toBeDefined();

    // AutomobileResource
    expect(AutomobileResource.SEDAN).toBeDefined();

    // AircraftResource
    expect(AircraftResource.HELICOPTER).toBeDefined();

    // WatercraftResource
    expect(WatercraftResource.SPEEDBOAT).toBeDefined();

    // TrainResource
    expect(TrainResource.LOCOMOTIVE).toBeDefined();
  });

  it("registers individual resources with ModelResourceCatalog", () => {
    const catalog = new ModelResourceCatalog();

    // Spread resource into catalog registration
    catalog.register({
      ...BipedResource.BUNNY,
      category: MODEL_CLASS_DATA.BIPED.category,
      modelClass: "BIPED",
    });

    const found = catalog.get("BUNNY");
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Bunny");
    expect(found!.modelName).toBe("Bunny");
    expect(found!.modelClass.abstractionClassName).toBe("SBiped");

    // Bulk-register all entries from a resource class
    for (const resource of Object.values(QuadrupedResource)) {
      catalog.register({
        ...resource,
        category: MODEL_CLASS_DATA.QUADRUPED.category,
        modelClass: "QUADRUPED",
      });
    }

    const quadrupeds = catalog.byCategory("animals");
    expect(quadrupeds.length).toBeGreaterThan(1);
    expect(quadrupeds.some((r) => r.name === "Dog")).toBe(true);
  });
});
