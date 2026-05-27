import { ModelImp, assertFinitePositive } from "./core.js";

export class BoxImp extends ModelImp {
  get width(): number { return this.size.width; }
  set width(value: number) { assertFinitePositive(value, "width"); this.size = { ...this.size, width: value }; }
  get height(): number { return this.size.height; }
  set height(value: number) { assertFinitePositive(value, "height"); this.size = { ...this.size, height: value }; }
  get depth(): number { return this.size.depth; }
  set depth(value: number) { assertFinitePositive(value, "depth"); this.size = { ...this.size, depth: value }; }
}

export class SphereImp extends ModelImp {
  #radius = 0.5;

  constructor(name: string | null = null, radius = 0.5) {
    super(name, { width: radius * 2, height: radius * 2, depth: radius * 2 });
    this.radius = radius;
  }

  get radius(): number { return this.#radius; }
  set radius(value: number) {
    assertFinitePositive(value, "radius");
    this.#radius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: diameter, depth: diameter };
  }
}

export class CylinderImp extends ModelImp {
  #radius = 0.5;
  #length = 1;

  constructor(name: string | null = null, radius = 0.5, length = 1) {
    super(name);
    this.radius = radius;
    this.length = length;
  }

  get radius(): number { return this.#radius; }
  set radius(value: number) {
    assertFinitePositive(value, "radius");
    this.#radius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: this.#length, depth: diameter };
  }

  get length(): number { return this.#length; }
  set length(value: number) {
    assertFinitePositive(value, "length");
    this.#length = value;
    const diameter = this.#radius * 2;
    this.size = { width: diameter, height: value, depth: diameter };
  }
}

export class ConeImp extends ModelImp {
  #baseRadius = 0.5;
  #length = 1;

  constructor(name: string | null = null, baseRadius = 0.5, length = 1) {
    super(name);
    this.baseRadius = baseRadius;
    this.length = length;
  }

  get baseRadius(): number { return this.#baseRadius; }
  set baseRadius(value: number) {
    assertFinitePositive(value, "baseRadius");
    this.#baseRadius = value;
    const diameter = value * 2;
    this.size = { width: diameter, height: this.#length, depth: diameter };
  }

  get length(): number { return this.#length; }
  set length(value: number) {
    assertFinitePositive(value, "length");
    this.#length = value;
    const diameter = this.#baseRadius * 2;
    this.size = { width: diameter, height: value, depth: diameter };
  }
}

export class TorusImp extends ModelImp {
  #innerRadius = 0.25;
  #outerRadius = 0.5;

  constructor(name: string | null = null, innerRadius = 0.25, outerRadius = 0.5) {
    super(name);
    assertFinitePositive(innerRadius, "innerRadius");
    assertFinitePositive(outerRadius, "outerRadius");
    if (innerRadius >= outerRadius) {
      throw new TypeError("innerRadius must be smaller than outerRadius");
    }
    this.#innerRadius = innerRadius;
    this.#outerRadius = outerRadius;
    this.#syncSize();
  }

  get innerRadius(): number { return this.#innerRadius; }
  set innerRadius(value: number) {
    assertFinitePositive(value, "innerRadius");
    if (value >= this.#outerRadius) {
      throw new TypeError("innerRadius must be smaller than outerRadius");
    }
    this.#innerRadius = value;
    this.#syncSize();
  }

  get outerRadius(): number { return this.#outerRadius; }
  set outerRadius(value: number) {
    assertFinitePositive(value, "outerRadius");
    if (value <= this.#innerRadius) {
      throw new TypeError("outerRadius must be larger than innerRadius");
    }
    this.#outerRadius = value;
    this.#syncSize();
  }

  #syncSize(): void {
    const tubeRadius = (this.#outerRadius - this.#innerRadius) / 2;
    const diameter = this.#outerRadius * 2;
    this.size = {
      width: diameter,
      height: Math.max(tubeRadius * 2, 0.01),
      depth: diameter,
    };
  }
}
