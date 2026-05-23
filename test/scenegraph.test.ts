import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { AliceProject, AliceObject } from "../src/a3p-parser.js";
import { buildScene } from "../src/scene-builder.js";
import {
  AffineMatrix4x4,
  AmbientLight,
  Background,
  Box,
  BoxGeometry,
  Composite,
  Cylinder,
  DirectionalLight,
  Disc,
  IndexedTriangleArray,
  Mesh,
  Model,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SingleAppearance,
  Sphere,
  SphereGeometry,
  SpotLight,
  SymmetricPerspectiveCamera,
  TextVisual,
  TexturedAppearance,
  Torus,
  Transformable,
  Visual,
  createModel,
} from "../src/scenegraph.js";

function decomposeTranslation(matrix: THREE.Matrix4): THREE.Vector3 {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  return position;
}

function makeObject(
  overrides: Partial<AliceObject> & { name: string; typeName: string },
): AliceObject {
  return {
    resourceType: null,
    position: null,
    orientation: null,
    size: null,
    ...overrides,
  };
}

function makeProject(objects: AliceObject[]): AliceProject {
  return {
    version: "3.6.0.0",
    projectName: "ParityScene",
    sceneObjects: objects,
    methods: [],
  };
}

describe("scenegraph hierarchy", () => {
  it("supports parent child add remove relationships", () => {
    const root = new Composite("root");
    const group = new Transformable("group");
    const child = new Model("child");

    root.add(group);
    group.add(child);

    expect(root.hasChild(group)).toBe(true);
    expect(group.hasChild(child)).toBe(true);
    expect(child.parent).toBe(group);
    expect(child.isDescendantOf(root)).toBe(true);

    expect(group.remove(child)).toBe(true);
    expect(child.parent).toBeNull();
  });

  it("computes absolute transformations from the parent chain", () => {
    const root = new Transformable("root").setTranslation(1, 2, 3);
    const child = new Transformable("child").setTranslation(4, 0, -2);
    root.add(child);

    const translation = decomposeTranslation(child.absoluteMatrix);
    expect(translation.toArray()).toEqual([5, 2, 1]);
  });

  it("prevents cycles when reparenting components", () => {
    const root = new Transformable("root");
    const child = new Transformable("child");
    const grandChild = new Transformable("grandChild");
    root.add(child);
    child.add(grandChild);

    expect(() => grandChild.add(root)).toThrow(/cycle/i);
  });
});

describe("scenegraph matrices and geometry", () => {
  it("supports affine multiplication inversion and quaternion rotation", () => {
    const translation = AffineMatrix4x4.createTranslation(1, 2, 3);
    const rotation = AffineMatrix4x4.createOrientation({
      x: 0,
      y: Math.sin(Math.PI / 4),
      z: 0,
      w: Math.cos(Math.PI / 4),
    });
    const combined = translation.times(rotation);
    const transformed = combined.transformPoint({ x: 1, y: 0, z: 0 });
    const restored = combined.invert().transformPoint(transformed);

    expect(combined.isAffine()).toBe(true);
    expect(restored.x).toBeCloseTo(1);
    expect(restored.y).toBeCloseTo(0);
    expect(restored.z).toBeCloseTo(0);
    expect(combined.columnTranslation().toArray()).toEqual([1, 2, 3, 1]);
  });

  it("computes bounds and three geometries for shapes", () => {
    const box = new Box(2, 4, 6);
    const sphere = new Sphere(3);
    const cylinder = new Cylinder(4, 1, 2);
    cylinder.originAlignment = "center";
    cylinder.bottomToTopAxis = "positiveZ";
    const disc = new Disc(5, 1);
    disc.axis = "z";
    const torus = new Torus(2, 0.5);
    torus.coordinatePlane = "xy";

    expect(box.bounds.min.toArray()).toEqual([-1, -2, -3]);
    expect(sphere.bounds.max.toArray()).toEqual([3, 3, 3]);
    expect(cylinder.bounds.max.z).toBeCloseTo(2);
    expect(disc.bounds.max.z).toBeCloseTo(0);
    expect(torus.bounds.max.z).toBeCloseTo(0.5);
    expect(box.toThreeGeometry()).toBeInstanceOf(THREE.BufferGeometry);
  });

  it("supports indexed meshes transforms and normals", () => {
    const geometry = new IndexedTriangleArray({
      vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
    });
    const mesh = new Mesh({
      vertices: geometry.vertices,
      indices: geometry.indices,
      normals: geometry.normals,
      uvs: geometry.uvs,
    });
    mesh.textureId = 7;
    mesh.transform(AffineMatrix4x4.createTranslation(2, 0, 0));
    mesh.scale(2);
    mesh.invertNormals();
    mesh.invertIndices();

    expect(mesh.bounds.min.x).toBeCloseTo(4);
    expect(mesh.getReferencedTextureIds()).toEqual([7]);
    expect(mesh.toThreeGeometry().getIndex()!.array).toEqual(new Uint16Array([0, 2, 1]));
  });
});

describe("scenegraph visuals lights and cameras", () => {
  it("renders visuals text and appearances into three objects", () => {
    const visual = new Visual("visual");
    visual.addGeometry(new BoxGeometry(2, 4, 6));
    visual.addGeometry(new PlaneGeometry(10, 10));
    visual.frontFacingAppearance.color = 0xff0000;

    const textured = new TexturedAppearance();
    textured.diffuseColorTexture = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1,
    );
    textured.isDiffuseColorTextureAlphaBlended = true;
    visual.backFacingAppearance = textured;

    const text = new TextVisual("label", "Alice", 2);
    const bounds = visual.bounds;

    expect(bounds).not.toBeNull();
    expect(bounds!.min.x).toBeCloseTo(-5);
    expect(visual.toThreeObject().children.length).toBe(2);
    expect(text.bounds.max.x).toBeGreaterThan(0);
    expect(text.toThreeObject().children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it("converts scene background lights and cameras", () => {
    const scene = new Scene("demo");
    scene.background = new Background(0x123456);
    const ambient = new AmbientLight("ambient", 0xffffff, 0.25);
    const directional = new DirectionalLight("sun", 0xffffff, 0.75).setTranslation(1, 2, 3);
    const spot = new SpotLight("spot", 0xffcc00, 1).setTranslation(0, 5, 0);
    scene.add(ambient);
    scene.add(directional);
    scene.add(spot);

    const perspective = new SymmetricPerspectiveCamera("camera");
    perspective.widthToHeightRatio = 4 / 3;
    perspective.verticalViewingAngle = Math.PI / 3;
    perspective.setTranslation(0, 2, 10);

    const ortho = new OrthographicCamera("ortho");
    ortho.picturePlane = { left: -2, right: 2, top: 2, bottom: -2 };

    scene.add(perspective);
    scene.add(ortho);
    const threeScene = scene.toThreeScene();

    expect(scene.isSceneOf(perspective)).toBe(true);
    expect(threeScene.background).toBeInstanceOf(THREE.Color);
    expect(threeScene.children).toHaveLength(5);
    expect(perspective.toThreeCamera()).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(ortho.toThreeCamera()).toBeInstanceOf(THREE.OrthographicCamera);
  });
});

describe("scenegraph integration with scene builder", () => {
  it("returns a sceneGraph rooted in transformable models", () => {
    const project = makeProject([
      makeObject({ name: "ground", typeName: "org.lgna.story.SGround" }),
      makeObject({
        name: "bunny",
        typeName: "org.lgna.story.SQuadruped",
        position: { x: 3, y: 0, z: -1 },
        size: { width: 2, height: 1, depth: 4 },
      }),
    ]);

    const result = buildScene(project);

    expect(result.sceneGraph).toBeInstanceOf(Transformable);
    expect(result.sceneGraph.children).toHaveLength(2);
    expect(result.sceneGraph.children[0]).toBeInstanceOf(Model);
    const bunny = result.sceneGraph.children[1] as Model;
    expect(bunny.visual.geometries[0]).toBeInstanceOf(BoxGeometry);

    const translation = decomposeTranslation(bunny.absoluteMatrix);
    expect(translation.x).toBeCloseTo(3);
    expect(translation.z).toBeCloseTo(-1);
  });

  it("creates reusable models through the helper factory", () => {
    const model = createModel({
      name: "tree",
      geometry: new SphereGeometry(0.5),
      color: 0x00aa00,
      position: { x: 1, y: 2, z: 3 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
    });

    expect(model).toBeInstanceOf(Model);
    expect(model.visual.frontFacingAppearance.color).toBe(0x00aa00);
    expect(model.visual.parent).toBe(model);

    const translation = decomposeTranslation(model.absoluteMatrix);
    expect(translation.toArray()).toEqual([1, 2, 3]);
  });

  it("supports base appearances independently", () => {
    const appearance = new SingleAppearance();
    appearance.color = 0xabcdef;
    appearance.opacity = 0.5;

    const material = appearance.toThreeMaterial();
    expect(material).toBeInstanceOf(THREE.Material);
  });
});
