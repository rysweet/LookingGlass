import { describe, expect, it } from "vitest";
import {
  BubbleAnimation,
  BubbleLayout,
  DEFAULT_BUBBLE_STYLE,
  SpeechBubble,
  ThoughtBubble,
} from "../src/speech-bubble.js";

describe("speech bubble module", () => {
  it("wraps text and positions the bubble above the speaker", () => {
    const layout = new BubbleLayout({ fontSize: 10, lineHeight: 12, padding: 4, maxWidth: 48, tailLength: 10 });
    const placement = layout.layoutBubble(
      "speech",
      "one two three four five six",
      { x: 10, y: 2, z: -4 },
      { width: 2, height: 4, depth: 1 },
      "above",
    );

    expect(placement.lines.length).toBeGreaterThan(2);
    expect(placement.bounds.width).toBeGreaterThan(placement.maxLineWidth);
    expect(placement.bubblePosition.y).toBeGreaterThan(placement.tailTip.y);
    expect(placement.tailBase.x).toBe(placement.tailTip.x);
  });

  it("speech bubble re-renders after text and anchor changes", () => {
    const bubble = new SpeechBubble("Hello Alice", { x: 0, y: 0, z: 0 }, {
      style: { fillColor: "#ffeeaa", fontSize: 14 },
      entitySize: { width: 2, height: 2, depth: 2 },
    });

    bubble.setText("Hello Alice from a much longer sentence");
    bubble.setAnchor("right");
    const placement = bubble.render(120);

    expect(bubble.style.fillColor).toBe("#ffeeaa");
    expect(bubble.style.fontSize).toBe(14);
    expect(placement.kind).toBe("speech");
    expect(placement.lines.length).toBeGreaterThan(1);
    expect(placement.bubblePosition.x).toBeGreaterThan(placement.tailTip.x);
  });

  it("thought bubbles use cloud styling and preserve speaker positioning", () => {
    const bubble = new ThoughtBubble("Thinking about loops", { x: -3, y: 5, z: 1 }, {
      anchor: "below",
      entitySize: { width: 1, height: 3, depth: 1 },
    });
    const placement = bubble.render();

    expect(bubble.kind).toBe("thought");
    expect(bubble.cloudPuffs).toBe(3);
    expect(bubble.style.fillColor).toBe("#f8fbff");
    expect(placement.bubblePosition.y).toBeLessThan(placement.tailTip.y);
    expect(DEFAULT_BUBBLE_STYLE.shadow).not.toBeNull();
  });

  it("bubble animation transitions through appear and disappear timing", () => {
    const animation = new BubbleAnimation(100, 50);

    animation.show();
    expect(animation.state).toBe("appearing");

    animation.update(25);
    expect(animation.alpha).toBeCloseTo(0.25);
    expect(animation.scale).toBeCloseTo(0.8875);

    animation.update(75);
    expect(animation.state).toBe("visible");
    expect(animation.alpha).toBe(1);

    animation.hide();
    animation.update(25);
    expect(animation.state).toBe("disappearing");
    animation.update(25);
    expect(animation.state).toBe("hidden");
    expect(animation.visible).toBe(false);
  });
});
