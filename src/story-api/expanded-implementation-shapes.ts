import {
  NumberProperty,
  StringProperty,
  type ImplementableEntity,
} from "./expanded-implementation-properties";
import { ModelImp } from "./expanded-implementation-entities-transformable";

export class ShapeImp extends ModelImp {}

export class SphereImp extends ShapeImp {
  readonly radius = this.registerProperty(new NumberProperty(this, "radius", 0.5, { min: 0 }));
  #synchronizing = false;

  constructor(owner: ImplementableEntity) {
    super(owner);
    this.radius.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      const diameter = value * 2;
      this.size.setValue({ width: diameter, height: diameter, depth: diameter });
      this.#synchronizing = false;
    });
    this.size.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.radius.setValueSilently((value.width + value.height + value.depth) / 6);
      this.#synchronizing = false;
    });
  }
}

export class DiscImp extends ShapeImp {
  readonly outerRadius = this.registerProperty(new NumberProperty(this, "outerRadius", 0.5, { min: 0 }));
  #synchronizing = false;

  constructor(owner: ImplementableEntity) {
    super(owner);
    this.outerRadius.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.size.setValue({ width: value * 2, height: this.size.value.height, depth: value * 2 });
      this.#synchronizing = false;
    });
    this.size.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.outerRadius.setValueSilently(Math.max(value.width, value.depth) / 2);
      this.#synchronizing = false;
    });
  }
}

export class BoxImp extends ShapeImp {}

export class ConeImp extends ShapeImp {
  readonly baseRadius = this.registerProperty(new NumberProperty(this, "baseRadius", 0.5, { min: 0 }));
  readonly length = this.registerProperty(new NumberProperty(this, "length", 1, { min: 0 }));
  #synchronizing = false;

  constructor(owner: ImplementableEntity) {
    super(owner);
    const syncFromProperties = (): void => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      const diameter = this.baseRadius.value * 2;
      this.size.setValue({ width: diameter, height: this.length.value, depth: diameter });
      this.#synchronizing = false;
    };
    this.baseRadius.addListener(syncFromProperties);
    this.length.addListener(syncFromProperties);
    this.size.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.baseRadius.setValueSilently(Math.max(value.width, value.depth) / 2);
      this.length.setValueSilently(value.height);
      this.#synchronizing = false;
    });
  }
}

export class CylinderImp extends ShapeImp {
  readonly radius = this.registerProperty(new NumberProperty(this, "radius", 0.5, { min: 0 }));
  readonly length = this.registerProperty(new NumberProperty(this, "length", 1, { min: 0 }));
  #synchronizing = false;

  constructor(owner: ImplementableEntity) {
    super(owner);
    const syncFromProperties = (): void => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      const diameter = this.radius.value * 2;
      this.size.setValue({ width: diameter, height: this.length.value, depth: diameter });
      this.#synchronizing = false;
    };
    this.radius.addListener(syncFromProperties);
    this.length.addListener(syncFromProperties);
    this.size.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.radius.setValueSilently(Math.max(value.width, value.depth) / 2);
      this.length.setValueSilently(value.height);
      this.#synchronizing = false;
    });
  }
}

export class TorusImp extends ShapeImp {
  readonly innerRadius = this.registerProperty(new NumberProperty(this, "innerRadius", 0.25, { min: 0 }));
  readonly outerRadius = this.registerProperty(new NumberProperty(this, "outerRadius", 0.5, { min: 0 }));
  #synchronizing = false;

  constructor(owner: ImplementableEntity) {
    super(owner);
    const syncFromProperties = (): void => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      const diameter = this.outerRadius.value * 2;
      this.size.setValue({ width: diameter, height: Math.max(this.innerRadius.value * 2, 0.1), depth: diameter });
      this.#synchronizing = false;
    };
    this.innerRadius.addListener(syncFromProperties);
    this.outerRadius.addListener(syncFromProperties);
    this.size.addListener(({ value }) => {
      if (this.#synchronizing) return;
      this.#synchronizing = true;
      this.outerRadius.setValueSilently(Math.max(value.width, value.depth) / 2);
      this.#synchronizing = false;
    });
  }
}

export class BillboardImp extends ShapeImp {
  readonly backPaint = this.registerProperty(new StringProperty<string>(this, "backPaint", "WHITE"));
}

export class AxesImp extends ShapeImp {}

export class TextModelImp extends ModelImp {
  readonly valueProperty = this.registerProperty(new StringProperty<string>(this, "value", ""));

  get value(): string {
    return this.valueProperty.value;
  }

  set value(nextValue: string) {
    this.valueProperty.setValue(nextValue);
  }

  append(value: unknown): void {
    this.value = `${this.value}${String(value)}`;
  }

  charAt(index: number): string {
    return this.value.charAt(index);
  }

  delete(start: number, end: number): void {
    this.value = `${this.value.slice(0, start)}${this.value.slice(end)}`;
  }

  deleteCharAt(index: number): void {
    this.delete(index, index + 1);
  }

  indexOf(value: string, fromIndex?: number): number {
    return this.value.indexOf(value, fromIndex);
  }

  lastIndexOf(value: string, fromIndex?: number): number {
    return this.value.lastIndexOf(value, fromIndex);
  }

  insert(offset: number, value: unknown): void {
    this.value = `${this.value.slice(0, offset)}${String(value)}${this.value.slice(offset)}`;
  }

  getLength(): number {
    return this.value.length;
  }

  replace(start: number, end: number, value: string): void {
    this.value = `${this.value.slice(0, start)}${value}${this.value.slice(end)}`;
  }

  setCharAt(index: number, value: string): void {
    this.value = `${this.value.slice(0, index)}${value.charAt(0)}${this.value.slice(index + 1)}`;
  }
}
