import type { AnimationClip, AnimationObserver, AnimationStyleLike } from "../animation";
import type { Scene } from "./expanded-scene";
import {
  IDENTITY_ORIENTATION,
  UNIT_SCALE,
  UNIT_SIZE,
  ZERO_POSITION,
} from "./expanded-math";
import {
  AxesImp,
  BillboardImp,
  BoxImp,
  CameraImp,
  CameraMarkerImp,
  ConeImp,
  CylinderImp,
  DiscImp,
  EntityImp,
  GroundImp,
  JointImp,
  JointedModelImp,
  MarkerImp,
  ModelImp,
  ObjectMarkerImp,
  ProgramImp,
  SceneImp,
  SphereImp,
  SunImp,
  TargetImp,
  TextModelImp,
  TorusImp,
  TransformableImp,
  type ImplementableEntity,
} from "./expanded-implementation";
import type {
  JointId,
  JointNode,
  MoveDirection,
  Orientation,
  Position,
  RollDirection,
  Size,
  SpatialRelation,
  SpeechBubbleState,
  TextBubbleEntity,
  TurnDirection,
  Vec3,
} from "./expanded-types";

const nonEmptyString = (value: string): boolean => typeof value === "string" && value.trim().length > 0;

type EntityImpFactory<T extends EntityImp = EntityImp> = (owner: ImplementableEntity) => T;
type NamedEntityImpFactory<T extends EntityImp = EntityImp> = string | null | EntityImpFactory<T>;
type JointAliases = Record<string, string>;

function isEntityImpFactory<T extends EntityImp>(value: NamedEntityImpFactory<T> | undefined): value is EntityImpFactory<T> {
  return typeof value === "function";
}

function joint(name: string, parentName: string | null, children: JointNode[] = []): JointNode {
  return {
    name,
    parentName,
    children,
    localTransform: {
      position: ZERO_POSITION,
      orientation: IDENTITY_ORIENTATION,
    },
  };
}

const GENERIC_JOINTS: JointNode[] = [joint("ROOT", null)];
const GENERIC_JOINT_ALIASES: JointAliases = {};
const BIPED_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("PELVIS_LOWER_BODY", "ROOT", [
      joint("LEFT_HIP", "PELVIS_LOWER_BODY", [joint("LEFT_KNEE", "LEFT_HIP", [joint("LEFT_ANKLE", "LEFT_KNEE", [joint("LEFT_FOOT", "LEFT_ANKLE")])])]),
      joint("RIGHT_HIP", "PELVIS_LOWER_BODY", [joint("RIGHT_KNEE", "RIGHT_HIP", [joint("RIGHT_ANKLE", "RIGHT_KNEE", [joint("RIGHT_FOOT", "RIGHT_ANKLE")])])]),
    ]),
    joint("SPINE_BASE", "ROOT", [
      joint("SPINE_MIDDLE", "SPINE_BASE", [
        joint("SPINE_UPPER", "SPINE_MIDDLE", [
          joint("NECK", "SPINE_UPPER", [joint("HEAD", "NECK", [joint("MOUTH", "HEAD"), joint("LEFT_EYE", "HEAD"), joint("RIGHT_EYE", "HEAD"), joint("LEFT_EYELID", "HEAD"), joint("RIGHT_EYELID", "HEAD")])]),
          joint("RIGHT_CLAVICLE", "SPINE_UPPER", [joint("RIGHT_SHOULDER", "RIGHT_CLAVICLE", [joint("RIGHT_ELBOW", "RIGHT_SHOULDER", [joint("RIGHT_WRIST", "RIGHT_ELBOW", [joint("RIGHT_HAND", "RIGHT_WRIST", [joint("RIGHT_THUMB", "RIGHT_HAND", [joint("RIGHT_THUMB_KNUCKLE", "RIGHT_THUMB")]), joint("RIGHT_INDEX_FINGER", "RIGHT_HAND", [joint("RIGHT_INDEX_FINGER_KNUCKLE", "RIGHT_INDEX_FINGER")]), joint("RIGHT_MIDDLE_FINGER", "RIGHT_HAND", [joint("RIGHT_MIDDLE_FINGER_KNUCKLE", "RIGHT_MIDDLE_FINGER")]), joint("RIGHT_PINKY_FINGER", "RIGHT_HAND", [joint("RIGHT_PINKY_FINGER_KNUCKLE", "RIGHT_PINKY_FINGER")])])])])])]),
          joint("LEFT_CLAVICLE", "SPINE_UPPER", [joint("LEFT_SHOULDER", "LEFT_CLAVICLE", [joint("LEFT_ELBOW", "LEFT_SHOULDER", [joint("LEFT_WRIST", "LEFT_ELBOW", [joint("LEFT_HAND", "LEFT_WRIST", [joint("LEFT_THUMB", "LEFT_HAND", [joint("LEFT_THUMB_KNUCKLE", "LEFT_THUMB")]), joint("LEFT_INDEX_FINGER", "LEFT_HAND", [joint("LEFT_INDEX_FINGER_KNUCKLE", "LEFT_INDEX_FINGER")]), joint("LEFT_MIDDLE_FINGER", "LEFT_HAND", [joint("LEFT_MIDDLE_FINGER_KNUCKLE", "LEFT_MIDDLE_FINGER")]), joint("LEFT_PINKY_FINGER", "LEFT_HAND", [joint("LEFT_PINKY_FINGER_KNUCKLE", "LEFT_PINKY_FINGER")])])])])])]),
        ]),
      ]),
    ]),
  ]),
];
const BIPED_JOINT_ALIASES: JointAliases = {
  PELVIS: "PELVIS_LOWER_BODY",
  SPINE: "SPINE_BASE",
  CHEST: "SPINE_UPPER",
};
const FLYER_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("SPINE_BASE", "ROOT", [
      joint("SPINE_MIDDLE", "SPINE_BASE", [
        joint("SPINE_UPPER", "SPINE_MIDDLE", [
          joint("NECK_0", "SPINE_UPPER", [joint("NECK_1", "NECK_0", [joint("HEAD", "NECK_1", [joint("MOUTH", "HEAD", [joint("LOWER_LIP", "MOUTH")]), joint("LEFT_EYE", "HEAD"), joint("RIGHT_EYE", "HEAD"), joint("LEFT_EYELID", "HEAD"), joint("RIGHT_EYELID", "HEAD")])])]),
          joint("LEFT_WING_SHOULDER", "SPINE_UPPER", [joint("LEFT_WING_ELBOW", "LEFT_WING_SHOULDER", [joint("LEFT_WING_WRIST", "LEFT_WING_ELBOW", [joint("LEFT_WING_TIP", "LEFT_WING_WRIST")])])]),
          joint("RIGHT_WING_SHOULDER", "SPINE_UPPER", [joint("RIGHT_WING_ELBOW", "RIGHT_WING_SHOULDER", [joint("RIGHT_WING_WRIST", "RIGHT_WING_ELBOW", [joint("RIGHT_WING_TIP", "RIGHT_WING_WRIST")])])]),
        ]),
      ]),
    ]),
    joint("PELVIS_LOWER_BODY", "ROOT", [
      joint("TAIL_0", "PELVIS_LOWER_BODY", [joint("TAIL_1", "TAIL_0", [joint("TAIL_2", "TAIL_1")])]),
      joint("LEFT_HIP", "PELVIS_LOWER_BODY", [joint("LEFT_KNEE", "LEFT_HIP", [joint("LEFT_ANKLE", "LEFT_KNEE", [joint("LEFT_FOOT", "LEFT_ANKLE")])])]),
      joint("RIGHT_HIP", "PELVIS_LOWER_BODY", [joint("RIGHT_KNEE", "RIGHT_HIP", [joint("RIGHT_ANKLE", "RIGHT_KNEE", [joint("RIGHT_FOOT", "RIGHT_ANKLE")])])]),
    ]),
  ]),
];
const FLYER_JOINT_ALIASES: JointAliases = {
  BODY: "SPINE_UPPER",
  LEFT_WING: "LEFT_WING_SHOULDER",
  RIGHT_WING: "RIGHT_WING_SHOULDER",
  TAIL: "TAIL_0",
  LEFT_LEG: "LEFT_HIP",
  RIGHT_LEG: "RIGHT_HIP",
};
const QUADRUPED_JOINTS: JointNode[] = [
  joint("ROOT", null, [
    joint("SPINE_BASE", "ROOT", [
      joint("SPINE_MIDDLE", "SPINE_BASE", [
        joint("SPINE_UPPER", "SPINE_MIDDLE", [
          joint("NECK", "SPINE_UPPER", [joint("HEAD", "NECK", [joint("LEFT_EYE", "HEAD"), joint("LEFT_EYELID", "HEAD"), joint("LEFT_EAR", "HEAD"), joint("MOUTH", "HEAD"), joint("RIGHT_EAR", "HEAD"), joint("RIGHT_EYE", "HEAD"), joint("RIGHT_EYELID", "HEAD")])]),
          joint("FRONT_LEFT_CLAVICLE", "SPINE_UPPER", [joint("FRONT_LEFT_SHOULDER", "FRONT_LEFT_CLAVICLE", [joint("FRONT_LEFT_KNEE", "FRONT_LEFT_SHOULDER", [joint("FRONT_LEFT_ANKLE", "FRONT_LEFT_KNEE", [joint("FRONT_LEFT_FOOT", "FRONT_LEFT_ANKLE", [joint("FRONT_LEFT_TOE", "FRONT_LEFT_FOOT")])])])])]),
          joint("FRONT_RIGHT_CLAVICLE", "SPINE_UPPER", [joint("FRONT_RIGHT_SHOULDER", "FRONT_RIGHT_CLAVICLE", [joint("FRONT_RIGHT_KNEE", "FRONT_RIGHT_SHOULDER", [joint("FRONT_RIGHT_ANKLE", "FRONT_RIGHT_KNEE", [joint("FRONT_RIGHT_FOOT", "FRONT_RIGHT_ANKLE", [joint("FRONT_RIGHT_TOE", "FRONT_RIGHT_FOOT")])])])])]),
        ]),
      ]),
    ]),
    joint("PELVIS_LOWER_BODY", "ROOT", [
      joint("TAIL_0", "PELVIS_LOWER_BODY", [joint("TAIL_1", "TAIL_0", [joint("TAIL_2", "TAIL_1", [joint("TAIL_3", "TAIL_2")])])]),
      joint("BACK_LEFT_HIP", "PELVIS_LOWER_BODY", [joint("BACK_LEFT_KNEE", "BACK_LEFT_HIP", [joint("BACK_LEFT_HOCK", "BACK_LEFT_KNEE", [joint("BACK_LEFT_ANKLE", "BACK_LEFT_HOCK", [joint("BACK_LEFT_FOOT", "BACK_LEFT_ANKLE", [joint("BACK_LEFT_TOE", "BACK_LEFT_FOOT")])])])])]),
      joint("BACK_RIGHT_HIP", "PELVIS_LOWER_BODY", [joint("BACK_RIGHT_KNEE", "BACK_RIGHT_HIP", [joint("BACK_RIGHT_HOCK", "BACK_RIGHT_KNEE", [joint("BACK_RIGHT_ANKLE", "BACK_RIGHT_HOCK", [joint("BACK_RIGHT_FOOT", "BACK_RIGHT_ANKLE", [joint("BACK_RIGHT_TOE", "BACK_RIGHT_FOOT")])])])])]),
    ]),
  ]),
];
const QUADRUPED_JOINT_ALIASES: JointAliases = {
  SPINE: "SPINE_UPPER",
  FRONT_LEFT_HIP: "FRONT_LEFT_CLAVICLE",
  FRONT_RIGHT_HIP: "FRONT_RIGHT_CLAVICLE",
  TAIL: "TAIL_0",
};
const PROP_JOINTS: JointNode[] = [joint("ROOT", null, [joint("BODY", "ROOT"), joint("HANDLE", "ROOT"), joint("MARKER", "ROOT")])];
const SLITHERER_JOINTS: JointNode[] = [joint("ROOT", null, [joint("NECK", "ROOT", [joint("HEAD", "NECK", [joint("MOUTH", "HEAD"), joint("LEFT_EYE", "HEAD", [joint("LEFT_EYELID", "LEFT_EYE")]), joint("RIGHT_EYE", "HEAD", [joint("RIGHT_EYELID", "RIGHT_EYE")])])]), joint("SPINE_BASE", "ROOT", [joint("SPINE_MIDDLE", "SPINE_BASE", [joint("SPINE_UPPER", "SPINE_MIDDLE", [joint("TAIL", "SPINE_UPPER")])])])])];
const SWIMMER_JOINTS: JointNode[] = [joint("ROOT", null, [joint("NECK", "ROOT", [joint("HEAD", "NECK", [joint("MOUTH", "HEAD"), joint("LEFT_EYE", "HEAD", [joint("LEFT_EYELID", "LEFT_EYE")]), joint("RIGHT_EYE", "HEAD", [joint("RIGHT_EYELID", "RIGHT_EYE")])])]), joint("FRONT_LEFT_FIN", "ROOT"), joint("FRONT_RIGHT_FIN", "ROOT"), joint("SPINE_BASE", "ROOT", [joint("SPINE_MIDDLE", "SPINE_BASE", [joint("TAIL", "SPINE_MIDDLE")])])])];

export class SThing implements ImplementableEntity {
  #imp: EntityImp;

  constructor(
    nameOrImpFactory: NamedEntityImpFactory = (owner) => new EntityImp(owner),
    impFactory?: EntityImpFactory,
  ) {
    const factory = isEntityImpFactory(nameOrImpFactory)
      ? nameOrImpFactory
      : impFactory ?? ((owner: ImplementableEntity) => new EntityImp(owner));
    this.#imp = factory(this);
    if (!isEntityImpFactory(nameOrImpFactory) && nameOrImpFactory !== undefined) {
      this.setName(nameOrImpFactory);
    }
  }

  get imp(): EntityImp {
    return this.#imp;
  }

  get name(): string | null {
    return this.imp.name;
  }

  set name(value: string | null) {
    this.imp.name = value;
  }

  getName(): string | null {
    return this.name;
  }

  setName(value: string | null): void {
    this.name = value;
  }

  getProperty<T>(name: string): T | undefined {
    return this.imp.getProperty<T>(name)?.value;
  }

  get isShowing(): boolean {
    return this.imp.isShowingProperty.value;
  }

  set isShowing(value: boolean) {
    this.imp.isShowingProperty.value = value;
  }

  delay(duration: number): void {
    this.imp.delay(duration);
  }

  playAudio(audioSource: string): void {
    this.imp.playAudio(audioSource);
  }

  isCollidingWith(other: SThing): boolean {
    return this.imp.isCollidingWith(other.imp);
  }

  getBooleanFromUser(message: string): boolean {
    return this.imp.getBooleanFromUser(message);
  }

  getStringFromUser(message: string): string {
    return this.imp.getStringFromUser(message);
  }

  getDoubleFromUser(message: string): number {
    return this.imp.getDoubleFromUser(message);
  }

  getIntegerFromUser(message: string): number {
    return this.imp.getIntegerFromUser(message);
  }

  toString(): string {
    return this.name ?? `unnamed ${this.constructor.name}`;
  }
}

export class SGround extends SThing {
  constructor() {
    super((owner) => new GroundImp(owner));
  }

  protected get groundImp(): GroundImp {
    return this.imp as GroundImp;
  }

  get opacity(): number {
    return this.groundImp.opacity.value;
  }

  set opacity(value: number) {
    this.groundImp.opacity.value = value;
  }
}

export class SScene extends SThing {
  constructor(name?: string | null) {
    super(name ?? null, (owner) => new SceneImp(owner));
  }

  protected get sceneImp(): SceneImp {
    return this.imp as SceneImp;
  }

  get atmosphereColor(): string | null {
    return this.sceneImp.atmosphereColor.value;
  }

  set atmosphereColor(value: string | null) {
    if (value === null || nonEmptyString(value)) {
      this.sceneImp.atmosphereColor.value = value;
    }
  }

  get ambientLightColor(): string | null {
    return this.sceneImp.fromAboveLightColor.value;
  }

  set ambientLightColor(value: string | null) {
    if (value === null || nonEmptyString(value)) {
      this.sceneImp.fromAboveLightColor.value = value;
    }
  }

  get fromAboveLightColor(): string | null {
    return this.sceneImp.fromAboveLightColor.value;
  }

  set fromAboveLightColor(value: string | null) {
    if (value === null || nonEmptyString(value)) {
      this.sceneImp.fromAboveLightColor.value = value;
    }
  }

  get fromBelowLightColor(): string | null {
    return this.sceneImp.fromBelowLightColor.value;
  }

  set fromBelowLightColor(value: string | null) {
    if (value === null || nonEmptyString(value)) {
      this.sceneImp.fromBelowLightColor.value = value;
    }
  }

  get fogDensity(): number {
    return this.sceneImp.fogDensity.value;
  }

  set fogDensity(value: number) {
    this.sceneImp.fogDensity.value = value;
  }

  getAtmosphereColor(): string | null {
    return this.atmosphereColor;
  }

  setAtmosphereColor(value: string | null): void {
    this.atmosphereColor = value;
  }

  getAmbientLightColor(): string | null {
    return this.ambientLightColor;
  }

  setAmbientLightColor(value: string | null): void {
    this.ambientLightColor = value;
  }

  getFromAboveLightColor(): string | null {
    return this.fromAboveLightColor;
  }

  setFromAboveLightColor(value: string | null): void {
    this.fromAboveLightColor = value;
  }

  getFromBelowLightColor(): string | null {
    return this.fromBelowLightColor;
  }

  setFromBelowLightColor(value: string | null): void {
    this.fromBelowLightColor = value;
  }

  getFogDensity(): number {
    return this.fogDensity;
  }

  setFogDensity(value: number): void {
    this.fogDensity = value;
  }

  addSceneActivationListener(listener: (isActive: boolean, activationCount: number) => void): void {
    this.sceneImp.addSceneActivationListener(listener);
  }

  removeSceneActivationListener(listener: (isActive: boolean, activationCount: number) => void): void {
    this.sceneImp.removeSceneActivationListener(listener);
  }
}

export class STurnable extends SThing {
  constructor(
    nameOrImpFactory: NamedEntityImpFactory<TransformableImp> = (owner) => new TransformableImp(owner),
    impFactory?: EntityImpFactory<TransformableImp>,
  ) {
    super(
      nameOrImpFactory as NamedEntityImpFactory,
      impFactory ?? ((owner) => new TransformableImp(owner)),
    );
  }

  protected get transformableImp(): TransformableImp {
    return this.imp as TransformableImp;
  }

  get orientation(): Orientation {
    return this.transformableImp.orientation.value;
  }

  set orientation(value: Orientation) {
    this.transformableImp.orientation.value = value;
  }

  getOrientation(): Orientation {
    return this.orientation;
  }

  setOrientation(value: Orientation): void {
    this.orientation = value;
  }

  turn(
    direction: TurnDirection,
    amount: number,
    duration = 0,
    style?: AnimationStyleLike,
    observer?: AnimationObserver,
  ): AnimationClip | null {
    return this.transformableImp.turn(direction, amount, duration, style, observer);
  }

  roll(
    direction: RollDirection,
    amount: number,
    duration = 0,
    style?: AnimationStyleLike,
    observer?: AnimationObserver,
  ): AnimationClip | null {
    return this.transformableImp.roll(direction, amount, duration, style, observer);
  }

  turnToFace(target: SThing): void {
    this.transformableImp.turnToFace(target.imp);
  }

  pointAt(target: SThing): void {
    this.transformableImp.pointAt(target.imp);
  }

  orientTo(target: SThing): void {
    this.transformableImp.orientTo(target.imp);
  }

  orientToUpright(): void {
    this.transformableImp.orientToUpright();
  }

  get orientationRelativeToVehicle(): Orientation {
    return this.orientation;
  }

  set orientationRelativeToVehicle(value: Orientation) {
    this.orientation = value;
  }

  isFacing(other: SThing): boolean {
    return this.transformableImp.isFacing(other.imp);
  }

  getDistanceTo(other: SThing): number {
    return this.imp.getDistanceTo(other.imp);
  }

  getDistanceAbove(other: SThing): number {
    return this.imp.getDistanceAbove(other.imp);
  }

  isAbove(other: SThing): boolean {
    return this.getDistanceAbove(other) > 0;
  }

  getDistanceBelow(other: SThing): number {
    return this.imp.getDistanceBelow(other.imp);
  }

  isBelow(other: SThing): boolean {
    return this.getDistanceBelow(other) > 0;
  }

  getDistanceToTheRightOf(other: SThing): number {
    return this.imp.getDistanceToTheRightOf(other.imp);
  }

  isToTheRightOf(other: SThing): boolean {
    return this.getDistanceToTheRightOf(other) > 0;
  }

  getDistanceToTheLeftOf(other: SThing): number {
    return this.imp.getDistanceToTheLeftOf(other.imp);
  }

  isToTheLeftOf(other: SThing): boolean {
    return this.getDistanceToTheLeftOf(other) > 0;
  }

  getDistanceInFrontOf(other: SThing): number {
    return this.imp.getDistanceInFrontOf(other.imp);
  }

  isInFrontOf(other: SThing): boolean {
    return this.getDistanceInFrontOf(other) > 0;
  }

  getDistanceBehind(other: SThing): number {
    return this.imp.getDistanceBehind(other.imp);
  }

  isBehind(other: SThing): boolean {
    return this.getDistanceBehind(other) > 0;
  }
}

export class SMovableTurnable extends STurnable {
  constructor(
    nameOrImpFactory: NamedEntityImpFactory<TransformableImp> = (owner) => new TransformableImp(owner),
    impFactory?: EntityImpFactory<TransformableImp>,
  ) {
    super(
      nameOrImpFactory as NamedEntityImpFactory<TransformableImp>,
      impFactory ?? ((owner) => new TransformableImp(owner)),
    );
  }

  get paint(): string {
    return this.transformableImp.paint.value;
  }

  set paint(value: string) {
    if (nonEmptyString(value)) {
      this.transformableImp.paint.value = value;
    }
  }

  get position(): Position {
    return this.transformableImp.position.value;
  }

  set position(value: Position) {
    this.transformableImp.position.value = value;
  }

  getPosition(): Position {
    return this.position;
  }

  setPosition(value: Position): void {
    this.position = value;
  }

  move(
    direction: MoveDirection | Vec3,
    amount: number,
    duration = 0,
    style?: AnimationStyleLike,
    observer?: AnimationObserver,
  ): AnimationClip | null {
    return this.transformableImp.move(direction, amount, duration, style, observer);
  }

  moveToward(target: SThing, amount: number): void {
    this.transformableImp.moveToward(target.imp, amount);
  }

  moveAwayFrom(target: SThing, amount: number): void {
    this.transformableImp.moveAwayFrom(target.imp, amount);
  }

  moveTo(target: SThing): void {
    this.transformableImp.moveTo(target.imp);
  }

  moveAndOrientTo(target: SThing): void {
    this.transformableImp.moveAndOrientTo(target.imp);
  }

  place(spatialRelation: SpatialRelation, target: SThing, offset = 0): void {
    this.transformableImp.place(spatialRelation, target.imp, offset);
  }

  get positionRelativeToVehicle(): Position {
    return this.position;
  }

  set positionRelativeToVehicle(value: Position) {
    this.position = value;
  }
}

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

export abstract class SShape extends SModel {}
export class SBox extends SShape { constructor() { super((owner) => new BoxImp(owner)); } }
export class SSphere extends SShape { constructor() { super((owner) => new SphereImp(owner)); } protected get sphereImp(): SphereImp { return this.imp as SphereImp; } get radius(): number { return this.sphereImp.radius.value; } set radius(value: number) { this.sphereImp.radius.value = value; } }
export class SDisc extends SShape { constructor() { super((owner) => new DiscImp(owner)); } protected get discImp(): DiscImp { return this.imp as DiscImp; } get radius(): number { return this.discImp.outerRadius.value; } set radius(value: number) { this.discImp.outerRadius.value = value; } }
export class SCone extends SShape { constructor() { super((owner) => new ConeImp(owner)); } protected get coneImp(): ConeImp { return this.imp as ConeImp; } get baseRadius(): number { return this.coneImp.baseRadius.value; } set baseRadius(value: number) { this.coneImp.baseRadius.value = value; } get length(): number { return this.coneImp.length.value; } set length(value: number) { this.coneImp.length.value = value; } }
export class SCylinder extends SShape { constructor() { super((owner) => new CylinderImp(owner)); } protected get cylinderImp(): CylinderImp { return this.imp as CylinderImp; } get radius(): number { return this.cylinderImp.radius.value; } set radius(value: number) { this.cylinderImp.radius.value = value; } get length(): number { return this.cylinderImp.length.value; } set length(value: number) { this.cylinderImp.length.value = value; } }
export class STorus extends SShape { constructor() { super((owner) => new TorusImp(owner)); } protected get torusImp(): TorusImp { return this.imp as TorusImp; } get innerRadius(): number { return this.torusImp.innerRadius.value; } set innerRadius(value: number) { this.torusImp.innerRadius.value = value; } get outerRadius(): number { return this.torusImp.outerRadius.value; } set outerRadius(value: number) { this.torusImp.outerRadius.value = value; } }
export class SAxes extends SShape { constructor() { super((owner) => new AxesImp(owner)); } }
export class SBillboard extends SModel { constructor() { super((owner) => new BillboardImp(owner)); } protected get billboardImp(): BillboardImp { return this.imp as BillboardImp; } get backPaint(): string { return this.billboardImp.backPaint.value; } set backPaint(value: string) { if (nonEmptyString(value)) { this.billboardImp.backPaint.value = value; } } }
export class STextModel extends SModel { constructor() { super((owner) => new TextModelImp(owner)); } protected get textModelImp(): TextModelImp { return this.imp as TextModelImp; } get value(): string { return this.textModelImp.value; } set value(text: string) { this.textModelImp.value = text; } append(value: unknown): void { this.textModelImp.append(value); } charAt(index: number): string { return this.textModelImp.charAt(index); } delete(start: number, end: number): void { this.textModelImp.delete(start, end); } deleteCharAt(index: number): void { this.textModelImp.deleteCharAt(index); } indexOf(value: string, fromIndex?: number): number { return this.textModelImp.indexOf(value, fromIndex); } lastIndexOf(value: string, fromIndex?: number): number { return this.textModelImp.lastIndexOf(value, fromIndex); } insert(offset: number, value: unknown): void { this.textModelImp.insert(offset, value); } get length(): number { return this.textModelImp.getLength(); } replace(start: number, end: number, value: string): void { this.textModelImp.replace(start, end, value); } setCharAt(index: number, value: string): void { this.textModelImp.setCharAt(index, value); } }

export class SMarker extends SMovableTurnable {
  constructor(
    nameOrImpFactory: NamedEntityImpFactory<MarkerImp> = (owner) => new MarkerImp(owner),
    impFactory?: EntityImpFactory<MarkerImp>,
  ) {
    super(
      nameOrImpFactory as NamedEntityImpFactory<TransformableImp>,
      impFactory ?? ((owner) => new MarkerImp(owner)),
    );
  }

  protected get markerImp(): MarkerImp {
    return this.imp as MarkerImp;
  }

  get size(): Size {
    return this.markerImp.size.value;
  }

  set size(value: Size) {
    this.markerImp.size.value = value;
  }

  get colorId(): string {
    return this.markerImp.color.value;
  }

  set colorId(value: string) {
    if (nonEmptyString(value)) {
      this.markerImp.color.value = value;
    }
  }

  get opacity(): number {
    return this.markerImp.opacity.value;
  }

  set opacity(value: number) {
    this.markerImp.opacity.value = value;
  }
}

export class SThingMarker extends SMarker { constructor() { super((owner) => new ObjectMarkerImp(owner)); } }
export class SCameraMarker extends SMarker { constructor() { super((owner) => new CameraMarkerImp(owner)); } }
export class STarget extends SMovableTurnable { constructor() { super((owner) => new TargetImp(owner)); } }
export class SSun extends STurnable { constructor() { super((owner) => new SunImp(owner)); } }

export class SJoint extends SMovableTurnable {
  readonly parent?: string;

  constructor(jointImp: JointImp) {
    super(() => jointImp);
    const jointId = jointImp.getJointId();
    this.parent = jointId.parent;
  }

  protected get jointImp(): JointImp {
    return this.imp as JointImp;
  }

  get isPivotVisible(): boolean {
    return this.jointImp.pivotVisible.value;
  }

  set isPivotVisible(value: boolean) {
    this.jointImp.pivotVisible.value = value;
  }

  get width(): number { return this.jointImp.size.value.width; }
  get height(): number { return this.jointImp.size.value.height; }
  get depth(): number { return this.jointImp.size.value.depth; }
}

export class SJointedModel extends SModel {
  readonly #jointCache = new Map<string, SJoint>();
  readonly #jointAliases: JointAliases;

  constructor(
    nameOrJointHierarchy?: string | JointNode[] | null,
    jointHierarchy: JointNode[] = GENERIC_JOINTS,
    jointAliases: JointAliases = GENERIC_JOINT_ALIASES,
  ) {
    const initialName = typeof nameOrJointHierarchy === "string" || nameOrJointHierarchy === null
      ? nameOrJointHierarchy
      : undefined;
    const hierarchy = Array.isArray(nameOrJointHierarchy) ? nameOrJointHierarchy : jointHierarchy;
    super(initialName ?? null, (owner) => new JointedModelImp(owner, hierarchy));
    this.#jointAliases = Object.fromEntries(
      Object.entries(jointAliases).map(([alias, canonical]) => [alias.toUpperCase(), canonical]),
    );
  }

  protected get jointedModelImp(): JointedModelImp {
    return this.imp as JointedModelImp;
  }

  protected joint(name: string): SJoint | undefined {
    return this.getJoint(name);
  }

  #resolveJointName(nameOrId: string | JointId): string {
    const requestedName = typeof nameOrId === "string" ? nameOrId : nameOrId.name;
    return this.#jointAliases[requestedName.toUpperCase()] ?? requestedName;
  }

  getJoint(nameOrId: string | JointId): SJoint | undefined {
    return this.getJointEntity(nameOrId);
  }

  getJointId(nameOrId: string | JointId): JointId | undefined {
    return this.jointedModelImp.getJoint(this.#resolveJointName(nameOrId));
  }

  getJointEntity(nameOrId: string | JointId): SJoint | undefined {
    const resolvedName = this.#resolveJointName(nameOrId);
    const key = resolvedName.toUpperCase();
    const cached = this.#jointCache.get(key);
    if (cached) return cached;
    const jointImp = this.jointedModelImp.getJointImplementation(resolvedName);
    if (!jointImp) return undefined;
    const jointEntity = new SJoint(jointImp);
    this.#jointCache.set(key, jointEntity);
    return jointEntity;
  }

  getJoints(): readonly SJoint[] {
    return this.jointedModelImp.getJoints().map((jointImp) => this.getJointEntity(jointImp.getJointId().name)!);
  }

  getJointHierarchy(): JointNode[] {
    return this.jointedModelImp.jointHierarchy;
  }

  straightenOutJoints(): void {
    this.jointedModelImp.straightenOutJoints();
  }

  strikePose(pose: Record<string, Partial<{ position: Position; orientation: Orientation }>>): void {
    this.jointedModelImp.strikePose(pose);
  }
}

export class SBiped extends SJointedModel {
  constructor(name?: string | null) {
    super(name, BIPED_JOINTS, BIPED_JOINT_ALIASES);
  }

  getRoot(): SJoint | undefined { return this.joint("ROOT"); }
  getPelvis(): SJoint | undefined { return this.joint("PELVIS_LOWER_BODY"); }
  getSpineBase(): SJoint | undefined { return this.joint("SPINE_BASE"); }
  getSpineMiddle(): SJoint | undefined { return this.joint("SPINE_MIDDLE"); }
  getSpineUpper(): SJoint | undefined { return this.joint("SPINE_UPPER"); }
  getNeck(): SJoint | undefined { return this.joint("NECK"); }
  getHead(): SJoint | undefined { return this.joint("HEAD"); }
  getMouth(): SJoint | undefined { return this.joint("MOUTH"); }
  getLeftEye(): SJoint | undefined { return this.joint("LEFT_EYE"); }
  getRightEye(): SJoint | undefined { return this.joint("RIGHT_EYE"); }
  getLeftEyelid(): SJoint | undefined { return this.joint("LEFT_EYELID"); }
  getRightEyelid(): SJoint | undefined { return this.joint("RIGHT_EYELID"); }
  getLeftHip(): SJoint | undefined { return this.joint("LEFT_HIP"); }
  getRightHip(): SJoint | undefined { return this.joint("RIGHT_HIP"); }
  getLeftKnee(): SJoint | undefined { return this.joint("LEFT_KNEE"); }
  getRightKnee(): SJoint | undefined { return this.joint("RIGHT_KNEE"); }
  getLeftAnkle(): SJoint | undefined { return this.joint("LEFT_ANKLE"); }
  getRightAnkle(): SJoint | undefined { return this.joint("RIGHT_ANKLE"); }
  getLeftFoot(): SJoint | undefined { return this.joint("LEFT_FOOT"); }
  getRightFoot(): SJoint | undefined { return this.joint("RIGHT_FOOT"); }
  getLeftClavicle(): SJoint | undefined { return this.joint("LEFT_CLAVICLE"); }
  getRightClavicle(): SJoint | undefined { return this.joint("RIGHT_CLAVICLE"); }
  getLeftShoulder(): SJoint | undefined { return this.joint("LEFT_SHOULDER"); }
  getRightShoulder(): SJoint | undefined { return this.joint("RIGHT_SHOULDER"); }
  getLeftElbow(): SJoint | undefined { return this.joint("LEFT_ELBOW"); }
  getRightElbow(): SJoint | undefined { return this.joint("RIGHT_ELBOW"); }
  getLeftWrist(): SJoint | undefined { return this.joint("LEFT_WRIST"); }
  getRightWrist(): SJoint | undefined { return this.joint("RIGHT_WRIST"); }
  getLeftHand(): SJoint | undefined { return this.joint("LEFT_HAND"); }
  getRightHand(): SJoint | undefined { return this.joint("RIGHT_HAND"); }
}

export class SFlyer extends SJointedModel {
  constructor(name?: string | null) {
    super(name, FLYER_JOINTS, FLYER_JOINT_ALIASES);
  }

  getRoot(): SJoint | undefined { return this.joint("ROOT"); }
  getSpineBase(): SJoint | undefined { return this.joint("SPINE_BASE"); }
  getSpineMiddle(): SJoint | undefined { return this.joint("SPINE_MIDDLE"); }
  getSpineUpper(): SJoint | undefined { return this.joint("SPINE_UPPER"); }
  getNeck(): SJoint | undefined { return this.joint("NECK_0"); }
  getHead(): SJoint | undefined { return this.joint("HEAD"); }
  getMouth(): SJoint | undefined { return this.joint("MOUTH"); }
  getLeftEye(): SJoint | undefined { return this.joint("LEFT_EYE"); }
  getRightEye(): SJoint | undefined { return this.joint("RIGHT_EYE"); }
  getLeftEyelid(): SJoint | undefined { return this.joint("LEFT_EYELID"); }
  getRightEyelid(): SJoint | undefined { return this.joint("RIGHT_EYELID"); }
  getLeftWingShoulder(): SJoint | undefined { return this.joint("LEFT_WING_SHOULDER"); }
  getLeftWingElbow(): SJoint | undefined { return this.joint("LEFT_WING_ELBOW"); }
  getLeftWingWrist(): SJoint | undefined { return this.joint("LEFT_WING_WRIST"); }
  getLeftWingTip(): SJoint | undefined { return this.joint("LEFT_WING_TIP"); }
  getRightWingShoulder(): SJoint | undefined { return this.joint("RIGHT_WING_SHOULDER"); }
  getRightWingElbow(): SJoint | undefined { return this.joint("RIGHT_WING_ELBOW"); }
  getRightWingWrist(): SJoint | undefined { return this.joint("RIGHT_WING_WRIST"); }
  getRightWingTip(): SJoint | undefined { return this.joint("RIGHT_WING_TIP"); }
  getTail(): SJoint | undefined { return this.joint("TAIL_0"); }
  getLeftHip(): SJoint | undefined { return this.joint("LEFT_HIP"); }
  getRightHip(): SJoint | undefined { return this.joint("RIGHT_HIP"); }
}

export class SQuadruped extends SJointedModel {
  constructor(name?: string | null) {
    super(name, QUADRUPED_JOINTS, QUADRUPED_JOINT_ALIASES);
  }

  getRoot(): SJoint | undefined { return this.joint("ROOT"); }
  getSpineBase(): SJoint | undefined { return this.joint("SPINE_BASE"); }
  getSpineMiddle(): SJoint | undefined { return this.joint("SPINE_MIDDLE"); }
  getSpineUpper(): SJoint | undefined { return this.joint("SPINE_UPPER"); }
  getNeck(): SJoint | undefined { return this.joint("NECK"); }
  getHead(): SJoint | undefined { return this.joint("HEAD"); }
  getMouth(): SJoint | undefined { return this.joint("MOUTH"); }
  getLeftEye(): SJoint | undefined { return this.joint("LEFT_EYE"); }
  getRightEye(): SJoint | undefined { return this.joint("RIGHT_EYE"); }
  getLeftEar(): SJoint | undefined { return this.joint("LEFT_EAR"); }
  getRightEar(): SJoint | undefined { return this.joint("RIGHT_EAR"); }
  getFrontLeftClavicle(): SJoint | undefined { return this.joint("FRONT_LEFT_CLAVICLE"); }
  getFrontLeftShoulder(): SJoint | undefined { return this.joint("FRONT_LEFT_SHOULDER"); }
  getFrontLeftKnee(): SJoint | undefined { return this.joint("FRONT_LEFT_KNEE"); }
  getFrontLeftAnkle(): SJoint | undefined { return this.joint("FRONT_LEFT_ANKLE"); }
  getFrontLeftFoot(): SJoint | undefined { return this.joint("FRONT_LEFT_FOOT"); }
  getFrontLeftToe(): SJoint | undefined { return this.joint("FRONT_LEFT_TOE"); }
  getFrontRightClavicle(): SJoint | undefined { return this.joint("FRONT_RIGHT_CLAVICLE"); }
  getFrontRightShoulder(): SJoint | undefined { return this.joint("FRONT_RIGHT_SHOULDER"); }
  getFrontRightKnee(): SJoint | undefined { return this.joint("FRONT_RIGHT_KNEE"); }
  getFrontRightAnkle(): SJoint | undefined { return this.joint("FRONT_RIGHT_ANKLE"); }
  getFrontRightFoot(): SJoint | undefined { return this.joint("FRONT_RIGHT_FOOT"); }
  getFrontRightToe(): SJoint | undefined { return this.joint("FRONT_RIGHT_TOE"); }
  getTail(): SJoint | undefined { return this.joint("TAIL_0"); }
  getBackLeftHip(): SJoint | undefined { return this.joint("BACK_LEFT_HIP"); }
  getBackRightHip(): SJoint | undefined { return this.joint("BACK_RIGHT_HIP"); }
}

export class SProp extends SJointedModel { constructor(name?: string | null) { super(name, PROP_JOINTS); } }
export class SSlitherer extends SJointedModel { constructor(name?: string | null) { super(name, SLITHERER_JOINTS); } get head(): SJoint | undefined { return this.getJointEntity("HEAD"); } get tail(): SJoint | undefined { return this.getJointEntity("TAIL"); } }
export class SSwimmer extends SJointedModel { constructor(name?: string | null) { super(name, SWIMMER_JOINTS); } swimTo(entity: SThing): void { this.moveAndOrientTo(entity); } get tail(): SJoint | undefined { return this.getJointEntity("TAIL"); } }

export class SProgram {
  #imp = new ProgramImp();

  get imp(): ProgramImp {
    return this.#imp;
  }

  get activeScene(): Scene | null {
    return this.#imp.activeScene as Scene | null;
  }

  setActiveScene(scene: Scene | null): void {
    this.#imp.setActiveScene(scene);
  }

  get simulationSpeedFactor(): number {
    return this.#imp.simulationSpeedFactor;
  }

  set simulationSpeedFactor(value: number) {
    this.#imp.simulationSpeedFactor = value;
  }
}

export const STORY_API_DEFAULTS = {
  position: ZERO_POSITION,
  orientation: IDENTITY_ORIENTATION,
  size: UNIT_SIZE,
  scale: UNIT_SCALE,
};
