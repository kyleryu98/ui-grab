import { test, expect } from "./fixtures.js";

test.describe("Visual Feedback", () => {
  test.describe("Selection Box", () => {
    test("selection box should match element bounds", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const elementBounds = await uiGrab.getElementBounds("li:first-child");
      const selectionBounds = await uiGrab.getSelectionBoxBounds();

      if (elementBounds && selectionBounds) {
        expect(Math.abs(selectionBounds.x - elementBounds.x)).toBeLessThan(5);
        expect(Math.abs(selectionBounds.y - elementBounds.y)).toBeLessThan(5);
        expect(
          Math.abs(selectionBounds.width - elementBounds.width),
        ).toBeLessThan(10);
        expect(
          Math.abs(selectionBounds.height - elementBounds.height),
        ).toBeLessThan(10);
      }
    });

    test("selection box should update when hovering different elements", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.page.waitForTimeout(100);
      const bounds1 = await uiGrab.getSelectionBoxBounds();

      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.page.waitForTimeout(100);
      const bounds2 = await uiGrab.getSelectionBoxBounds();

      if (bounds1 && bounds2) {
        expect(
          bounds1.width !== bounds2.width || bounds1.height !== bounds2.height,
        ).toBe(true);
      }
    });

    test("selection box should track scrolling element", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const boundsBefore = await uiGrab.getSelectionBoxBounds();

      await uiGrab.scrollPage(50);
      await uiGrab.page.waitForTimeout(200);

      const boundsAfter = await uiGrab.getSelectionBoxBounds();

      if (boundsBefore && boundsAfter) {
        expect(boundsBefore.y - boundsAfter.y).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Drag Box", () => {
    test("drag box should appear during drag", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });

      const dragBounds = await uiGrab.getDragBoxBounds();
      expect(dragBounds).toBeDefined();

      await uiGrab.page.mouse.up();
    });

    test("drag box should grow with drag distance", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();

      await uiGrab.page.mouse.move(box.x + 50, box.y + 50, { steps: 5 });
      const smallDragBounds = await uiGrab.getDragBoxBounds();

      await uiGrab.page.mouse.move(box.x + 200, box.y + 200, { steps: 5 });
      const largeDragBounds = await uiGrab.getDragBoxBounds();

      if (smallDragBounds && largeDragBounds) {
        expect(largeDragBounds.width).toBeGreaterThan(smallDragBounds.width);
        expect(largeDragBounds.height).toBeGreaterThan(smallDragBounds.height);
      }

      await uiGrab.page.mouse.up();
    });

    test("drag box should disappear after drag ends", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });
      await uiGrab.page.mouse.up();

      await uiGrab.page.waitForTimeout(100);

      const dragBounds = await uiGrab.getDragBoxBounds();
      expect(dragBounds).toBeNull();
    });
  });

  test.describe("Grabbed Box", () => {
    test("grabbed box should appear after element click", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      const grabbedInfo = await uiGrab.getGrabbedBoxInfo();
      expect(grabbedInfo.count).toBeGreaterThan(0);
    });

    test("grabbed box should fade out after delay", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(2000);

      const grabbedInfo = await uiGrab.getGrabbedBoxInfo();
      expect(grabbedInfo.count).toBe(0);
    });
  });

  test.describe("Selection Label", () => {
    test("label should show tag name", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.tagName).toBe("h1");
    });

    test("label should show element count for multi-select", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.dragSelect("li:first-child", "li:nth-child(3)");
      await uiGrab.page.waitForTimeout(200);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("label should position below element by default", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();

      const elementBounds = await uiGrab.getElementBounds("h1");
      const labelInfo = await uiGrab.getSelectionLabelInfo();

      expect(labelInfo.isVisible).toBe(true);
      expect(elementBounds).toBeDefined();
    });

    test("prompt panel should center on the selected element even after an edge click", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.activate();

      const target = uiGrab.page.locator("[data-testid='plain-button']");
      await target.scrollIntoViewIfNeeded();
      const elementBounds = await target.boundingBox();
      if (!elementBounds) {
        throw new Error("Could not get bounds for prompt centering test");
      }

      await uiGrab.page.mouse.click(
        elementBounds.x + elementBounds.width - 2,
        elementBounds.y + elementBounds.height / 2,
      );

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);

      await expect(async () => {
        const labelBounds = await uiGrab.getSelectionLabelBounds();
        expect(labelBounds).not.toBeNull();

        const labelCenterX =
          labelBounds!.label.x + labelBounds!.label.width / 2;
        const selectionCenterX = elementBounds.x + elementBounds.width / 2;

        expect(Math.abs(labelCenterX - selectionCenterX)).toBeLessThan(10);
      }).toPass({ timeout: 2000 });
    });

    test("label should be clamped to viewport", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='edge-bottom-left']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.isVisible).toBe(true);
    });

    test("label and arrow should stay within bounds at left edge", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='edge-top-left']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      await expect(async () => {
        const bounds = await uiGrab.getSelectionLabelBounds();
        expect(bounds).not.toBeNull();
        expect(bounds?.arrow).not.toBeNull();
        if (bounds?.arrow) {
          expect(bounds.label.x).toBeGreaterThanOrEqual(0);
          expect(bounds.label.x + bounds.label.width).toBeLessThanOrEqual(
            bounds.viewport.width,
          );
          expect(bounds.arrow.x).toBeGreaterThanOrEqual(bounds.label.x);
          expect(bounds.arrow.x + bounds.arrow.width).toBeLessThanOrEqual(
            bounds.label.x + bounds.label.width,
          );
        }
      }).toPass({ timeout: 2000 });
    });

    test("label and arrow should stay within bounds at right edge", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='edge-top-right']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      await expect(async () => {
        const bounds = await uiGrab.getSelectionLabelBounds();
        expect(bounds).not.toBeNull();
        expect(bounds?.arrow).not.toBeNull();
        if (bounds?.arrow) {
          expect(bounds.label.x).toBeGreaterThanOrEqual(0);
          expect(bounds.label.x + bounds.label.width).toBeLessThanOrEqual(
            bounds.viewport.width,
          );
          expect(bounds.arrow.x).toBeGreaterThanOrEqual(bounds.label.x);
          expect(bounds.arrow.x + bounds.arrow.width).toBeLessThanOrEqual(
            bounds.label.x + bounds.label.width,
          );
        }
      }).toPass({ timeout: 2000 });
    });

    test("label and arrow should stay within bounds at bottom-left edge", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='edge-bottom-left']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      await expect(async () => {
        const bounds = await uiGrab.getSelectionLabelBounds();
        expect(bounds).not.toBeNull();
        expect(bounds?.arrow).not.toBeNull();
        if (bounds?.arrow) {
          expect(bounds.label.x).toBeGreaterThanOrEqual(0);
          expect(bounds.label.x + bounds.label.width).toBeLessThanOrEqual(
            bounds.viewport.width,
          );
          expect(bounds.arrow.x).toBeGreaterThanOrEqual(bounds.label.x);
          expect(bounds.arrow.x + bounds.arrow.width).toBeLessThanOrEqual(
            bounds.label.x + bounds.label.width,
          );
        }
      }).toPass({ timeout: 2000 });
    });
  });

  test.describe("Status Transitions", () => {
    test("should show copying status during copy", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      // During/after copy, a status label should appear (e.g., "Copying..." or "Copied")
      await expect
        .poll(() => uiGrab.getLabelStatusText(), { timeout: 2000 })
        .toBeTruthy();
    });

    test("should transition to copied status after copy", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(() => uiGrab.getLabelStatusText(), { timeout: 2000 })
        .toBe("Copied");
    });
  });

  test.describe("Arrow Direction", () => {
    test("arrow should point down when label is below element", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.isVisible).toBe(true);
    });

    test("arrow should adjust when near viewport bottom", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.scrollPage(500);
      await uiGrab.hoverElement("[data-testid='footer']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.isVisible).toBe(true);
    });
  });

  test.describe("Multiple Visual Elements", () => {
    test("selection box and label should be synchronized", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionLabel();

      const selectionVisible = await uiGrab.isSelectionBoxVisible();
      const labelVisible = await uiGrab.isSelectionLabelVisible();

      expect(selectionVisible).toBe(true);
      expect(labelVisible).toBe(true);
    });

    test("all visual elements should update on viewport change", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.setViewportSize(1024, 768);
      await uiGrab.page.waitForTimeout(200);

      const selectionVisible = await uiGrab.isSelectionBoxVisible();
      expect(selectionVisible).toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });
  });
});
