import { test, expect } from "./fixtures.js";
import {
  FROZEN_GLOW_COLOR,
  OVERLAY_BORDER_COLOR_DEFAULT,
  OVERLAY_BORDER_COLOR_DRAG,
  OVERLAY_BORDER_COLOR_INSPECT,
  OVERLAY_FILL_COLOR_DEFAULT,
  OVERLAY_FILL_COLOR_DRAG,
  OVERLAY_FILL_COLOR_INSPECT,
} from "../src/constants.js";

test.describe("Theme Customization", () => {
  test.describe("Default Overlay Palette", () => {
    test("should use the restored soft blue palette", async () => {
      expect(OVERLAY_BORDER_COLOR_DRAG).toBe("rgba(118, 198, 255, 0.4)");
      expect(OVERLAY_FILL_COLOR_DRAG).toBe("rgba(118, 198, 255, 0.05)");
      expect(OVERLAY_BORDER_COLOR_DEFAULT).toBe("rgba(118, 198, 255, 0.5)");
      expect(OVERLAY_FILL_COLOR_DEFAULT).toBe("rgba(118, 198, 255, 0.08)");
      expect(OVERLAY_BORDER_COLOR_INSPECT).toBe("rgba(118, 198, 255, 0.3)");
      expect(OVERLAY_FILL_COLOR_INSPECT).toBe("rgba(118, 198, 255, 0.04)");
      expect(FROZEN_GLOW_COLOR).toBe("rgba(118, 198, 255, 0.15)");
    });
  });

  test.describe("Hue Rotation", () => {
    test("should apply hue rotation filter", async ({ uiGrab }) => {
      await uiGrab.updateOptions({ theme: { hue: 180 } });
      await uiGrab.activate();

      const hasFilter = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return false;
        const root = shadowRoot.querySelector(`[${attrName}]`) as HTMLElement;
        return root?.style.filter?.includes("hue-rotate") ?? false;
      }, "data-ui-grab");

      expect(hasFilter).toBe(true);
    });

    test("should apply correct hue rotation value", async ({ uiGrab }) => {
      await uiGrab.updateOptions({ theme: { hue: 90 } });
      await uiGrab.activate();

      const filterValue = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return null;
        const root = shadowRoot.querySelector(`[${attrName}]`) as HTMLElement;
        return root?.style.filter;
      }, "data-ui-grab");

      expect(filterValue).toContain("hue-rotate(90deg)");
    });

    test("should not apply filter when hue is 0", async ({ uiGrab }) => {
      await uiGrab.updateOptions({ theme: { hue: 0 } });
      await uiGrab.activate();

      const filterValue = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return "";
        const root = shadowRoot.querySelector(`[${attrName}]`) as HTMLElement;
        return root?.style.filter ?? "";
      }, "data-ui-grab");

      expect(filterValue).toBe("");
    });
  });

  test.describe("Selection Box", () => {
    test("should show selection box by default", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });

    test("should hide selection box when disabled", async ({ uiGrab }) => {
      await uiGrab.updateOptions({
        theme: { selectionBox: { enabled: false } },
      });
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const bounds = await uiGrab.getSelectionBoxBounds();
      expect(bounds).toBeNull();
    });
  });

  test.describe("Drag Box", () => {
    test("should show drag box by default", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });

      const dragBounds = await uiGrab.getDragBoxBounds();
      await uiGrab.page.mouse.up();

      expect(dragBounds).toBeDefined();
    });

    test("should hide drag box when disabled", async ({ uiGrab }) => {
      await uiGrab.updateOptions({ theme: { dragBox: { enabled: false } } });
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });

      const dragBounds = await uiGrab.getDragBoxBounds();
      await uiGrab.page.mouse.up();

      expect(dragBounds).toBeNull();
    });
  });

  test.describe("Grabbed Boxes", () => {
    test("should show grabbed boxes by default", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      const info = await uiGrab.getGrabbedBoxInfo();
      expect(info.count).toBeGreaterThan(0);
    });

    test("should hide grabbed boxes when disabled", async ({ uiGrab }) => {
      await uiGrab.updateOptions({
        theme: { grabbedBoxes: { enabled: false } },
      });
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      const isVisible = await uiGrab.isGrabbedBoxVisible();
      expect(isVisible).toBe(false);
    });
  });

  test.describe("Element Label", () => {
    test("should show element label by default", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionLabelVisible();
      expect(isVisible).toBe(true);
    });

    test("should hide element label when disabled", async ({ uiGrab }) => {
      await uiGrab.updateOptions({
        theme: { elementLabel: { enabled: false } },
      });
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.isVisible).toBe(false);
    });
  });

  test.describe("Toolbar", () => {
    test("should show toolbar by default", async ({ uiGrab }) => {
      await uiGrab.page.waitForTimeout(600);

      const isVisible = await uiGrab.isToolbarVisible();
      expect(isVisible).toBe(true);
    });

    test("should hide toolbar when disabled", async ({ uiGrab }) => {
      await uiGrab.updateOptions({ theme: { toolbar: { enabled: false } } });
      await uiGrab.page.waitForTimeout(600);

      const isVisible = await uiGrab.isToolbarVisible();
      expect(isVisible).toBe(false);
    });
  });

  test.describe("Global Enable/Disable", () => {
    test("should disable entire overlay when enabled is false", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ theme: { enabled: false } });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isSelectionBoxVisible = await uiGrab.isSelectionBoxVisible();
      expect(isSelectionBoxVisible).toBe(false);
    });
  });

  test.describe("Theme Persistence", () => {
    test("theme should persist across activation cycles", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ theme: { hue: 120 } });

      await uiGrab.activate();
      await uiGrab.deactivate();
      await uiGrab.activate();

      const hasFilter = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        const shadowRoot = host?.shadowRoot;
        const root = shadowRoot?.querySelector(
          "[data-ui-grab]",
        ) as HTMLElement;
        return root?.style.filter?.includes("hue-rotate(120deg)") ?? false;
      });
      expect(hasFilter).toBe(true);
    });
  });
});
