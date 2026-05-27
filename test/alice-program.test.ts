import { describe, expect, it } from "vitest";
import {
  AliceProgram,
  ProgramClock,
  ProgramRunner,
  ProgramState,
  SceneSetupPhase,
  UserMainMethod,
} from "../src/alice-program";
import { Scene } from "../src/story-api/scene";

describe("alice-program", () => {
  it("owns scenes, types, and scene setup phases", () => {
    const program = new AliceProgram();
    const scene = new Scene();

    program.addScene("world", scene);
    program.registerType("Dragon", { joints: 12 });

    expect(program.listSceneNames()).toEqual(["world"]);
    expect(program.listTypeNames()).toEqual(["Dragon"]);
    expect(program.prepareScene("world")).toEqual({
      sceneName: "world",
      phases: [SceneSetupPhase.BINDING, SceneSetupPhase.ACTIVATING, SceneSetupPhase.READY],
      activated: true,
    });
    expect(program.activeScene).toBe(scene);
  });

  it("uses myFirstMethod as the user entry point", () => {
    const program = new AliceProgram();
    program.addScene("world", new Scene());
    program.setEntryPoint(() => "ran");

    expect(program.invoke(UserMainMethod)).toBe("ran");
  });

  it("advances the program clock only while running", () => {
    const clock = new ProgramClock();

    expect(clock.advance(10)).toBe(0);
    clock.start();
    expect(clock.advance(16)).toBe(16);
    clock.pause();
    expect(clock.advance(16)).toBe(16);
    clock.resume();
    expect(clock.advance(4)).toBe(20);
    clock.reset();
    expect(clock.elapsedMs).toBe(0);
    expect(clock.isRunning).toBe(false);
  });

  it("supports start, pause, resume, tick, and execute", () => {
    const program = new AliceProgram();
    program.addScene("world", new Scene());
    let calls = 0;
    program.setEntryPoint(() => {
      calls += 1;
      return `call-${calls}`;
    });

    const runner = new ProgramRunner(program, new ProgramClock());
    runner.start();
    expect(runner.state).toBe(ProgramState.RUNNING);

    runner.pause();
    expect(runner.state).toBe(ProgramState.PAUSED);

    runner.resume();
    const first = runner.tick(33)!;
    expect(first.value).toBe("call-1");
    expect(first.entryPoint).toBe(UserMainMethod);
    expect(first.elapsedMs).toBe(33);
    expect(first.scene.phases).toEqual([
      SceneSetupPhase.BINDING,
      SceneSetupPhase.ACTIVATING,
      SceneSetupPhase.READY,
    ]);
    expect(runner.state).toBe(ProgramState.STOPPED);

    const second = runner.execute(UserMainMethod, 10);
    expect(second.value).toBe("call-2");
    expect(calls).toBe(2);
  });

  it("stops pending work without executing the entry point", () => {
    const program = new AliceProgram();
    program.addScene("world", new Scene());
    let executed = false;
    program.setEntryPoint(() => {
      executed = true;
      return null;
    });

    const runner = new ProgramRunner(program);
    runner.start();
    runner.stop();

    expect(runner.state).toBe(ProgramState.STOPPED);
    expect(runner.tick(5)).toBeNull();
    expect(executed).toBe(false);
  });
});
