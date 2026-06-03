import { describe, expect, it } from "vitest";
import {
  BorderLayoutBridge,
  BoxLayoutBridge,
  CardLayoutBridge,
  FlowLayoutBridge,
  GridBagLayoutBridge,
  GridLayoutBridge,
} from "../src/layout-bridge";

describe("layout-bridge", () => {
  // ---------- BorderLayoutBridge ----------

  describe("BorderLayoutBridge", () => {
    it("produces CSS Grid styles with all regions", () => {
      const layout = new BorderLayoutBridge({ hgap: 8, vgap: 4 });
      layout.addRegion("north");
      layout.addRegion("south");
      layout.addRegion("west");
      layout.addRegion("east");
      layout.addRegion("center");

      const style = layout.containerStyle();
      expect(style.display).toBe("grid");
      expect(style["grid-template-rows"]).toBe("auto 1fr auto");
      expect(style["grid-template-columns"]).toBe("auto 1fr auto");
      expect(style.gap).toBe("4px 8px");
      expect(style["grid-template-areas"]).toContain("north");
      expect(style["grid-template-areas"]).toContain("center");
      expect(style["grid-template-areas"]).toContain("south");
    });

    it("produces CSS Grid with only center", () => {
      const layout = new BorderLayoutBridge();
      layout.addRegion("center");

      const style = layout.containerStyle();
      expect(style["grid-template-rows"]).toBe("1fr");
      expect(style["grid-template-columns"]).toBe("1fr");
      expect(style["grid-template-areas"]).toBe('"center"');
    });

    it("produces CSS Grid with north and center only", () => {
      const layout = new BorderLayoutBridge();
      layout.addRegion("north");
      layout.addRegion("center");

      const style = layout.containerStyle();
      expect(style["grid-template-rows"]).toBe("auto 1fr");
      expect(style["grid-template-columns"]).toBe("1fr");
    });

    it("produces child styles with grid-area", () => {
      const layout = new BorderLayoutBridge();
      expect(layout.childStyle("north")["grid-area"]).toBe("north");
      expect(layout.childStyle("center")["grid-area"]).toBe("center");
    });

    it("supports removing regions", () => {
      const layout = new BorderLayoutBridge();
      layout.addRegion("north");
      layout.addRegion("south");
      layout.removeRegion("south");

      const style = layout.containerStyle();
      expect(style["grid-template-rows"]).toBe("auto 1fr");
      expect(style["grid-template-areas"]).not.toContain("south");
    });
  });

  // ---------- BoxLayoutBridge ----------

  describe("BoxLayoutBridge", () => {
    it("produces horizontal flexbox", () => {
      const layout = new BoxLayoutBridge("x", 8);
      const style = layout.containerStyle();

      expect(style.display).toBe("flex");
      expect(style["flex-direction"]).toBe("row");
      expect(style.gap).toBe("8px");
    });

    it("produces vertical flexbox", () => {
      const layout = new BoxLayoutBridge("y");
      const style = layout.containerStyle();

      expect(style["flex-direction"]).toBe("column");
    });

    it("produces child styles with flex weight", () => {
      const layout = new BoxLayoutBridge("x");
      expect(layout.childStyle({ flex: 1 }).flex).toBe("1");
    });

    it("produces rigid spacer styles", () => {
      const hBox = new BoxLayoutBridge("x");
      expect(hBox.rigidSpacerStyle(10).width).toBe("10px");

      const vBox = new BoxLayoutBridge("y");
      expect(vBox.rigidSpacerStyle(10).height).toBe("10px");
    });

    it("produces glue styles", () => {
      const layout = new BoxLayoutBridge("x");
      expect(layout.glueStyle().flex).toBe("1");
    });
  });

  // ---------- FlowLayoutBridge ----------

  describe("FlowLayoutBridge", () => {
    it("produces wrap-enabled flexbox with center alignment", () => {
      const layout = new FlowLayoutBridge("center", 10, 5);
      const style = layout.containerStyle();

      expect(style.display).toBe("flex");
      expect(style["flex-wrap"]).toBe("wrap");
      expect(style["justify-content"]).toBe("center");
      expect(style.gap).toBe("5px 10px");
    });

    it("supports left and right alignment", () => {
      expect(new FlowLayoutBridge("left").containerStyle()["justify-content"]).toBe("flex-start");
      expect(new FlowLayoutBridge("right").containerStyle()["justify-content"]).toBe("flex-end");
    });
  });

  // ---------- GridLayoutBridge ----------

  describe("GridLayoutBridge", () => {
    it("produces CSS Grid with equal tracks", () => {
      const layout = new GridLayoutBridge(3, 4, 4, 2);
      const style = layout.containerStyle();

      expect(style.display).toBe("grid");
      expect(style["grid-template-rows"]).toBe("repeat(3, 1fr)");
      expect(style["grid-template-columns"]).toBe("repeat(4, 1fr)");
      expect(style.gap).toBe("2px 4px");
    });

    it("clamps to minimum 1 row and column", () => {
      const layout = new GridLayoutBridge(0, 0);
      const style = layout.containerStyle();
      expect(style["grid-template-rows"]).toBe("repeat(1, 1fr)");
      expect(style["grid-template-columns"]).toBe("repeat(1, 1fr)");
    });
  });

  // ---------- GridBagLayoutBridge ----------

  describe("GridBagLayoutBridge", () => {
    it("produces CSS Grid with explicit placement", () => {
      const layout = new GridBagLayoutBridge();
      layout.addConstraint({ gridx: 0, gridy: 0, weightx: 1 });
      layout.addConstraint({ gridx: 1, gridy: 0, weightx: 2 });
      layout.addConstraint({ gridx: 0, gridy: 1, gridwidth: 2, weighty: 1 });

      const containerStyle = layout.containerStyle();
      expect(containerStyle.display).toBe("grid");
      expect(containerStyle["grid-template-columns"]).toBe("1fr 2fr");
      expect(containerStyle["grid-template-rows"]).toBe("auto 1fr");
    });

    it("produces child styles with grid placement", () => {
      const layout = new GridBagLayoutBridge();
      const constraint = {
        gridx: 0,
        gridy: 1,
        gridwidth: 2,
        gridheight: 1,
        fill: "both" as const,
        anchor: "northwest" as const,
        insets: { top: 4, left: 8, bottom: 4, right: 8 },
      };

      const style = layout.childStyle(constraint);
      expect(style["grid-column"]).toBe("1 / span 2");
      expect(style["grid-row"]).toBe("2 / span 1");
      expect(style.width).toBe("100%");
      expect(style.height).toBe("100%");
      expect(style["justify-self"]).toBe("start");
      expect(style["align-self"]).toBe("start");
      expect(style.margin).toBe("4px 8px 4px 8px");
    });

    it("applies horizontal fill only", () => {
      const layout = new GridBagLayoutBridge();
      const style = layout.childStyle({ gridx: 0, gridy: 0, fill: "horizontal" });
      expect(style.width).toBe("100%");
      expect(style.height).toBeUndefined();
    });

    it("applies vertical fill only", () => {
      const layout = new GridBagLayoutBridge();
      const style = layout.childStyle({ gridx: 0, gridy: 0, fill: "vertical" });
      expect(style.width).toBeUndefined();
      expect(style.height).toBe("100%");
    });

    it("defaults to center anchor", () => {
      const layout = new GridBagLayoutBridge();
      const style = layout.childStyle({ gridx: 0, gridy: 0 });
      expect(style["justify-self"]).toBe("center");
      expect(style["align-self"]).toBe("center");
    });
  });

  // ---------- CardLayoutBridge ----------

  describe("CardLayoutBridge", () => {
    it("shows the first card by default", () => {
      const layout = new CardLayoutBridge();
      layout.addCard("page1");
      layout.addCard("page2");

      expect(layout.active).toBe("page1");
      expect(layout.allCards).toEqual(["page1", "page2"]);
    });

    it("switches active card", () => {
      const layout = new CardLayoutBridge();
      layout.addCard("page1");
      layout.addCard("page2");

      expect(layout.show("page2")).toBe(true);
      expect(layout.active).toBe("page2");
    });

    it("returns false when showing unknown card", () => {
      const layout = new CardLayoutBridge();
      expect(layout.show("unknown")).toBe(false);
    });

    it("produces stacked container style", () => {
      const layout = new CardLayoutBridge();
      const style = layout.containerStyle();
      expect(style.display).toBe("grid");
    });

    it("makes active card visible and inactive hidden", () => {
      const layout = new CardLayoutBridge();
      layout.addCard("a");
      layout.addCard("b");

      expect(layout.cardStyle("a").visibility).toBe("visible");
      expect(layout.cardStyle("a")["pointer-events"]).toBe("auto");
      expect(layout.cardStyle("b").visibility).toBe("hidden");
      expect(layout.cardStyle("b")["pointer-events"]).toBe("none");
    });

    it("does not duplicate cards when adding same name twice", () => {
      const layout = new CardLayoutBridge();
      layout.addCard("page1");
      layout.addCard("page1");
      expect(layout.allCards).toEqual(["page1"]);
    });
  });
});
