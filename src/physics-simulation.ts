import type { Vec3 } from "./story-api/types";

export type ColliderShape = "box" | "sphere" | "mesh";
export type ConstraintType = "hinge" | "slider" | "spring";

export interface PhysicsHit {
  readonly body: RigidBody;
  readonly distance: number;
  readonly point: Vec3;
}

const ZERO_VEC3: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });

function add(left: Vec3, right: Vec3): Vec3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtract(left: Vec3, right: Vec3): Vec3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function scale(value: Vec3, factor: number): Vec3 {
  return { x: value.x * factor, y: value.y * factor, z: value.z * factor };
}

function dot(left: Vec3, right: Vec3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function magnitude(value: Vec3): number {
  return Math.sqrt(dot(value, value));
}

function normalize(value: Vec3): Vec3 {
  const length = magnitude(value);
  return length === 0 ? ZERO_VEC3 : scale(value, 1 / length);
}

function cloneVec3(value: Vec3): Vec3 {
  return { x: value.x, y: value.y, z: value.z };
}

export class Collider {
  private constructor(
    readonly shape: ColliderShape,
    readonly size: Vec3,
    readonly vertices: readonly Vec3[] = [],
    private readonly explicitRadius: number | null = null,
  ) {}

  static box(width: number, height: number, depth: number): Collider {
    return new Collider("box", { x: width, y: height, z: depth });
  }

  static sphere(radius: number): Collider {
    return new Collider("sphere", { x: radius * 2, y: radius * 2, z: radius * 2 });
  }

  static mesh(vertices: readonly Vec3[]): Collider {
    const radius = vertices.reduce((largest, vertex) => Math.max(largest, magnitude(vertex)), 0);
    return new Collider("mesh", { x: radius * 2, y: radius * 2, z: radius * 2 }, [...vertices], radius);
  }

  get halfExtents(): Vec3 {
    return scale(this.size, 0.5);
  }

  get boundingRadius(): number {
    if (this.explicitRadius !== null) {
      return this.explicitRadius;
    }
    if (this.shape === "sphere") {
      return this.size.x / 2;
    }
    const half = this.halfExtents;
    return Math.sqrt(half.x * half.x + half.y * half.y + half.z * half.z);
  }
}

export interface RigidBodyOptions {
  readonly mass?: number;
  readonly position?: Vec3;
  readonly velocity?: Vec3;
  readonly collider?: Collider;
  readonly restitution?: number;
  readonly isStatic?: boolean;
}

export class RigidBody {
  readonly mass: number;
  readonly collider: Collider;
  readonly restitution: number;
  readonly isStatic: boolean;
  position: Vec3;
  velocity: Vec3;
  grounded = false;
  private accumulatedForce: Vec3 = ZERO_VEC3;

  constructor(options: RigidBodyOptions = {}) {
    this.mass = options.mass ?? 1;
    this.collider = options.collider ?? Collider.sphere(0.5);
    this.restitution = options.restitution ?? 0.2;
    this.isStatic = options.isStatic ?? false;
    this.position = cloneVec3(options.position ?? ZERO_VEC3);
    this.velocity = cloneVec3(options.velocity ?? ZERO_VEC3);
  }

  get inverseMass(): number {
    return this.isStatic || this.mass <= 0 ? 0 : 1 / this.mass;
  }

  applyForce(force: Vec3): void {
    this.accumulatedForce = add(this.accumulatedForce, force);
  }

  clearForces(): void {
    this.accumulatedForce = ZERO_VEC3;
  }

  integrate(deltaSeconds: number, gravity: Vec3): void {
    if (this.inverseMass === 0 || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      this.clearForces();
      return;
    }
    const acceleration = add(gravity, scale(this.accumulatedForce, this.inverseMass));
    this.velocity = add(this.velocity, scale(acceleration, deltaSeconds));
    this.position = add(this.position, scale(this.velocity, deltaSeconds));
    this.clearForces();
  }
}

export interface PhysicsConstraintOptions {
  readonly axis?: Vec3;
  readonly restLength?: number;
  readonly stiffness?: number;
}

export class PhysicsConstraint {
  readonly axis: Vec3;
  readonly restLength: number;
  readonly stiffness: number;

  constructor(
    readonly type: ConstraintType,
    readonly bodyA: RigidBody,
    readonly bodyB: RigidBody,
    options: PhysicsConstraintOptions = {},
  ) {
    this.axis = normalize(options.axis ?? { x: 1, y: 0, z: 0 });
    this.restLength = options.restLength ?? magnitude(subtract(bodyB.position, bodyA.position));
    this.stiffness = options.stiffness ?? 1;
  }

  solve(_deltaSeconds: number): void {
    const delta = subtract(this.bodyB.position, this.bodyA.position);
    if (this.type === "slider") {
      const projected = dot(delta, this.axis);
      this.bodyB.position = add(this.bodyA.position, scale(this.axis, projected));
      return;
    }

    const distanceBetween = magnitude(delta);
    if (distanceBetween === 0) {
      return;
    }
    const normal = scale(delta, 1 / distanceBetween);
    const correction = (distanceBetween - this.restLength) * 0.5 * this.stiffness;
    if (this.type === "spring") {
      if (!this.bodyA.isStatic) {
        this.bodyA.position = add(this.bodyA.position, scale(normal, correction));
      }
      if (!this.bodyB.isStatic) {
        this.bodyB.position = add(this.bodyB.position, scale(normal, -correction));
      }
      return;
    }

    if (this.type === "hinge") {
      const target = add(this.bodyA.position, scale(normalize(delta), this.restLength));
      if (!this.bodyB.isStatic) {
        this.bodyB.position = target;
      }
    }
  }
}

export class PhysicsWorld {
  readonly bodies = new Set<RigidBody>();
  readonly constraints = new Set<PhysicsConstraint>();

  constructor(
    readonly gravity: Vec3 = { x: 0, y: -9.8, z: 0 },
    readonly timestep = 1 / 60,
  ) {}

  addBody(body: RigidBody): void {
    this.bodies.add(body);
  }

  addConstraint(constraint: PhysicsConstraint): void {
    this.constraints.add(constraint);
  }

  step(deltaSeconds = this.timestep): void {
    for (const body of this.bodies) {
      body.grounded = false;
      body.integrate(deltaSeconds, this.gravity);
      this.resolveGround(body);
    }
    for (const constraint of this.constraints) {
      constraint.solve(deltaSeconds);
    }
    this.resolveBodyCollisions();
  }

  private resolveGround(body: RigidBody): void {
    const floor = body.collider.shape === "box" ? body.collider.halfExtents.y : body.collider.boundingRadius;
    if (body.position.y >= floor) {
      return;
    }
    body.position = { x: body.position.x, y: floor, z: body.position.z };
    if (body.velocity.y < 0) {
      body.velocity = { x: body.velocity.x, y: -body.velocity.y * body.restitution, z: body.velocity.z };
    }
    if (Math.abs(body.velocity.y) < 0.05) {
      body.velocity = { x: body.velocity.x, y: 0, z: body.velocity.z };
    }
    body.grounded = true;
  }

  private resolveBodyCollisions(): void {
    const bodies = [...this.bodies];
    for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
        const left = bodies[leftIndex];
        const right = bodies[rightIndex];
        const delta = subtract(right.position, left.position);
        const distanceBetween = magnitude(delta);
        const minimumDistance = left.collider.boundingRadius + right.collider.boundingRadius;
        if (distanceBetween >= minimumDistance) {
          continue;
        }
        const normal = distanceBetween === 0 ? { x: 1, y: 0, z: 0 } : scale(delta, 1 / distanceBetween);
        const penetration = minimumDistance - distanceBetween;
        const correction = scale(normal, penetration / 2);
        if (!left.isStatic) {
          left.position = add(left.position, scale(correction, -1));
        }
        if (!right.isStatic) {
          right.position = add(right.position, correction);
        }
        if (!left.isStatic) {
          left.velocity = add(left.velocity, scale(normal, -left.restitution));
        }
        if (!right.isStatic) {
          right.velocity = add(right.velocity, scale(normal, right.restitution));
        }
      }
    }
  }
}

export class RayCast {
  static cast(origin: Vec3, direction: Vec3, bodies: Iterable<RigidBody>, maxDistance = Number.POSITIVE_INFINITY): PhysicsHit | null {
    const normalizedDirection = normalize(direction);
    let nearest: PhysicsHit | null = null;
    for (const body of bodies) {
      const offset = subtract(origin, body.position);
      const radius = body.collider.boundingRadius;
      const a = dot(normalizedDirection, normalizedDirection);
      const b = 2 * dot(offset, normalizedDirection);
      const c = dot(offset, offset) - radius * radius;
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        continue;
      }
      const hitDistance = (-b - Math.sqrt(discriminant)) / (2 * a);
      if (hitDistance < 0 || hitDistance > maxDistance) {
        continue;
      }
      if (!nearest || hitDistance < nearest.distance) {
        nearest = {
          body,
          distance: hitDistance,
          point: add(origin, scale(normalizedDirection, hitDistance)),
        };
      }
    }
    return nearest;
  }
}

export class CharacterController {
  constructor(
    readonly body: RigidBody,
    readonly moveSpeed = 4,
    readonly jumpVelocity = 5,
  ) {}

  move(input: Vec3): void {
    this.body.velocity = {
      x: input.x * this.moveSpeed,
      y: this.body.velocity.y,
      z: input.z * this.moveSpeed,
    };
  }

  jump(): boolean {
    if (!this.body.grounded) {
      return false;
    }
    this.body.velocity = {
      x: this.body.velocity.x,
      y: this.jumpVelocity,
      z: this.body.velocity.z,
    };
    this.body.grounded = false;
    return true;
  }

  step(world: PhysicsWorld, input: Vec3 = ZERO_VEC3, jumpRequested = false, deltaSeconds = world.timestep): void {
    this.move(input);
    if (jumpRequested) {
      this.jump();
    }
    world.step(deltaSeconds);
  }
}
