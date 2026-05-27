import type { AnimationClip, AnimationObserver, AnimationStyleLike } from "../animation";
import { CameraImp, ModelImp, TransformableImp } from "./expanded-implementation";
import type { Size, SpeechBubbleState, TextBubbleEntity } from "./expanded-types";
import {
  type EntityImpFactory,
  type NamedEntityImpFactory,
  SMovableTurnable,
  SThing,
} from "./expanded-entities-base-core";

const nonEmptyString = (value: string): boolean => typeof value === "string" && value.trim().length > 0;

export class SCamera extends SMovableTurnable {
  constructor(name?: string | null) {
    super(name ?? null, (owner) => new CameraImp(owner));
  }

  protected get cameraImp(): CameraImp {
    return this.imp as CameraImp;
  }

  moveAndOrientToAGoodVantagePointOf(target: SThing, distance = 8): void {
    this.cameraImp.moveAndOrientToAGoodVantagePointOf(target.imp, distance);
  }

  moveToPointOfView(target: SThing): void {
    this.moveAndOrientTo(target);
  }

  get nearClippingPlaneDistance(): number {
    return this.cameraImp.nearClippingPlaneDistance.value;
  }

  set nearClippingPlaneDistance(value: number) {
    this.cameraImp.nearClippingPlaneDistance.value = value;
  }

  get farClippingPlaneDistance(): number {
    return this.cameraImp.farClippingPlaneDistance.value;
  }

  set farClippingPlaneDistance(value: number) {
    this.cameraImp.farClippingPlaneDistance.value = value;
  }

  get horizontalViewingAngle(): number {
    return this.cameraImp.horizontalViewingAngle.value;
  }

  set horizontalViewingAngle(value: number) {
    this.cameraImp.horizontalViewingAngle.value = value;
  }

  get verticalViewingAngle(): number {
    return this.cameraImp.verticalViewingAngle.value;
  }

  set verticalViewingAngle(value: number) {
    this.cameraImp.verticalViewingAngle.value = value;
  }

  getNearClippingPlaneDistance(): number {
    return this.nearClippingPlaneDistance;
  }

  setNearClippingPlaneDistance(value: number): void {
    this.nearClippingPlaneDistance = value;
  }

  getFarClippingPlaneDistance(): number {
    return this.farClippingPlaneDistance;
  }

  setFarClippingPlaneDistance(value: number): void {
    this.farClippingPlaneDistance = value;
  }

  getHorizontalViewingAngle(): number {
    return this.horizontalViewingAngle;
  }

  setHorizontalViewingAngle(value: number): void {
    this.horizontalViewingAngle = value;
  }

  getVerticalViewingAngle(): number {
    return this.verticalViewingAngle;
  }

  setVerticalViewingAngle(value: number): void {
    this.verticalViewingAngle = value;
  }

  getFieldOfView(): number {
    return this.verticalViewingAngle;
  }

  setFieldOfView(value: number): void {
    this.verticalViewingAngle = value;
    this.horizontalViewingAngle = value;
  }
}

export class SModel extends SMovableTurnable {
  constructor(
    nameOrImpFactory: NamedEntityImpFactory<ModelImp> = (owner) => new ModelImp(owner),
    impFactory?: EntityImpFactory<ModelImp>,
  ) {
    super(
      nameOrImpFactory as NamedEntityImpFactory<TransformableImp>,
      impFactory ?? ((owner) => new ModelImp(owner)),
    );
  }

  protected get modelImp(): ModelImp {
    return this.imp as ModelImp;
  }

  get size(): Size {
    return this.modelImp.size.value;
  }

  set size(value: Size) {
    this.modelImp.size.value = value;
  }

  get scale(): Size {
    return this.modelImp.scale.value;
  }

  set scale(value: Size) {
    this.modelImp.setScale(value);
  }

  get vehicle(): SThing | null {
    return (this.imp.vehicle?.owner as SThing | undefined) ?? null;
  }

  set vehicle(value: SThing | null) {
    if (value === null || value instanceof SThing) {
      this.imp.setVehicle(value?.imp ?? null);
    }
  }

  get color(): string {
    return this.modelImp.color.value;
  }

  set color(value: string) {
    if (nonEmptyString(value)) {
      this.modelImp.setColor(value);
    }
  }

  get opacity(): number {
    return this.modelImp.opacity.value;
  }

  set opacity(value: number) {
    this.modelImp.opacity.value = value;
  }

  get width(): number {
    return this.size.width;
  }

  set width(value: number) {
    this.modelImp.setWidth(value);
  }

  get height(): number {
    return this.size.height;
  }

  set height(value: number) {
    this.modelImp.setHeight(value);
  }

  get depth(): number {
    return this.size.depth;
  }

  set depth(value: number) {
    this.modelImp.setDepth(value);
  }

  setSize(value: Size): void {
    this.modelImp.setSize(value);
  }

  setColor(value: string): void {
    this.modelImp.setColor(value);
  }

  setOpacity(value: number): void {
    this.modelImp.setOpacity(value);
  }

  resize(
    factor: number,
    duration = 0,
    style?: AnimationStyleLike,
    observer?: AnimationObserver,
  ): AnimationClip | null {
    return this.modelImp.resize(factor, duration, style, observer);
  }

  resizeWidth(factor: number): void {
    this.modelImp.resizeWidth(factor);
  }

  resizeHeight(factor: number): void {
    this.modelImp.resizeHeight(factor);
  }

  resizeDepth(factor: number): void {
    this.modelImp.resizeDepth(factor);
  }

  say(text: string, duration = 0): void {
    this.modelImp.say(text, duration);
  }

  think(text: string, duration = 0): void {
    this.modelImp.think(text, duration);
  }

  get speechBubble(): SpeechBubbleState | null {
    return this.modelImp.speechBubble.value;
  }

  get speechBubbleEntity(): TextBubbleEntity | null {
    return this.modelImp.speechBubbleEntity.value;
  }

  get lastSpokenText(): string | null {
    return this.modelImp.lastSpokenText.value;
  }

  get lastThoughtText(): string | null {
    return this.modelImp.lastThoughtText.value;
  }
}
