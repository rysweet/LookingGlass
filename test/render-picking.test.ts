import { describe, expect, it } from "vitest";
import {
  RenderPickingSystem,
  rayBoxIntersection,
  rayMeshIntersection,
  raySphereIntersection,
  rayTriangleIntersection,
  type Triangle,
} from "../src/render-picking";
import type { Ray } from "../src/collision-detection";

const forwardRay: Ray = {
  origin: { x: 0, y: 0, z: 0 },
  direction: { x: 0, y: 0, z: 1 },
};

describe("rayTriangleIntersection", () => {
  it("hits a triangle and reports the intersection point", () => {
    const hit = rayTriangleIntersection(forwardRay, {
      a: { x: -1, y: -1, z: 2 },
      b: { x: 1, y: -1, z: 2 },
      c: { x: 0, y: 1, z: 2 },
    });

    expect(hit).toEqual({
      distance: 2,
      point: { x: 0, y: 0, z: 2 },
      normal: { x: 0, y: 0, z: 1 },
    });
  });
});

describe("rayMeshIntersection", () => {
  it("searches a triangle list and returns the closest face index", () => {
    const triangles: Triangle[] = [
      {
        a: { x: -1, y: -1, z: 6 },
        b: { x: 1, y: -1, z: 6 },
        c: { x: 0, y: 1, z: 6 },
      },
      {
        a: { x: -1, y: -1, z: 3 },
        b: { x: 1, y: -1, z: 3 },
        c: { x: 0, y: 1, z: 3 },
      },
    ];

    expect(rayMeshIntersection(forwardRay, triangles)).toEqual({
      distance: 3,
      point: { x: 0, y: 0, z: 3 },
      normal: { x: 0, y: 0, z: 1 },
      faceIndex: 1,
    });
  });
});

describe("raySphereIntersection", () => {
  it("returns the first sphere hit along the ray", () => {
    expect(
      raySphereIntersection(forwardRay, {
        center: { x: 0, y: 0, z: 5 },
        radius: 1,
      }),
    ).toEqual({
      distance: 4,
      point: { x: 0, y: 0, z: 4 },
      normal: { x: 0, y: 0, z: -1 },
    });
  });
});

describe("rayBoxIntersection", () => {
  it("delegates to the slab-based AABB intersection helper", () => {
    expect(
      rayBoxIntersection(forwardRay, {
        min: { x: -1, y: -1, z: 7 },
        max: { x: 1, y: 1, z: 9 },
      }),
    ).toEqual({
      distance: 7,
      point: { x: 0, y: 0, z: 7 },
      normal: { x: 0, y: 0, z: -1 },
    });
  });
});

describe("RenderPickingSystem", () => {
  it("sorts mesh, sphere, and box hits by depth", () => {
    const picking = new RenderPickingSystem([
      {
        id: "box",
        geometry: {
          kind: "box",
          box: {
            min: { x: -1, y: -1, z: 7 },
            max: { x: 1, y: 1, z: 9 },
          },
        },
      },
      {
        id: "sphere",
        geometry: {
          kind: "sphere",
          sphere: {
            center: { x: 0, y: 0, z: 5 },
            radius: 1,
          },
        },
      },
      {
        id: "mesh",
        geometry: {
          kind: "mesh",
          triangles: [
            {
              a: { x: -1, y: -1, z: 2 },
              b: { x: 1, y: -1, z: 2 },
              c: { x: 0, y: 1, z: 2 },
            },
          ],
        },
      },
    ]);

    expect(picking.pickAll(forwardRay).map((hit) => hit.objectId)).toEqual(["mesh", "sphere", "box"]);
  });

  it("simulates depth buffer readback and can select the matching object", () => {
    const picking = new RenderPickingSystem([
      {
        id: "near-mesh",
        geometry: {
          kind: "mesh",
          triangles: [
            {
              a: { x: -1, y: -1, z: 2 },
              b: { x: 1, y: -1, z: 2 },
              c: { x: 0, y: 1, z: 2 },
            },
          ],
        },
      },
      {
        id: "far-sphere",
        geometry: {
          kind: "sphere",
          sphere: {
            center: { x: 0, y: 0, z: 5 },
            radius: 1,
          },
        },
      },
    ]);

    const depthSample = picking.simulateDepthBufferReadback(forwardRay);
    expect(depthSample).toEqual({
      objectId: "near-mesh",
      depth: 2,
      point: { x: 0, y: 0, z: 2 },
    });

    expect(picking.pickFrontMost(forwardRay, { depthReadback: 4 })?.objectId).toBe("far-sphere");
    expect(picking.pickFrontMost(forwardRay, { depthReadback: depthSample?.depth })?.objectId).toBe("near-mesh");
  });
});
