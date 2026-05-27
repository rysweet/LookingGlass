import { SModel, SMovableTurnable, SScene, STextModel, SThing, STurnable } from "./story-api/entities.js";
import type { Orientation, Position, Size } from "./story-api/types.js";

export interface ObjectPropertySnapshot {
  position: Position | null;
  orientation: Orientation | null;
  size: Size | null;
  paint: string | null;
  ambient: string | null;
  opacity: number | null;
  text: string | null;
  vehicle: SThing | null;
}

function clonePosition(position: Position): Position {
  return { ...position };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { ...orientation };
}

function cloneSize(size: Size): Size {
  return { ...size };
}

export class ObjectPropertyEditor {
  readonly transform = new TransformEditor(this);
  readonly color = new ColorEditor(this);
  readonly opacity = new OpacityEditor(this);
  readonly text = new TextPropertyEditor(this);
  readonly vehicle = new VehicleEditor(this);

  constructor(
    readonly target: SThing | SScene,
    private readonly resolveEntity: (name: string) => SThing | null = () => null,
  ) {}

  snapshot(): ObjectPropertySnapshot {
    return {
      position: this.target instanceof SMovableTurnable ? clonePosition(this.target.position) : null,
      orientation: this.target instanceof STurnable ? cloneOrientation(this.target.orientation) : null,
      size: this.target instanceof SModel ? cloneSize(this.target.size) : null,
      paint: this.target instanceof SMovableTurnable ? this.target.paint : null,
      ambient: this.target instanceof SScene
        ? this.target.getAmbientLightColor()
        : (this.target as SThing).imp.getProperty<string>("ambientColor")?.value ?? null,
      opacity: this.target instanceof SModel ? this.target.opacity : null,
      text: this.target instanceof STextModel ? this.target.value : null,
      vehicle: this.target instanceof SModel ? this.target.vehicle : null,
    };
  }

  requireMovable(): SMovableTurnable {
    if (!(this.target instanceof SMovableTurnable)) {
      throw new TypeError(`${this.target.constructor.name} does not support position editing`);
    }
    return this.target;
  }

  requireTurnable(): STurnable {
    if (!(this.target instanceof STurnable)) {
      throw new TypeError(`${this.target.constructor.name} does not support rotation editing`);
    }
    return this.target;
  }

  requireModel(): SModel {
    if (!(this.target instanceof SModel)) {
      throw new TypeError(`${this.target.constructor.name} does not support model properties`);
    }
    return this.target;
  }

  requireTextModel(): STextModel {
    if (!(this.target instanceof STextModel)) {
      throw new TypeError(`${this.target.constructor.name} does not support text editing`);
    }
    return this.target;
  }

  resolveVehicle(vehicle: SThing | string | null): SThing | null {
    if (vehicle === null || vehicle instanceof SThing) {
      return vehicle;
    }
    const resolved = this.resolveEntity(vehicle);
    if (!resolved) {
      throw new TypeError(`vehicle \"${vehicle}\" was not found`);
    }
    return resolved;
  }
}

export class TransformEditor {
  constructor(private readonly editor: ObjectPropertyEditor) {}

  setPosition(position: Position): void {
    this.editor.requireMovable().position = clonePosition(position);
  }

  setPositionAxis(axis: keyof Position, value: number): void {
    const target = this.editor.requireMovable();
    target.position = {
      ...target.position,
      [axis]: value,
    };
  }

  setRotation(orientation: Orientation): void {
    this.editor.requireTurnable().orientation = cloneOrientation(orientation);
  }

  setRotationAxis(axis: keyof Orientation, value: number): void {
    const target = this.editor.requireTurnable();
    target.orientation = {
      ...target.orientation,
      [axis]: value,
    };
  }

  setScale(size: Size): void {
    this.editor.requireModel().size = cloneSize(size);
  }

  setScaleAxis(axis: keyof Size, value: number): void {
    const target = this.editor.requireModel();
    target.size = {
      ...target.size,
      [axis]: value,
    };
  }

  setUniformScale(value: number): void {
    this.setScale({ width: value, height: value, depth: value });
  }

  snapshot(): Pick<ObjectPropertySnapshot, "position" | "orientation" | "size"> {
    const snapshot = this.editor.snapshot();
    return {
      position: snapshot.position,
      orientation: snapshot.orientation,
      size: snapshot.size,
    };
  }
}

export class ColorEditor {
  constructor(private readonly editor: ObjectPropertyEditor) {}

  setPaint(color: string): void {
    const target = this.editor.requireModel();
    target.paint = color;
    target.color = color;
  }

  get paint(): string {
    return this.editor.requireModel().paint;
  }

  setAmbient(color: string): void {
    if (this.editor.target instanceof SScene) {
      this.editor.target.setAmbientLightColor(color);
      return;
    }
    const property = (this.editor.target as SThing).imp.getProperty<string>("ambientColor")
      ?? (this.editor.target as SThing).imp.getProperty<string>("color");
    if (!property) {
      throw new TypeError(`${this.editor.target.constructor.name} does not support ambient color editing`);
    }
    property.setValue(color);
  }

  get ambient(): string | null {
    if (this.editor.target instanceof SScene) {
      return this.editor.target.getAmbientLightColor();
    }
    return (this.editor.target as SThing).imp.getProperty<string>("ambientColor")?.value ?? null;
  }
}

export class OpacityEditor {
  constructor(private readonly editor: ObjectPropertyEditor) {}

  setOpacity(opacity: number): void {
    this.editor.requireModel().opacity = opacity;
  }

  get value(): number {
    return this.editor.requireModel().opacity;
  }
}

export class TextPropertyEditor {
  constructor(private readonly editor: ObjectPropertyEditor) {}

  setValue(text: string): void {
    this.editor.requireTextModel().value = text;
  }

  insert(offset: number, text: string): void {
    this.editor.requireTextModel().insert(offset, text);
  }

  previewSpeech(kind: "say" | "think", text: string, duration = 1): void {
    const model = this.editor.requireModel();
    if (kind === "say") {
      model.say(text, duration);
      return;
    }
    model.think(text, duration);
  }

  snapshot(): { value: string | null; spoken: string | null; thought: string | null } {
    const target = this.editor.target;
    return {
      value: target instanceof STextModel ? target.value : null,
      spoken: target instanceof SModel ? target.lastSpokenText : null,
      thought: target instanceof SModel ? target.lastThoughtText : null,
    };
  }
}

export class VehicleEditor {
  constructor(private readonly editor: ObjectPropertyEditor) {}

  setVehicle(vehicle: SThing | string | null): void {
    this.editor.requireModel().vehicle = this.editor.resolveVehicle(vehicle);
  }

  clear(): void {
    this.setVehicle(null);
  }

  get vehicle(): SThing | null {
    return this.editor.requireModel().vehicle;
  }
}
