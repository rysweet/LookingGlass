import { describe, expect, it } from "vitest";
import {
  CharacterController,
  Collider,
  PhysicsConstraint,
  PhysicsWorld,
  RayCast,
  RigidBody,
} from "../src/physics-simulation.js";

describe("physics simulation module", () => {
  it("rigid bodies integrate applied forces", () => {
    const body = new RigidBody({ mass: 2, collider: Collider.sphere(0.5) });
    body.applyForce({ x: 4, y: 0, z: 0 });
    body.integrate(0.5, { x: 0, y: 0, z: 0 });

    expect(body.velocity.x).toBeCloseTo(1);
    expect(body.position.x).toBeCloseTo(0.5);
  });

  it("colliders report stable bounding radii", () => {
    expect(Collider.box(2, 4, 4).boundingRadius).toBeCloseTo(3);
    expect(Collider.sphere(1.5).boundingRadius).toBeCloseTo(1.5);
    expect(Collider.mesh([{ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 4 }]).boundingRadius).toBeCloseTo(5);
  });

  it("physics world resolves the ground plane and overlapping bodies", () => {
    const groundWorld = new PhysicsWorld({ x: 0, y: -10, z: 0 }, 0.5);
    const falling = new RigidBody({ position: { x: 0, y: 2, z: 0 }, collider: Collider.sphere(0.5), restitution: 0 });
    groundWorld.addBody(falling);
    groundWorld.step();

    expect(falling.grounded).toBe(true);
    expect(falling.position.y).toBeCloseTo(0.5);

    const overlapWorld = new PhysicsWorld({ x: 0, y: 0, z: 0 }, 0.5);
    const left = new RigidBody({ position: { x: 0, y: 1, z: 0 }, collider: Collider.sphere(1), restitution: 0 });
    const right = new RigidBody({ position: { x: 1, y: 1, z: 0 }, collider: Collider.sphere(1), restitution: 0 });
    overlapWorld.addBody(left);
    overlapWorld.addBody(right);
    overlapWorld.step();

    expect(right.position.x - left.position.x).toBeGreaterThanOrEqual(2);
  });

  it("constraints enforce spring and slider rules", () => {
    const springA = new RigidBody({ position: { x: 0, y: 0, z: 0 }, collider: Collider.sphere(0.5) });
    const springB = new RigidBody({ position: { x: 10, y: 0, z: 0 }, collider: Collider.sphere(0.5) });
    const spring = new PhysicsConstraint("spring", springA, springB, { restLength: 4, stiffness: 1 });
    spring.solve(1);

    expect(springB.position.x - springA.position.x).toBeCloseTo(4);

    const sliderA = new RigidBody({ position: { x: 0, y: 0, z: 0 }, collider: Collider.sphere(0.5) });
    const sliderB = new RigidBody({ position: { x: 2, y: 3, z: 0 }, collider: Collider.sphere(0.5) });
    const slider = new PhysicsConstraint("slider", sliderA, sliderB, { axis: { x: 1, y: 0, z: 0 } });
    slider.solve(1);

    expect(sliderB.position.y).toBeCloseTo(0);
    expect(sliderB.position.x).toBeCloseTo(2);
  });

  it("ray casts hit the nearest body", () => {
    const near = new RigidBody({ position: { x: 5, y: 0, z: 0 }, collider: Collider.sphere(1) });
    const far = new RigidBody({ position: { x: 8, y: 0, z: 0 }, collider: Collider.sphere(1) });
    const hit = RayCast.cast({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, [far, near]);

    expect(hit?.body).toBe(near);
    expect(hit?.distance).toBeCloseTo(4);
    expect(hit?.point.x).toBeCloseTo(4);
  });

  it("character controller moves, jumps, and lands again", () => {
    const world = new PhysicsWorld({ x: 0, y: -9.8, z: 0 }, 0.1);
    const body = new RigidBody({ position: { x: 0, y: 0.5, z: 0 }, collider: Collider.sphere(0.5), restitution: 0 });
    world.addBody(body);
    const controller = new CharacterController(body, 3, 4);

    world.step(0);
    body.grounded = true;
    controller.step(world, { x: 1, y: 0, z: 0 }, true, 0.1);
    expect(body.position.x).toBeGreaterThan(0);
    expect(body.velocity.y).toBeGreaterThan(0);

    for (let index = 0; index < 20; index += 1) {
      world.step(0.1);
    }

    expect(body.grounded).toBe(true);
    expect(body.position.y).toBeCloseTo(0.5);
  });
});
