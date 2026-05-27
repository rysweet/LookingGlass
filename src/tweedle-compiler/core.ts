import {
  TweedleParseError,
  parseTweedle,
  type ClassDecl,
  type ConstructorDecl,
  type MethodDecl,
  type Statement,
} from "../tweedle-parser.js";
import {
  collectControlFlowWarnings,
  collectExpressionTypeReferences,
  collectStatementsTypeReferences,
  collectUnusedVariableWarnings,
  normalizeTypeName,
  typeRefName,
} from "./diagnostics.js";

export interface SourceLocation { filePath: string; line: number; column: number; }
export interface ExecutableMethod { key: string; className: string; name: string; kind: "constructor" | "method"; parameters: Array<{ name: string; type: string; isVarArgs: boolean }>; returnType: string; body: Statement[]; isStatic: boolean; }
export interface ExecutableAst { className: string; constructors: ExecutableMethod[]; methods: ExecutableMethod[]; entryPoint: string | null; }

const DEFAULT_BUILTIN_TYPES = new Set(["Boolean", "Color", "Character", "Direction", "Double", "Duration", "Integer", "List", "Number", "Object", "PointOfView", "SActor", "SBiped", "SCamera", "SJointedModel", "SModel", "SScene", "SThing", "String", "Text", "Void", "WholeNumber", "decimal", "int", "void"]);
const IMPORT_RE = /^\s*import\s+([A-Za-z0-9_.]+)\s*;\s*$/gm;

export class CompilerError extends Error { constructor(message: string, public readonly location: SourceLocation | null, public readonly code: string = "compiler-error") { super(message); this.name = "CompilerError"; } }
export class CompilerWarning extends Error { constructor(message: string, public readonly location: SourceLocation | null, public readonly code: string = "compiler-warning") { super(message); this.name = "CompilerWarning"; } }

export class CompilationUnit {
  constructor(
    public readonly filePath: string,
    public readonly source: string,
    public readonly ast: ClassDecl | null,
    public readonly imports: string[],
    public readonly executableAst: ExecutableAst | null,
    public readonly errors: CompilerError[] = [],
    public readonly warnings: CompilerWarning[] = [],
  ) {}
  get className(): string | null { return this.ast?.name ?? null; }
  get success(): boolean { return this.ast !== null && this.errors.length === 0; }
}

export class ImportResolver {
  resolveImports(source: string): string[] { return [...source.matchAll(IMPORT_RE)].map((match) => match[1]); }
  stripImports(source: string): string { return source.split(/\r?\n/u).map((line) => line.trimStart().startsWith("import ") ? "" : line).join("\n"); }
  resolveImportStatements(unit: CompilationUnit, units: readonly CompilationUnit[], typeResolver: TypeResolver): CompilationUnit[] {
    const resolved: CompilationUnit[] = [];
    for (const specifier of unit.imports) {
      const target = typeResolver.resolveTypeReference(this.localName(specifier), unit);
      if (target instanceof CompilationUnit) resolved.push(target);
    }
    return resolved;
  }
  localName(specifier: string): string { return specifier.split(".").at(-1) ?? specifier; }
}

export class TypeResolver {
  private readonly builtinTypes: Set<string>;
  private readonly unitsByClassName = new Map<string, CompilationUnit>();

  constructor(units: readonly CompilationUnit[], builtinTypes: Iterable<string> = DEFAULT_BUILTIN_TYPES) {
    this.builtinTypes = new Set(builtinTypes);
    for (const unit of units) if (unit.className) this.unitsByClassName.set(unit.className, unit);
  }

  resolveTypeReference(name: string, unit?: CompilationUnit): CompilationUnit | { name: string; builtin: true } | null {
    const normalized = normalizeTypeName(name);
    if (!normalized) return null;
    if (this.builtinTypes.has(normalized)) return { name: normalized, builtin: true };
    if (unit) {
      if (unit.className === normalized) return unit;
      for (const specifier of unit.imports) {
        const localName = specifier.split(".").at(-1) ?? specifier;
        if (localName === normalized) {
          const imported = this.unitsByClassName.get(localName);
          if (imported) return imported;
        }
      }
    }
    return this.unitsByClassName.get(normalized) ?? null;
  }

  validateCompilationUnit(unit: CompilationUnit): { errors: CompilerError[]; warnings: CompilerWarning[] } {
    const errors: CompilerError[] = [];
    const warnings: CompilerWarning[] = [];
    const seenImports = new Set<string>();

    for (const specifier of unit.imports) {
      if (seenImports.has(specifier)) {
        warnings.push(new CompilerWarning(`Duplicate import '${specifier}'`, null, "duplicate-import"));
        continue;
      }
      seenImports.add(specifier);
      const localName = specifier.split(".").at(-1) ?? specifier;
      if (!this.resolveTypeReference(localName, unit)) {
        errors.push(new CompilerError(`Unknown import '${specifier}'`, null, "unknown-import"));
      }
    }
    if (!unit.ast) return { errors, warnings };

    const typesToCheck = new Map<string, string[]>();
    typesToCheck.set(`class ${unit.ast.name}`, [...(unit.ast.superClass ? [unit.ast.superClass] : []), ...(unit.ast.modelType ? [unit.ast.modelType] : [])]);
    for (const field of unit.ast.fields) typesToCheck.set(`field ${field.name}`, [typeRefName(field.fieldType), ...collectExpressionTypeReferences(field.initializer)]);
    for (const constructor of unit.ast.constructors) {
      typesToCheck.set(`constructor ${constructor.name}`, [...constructor.parameters.map((parameter) => typeRefName(parameter.paramType)), ...collectStatementsTypeReferences(constructor.body)]);
      warnings.push(...collectControlFlowWarnings(unit, constructor.name, constructor.body));
      warnings.push(...collectUnusedVariableWarnings(unit, constructor.name, constructor.body));
    }
    for (const method of unit.ast.methods) {
      typesToCheck.set(`method ${method.name}`, [typeRefName(method.returnType), ...method.parameters.map((parameter) => typeRefName(parameter.paramType)), ...collectStatementsTypeReferences(method.body)]);
      warnings.push(...collectControlFlowWarnings(unit, method.name, method.body));
      warnings.push(...collectUnusedVariableWarnings(unit, method.name, method.body));
    }

    for (const [label, typeNames] of typesToCheck) {
      for (const rawTypeName of typeNames) {
        const typeName = normalizeTypeName(rawTypeName);
        if (!typeName || typeName === "void") continue;
        if (!this.resolveTypeReference(typeName, unit)) {
          errors.push(new CompilerError(`Unknown type '${typeName}' referenced by ${label}`, null, "unknown-type"));
        }
      }
    }
    return { errors, warnings };
  }
}

export class TweedleCompiler {
  constructor(private readonly importResolver: ImportResolver = new ImportResolver()) {}

  compile(source: string, filePath = "Main.tweedle"): CompilationUnit { return this.compileUnits([{ path: filePath, source }])[0]; }

  compileUnits(sources: ReadonlyArray<{ path: string; source: string }>): CompilationUnit[] {
    const parsedUnits = sources.map(({ path, source }) => this.parseUnit(path, source));
    const typeResolver = new TypeResolver(parsedUnits.filter((unit) => unit.ast));
    return parsedUnits.map((unit) => {
      if (!unit.ast) return unit;
      const diagnostics = typeResolver.validateCompilationUnit(unit);
      const executableAst = buildExecutableAst(unit.ast);
      return new CompilationUnit(unit.filePath, unit.source, unit.ast, unit.imports, executableAst, [...unit.errors, ...diagnostics.errors], [...unit.warnings, ...diagnostics.warnings]);
    });
  }

  private parseUnit(filePath: string, source: string): CompilationUnit {
    const imports = this.importResolver.resolveImports(source);
    const strippedSource = this.importResolver.stripImports(source);
    try {
      const ast = parseTweedle(strippedSource);
      return new CompilationUnit(filePath, source, ast, imports, buildExecutableAst(ast));
    } catch (error) {
      if (error instanceof TweedleParseError) {
        return new CompilationUnit(filePath, source, null, imports, null, [new CompilerError(error.message, { filePath, line: error.line, column: error.column }, "syntax-error")]);
      }
      throw error;
    }
  }
}

function buildExecutableAst(ast: ClassDecl): ExecutableAst {
  const constructors = ast.constructors.map((constructorDecl) => executableMethod(ast.name, constructorDecl));
  const methods = ast.methods.map((methodDecl) => executableMethod(ast.name, methodDecl));
  const entryPoint = methods.find((method) => method.name === "main")?.key ?? methods[0]?.key ?? constructors[0]?.key ?? null;
  return { className: ast.name, constructors, methods, entryPoint };
}

function executableMethod(className: string, declaration: ConstructorDecl | MethodDecl): ExecutableMethod {
  const kind = declaration.type === "ConstructorDeclaration" ? "constructor" : "method";
  return {
    key: `${className}.${declaration.name}`,
    className,
    name: declaration.name,
    kind,
    parameters: declaration.parameters.map((parameter) => ({ name: parameter.name, type: typeRefName(parameter.paramType), isVarArgs: parameter.isVarArgs })),
    returnType: declaration.type === "ConstructorDeclaration" ? className : typeRefName(declaration.returnType),
    body: declaration.body,
    isStatic: declaration.type === "MethodDeclaration" ? declaration.isStatic : false,
  };
}
