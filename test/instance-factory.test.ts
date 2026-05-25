import { describe, expect, it } from "vitest";
import {
  FieldAccess,
  JavaMethod,
  LocalAccess,
  MethodInvocation,
  NamedUserType,
  ParameterAccess,
  ThisExpression,
  UserField,
  UserParameter,
  simpleTypeRef,
} from "../src/ast-nodes";
import {
  GlobalFirstInstanceSceneFactory,
  ThisFieldAccessFactory,
  createFactoryFromTypeSelection,
  resolveInstanceFactory,
} from "../src/instance-factory";

describe("instance factory system", () => {
  it("creates this-field access expressions", () => {
    const bunnyField = new UserField("bunny", simpleTypeRef("SBunny"), null, false, false);
    const sceneType = new NamedUserType("Scene", null, null, [], [], [bunnyField]);

    const factory = new ThisFieldAccessFactory(bunnyField, sceneType.toTypeRef());
    const expression = factory.createExpression();

    expect(factory.isValid({ currentType: sceneType })).toBe(true);
    expect(factory.getValueType()).toEqual(simpleTypeRef("SBunny"));
    expect(factory.getRepr()).toBe("this.bunny");
    expect(expression).toBeInstanceOf(FieldAccess);
    expect((expression as FieldAccess).memberName).toBe("bunny");
  });

  it("creates global-first scene expressions from the selected scene field", () => {
    const sceneField = new UserField("scene", simpleTypeRef("Scene"), null, false, false);
    new NamedUserType("Program", null, null, [], [], [sceneField]);

    const factory = new GlobalFirstInstanceSceneFactory(sceneField);
    const expression = factory.createExpression();

    expect(factory.getRepr()).toBe("scene");
    expect(expression).toBeInstanceOf(FieldAccess);
    expect((expression as FieldAccess).memberName).toBe("scene");
  });

  it("creates instance creations from type selections", () => {
    const factory = createFactoryFromTypeSelection("SBunny");
    const expression = factory.createExpression();

    expect(factory.getRepr()).toBe("SBunny");
    expect(expression.getType()).toEqual(simpleTypeRef("SBunny"));
  });

  it("resolves field and method access chains", () => {
    const vehicleField = new UserField("vehicle", simpleTypeRef("SVehicle"), null, false, false);
    const getDriver = new JavaMethod("getDriver", simpleTypeRef("SDriver"));
    new NamedUserType("Scene", null, null, [], [], [vehicleField]);

    const expression = new MethodInvocation(
      new FieldAccess(new ThisExpression(simpleTypeRef("Scene")), "vehicle", vehicleField),
      "getDriver",
      [],
      getDriver,
    );

    const factory = resolveInstanceFactory(expression);

    expect(factory?.getRepr()).toBe("this.vehicle.getDriver()");
    expect(factory?.createExpression()).toBeInstanceOf(MethodInvocation);
    expect(factory?.getValueType()).toEqual(simpleTypeRef("SDriver"));
  });

  it("resolves local and parameter access factories", () => {
    const localFactory = resolveInstanceFactory(new LocalAccess("camera", simpleTypeRef("SCamera")));
    const parameterFactory = resolveInstanceFactory(new ParameterAccess(new UserParameter("target", simpleTypeRef("SThing"))));

    expect(localFactory?.getRepr()).toBe("camera");
    expect(localFactory?.getValueType()).toEqual(simpleTypeRef("SCamera"));
    expect(parameterFactory?.getRepr()).toBe("target");
    expect(parameterFactory?.getValueType()).toEqual(simpleTypeRef("SThing"));
  });
});
