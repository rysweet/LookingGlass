import { describe, expect, it } from "vitest";
import { Scene } from "../src/story-api";
import { SceneActivation, SceneInventory, SceneTransition, TransitionEffect } from "../src/scene-transition.js";

describe("scene-transition", () => {
  it("tracks inventory and scene activation state", () => {
    const intro = new Scene();
    const game = new Scene();
    const inventory = new SceneInventory({ intro, game });
    const activation = new SceneActivation();

    expect(activation.activate(intro)).toBe(1);
    expect(intro.isActive).toBe(true);
    expect(activation.activate(game)).toBe(1);
    expect(intro.isActive).toBe(false);
    expect(game.isActive).toBe(true);
    expect(activation.getActivationCount(intro)).toBe(1);
    expect(activation.getActivationCount(game)).toBe(1);
    expect(activation.deactivate()).toBe(true);
    expect(game.isActive).toBe(false);
    expect(inventory.list()).toEqual([
      { name: "intro", scene: intro, isActive: false },
      { name: "game", scene: game, isActive: false },
    ]);
  });

  it("computes fade crossfade wipe and cut snapshots", () => {
    expect(TransitionEffect.fadeToBlack(2).snapshot(0.25)).toMatchObject({
      kind: "FADE_TO_BLACK",
      duration: 2,
      overlayOpacity: 0.5,
      mix: 0,
    });
    expect(TransitionEffect.fadeToBlack(2).snapshot(0.75)).toMatchObject({
      overlayOpacity: 0.5,
      mix: 1,
    });
    expect(TransitionEffect.crossfade(3).snapshot(0.4)).toMatchObject({
      kind: "CROSSFADE",
      duration: 3,
      mix: 0.4,
    });
    expect(TransitionEffect.wipe("RIGHT", 1.5).snapshot(0.6)).toMatchObject({
      kind: "WIPE_RIGHT",
      wipeProgress: 0.6,
    });
    expect(TransitionEffect.cut().snapshot(0)).toMatchObject({ mix: 0 });
    expect(TransitionEffect.cut().snapshot(1)).toMatchObject({ mix: 1, wipeProgress: 1 });
  });

  it("transitions by scene name and previews without mutating active scene", () => {
    const intro = new Scene();
    const game = new Scene();
    const credits = new Scene();
    const transition = new SceneTransition(
      new SceneInventory([
        ["intro", intro],
        ["game", game],
        ["credits", credits],
      ]),
    );

    transition.cutTo("intro");
    const preview = transition.preview("credits", TransitionEffect.wipe("RIGHT", 1.5), 0.4);
    const result = transition.dissolveTo("game", 2);

    expect(transition.activation.activeScene).toBe(game);
    expect(preview.fromName).toBe("intro");
    expect(preview.toName).toBe("credits");
    expect(preview.effect.wipeProgress).toBe(0.4);
    expect(result.fromName).toBe("intro");
    expect(result.toName).toBe("game");
    expect(result.effect.kind).toBe("CROSSFADE");
    expect(transition.inventory.listNames()).toEqual(["intro", "game", "credits"]);
  });
});
