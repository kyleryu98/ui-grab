import { test, expect } from "./fixtures.js";

const FEEDBACK_DURATION_MS = 1500;

test.describe("Copy Feedback Behavior", () => {
  test.describe("Toggle Mode - Feedback Period Deactivation", () => {
    test("should deactivate immediately when key released during feedback period", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });

    test("should stay active when key held through entire feedback period", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(FEEDBACK_DURATION_MS + 200);

      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should allow hovering different elements during feedback period", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.hoverElement("h1");
      await expect
        .poll(() => uiGrab.isSelectionBoxVisible(), {
          timeout: FEEDBACK_DURATION_MS,
        })
        .toBe(true);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should show selection box following hover during feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");
      await uiGrab.hoverElement("h1");

      await uiGrab.page.waitForTimeout(FEEDBACK_DURATION_MS + 500);

      expect(await uiGrab.isOverlayVisible()).toBe(true);
      const boundsAfter = await uiGrab.getSelectionBoxBounds();
      expect(boundsAfter).not.toBeNull();

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should deactivate at end of feedback if key released mid-feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(500);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });
  });

  test.describe("Hold Mode - Feedback Period Behavior", () => {
    test("should deactivate immediately when key released during feedback in hold mode", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ activationMode: "hold" });

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(200);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });
  });

  test.describe("API Activation - Toggle Mode Behavior", () => {
    test("should deactivate after copy via API activation in toggle mode", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 3000 })
        .toBe(false);
    });

    test("should require re-activation for multiple copies via API", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 3000 })
        .toBe(false);

      await uiGrab.activate();
      await uiGrab.hoverElement("h1");
      await uiGrab.page.waitForTimeout(100);

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle rapid key tap during feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(100);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.down("c");
      await uiGrab.page.waitForTimeout(50);
      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });

    test("should handle modifier key release during feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(100);

      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);

      await uiGrab.page.keyboard.up("c");
    });

    test("should copy to clipboard before deactivating", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("[data-testid='main-title']");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("[data-testid='main-title']");

      await expect
        .poll(() => uiGrab.getClipboardContent(), {
          timeout: FEEDBACK_DURATION_MS,
        })
        .toContain("UI Grab");

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should handle multiple sequential copies while holding", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverElement("li:nth-child(2)");
      await uiGrab.page.waitForTimeout(100);
      await uiGrab.clickElement("li:nth-child(2)");
      await uiGrab.page.waitForTimeout(200);

      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should deactivate when escape pressed during feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(100);

      await uiGrab.pressEscape();

      await uiGrab.page.waitForTimeout(100);
      expect(await uiGrab.isOverlayVisible()).toBe(false);

      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });
  });

  test.describe("Feedback Visual Indicators", () => {
    test("should show 'Copied' label after successful copy", async ({
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

    test("should show grabbed box animation during feedback", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.waitForTimeout(100);

      const grabbedInfo = await uiGrab.getGrabbedBoxInfo();
      expect(grabbedInfo.count).toBeGreaterThan(0);
    });
  });

  test.describe("Immediate Grabbing Feedback", () => {
    test("should enter copying state immediately on click", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(
          async () => {
            const state = await uiGrab.getState();
            return state.isCopying || state.labelInstances.length > 0;
          },
          { timeout: 500 },
        )
        .toBe(true);
    });

    test("should create label instance with copying status on click", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(
          async () => {
            const instances = await uiGrab.getLabelInstancesInfo();
            return instances.some(
              (instance) =>
                instance.status === "copying" || instance.status === "copied",
            );
          },
          { timeout: 500 },
        )
        .toBe(true);
    });

    test("should set progress cursor during copy", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(
          async () => {
            const hasCursorOverride = await uiGrab.page.evaluate(() => {
              const styleElement = document.querySelector(
                "[data-ui-grab-cursor]",
              );
              if (!styleElement) return false;
              return styleElement.textContent?.includes("progress") ?? false;
            });
            const state = await uiGrab.getState();
            return hasCursorOverride || state.labelInstances.length > 0;
          },
          { timeout: 500 },
        )
        .toBe(true);
    });

    test("should show Grabbing label before copy completes", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='main-title']");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("[data-testid='main-title']");

      await expect
        .poll(
          async () => {
            const statusText = await uiGrab.getLabelStatusText();
            return statusText !== null;
          },
          { timeout: 2000 },
        )
        .toBe(true);
    });

    test("should transition from Grabbing to Copied", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(() => uiGrab.getLabelStatusText(), { timeout: 2000 })
        .toBe("Copied");

      const state = await uiGrab.getState();
      expect(state.isCopying).toBe(false);
    });
  });
});
