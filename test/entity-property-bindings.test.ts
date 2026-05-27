import { describe, expect, it } from "vitest";
import { TraditionalStyle } from "../src/animation.js";
import { DerivedProperty, EntityProperty, PropertyAnimation } from "../src/entity-property-bindings.js";
import { type Position } from "../src/story-api/index.js";
import { SMarker, SProp } from "../src/scene-object-hierarchy.js";

describe("entity-property-bindings", () => {
  it("emits property change events with source entity", () => {
    const entity = new SProp();
    const position = new EntityProperty<Position>(entity, "position");
    const events: Array<{ oldX: number; newX: number; source: SProp }> = [];

    position.addListener((event) => {
      events.push({ oldX: event.oldValue.x, newX: event.newValue.x, source: event.source as SProp });
    });
    position.value = { x: 2, y: 0, z: -1 };

    expect(events).toEqual([{ oldX: 0, newX: 2, source: entity }]);
  });

  it("applies numeric constraints when setting values", () => {
    const entity = new SProp();
    const opacity = new EntityProperty(entity, "opacity", { min: 0, max: 1, step: 0.25 });

    opacity.value = 1.2;
    expect(opacity.value).toBe(1);

    opacity.value = 0.62;
    expect(opacity.value).toBe(0.5);
  });

  it("animates entity properties from their current value to a target", () => {
    const entity = new SProp();
    const opacity = new EntityProperty(entity, "opacity", { min: 0, max: 1 });
    const animation = new PropertyAnimation(opacity, 0.25, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);

    expect(animation.update(500).value).toBeCloseTo(0.625, 5);
    expect(entity.opacity).toBeCloseTo(0.625, 5);

    animation.update(500);
    expect(animation.isComplete).toBe(true);
    expect(entity.opacity).toBeCloseTo(0.25, 5);
  });

  it("recomputes derived properties when dependencies change", () => {
    const source = new SProp();
    const target = new SMarker();
    const sourcePosition = new EntityProperty<Position>(source, "position");
    const targetPosition = new EntityProperty<Position>(target, "position");
    const distances: number[] = [];
    const distance = new DerivedProperty("distance", [sourcePosition, targetPosition], () => {
      const left = sourcePosition.value;
      const right = targetPosition.value;
      return Math.hypot(right.x - left.x, right.y - left.y, right.z - left.z);
    });

    distance.addListener((event) => distances.push(event.newValue));
    targetPosition.value = { x: 3, y: 4, z: 0 };

    expect(distance.value).toBe(5);
    expect(distances).toEqual([5]);
  });
});
