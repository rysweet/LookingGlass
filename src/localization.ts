type CanonicalLocale = "en" | "es" | "zh";
export type SupportedLocale = CanonicalLocale | "zh-CN" | "zh-TW";

interface LocalizationBundle {
  readonly ui: Record<string, string>;
  readonly methodNames: Record<string, string>;
  readonly typeNames: Record<string, string>;
  readonly templates: Record<string, string>;
}

const LOCALE_ALIASES: Record<string, CanonicalLocale> = {
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  zh: "zh",
  "zh-cn": "zh",
  "zh-sg": "zh",
  "zh-tw": "zh",
  "zh-hk": "zh",
};

const EN_BUNDLE: LocalizationBundle = {
  ui: {
    null: "unset",
    this: "this",
    get: "get ",
    set: "set ",
    classes: "classes",
    new: "new",
    constant: "constant",
    emptyWorld: "Empty World",
  },
  methodNames: {
    move: "move",
    say: "say",
    turn: "turn",
    distanceTo: "distance to",
    vehicle: "vehicle",
    opacity: "opacity",
  },
  typeNames: {
    Scene: "Scene",
    Program: "Program",
    SScene: "Scene",
    SGround: "ground",
    Bunny: "Bunny",
    camera: "camera",
    "java.lang.Boolean": "Boolean",
    "java.lang.Double": "DecimalNumber",
    "java.lang.Integer": "WholeNumber",
    "java.lang.String": "TextString",
    "org.lgna.story.SScene": "Scene",
    "org.lgna.story.SGround": "ground",
  },
  templates: {
    MethodInvocation: "{expression} {method} {arguments}",
    DoInOrder: "do in order\n\t{body}",
    NullLiteral: "unset",
    ThisExpression: "this",
  },
};

const ES_BUNDLE: LocalizationBundle = {
  ui: {
    null: "no establecido",
    this: "este",
    get: "obtener ",
    set: "establecer ",
    classes: "clases",
    new: "nuevo",
    constant: "constante",
    emptyWorld: "Mundo vacío",
  },
  methodNames: {
    move: "mover",
    say: "decir",
    turn: "girar",
    distanceTo: "distancia a",
    vehicle: "vehículo",
    opacity: "opacidad",
  },
  typeNames: {
    Scene: "Escena",
    Program: "Programa",
    SScene: "Escena",
    SGround: "suelo",
    Bunny: "Conejito",
    camera: "cámara",
    "java.lang.Boolean": "Booleano",
    "java.lang.Double": "NúmeroDecimal",
    "java.lang.Integer": "NúmeroEntero",
    "java.lang.String": "Texto",
    "org.lgna.story.SScene": "Escena",
    "org.lgna.story.SGround": "suelo",
  },
  templates: {
    MethodInvocation: "{expression} {method} {arguments}",
    DoInOrder: "hacer en orden\n\t{body}",
    NullLiteral: "no establecido",
    ThisExpression: "este",
  },
};

const ZH_BUNDLE: LocalizationBundle = {
  ui: {
    null: "未设置",
    this: "这个",
    get: "获取",
    set: "设置",
    classes: "类",
    new: "新建",
    constant: "常量",
    emptyWorld: "空世界",
  },
  methodNames: {
    move: "移动",
    say: "说",
    turn: "转动",
    distanceTo: "距离",
    vehicle: "载具",
    opacity: "透明度",
  },
  typeNames: {
    Scene: "场景",
    Program: "程序",
    SScene: "场景",
    SGround: "地面",
    Bunny: "兔子",
    camera: "相机",
    "java.lang.Boolean": "布尔值",
    "java.lang.Double": "小数",
    "java.lang.Integer": "整数",
    "java.lang.String": "文本",
    "org.lgna.story.SScene": "场景",
    "org.lgna.story.SGround": "地面",
  },
  templates: {
    MethodInvocation: "{expression}{method}{arguments}",
    DoInOrder: "按顺序执行\n\t{body}",
    NullLiteral: "未设置",
    ThisExpression: "这个",
  },
};

const BUNDLES: Record<CanonicalLocale, LocalizationBundle> = {
  en: EN_BUNDLE,
  es: ES_BUNDLE,
  zh: ZH_BUNDLE,
};

let currentLocale: CanonicalLocale = "en";

function canonicalizeLocaleTag(locale?: string | null): string {
  return (locale ?? "en").trim().replaceAll("_", "-").toLowerCase();
}

function decapitalize(value: string): string {
  return value.length > 0 ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function simpleTypeName(typeName: string): string {
  const segments = typeName.split(".");
  return segments[segments.length - 1] ?? typeName;
}

function lookupBundle(locale?: string | null): LocalizationBundle {
  return BUNDLES[normalizeLocale(locale) as CanonicalLocale];
}

function localizeWithAccessorFallback(name: string, table: Record<string, string>, ui: Record<string, string>): string {
  const direct = table[name];
  if (direct) {
    return direct;
  }

  for (const prefix of ["get", "set"] as const) {
    if (name.startsWith(prefix) && name.length > prefix.length) {
      const remainder = decapitalize(name.slice(prefix.length));
      const localizedRemainder = table[remainder] ?? remainder;
      const localizedPrefix = ui[prefix] ?? prefix;
      return `${localizedPrefix}${localizedRemainder}`.trim();
    }
  }

  return name;
}

export function normalizeLocale(locale?: string | null): CanonicalLocale {
  const normalized = canonicalizeLocaleTag(locale);
  return LOCALE_ALIASES[normalized] ?? "en";
}

export function getSupportedLocales(): SupportedLocale[] {
  return ["en", "es", "zh", "zh-CN", "zh-TW"];
}

export function setLocale(locale?: string | null): CanonicalLocale {
  currentLocale = normalizeLocale(locale);
  return currentLocale;
}

export function getLocale(): CanonicalLocale {
  return currentLocale;
}

export function localizeUiString(key: string, locale: string | null = currentLocale): string {
  const bundle = lookupBundle(locale);
  return bundle.ui[key] ?? EN_BUNDLE.ui[key] ?? key;
}

export function localizeMethodName(name: string, locale: string | null = currentLocale): string {
  const bundle = lookupBundle(locale);
  return localizeWithAccessorFallback(name, bundle.methodNames, bundle.ui);
}

export function localizeTypeName(typeName: string, locale: string | null = currentLocale): string {
  const bundle = lookupBundle(locale);
  const byExactName = bundle.typeNames[typeName] ?? EN_BUNDLE.typeNames[typeName];
  if (byExactName) {
    return byExactName;
  }
  const simpleName = simpleTypeName(typeName);
  return bundle.typeNames[simpleName] ?? EN_BUNDLE.typeNames[simpleName] ?? typeName;
}

export function getTemplateText(templateKey: string, locale: string | null = currentLocale): string {
  const bundle = lookupBundle(locale);
  return bundle.templates[templateKey] ?? EN_BUNDLE.templates[templateKey] ?? templateKey;
}

export interface FormatterLike {
  readonly locale: CanonicalLocale;
  getTextForNull(): string;
  getTextForThis(): string;
  getNameForMethod(name: string): string;
  getTextForType(typeName: string): string;
  getTemplateText(key: string): string;
  formatList(values: readonly string[]): string;
}

export class LocalizedFormatter implements FormatterLike {
  readonly locale: CanonicalLocale;

  constructor(locale: string | null = currentLocale) {
    this.locale = normalizeLocale(locale);
  }

  getTextForNull(): string {
    return localizeUiString("null", this.locale);
  }

  getTextForThis(): string {
    return localizeUiString("this", this.locale);
  }

  getNameForMethod(name: string): string {
    return localizeMethodName(name, this.locale);
  }

  getTextForType(typeName: string): string {
    return localizeTypeName(typeName, this.locale);
  }

  getTemplateText(key: string): string {
    return getTemplateText(key, this.locale);
  }

  formatList(values: readonly string[]): string {
    if (values.length === 0) {
      return "";
    }
    const localeTag = this.locale === "zh" ? "zh-CN" : this.locale;
    return new Intl.ListFormat(localeTag, { style: "long", type: "conjunction" }).format([...values]);
  }
}

export function createFormatter(locale: string | null = currentLocale): LocalizedFormatter {
  return new LocalizedFormatter(locale);
}
