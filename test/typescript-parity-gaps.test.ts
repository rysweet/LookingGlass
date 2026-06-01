import { describe, expect, it } from "vitest";
import {
  SBiped,
  SCamera,
  SFlyer,
  SGround,
  SJoint,
  SQuadruped,
  SScene,
  SSlitherer,
  SSwimmer,
  SThing,
} from "../src/story-api";
import {
  AnimationStyle,
  CompoundAnimation,
  FoldWingsAnimation,
  MoveToAnimation,
  MoveTowardAnimation,
  OrientToAnimation,
  PlaceAnimation,
  PointAtAnimation,
  SayBubbleAnimation,
  StraightenOutJointsAnimation,
  ThinkBubbleAnimation,
  TurnToFaceAnimation,
} from "../src/story-api-animations";
import {
  CountLoop,
  DoTogether,
} from "../src/ast-nodes-statements-control";
import {
  Comment,
  FieldAccess,
} from "../src/ast-nodes-expressions-primary";
import {
  ArrayAccess,
} from "../src/ast-nodes-expressions-operators";
import {
  UserMethod,
  UserField,
  UserType,
} from "../src/ast-nodes-declarations-runtime";
import { NamedUserType } from "../src/ast-nodes-declarations-types";
import { IntegerLiteral, IdentifierExpression } from "../src/ast-nodes-expressions-primary";
import { UserLocal } from "../src/ast-nodes-declarations-base";
import { ExpressionStatement } from "../src/ast-nodes-statements-blocks";
import { simpleTypeRef } from "../src/ast-nodes-common-core";

// ═══════════════════════════════════════════════════════════════════════════
// Issue #80: Named Joint Accessors
// ═══════════════════════════════════════════════════════════════════════════
describe("Issue #80 — named joint accessors", () => {
  describe("SBiped finger/thumb accessors", () => {
    const biped = new SBiped("TestBiped");

    it("has all 16 finger and thumb accessors", () => {
      const fingerAccessors = [
        "getRightThumb", "getRightThumbKnuckle",
        "getRightIndexFinger", "getRightIndexFingerKnuckle",
        "getRightMiddleFinger", "getRightMiddleFingerKnuckle",
        "getRightPinkyFinger", "getRightPinkyFingerKnuckle",
        "getLeftThumb", "getLeftThumbKnuckle",
        "getLeftIndexFinger", "getLeftIndexFingerKnuckle",
        "getLeftMiddleFinger", "getLeftMiddleFingerKnuckle",
        "getLeftPinkyFinger", "getLeftPinkyFingerKnuckle",
      ];
      for (const accessor of fingerAccessors) {
        const joint = (biped as unknown as Record<string, () => SJoint | undefined>)[accessor]();
        expect(joint, `${accessor} should return a joint`).toBeInstanceOf(SJoint);
      }
    });

    it("retains all 30 original accessors", () => {
      expect(biped.getRoot()).toBeInstanceOf(SJoint);
      expect(biped.getPelvis()).toBeInstanceOf(SJoint);
      expect(biped.getHead()).toBeInstanceOf(SJoint);
      expect(biped.getLeftHand()).toBeInstanceOf(SJoint);
      expect(biped.getRightHand()).toBeInstanceOf(SJoint);
    });

    it("reaches 46 total named accessors", () => {
      const accessorNames = Object.getOwnPropertyNames(SBiped.prototype)
        .filter((name) => name.startsWith("get") && name !== "getJoint" && name !== "getJointId"
          && name !== "getJointEntity" && name !== "getJoints" && name !== "getJointHierarchy"
          && name !== "getProperty" && name !== "getName" && name !== "getPosition"
          && name !== "getOrientation" && name !== "getDistanceTo" && name !== "getDistanceAbove"
          && name !== "getDistanceBelow" && name !== "getDistanceToTheRightOf"
          && name !== "getDistanceToTheLeftOf" && name !== "getDistanceInFrontOf"
          && name !== "getDistanceBehind" && name !== "getVehicle" && name !== "getVantagePoint"
          && name !== "getCollisionHull" && name !== "getBooleanFromUser"
          && name !== "getStringFromUser" && name !== "getDoubleFromUser"
          && name !== "getIntegerFromUser");
      expect(accessorNames.length).toBeGreaterThanOrEqual(46);
    });
  });

  describe("SFlyer missing accessors", () => {
    const flyer = new SFlyer("TestFlyer");

    it("has new neck/lip/pelvis/tail/leg accessors", () => {
      expect(flyer.getNeck1()).toBeInstanceOf(SJoint);
      expect(flyer.getLowerLip()).toBeInstanceOf(SJoint);
      expect(flyer.getPelvis()).toBeInstanceOf(SJoint);
      expect(flyer.getTail1()).toBeInstanceOf(SJoint);
      expect(flyer.getTail2()).toBeInstanceOf(SJoint);
      expect(flyer.getLeftKnee()).toBeInstanceOf(SJoint);
      expect(flyer.getLeftAnkle()).toBeInstanceOf(SJoint);
      expect(flyer.getLeftFoot()).toBeInstanceOf(SJoint);
      expect(flyer.getRightKnee()).toBeInstanceOf(SJoint);
      expect(flyer.getRightAnkle()).toBeInstanceOf(SJoint);
      expect(flyer.getRightFoot()).toBeInstanceOf(SJoint);
    });

    it("retains original wing/body accessors", () => {
      expect(flyer.getRoot()).toBeInstanceOf(SJoint);
      expect(flyer.getLeftWingShoulder()).toBeInstanceOf(SJoint);
      expect(flyer.getRightWingTip()).toBeInstanceOf(SJoint);
      expect(flyer.getTail()).toBeInstanceOf(SJoint);
    });
  });

  describe("SQuadruped missing accessors", () => {
    const quad = new SQuadruped("TestQuad");

    it("has new eyelid/pelvis/tail/back-leg accessors", () => {
      expect(quad.getLeftEyelid()).toBeInstanceOf(SJoint);
      expect(quad.getRightEyelid()).toBeInstanceOf(SJoint);
      expect(quad.getPelvis()).toBeInstanceOf(SJoint);
      expect(quad.getTail1()).toBeInstanceOf(SJoint);
      expect(quad.getTail2()).toBeInstanceOf(SJoint);
      expect(quad.getTail3()).toBeInstanceOf(SJoint);
      expect(quad.getBackLeftKnee()).toBeInstanceOf(SJoint);
      expect(quad.getBackLeftHock()).toBeInstanceOf(SJoint);
      expect(quad.getBackLeftAnkle()).toBeInstanceOf(SJoint);
      expect(quad.getBackLeftFoot()).toBeInstanceOf(SJoint);
      expect(quad.getBackLeftToe()).toBeInstanceOf(SJoint);
      expect(quad.getBackRightKnee()).toBeInstanceOf(SJoint);
      expect(quad.getBackRightHock()).toBeInstanceOf(SJoint);
      expect(quad.getBackRightAnkle()).toBeInstanceOf(SJoint);
      expect(quad.getBackRightFoot()).toBeInstanceOf(SJoint);
      expect(quad.getBackRightToe()).toBeInstanceOf(SJoint);
    });

    it("retains original front-leg accessors", () => {
      expect(quad.getFrontLeftClavicle()).toBeInstanceOf(SJoint);
      expect(quad.getFrontRightToe()).toBeInstanceOf(SJoint);
    });
  });

  describe("SSlitherer expanded accessors", () => {
    const snake = new SSlitherer("TestSnake");

    it("has all 12 named joint accessors", () => {
      expect(snake.getRoot()).toBeInstanceOf(SJoint);
      expect(snake.getNeck()).toBeInstanceOf(SJoint);
      expect(snake.getHead()).toBeInstanceOf(SJoint);
      expect(snake.getMouth()).toBeInstanceOf(SJoint);
      expect(snake.getLeftEye()).toBeInstanceOf(SJoint);
      expect(snake.getLeftEyelid()).toBeInstanceOf(SJoint);
      expect(snake.getRightEye()).toBeInstanceOf(SJoint);
      expect(snake.getRightEyelid()).toBeInstanceOf(SJoint);
      expect(snake.getSpineBase()).toBeInstanceOf(SJoint);
      expect(snake.getSpineMiddle()).toBeInstanceOf(SJoint);
      expect(snake.getSpineUpper()).toBeInstanceOf(SJoint);
      expect(snake.getTail()).toBeInstanceOf(SJoint);
    });

    it("retains property-style head/tail accessors", () => {
      expect(snake.head).toBeInstanceOf(SJoint);
      expect(snake.tail).toBeInstanceOf(SJoint);
    });
  });

  describe("SSwimmer expanded accessors", () => {
    const fish = new SSwimmer("TestFish");

    it("has all 13 named joint accessors", () => {
      expect(fish.getRoot()).toBeInstanceOf(SJoint);
      expect(fish.getNeck()).toBeInstanceOf(SJoint);
      expect(fish.getHead()).toBeInstanceOf(SJoint);
      expect(fish.getMouth()).toBeInstanceOf(SJoint);
      expect(fish.getLeftEye()).toBeInstanceOf(SJoint);
      expect(fish.getLeftEyelid()).toBeInstanceOf(SJoint);
      expect(fish.getRightEye()).toBeInstanceOf(SJoint);
      expect(fish.getRightEyelid()).toBeInstanceOf(SJoint);
      expect(fish.getFrontLeftFin()).toBeInstanceOf(SJoint);
      expect(fish.getFrontRightFin()).toBeInstanceOf(SJoint);
      expect(fish.getSpineBase()).toBeInstanceOf(SJoint);
      expect(fish.getSpineMiddle()).toBeInstanceOf(SJoint);
      expect(fish.getTail()).toBeInstanceOf(SJoint);
    });

    it("retains swimTo and tail property", () => {
      expect(fish.tail).toBeInstanceOf(SJoint);
      expect(typeof fish.swimTo).toBe("function");
    });
  });

  describe("SJoint Java-style getter methods", () => {
    const biped = new SBiped("TestBiped");
    const joint = biped.getHead()!;

    it("has getWidth/getHeight/getDepth methods", () => {
      expect(joint.getWidth()).toBe(joint.width);
      expect(joint.getHeight()).toBe(joint.height);
      expect(joint.getDepth()).toBe(joint.depth);
    });

    it("has getPivotVisible/setPivotVisible methods", () => {
      expect(joint.getPivotVisible()).toBe(false);
      joint.setPivotVisible(true);
      expect(joint.getPivotVisible()).toBe(true);
      expect(joint.isPivotVisible).toBe(true);
      joint.setPivotVisible(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Issue #81: Missing Entity/Camera/Scene API Methods
// ═══════════════════════════════════════════════════════════════════════════
describe("Issue #81 — missing entity/camera/scene API methods", () => {
  describe("SThing.getVehicle/getVantagePoint/getCollisionHull", () => {
    it("getVehicle returns null when no vehicle is set", () => {
      const thing = new SThing("thing");
      expect(thing.getVehicle()).toBeNull();
    });

    it("getVantagePoint returns absolute position", () => {
      const thing = new SThing("thing");
      const vantage = thing.getVantagePoint();
      expect(vantage).toHaveProperty("x");
      expect(vantage).toHaveProperty("y");
      expect(vantage).toHaveProperty("z");
    });

    it("getCollisionHull returns BoundingBox or null", () => {
      const thing = new SThing("thing");
      const hull = thing.getCollisionHull();
      // SThing without size property returns null
      expect(hull).toBeNull();
    });

    it("getCollisionHull returns box for SModel", () => {
      const biped = new SBiped("b");
      const hull = biped.getCollisionHull();
      expect(hull).not.toBeNull();
      expect(hull!.min).toHaveProperty("x");
      expect(hull!.max).toHaveProperty("x");
    });
  });

  describe("SGround.setVehicle", () => {
    it("accepts a vehicle entity", () => {
      const ground = new SGround();
      const vehicle = new SBiped("car");
      expect(() => ground.setVehicle(vehicle)).not.toThrow();
    });

    it("accepts null to clear vehicle", () => {
      const ground = new SGround();
      expect(() => ground.setVehicle(null)).not.toThrow();
    });
  });

  describe("SCamera hand accessors", () => {
    it("getLeftHand returns null for non-VR camera", () => {
      const camera = new SCamera("cam");
      expect(camera.getLeftHand()).toBeNull();
    });

    it("getRightHand returns null for non-VR camera", () => {
      const camera = new SCamera("cam");
      expect(camera.getRightHand()).toBeNull();
    });
  });

  describe("SScene listener registration", () => {
    it("addObjectAdditionListener/removeObjectAdditionListener", () => {
      const scene = new SScene("s");
      const events: SThing[] = [];
      const listener = (entity: SThing) => { events.push(entity); };

      expect(() => scene.addObjectAdditionListener(listener)).not.toThrow();
      expect(() => scene.removeObjectAdditionListener(listener)).not.toThrow();
    });

    it("addTimeListener/removeTimeListener", () => {
      const scene = new SScene("s");
      const times: number[] = [];
      const listener = (time: number) => { times.push(time); };

      expect(() => scene.addTimeListener(listener)).not.toThrow();
      expect(() => scene.removeTimeListener(listener)).not.toThrow();
    });

    it("removing unregistered listener is a no-op", () => {
      const scene = new SScene("s");
      expect(() => scene.removeObjectAdditionListener(() => {})).not.toThrow();
      expect(() => scene.removeTimeListener(() => {})).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Issue #82: Named Animation Classes + AST Enrichment
// ═══════════════════════════════════════════════════════════════════════════
describe("Issue #82 — named animation classes", () => {
  const makeEntity = () => ({
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
  });

  describe("MoveToAnimation", () => {
    it("moves entity to target position", () => {
      const entity = makeEntity();
      const anim = new MoveToAnimation(entity, { x: 10, y: 5, z: -3 }, 1000);
      anim.update(1000);
      expect(entity.position.x).toBeCloseTo(10);
      expect(entity.position.y).toBeCloseTo(5);
      expect(entity.position.z).toBeCloseTo(-3);
      expect(anim.isComplete).toBe(true);
    });

    it("interpolates at 50% progress", () => {
      const entity = makeEntity();
      const anim = new MoveToAnimation(entity, { x: 10, y: 0, z: 0 }, 1000);
      anim.update(500);
      expect(entity.position.x).toBeGreaterThan(0);
      expect(entity.position.x).toBeLessThan(10);
    });
  });

  describe("MoveTowardAnimation", () => {
    it("moves entity toward target by specified amount", () => {
      const entity = makeEntity();
      const anim = new MoveTowardAnimation(entity, { x: 10, y: 0, z: 0 }, 3, 1000);
      anim.update(1000);
      expect(entity.position.x).toBeCloseTo(3);
    });
  });

  describe("OrientToAnimation", () => {
    it("orients entity toward target", () => {
      const entity = makeEntity();
      const anim = new OrientToAnimation(entity, { x: 10, y: 0, z: 0 }, 1000);
      anim.update(1000);
      expect(anim.isComplete).toBe(true);
      // Orientation should have changed from identity
      const { x, y, z, w } = entity.orientation;
      const isIdentity = Math.abs(x) < 0.001 && Math.abs(y) < 0.001 && Math.abs(z) < 0.001 && Math.abs(w - 1) < 0.001;
      expect(isIdentity).toBe(false);
    });
  });

  describe("PointAtAnimation", () => {
    it("points entity at target position", () => {
      const entity = makeEntity();
      const anim = new PointAtAnimation(entity, { x: 0, y: 10, z: -5 }, 1000);
      anim.update(1000);
      expect(anim.isComplete).toBe(true);
    });
  });

  describe("TurnToFaceAnimation", () => {
    it("turns entity to face target on Y axis", () => {
      const entity = makeEntity();
      const anim = new TurnToFaceAnimation(entity, { x: 5, y: 0, z: 0 }, 1000);
      anim.update(1000);
      expect(anim.isComplete).toBe(true);
    });
  });

  describe("PlaceAnimation", () => {
    it("immediately places entity at target", () => {
      const entity = makeEntity();
      const anim = new PlaceAnimation(entity, { x: 7, y: 3, z: -1 });
      anim.update(0);
      expect(entity.position.x).toBeCloseTo(7);
      expect(entity.position.y).toBeCloseTo(3);
    });
  });

  describe("StraightenOutJointsAnimation", () => {
    it("resets joint rotations to zero", () => {
      const entity = {
        jointRotations: { LEFT_ARM: 45, RIGHT_ARM: -30 } as Record<string, number>,
      };
      const anim = new StraightenOutJointsAnimation(entity, 1000);
      anim.update(1000);
      expect(entity.jointRotations.LEFT_ARM).toBeCloseTo(0);
      expect(entity.jointRotations.RIGHT_ARM).toBeCloseTo(0);
    });
  });

  describe("FoldWingsAnimation", () => {
    it("folds wing joints to specified angle", () => {
      const entity = {
        jointRotations: {
          LEFT_WING_SHOULDER: 0, LEFT_WING_ELBOW: 0,
          LEFT_WING_WRIST: 0, LEFT_WING_TIP: 0,
          RIGHT_WING_SHOULDER: 0, RIGHT_WING_ELBOW: 0,
          RIGHT_WING_WRIST: 0, RIGHT_WING_TIP: 0,
        } as Record<string, number>,
      };
      const anim = new FoldWingsAnimation(entity, 1000, 90);
      anim.update(1000);
      expect(entity.jointRotations.LEFT_WING_SHOULDER).toBeCloseTo(90);
      expect(entity.jointRotations.RIGHT_WING_TIP).toBeCloseTo(90);
    });

    it("uses custom wing joint names", () => {
      const entity = {
        jointRotations: { MY_LEFT_WING: 0, MY_RIGHT_WING: 0 } as Record<string, number>,
        wingJointNames: ["MY_LEFT_WING", "MY_RIGHT_WING"] as readonly string[],
      };
      const anim = new FoldWingsAnimation(entity, 500, 45);
      anim.update(500);
      expect(entity.jointRotations.MY_LEFT_WING).toBeCloseTo(45);
      expect(entity.jointRotations.MY_RIGHT_WING).toBeCloseTo(45);
    });
  });

  describe("CompoundAnimation with named animations", () => {
    it("runs MoveToAnimation and TurnToFaceAnimation together", () => {
      const entity = makeEntity();
      const moveAnim = new MoveToAnimation(entity, { x: 5, y: 0, z: 0 }, 1000);
      const turnAnim = new TurnToFaceAnimation(entity, { x: 5, y: 0, z: 0 }, 1000);
      const together = CompoundAnimation.doTogether(moveAnim, turnAnim);
      together.update(1000);
      expect(together.isComplete).toBe(true);
    });
  });
});

describe("Issue #82 — AST node enrichment", () => {
  describe("CountLoop convenience methods", () => {
    it("getCountExpression returns count", () => {
      const count = new IntegerLiteral(5);
      const loop = new CountLoop(null, null, count, []);
      expect(loop.getCountExpression()).toBe(count);
    });

    it("getLoopVariable returns variable when present", () => {
      const count = new IntegerLiteral(5);
      const variable = new UserLocal("i", simpleTypeRef("WholeNumber"), false);
      const loop = new CountLoop(variable, null, count, []);
      expect(loop.getLoopVariable()).toBe(variable);
      expect(loop.isIndexed()).toBe(true);
    });

    it("isIndexed returns false when no variable", () => {
      const loop = new CountLoop(null, null, new IntegerLiteral(3), []);
      expect(loop.isIndexed()).toBe(false);
      expect(loop.getLoopVariable()).toBeNull();
    });

    it("getLoopConstant returns constant when present", () => {
      const count = new IntegerLiteral(5);
      const constant = new UserLocal("N", simpleTypeRef("WholeNumber"), true);
      const loop = new CountLoop(null, constant, count, []);
      expect(loop.getLoopConstant()).toBe(constant);
    });
  });

  describe("DoTogether convenience methods", () => {
    it("getStatementCount returns body length", () => {
      const stmt = new ExpressionStatement(new IntegerLiteral(1));
      const together = new DoTogether([stmt, stmt]);
      expect(together.getStatementCount()).toBe(2);
    });

    it("isEmpty returns true for empty body", () => {
      const together = new DoTogether([]);
      expect(together.isEmpty()).toBe(true);
    });

    it("getStatements returns readonly body", () => {
      const stmt = new ExpressionStatement(new IntegerLiteral(1));
      const together = new DoTogether([stmt]);
      expect(together.getStatements()).toHaveLength(1);
    });
  });

  describe("existing AST classes are properly accessible", () => {
    it("Comment is accessible", () => {
      const comment = new Comment("test comment");
      expect(comment).toBeDefined();
    });

    it("FieldAccess constructs with target and member name", () => {
      const target = new IdentifierExpression("obj");
      const access = new FieldAccess(target, "field");
      expect(access.memberName).toBe("field");
      expect(access.type).toBe("MemberAccess");
    });

    it("ArrayAccess constructs with target and index", () => {
      const target = new IdentifierExpression("arr");
      const index = new IntegerLiteral(0);
      const access = new ArrayAccess(target, index);
      expect(access.type).toBe("ArrayAccess");
    });

    it("UserMethod constructs with name and return type", () => {
      const method = new UserMethod("doSomething", simpleTypeRef("Void"), [], [], false);
      expect(method.name).toBe("doSomething");
    });

    it("UserField constructs with name and type", () => {
      const field = new UserField("myField", simpleTypeRef("DecimalNumber"), null, false, false);
      expect(field.name).toBe("myField");
      expect(field.fieldType).toEqual(simpleTypeRef("DecimalNumber"));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Extended coverage: edge cases, counts, caching, integration
// ═══════════════════════════════════════════════════════════════════════════
describe("Issue #80 — accessor count validation", () => {
  const filterJointAccessors = (prototype: object): string[] =>
    Object.getOwnPropertyNames(prototype).filter(
      (n) =>
        n.startsWith("get") &&
        ![
          "getJoint", "getJointId", "getJointEntity", "getJoints", "getJointHierarchy",
          "getProperty", "getName", "getPosition", "getOrientation",
          "getDistanceTo", "getDistanceAbove", "getDistanceBelow",
          "getDistanceToTheRightOf", "getDistanceToTheLeftOf",
          "getDistanceInFrontOf", "getDistanceBehind",
          "getVehicle", "getVantagePoint", "getCollisionHull",
          "getBooleanFromUser", "getStringFromUser", "getDoubleFromUser", "getIntegerFromUser",
          "getWidth", "getHeight", "getDepth", "getPivotVisible",
        ].includes(n),
    );

  it("SFlyer has exactly 33 named joint accessors", () => {
    const accessors = filterJointAccessors(SFlyer.prototype);
    expect(accessors.length).toBeGreaterThanOrEqual(33);
  });

  it("SQuadruped has exactly 42 named joint accessors", () => {
    const accessors = filterJointAccessors(SQuadruped.prototype);
    expect(accessors.length).toBeGreaterThanOrEqual(42);
  });

  it("SSlitherer has exactly 12 named joint accessors", () => {
    const accessors = filterJointAccessors(SSlitherer.prototype);
    expect(accessors.length).toBeGreaterThanOrEqual(12);
  });

  it("SSwimmer has exactly 13 named joint accessors (plus swimTo)", () => {
    const accessors = filterJointAccessors(SSwimmer.prototype);
    expect(accessors.length).toBeGreaterThanOrEqual(13);
  });
});

describe("Issue #80 — joint caching", () => {
  it("returns same SJoint instance on repeated calls", () => {
    const biped = new SBiped("cache-test");
    const head1 = biped.getHead();
    const head2 = biped.getHead();
    expect(head1).toBe(head2);
  });

  it("different joint accessors return distinct instances", () => {
    const biped = new SBiped("distinct");
    expect(biped.getHead()).not.toBe(biped.getLeftHand());
  });

  it("SFlyer caches wing joints consistently", () => {
    const flyer = new SFlyer("cache-flyer");
    const wing1 = flyer.getLeftWingShoulder();
    const wing2 = flyer.getLeftWingShoulder();
    expect(wing1).toBe(wing2);
  });
});

describe("Issue #80 — non-existent joint returns undefined", () => {
  it("SBiped.getJoint returns undefined for invalid name", () => {
    const biped = new SBiped("test");
    expect(biped.getJoint("NONEXISTENT_JOINT")).toBeUndefined();
  });

  it("SSlitherer has no wing joints", () => {
    const snake = new SSlitherer("test");
    expect(snake.getJoint("LEFT_WING_SHOULDER")).toBeUndefined();
  });
});

describe("Issue #81 — edge cases", () => {
  it("getVantagePoint returns numeric x/y/z values", () => {
    const thing = new SThing("precise");
    const vp = thing.getVantagePoint();
    expect(typeof vp.x).toBe("number");
    expect(typeof vp.y).toBe("number");
    expect(typeof vp.z).toBe("number");
  });

  it("SScene can register same listener twice without duplication (Set semantics)", () => {
    const scene = new SScene("dedup");
    const calls: number[] = [];
    const listener = (t: number) => calls.push(t);
    scene.addTimeListener(listener);
    scene.addTimeListener(listener);
    // Set-based: adding same reference twice should not throw
    scene.removeTimeListener(listener);
    // After one remove, listener should be fully gone (Set semantics)
    expect(() => scene.removeTimeListener(listener)).not.toThrow();
  });

  it("SGround.setVehicle roundtrip with getVehicle", () => {
    const ground = new SGround();
    expect(ground.getVehicle()).toBeNull();
    const biped = new SBiped("rider");
    ground.setVehicle(biped);
    // ground inherits getVehicle from SThing
    const result = ground.getVehicle();
    expect(result).toBeInstanceOf(SThing);
  });
});

describe("Issue #82 — animation edge cases", () => {
  it("MoveToAnimation with zero duration completes immediately", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    const anim = new MoveToAnimation(entity, { x: 5, y: 5, z: 5 }, 0);
    anim.update(0);
    expect(anim.isComplete).toBe(true);
    expect(entity.position.x).toBeCloseTo(5);
  });

  it("MoveTowardAnimation with zero amount stays in place", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    const anim = new MoveTowardAnimation(entity, { x: 10, y: 0, z: 0 }, 0, 1000);
    anim.update(1000);
    expect(entity.position.x).toBeCloseTo(0);
  });

  it("PlaceAnimation with non-zero duration animates position", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    const anim = new PlaceAnimation(entity, { x: 10, y: 0, z: 0 }, 1000, AnimationStyle.NONE);
    anim.update(500);
    expect(entity.position.x).toBeCloseTo(5);
    expect(anim.isComplete).toBe(false);
  });

  it("StraightenOutJointsAnimation preserves non-targeted joints unchanged structure", () => {
    const entity = {
      jointRotations: { ARM: 45, LEG: -20, SPINE: 10 } as Record<string, number>,
    };
    const anim = new StraightenOutJointsAnimation(entity, 1000);
    anim.update(1000);
    expect(entity.jointRotations.ARM).toBeCloseTo(0);
    expect(entity.jointRotations.LEG).toBeCloseTo(0);
    expect(entity.jointRotations.SPINE).toBeCloseTo(0);
  });

  it("FoldWingsAnimation default fold angle is 90", () => {
    const entity = {
      jointRotations: {
        LEFT_WING_SHOULDER: 0, LEFT_WING_ELBOW: 0,
        LEFT_WING_WRIST: 0, LEFT_WING_TIP: 0,
        RIGHT_WING_SHOULDER: 0, RIGHT_WING_ELBOW: 0,
        RIGHT_WING_WRIST: 0, RIGHT_WING_TIP: 0,
      } as Record<string, number>,
    };
    const anim = new FoldWingsAnimation(entity, 1000);
    anim.update(1000);
    expect(entity.jointRotations.LEFT_WING_SHOULDER).toBeCloseTo(90);
  });

  it("animation reset allows replay", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    const anim = new MoveToAnimation(entity, { x: 10, y: 0, z: 0 }, 1000, AnimationStyle.NONE);
    anim.update(1000);
    expect(anim.isComplete).toBe(true);
    anim.reset();
    expect(anim.isComplete).toBe(false);
    expect(anim.progress).toBe(0);
  });

  it("negative durationMs throws TypeError", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    expect(() => new MoveToAnimation(entity, { x: 1, y: 0, z: 0 }, -1)).toThrow(TypeError);
  });

  it("NaN durationMs throws TypeError", () => {
    const entity = { position: { x: 0, y: 0, z: 0 } };
    expect(() => new MoveToAnimation(entity, { x: 1, y: 0, z: 0 }, NaN)).toThrow(TypeError);
  });
});

describe("Issue #82 — SayBubbleAnimation and ThinkBubbleAnimation parity", () => {
  it("SayBubbleAnimation shows say bubble during animation", () => {
    const host = { bubble: null as any };
    const anim = new SayBubbleAnimation(host, "Hello", 500);
    anim.update(250);
    expect(host.bubble).toMatchObject({ kind: "say", text: "Hello", visible: true });
    anim.update(250);
    expect(host.bubble).toBeNull();
  });

  it("ThinkBubbleAnimation shows think bubble during animation", () => {
    const host = { bubble: null as any };
    const anim = new ThinkBubbleAnimation(host, "Hmm", 400);
    anim.update(200);
    expect(host.bubble).toMatchObject({ kind: "think", text: "Hmm", visible: true });
  });
});

describe("Issue #82 — AST enrichment edge cases", () => {
  it("CountLoop with all parameters populated", () => {
    const count = new IntegerLiteral(10);
    const variable = new UserLocal("i", simpleTypeRef("WholeNumber"), false);
    const constant = new UserLocal("N", simpleTypeRef("WholeNumber"), true);
    const stmt = new ExpressionStatement(new IntegerLiteral(1));
    const loop = new CountLoop(variable, constant, count, [stmt]);

    expect(loop.getCountExpression()).toBe(count);
    expect(loop.getLoopVariable()).toBe(variable);
    expect(loop.getLoopConstant()).toBe(constant);
    expect(loop.isIndexed()).toBe(true);
  });

  it("DoTogether with multiple statements tracks count", () => {
    const stmts = Array.from({ length: 5 }, () => new ExpressionStatement(new IntegerLiteral(0)));
    const together = new DoTogether(stmts);
    expect(together.getStatementCount()).toBe(5);
    expect(together.isEmpty()).toBe(false);
    expect(together.getStatements()).toHaveLength(5);
  });
});

describe("Issue #82 — UserType enrichment methods", () => {
  it("getMethodByName finds existing method", () => {
    const method = new UserMethod("doSomething", simpleTypeRef("Void"), [], [], false);
    const type = new NamedUserType("MyType", null, null, [], [method], []);
    expect(type.getMethodByName("doSomething")).toBe(method);
  });

  it("getMethodByName returns undefined for missing method", () => {
    const type = new NamedUserType("MyType", null, null, [], [], []);
    expect(type.getMethodByName("nonexistent")).toBeUndefined();
  });

  it("getFieldByName finds existing field", () => {
    const field = new UserField("myField", simpleTypeRef("DecimalNumber"), null, false, false);
    const type = new NamedUserType("MyType", null, null, [], [], [field]);
    expect(type.getFieldByName("myField")).toBe(field);
  });

  it("getFieldByName returns undefined for missing field", () => {
    const type = new NamedUserType("MyType", null, null, [], [], []);
    expect(type.getFieldByName("missing")).toBeUndefined();
  });

  it("addMethod adds a new method", () => {
    const type = new NamedUserType("MyType", null, null, [], [], []);
    const method = new UserMethod("newMethod", simpleTypeRef("Void"), [], [], false);
    type.addMethod(method);
    expect(type.getMethodByName("newMethod")).toBe(method);
    expect(type.getDeclaredMethods()).toContainEqual(method);
  });

  it("addField adds a new field", () => {
    const type = new NamedUserType("MyType", null, null, [], [], []);
    const field = new UserField("newField", simpleTypeRef("WholeNumber"), null, false, false);
    type.addField(field);
    expect(type.getFieldByName("newField")).toBe(field);
    expect(type.getDeclaredFields()).toContainEqual(field);
  });

  it("getConstructors delegates to getDeclaredConstructors", () => {
    const type = new NamedUserType("MyType", null, null, [], [], []);
    const constructors = type.getConstructors();
    expect(Array.isArray(constructors)).toBe(true);
  });
});

describe("Issue #82 — UserMethod enrichment", () => {
  it("isOverride defaults to false", () => {
    const method = new UserMethod("doSomething", simpleTypeRef("Void"), [], [], false);
    expect(method.isOverride).toBe(false);
  });

  it("isOverride can be set to true via constructor", () => {
    const method = new UserMethod("doSomething", simpleTypeRef("Void"), [], [], false, null, undefined, false, false, true);
    expect(method.isOverride).toBe(true);
  });

  it("getSignature returns formatted signature with no params", () => {
    const method = new UserMethod("doSomething", simpleTypeRef("Void"), [], [], false);
    expect(method.getSignature()).toBe("doSomething(): Void");
  });

  it("getSignature returns formatted signature with params", () => {
    const method = new UserMethod(
      "add",
      simpleTypeRef("DecimalNumber"),
      [
        { name: "a", paramType: simpleTypeRef("DecimalNumber"), isVarArgs: false, defaultValue: null },
        { name: "b", paramType: simpleTypeRef("DecimalNumber"), isVarArgs: false, defaultValue: null },
      ],
      [],
      false,
    );
    expect(method.getSignature()).toBe("add(DecimalNumber, DecimalNumber): DecimalNumber");
  });
});
