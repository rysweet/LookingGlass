import {
  getTemplateText as getLocalizedTemplateText,
  localizeMethodName,
  localizeTypeName,
  localizeUiString,
  normalizeLocale,
} from "./localization.js";

export type FormatterId = "alice" | "java" | (string & {});
export type CodeKind = "procedure" | "function" | "method" | "constructor";

export interface CodeDescriptor {
  readonly kind: CodeKind;
  readonly name?: string;
  readonly parameters?: readonly string[];
  readonly returnType?: string | null;
  readonly declaringType?: string | null;
}

export interface MethodInvocationDescriptor {
  readonly target?: string | null;
  readonly methodName: string;
  readonly arguments?: readonly string[];
}

export interface NewExpressionDescriptor {
  readonly typeName: string;
  readonly arguments?: readonly string[];
}

const JAVA_TEMPLATES: Readonly<Record<string, string>> = {
  ExpressionStatement: "</expression/>;",
  WhileLoop: "while( </conditional/> ) {\n\t</body/>\n}",
  CountLoop: "for( </__variable__/> = 0; </_variable_/> < </count/>; </_variable_/>++ ) {\n\t</body/>\n}",
  ConditionalStatement: "</booleanExpressionBodyPairs/>\n} else {\n\t</elseBody/>\n}",
  MethodInvocation: "</expression/></method/>(</requiredArguments/></variableArguments/></keyedArguments/>)",
  FieldAccess: "</expression/>.</field/>",
  LocalDeclarationStatement: "</__local__/> = </initializer/> ;",
  DoInOrder: "/*do in order*/ {\n\t</body/>\n}",
  DoTogether: "ThreadUtilities.doTogether( ()-> {\n\t</body/>\n} );",
  ForEachInArrayLoop: "for( </__item__/> : </array/> ) {\n\t</body/>\n}",
  TypeExpression: "</value/>",
  InstanceCreation: "new </constructor/>( </requiredArguments/></variableArguments/></keyedArguments/> )",
  LogicalComplement: "!</operand/>",
  NullLiteral: "null",
  LambdaExpression: "{# </value/> }",
  EachInArrayTogether: "ThreadUtilities.eachInTogether( ( </__item__/> ) -> {\n\t</body/>\n}, </array/> );",
};

function joinArguments(argumentsList: readonly string[] | undefined): string {
  return (argumentsList ?? []).join(", ");
}

export abstract class Formatter {
  constructor(
    public readonly id: FormatterId,
    public readonly displayName: string,
  ) {}

  abstract getHeaderTextForCode(code: CodeDescriptor): string;
  abstract getTrailerTextForCode(code: CodeDescriptor): string | null;
  abstract getTemplateText(key: string): string;
  abstract getNameForMethod(name: string): string;
  abstract getNameForField(name: string): string;
  abstract getNameForType(typeName: string): string;
  abstract getNameForParameter(name: string): string;
  abstract isTypeExpressionDesired(): boolean;
  abstract getTextForThis(): string;
  abstract getTextForNull(): string;
  abstract getFinalText(): string;
  protected abstract getClassesFormat(): string;
  abstract getNewFormat(): string;

  formatMethodInvocation(invocation: MethodInvocationDescriptor): string {
    const target = invocation.target ? `${invocation.target}.` : "";
    return `${target}${this.getNameForMethod(invocation.methodName)}(${joinArguments(invocation.arguments)})`;
  }

  formatNewExpression(expression: NewExpressionDescriptor): string {
    return this.getNewFormat()
      .replace("%s", this.getNameForType(expression.typeName))
      .replace("%s", joinArguments(expression.arguments));
  }

  galleryLabelFor(className: string, options: { readonly isEnum?: boolean; readonly isLeaf?: boolean } = {}): string {
    if (options.isEnum) {
      const params = options.isLeaf ? "" : "␣";
      return this.getNewFormat()
        .replace("%s", className)
        .replace("%s", params);
    }
    return this.getClassesFormat().replace("%s", className);
  }
}

export class AliceFormatter extends Formatter {
  readonly locale: "en" | "es" | "zh";

  constructor(locale: string | null = "en") {
    super("alice", "Alice");
    this.locale = normalizeLocale(locale);
  }

  getHeaderTextForCode(code: CodeDescriptor): string {
    const parameters = joinArguments(code.parameters);
    if (code.kind === "constructor") {
      return `declare constructor ${code.name ?? ""}(${parameters})`.trim();
    }
    const localizedName = this.getNameForMethod(code.name ?? (code.kind === "function" ? "function" : "procedure"));
    if (code.kind === "function" || (code.kind === "method" && code.returnType && code.returnType !== "void")) {
      return `declare ${this.getNameForType(code.returnType ?? "Object")} function ${localizedName}(${parameters})`;
    }
    return `declare procedure ${localizedName}(${parameters})`;
  }

  getTrailerTextForCode(_code: CodeDescriptor): string | null {
    return null;
  }

  getTemplateText(key: string): string {
    return getLocalizedTemplateText(key, this.locale);
  }

  getNameForMethod(name: string): string {
    return localizeMethodName(name, this.locale);
  }

  getNameForField(name: string): string {
    return name;
  }

  getNameForType(typeName: string): string {
    return localizeTypeName(typeName, this.locale);
  }

  getNameForParameter(name: string): string {
    return name;
  }

  formatMethodInvocation(invocation: MethodInvocationDescriptor): string {
    const target = invocation.target ? `${invocation.target} ` : "";
    const argumentsText = joinArguments(invocation.arguments);
    return `${target}${this.getNameForMethod(invocation.methodName)}${argumentsText.length > 0 ? ` ${argumentsText}` : ""}`.trim();
  }

  isTypeExpressionDesired(): boolean {
    return false;
  }

  getTextForThis(): string {
    return localizeUiString("this", this.locale);
  }

  getTextForNull(): string {
    return localizeUiString("null", this.locale);
  }

  getFinalText(): string {
    return localizeUiString("constant", this.locale);
  }

  protected getClassesFormat(): string {
    return `%s ${localizeUiString("classes", this.locale)}`;
  }

  getNewFormat(): string {
    return `${localizeUiString("new", this.locale)} %s( %s )`;
  }
}

export class JavaFormatter extends Formatter {
  constructor() {
    super("java", "Java");
  }

  getHeaderTextForCode(code: CodeDescriptor): string {
    const parameters = joinArguments(code.parameters);
    if (code.kind === "constructor") {
      return `${code.declaringType ?? code.name ?? "Program"}( ${parameters} ) {`;
    }
    const returnType = code.kind === "procedure" ? "void" : code.returnType ?? "void";
    return `${returnType} ${code.name ?? "method"}( ${parameters} ) {`;
  }

  getTrailerTextForCode(_code: CodeDescriptor): string {
    return "}";
  }

  getTemplateText(key: string): string {
    return JAVA_TEMPLATES[key] ?? key;
  }

  getNameForMethod(name: string): string {
    return name;
  }

  getNameForField(name: string): string {
    return name;
  }

  getNameForType(typeName: string): string {
    return typeName;
  }

  getNameForParameter(name: string): string {
    return name;
  }

  isTypeExpressionDesired(): boolean {
    return true;
  }

  getTextForThis(): string {
    return "this";
  }

  getTextForNull(): string {
    return "null";
  }

  getFinalText(): string {
    return "final";
  }

  protected getClassesFormat(): string {
    return "%s classes";
  }

  getNewFormat(): string {
    return "new %s( %s )";
  }
}

export class FormatterRegistry {
  private readonly formatters = new Map<string, Formatter>();
  private defaultFormatterId: string;

  constructor(formatters: readonly Formatter[] = [new AliceFormatter(), new JavaFormatter()], defaultFormatterId?: string) {
    for (const formatter of formatters) {
      this.formatters.set(formatter.id, formatter);
    }
    const fallbackId = formatters[0]?.id;
    if (!fallbackId) {
      throw new Error("FormatterRegistry requires at least one formatter");
    }
    this.defaultFormatterId = defaultFormatterId ?? fallbackId;
    this.require(this.defaultFormatterId);
  }

  register(formatter: Formatter): Formatter {
    this.formatters.set(formatter.id, formatter);
    return formatter;
  }

  get(id: string): Formatter | undefined {
    return this.formatters.get(id);
  }

  require(id: string): Formatter {
    const formatter = this.formatters.get(id);
    if (!formatter) {
      throw new Error(`Unknown formatter: ${id}`);
    }
    return formatter;
  }

  list(): Formatter[] {
    return [...this.formatters.values()];
  }

  getDefault(): Formatter {
    return this.require(this.defaultFormatterId);
  }

  setDefault(id: string): Formatter {
    const formatter = this.require(id);
    this.defaultFormatterId = formatter.id;
    return formatter;
  }
}

export function createDefaultFormatterRegistry(locale: string | null = "en"): FormatterRegistry {
  return new FormatterRegistry([new AliceFormatter(locale), new JavaFormatter()], "alice");
}
