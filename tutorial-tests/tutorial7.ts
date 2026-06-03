import { Alice, ensureDomGlobals, printReport } from "./common.js";

async function main(): Promise<void> {
  ensureDomGlobals();
  const output: string[] = [];
  const gaps: string[] = [];

  const hero = new Alice.StoryApi.SProp();
  const target = new Alice.StoryApi.SProp();
  target.position = { x: 3, y: 0, z: -4 };
  hero.turnToFace(target);
  const distance = hero.getDistanceTo(target);
  const facing = hero.isFacing(target);
  output.push(`Direct StoryApi built-ins => distance=${distance.toFixed(3)} isFacing=${String(facing)}.`);
  if (Math.abs(distance - 5) > 1e-4 || !facing) {
    gaps.push("Direct StoryApi built-in functions did not return the expected values.");
  }

  const declaration = Alice.TweedleParser.parseTweedle(`class FunctionProbe {
    Boolean alwaysFalse() {
      return false;
    }
    void run() {
      if (alwaysFalse()) {
        this.state <- \"if-branch\";
      } else {
        this.state <- \"else-branch\";
      }
    }
  }`);

  const vm = new Alice.TweedleVm.TweedleVM();
  const functionResult = vm.execute(declaration, { entryMethod: "alwaysFalse" });
  const returned = functionResult.returnValues.get("alwaysFalse");
  output.push(`Custom function alwaysFalse() returned ${String(returned)} when executed directly.`);

  const runResult = vm.execute(declaration, { entryMethod: "run" });
  const ifLog = runResult.execution_log.find((entry) => entry.kind === "IfElse")?.detail ?? "<no IfElse log>";
  const assignmentLog = runResult.execution_log.find((entry) => entry.kind === "VariableAssignment")?.detail ?? "<no assignment>";
  output.push(`run() logged ${ifLog} and ${assignmentLog}.`);

  if (!String(returned).includes("false")) {
    gaps.push("Custom function execution did not produce a false return value.");
  }
  if (assignmentLog.includes("if-branch") || ifLog.includes("→ true")) {
    gaps.push("Function calls used inside IfElse conditions are not evaluated; the VM treats unknown conditions as true and takes the if branch even when the function returns false.");
  }

  printReport({
    tutorial: "Tutorial 7: Functions and Return Values",
    script: [
      "StoryApi SProp.getDistanceTo/isFacing",
      "TweedleParser.parseTweedle(class FunctionProbe)",
      "TweedleVm.TweedleVM.execute(entryMethod='alwaysFalse')",
      "TweedleVm.TweedleVM.execute(entryMethod='run')",
    ],
    result: gaps.length === 0 ? "PASS" : "PARTIAL",
    output,
    gaps,
    wouldBlock: gaps.length > 0,
  });
}

main().catch((error) => {
  printReport({
    tutorial: "Tutorial 7: Functions and Return Values",
    script: ["tutorial-tests/tutorial7.ts"],
    result: "FAIL",
    output: [String(error)],
    gaps: ["Script crashed before the workflow completed."],
    wouldBlock: true,
  });
  process.exitCode = 1;
});
