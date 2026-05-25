import { describe, expect, it } from "vitest";
import {
  LocalizedFormatter,
  createFormatter,
  getLocale,
  getSupportedLocales,
  getTemplateText,
  localizeMethodName,
  localizeTypeName,
  localizeUiString,
  normalizeLocale,
  setLocale,
} from "../src/localization.js";

describe("localization", () => {
  it("normalizes locale aliases and falls back to english", () => {
    expect(normalizeLocale("es-MX")).toBe("es");
    expect(normalizeLocale("zh_CN")).toBe("zh");
    expect(normalizeLocale("fr-CA")).toBe("en");
  });

  it("tracks the active locale", () => {
    const previous = getLocale();
    expect(setLocale("es")).toBe("es");
    expect(getLocale()).toBe("es");
    setLocale(previous);
  });

  it("localizes method names including get/set accessors", () => {
    expect(localizeMethodName("move", "es")).toBe("mover");
    expect(localizeMethodName("getDistanceTo", "es")).toBe("obtener distancia a");
    expect(localizeMethodName("setVehicle", "zh")).toBe("设置载具");
    expect(localizeMethodName("customMethod", "es")).toBe("customMethod");
  });

  it("localizes type names and ui text", () => {
    expect(localizeTypeName("java.lang.Double", "es")).toBe("NúmeroDecimal");
    expect(localizeTypeName("org.lgna.story.SGround", "zh")).toBe("地面");
    expect(localizeTypeName("org.example.CustomType", "es")).toBe("org.example.CustomType");
    expect(localizeUiString("null", "es")).toBe("no establecido");
    expect(localizeUiString("this", "zh")).toBe("这个");
  });

  it("exposes localized template text", () => {
    expect(getTemplateText("DoInOrder", "en")).toContain("do in order");
    expect(getTemplateText("DoInOrder", "es")).toContain("hacer en orden");
    expect(getTemplateText("NullLiteral", "zh")).toBe("未设置");
  });

  it("creates locale-aware formatters", () => {
    const spanish = new LocalizedFormatter("es");
    const chinese = createFormatter("zh");

    expect(spanish.getTextForNull()).toBe("no establecido");
    expect(spanish.getNameForMethod("setOpacity")).toBe("establecer opacidad");
    expect(spanish.getTextForType("Scene")).toBe("Escena");
    expect(spanish.formatList(["uno", "dos"])).toContain(" y ");

    expect(chinese.getTextForThis()).toBe("这个");
    expect(chinese.getNameForMethod("getDistanceTo")).toBe("获取距离");
    expect(chinese.formatList(["甲", "乙"])).toContain("和");
  });

  it("reports supported locale tags", () => {
    expect(getSupportedLocales()).toEqual(["en", "es", "zh", "zh-CN", "zh-TW"]);
  });
});
