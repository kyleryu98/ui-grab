import { test, expect } from "./fixtures.js";
import type { UiGrabPageObject } from "./fixtures.js";

const POSITION_TOLERANCE_PX = 3;
const TOGGLE_ANIMATION_SETTLE_MS = 300;

const getToggleButtonCenter = async (uiGrab: UiGrabPageObject) => {
  return uiGrab.page.evaluate((attrName) => {
    const host = document.querySelector(`[${attrName}]`);
    const shadowRoot = host?.shadowRoot;
    if (!shadowRoot) return null;
    const root = shadowRoot.querySelector(`[${attrName}]`);
    if (!root) return null;
    const button = root.querySelector<HTMLButtonElement>(
      "[data-ui-grab-toolbar-enabled]",
    );
    if (!button) return null;
    const rect = button.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, "data-ui-grab");
};

const seedToolbarEdge = async (
  page: import("@playwright/test").Page,
  edge: "top" | "bottom" | "left" | "right",
  enabled = true,
) => {
  await page.evaluate(
    ({ edge: savedEdge, enabled: savedEnabled }) => {
      localStorage.setItem(
        "ui-grab-toolbar-state",
        JSON.stringify({
          edge: savedEdge,
          ratio: 0.5,
          collapsed: false,
          enabled: savedEnabled,
        }),
      );
    },
    { edge, enabled },
  );
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
};

const copyElement = async (
  uiGrab: UiGrabPageObject,
  selector: string,
) => {
  const previousCommentCount = await uiGrab.getCommentItemCount();
  await uiGrab.registerCommentAction();
  await uiGrab.enterPromptMode(selector);
  await uiGrab.typeInInput("comment");
  await uiGrab.submitInput();
  await expect
    .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
    .toBe(false);
  await expect
    .poll(() => uiGrab.getCommentItemCount(), { timeout: 5000 })
    .toBe(previousCommentCount + 1);
  await expect
    .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 5000 })
    .toBe(true);
  // HACK: Wait for copy feedback transition and toolbar layout animation
  await uiGrab.page.waitForTimeout(300);
};

const expectPositionStable = (
  beforePosition: { x: number; y: number },
  afterPosition: { x: number; y: number },
) => {
  expect(Math.abs(afterPosition.x - beforePosition.x)).toBeLessThan(
    POSITION_TOLERANCE_PX,
  );
  expect(Math.abs(afterPosition.y - beforePosition.y)).toBeLessThan(
    POSITION_TOLERANCE_PX,
  );
};

const waitForToolbarReady = async (uiGrab: UiGrabPageObject) => {
  await expect
    .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
    .toBe(true);
  // HACK: Wait for toolbar fade-in animation to complete
  await uiGrab.page.waitForTimeout(600);
};

test.describe("Toggle Position Stability", () => {
  test.beforeEach(async ({ uiGrab }) => {
    await uiGrab.page.evaluate(() => {
      localStorage.removeItem("ui-grab-toolbar-state");
    });
    await uiGrab.page.reload();
    await uiGrab.page.waitForLoadState("domcontentloaded");
    await waitForToolbarReady(uiGrab);
  });

  test.describe("Horizontal Layout", () => {
    test("toggle should stay in place when disabling on bottom edge", async ({
      uiGrab,
    }) => {
      const beforeToggle = await getToggleButtonCenter(uiGrab);
      expect(beforeToggle).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterToggle = await getToggleButtonCenter(uiGrab);
      expect(afterToggle).not.toBeNull();
      expectPositionStable(beforeToggle!, afterToggle!);
    });

    test("toggle should stay in place when re-enabling on bottom edge", async ({
      uiGrab,
    }) => {
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const beforeReEnable = await getToggleButtonCenter(uiGrab);
      expect(beforeReEnable).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterReEnable = await getToggleButtonCenter(uiGrab);
      expect(afterReEnable).not.toBeNull();
      expectPositionStable(beforeReEnable!, afterReEnable!);
    });

    test("toggle should return to same position after full cycle on bottom edge", async ({
      uiGrab,
    }) => {
      const initialPosition = await getToggleButtonCenter(uiGrab);
      expect(initialPosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterCycle = await getToggleButtonCenter(uiGrab);
      expect(afterCycle).not.toBeNull();
      expectPositionStable(initialPosition!, afterCycle!);
    });

    test("toggle should stay in place when toggling on top edge", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "top");
      await waitForToolbarReady(uiGrab);

      const beforeToggle = await getToggleButtonCenter(uiGrab);
      expect(beforeToggle).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterToggle = await getToggleButtonCenter(uiGrab);
      expect(afterToggle).not.toBeNull();
      expectPositionStable(beforeToggle!, afterToggle!);
    });
  });

  test.describe("Vertical Layout", () => {
    test("toggle should stay in place when toggling on right edge", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "right");
      await waitForToolbarReady(uiGrab);

      const beforeToggle = await getToggleButtonCenter(uiGrab);
      expect(beforeToggle).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterToggle = await getToggleButtonCenter(uiGrab);
      expect(afterToggle).not.toBeNull();
      expectPositionStable(beforeToggle!, afterToggle!);
    });

    test("toggle should stay in place when toggling on left edge", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "left");
      await waitForToolbarReady(uiGrab);

      const beforeToggle = await getToggleButtonCenter(uiGrab);
      expect(beforeToggle).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterToggle = await getToggleButtonCenter(uiGrab);
      expect(afterToggle).not.toBeNull();
      expectPositionStable(beforeToggle!, afterToggle!);
    });
  });

  test.describe("First Enable", () => {
    test("first enable on bottom edge should not cause position jump", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "bottom", false);
      await waitForToolbarReady(uiGrab);

      const beforeFirstEnable = await getToggleButtonCenter(uiGrab);
      expect(beforeFirstEnable).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterFirstEnable = await getToggleButtonCenter(uiGrab);
      expect(afterFirstEnable).not.toBeNull();
      expectPositionStable(beforeFirstEnable!, afterFirstEnable!);
    });

    test("first enable on top edge should not cause position jump", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "top", false);
      await waitForToolbarReady(uiGrab);

      const beforeFirstEnable = await getToggleButtonCenter(uiGrab);
      expect(beforeFirstEnable).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterFirstEnable = await getToggleButtonCenter(uiGrab);
      expect(afterFirstEnable).not.toBeNull();
      expectPositionStable(beforeFirstEnable!, afterFirstEnable!);
    });
  });

  test.describe("Position Drift Prevention", () => {
    test("should not drift after comments button appears then disappears", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);

      const withCommentsPosition = await getToggleButtonCenter(uiGrab);
      expect(withCommentsPosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterCycleWithComments = await getToggleButtonCenter(uiGrab);
      expect(afterCycleWithComments).not.toBeNull();
      expectPositionStable(withCommentsPosition!, afterCycleWithComments!);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsClear();
      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
      // HACK: Wait for comments button hide animation
      await uiGrab.page.waitForTimeout(200);

      const withoutCommentsPosition = await getToggleButtonCenter(uiGrab);
      expect(withoutCommentsPosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterCycleWithoutComments = await getToggleButtonCenter(uiGrab);
      expect(afterCycleWithoutComments).not.toBeNull();
      expectPositionStable(
        withoutCommentsPosition!,
        afterCycleWithoutComments!,
      );
    });

    test("should not accumulate drift over multiple toggle cycles", async ({
      uiGrab,
    }) => {
      const initialPosition = await getToggleButtonCenter(uiGrab);
      expect(initialPosition).not.toBeNull();

      for (let cycleIndex = 0; cycleIndex < 5; cycleIndex++) {
        await uiGrab.clickToolbarEnabled();
        // HACK: Wait for toggle animation to settle
        await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
        await uiGrab.clickToolbarEnabled();
        // HACK: Wait for toggle animation to settle
        await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      }

      const finalPosition = await getToggleButtonCenter(uiGrab);
      expect(finalPosition).not.toBeNull();
      expectPositionStable(initialPosition!, finalPosition!);
    });

    test("should not drift on vertical edge after comments changes", async ({
      uiGrab,
    }) => {
      await seedToolbarEdge(uiGrab.page, "right");
      await waitForToolbarReady(uiGrab);

      await copyElement(uiGrab, "li:first-child");
      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);

      const beforeCyclePosition = await getToggleButtonCenter(uiGrab);
      expect(beforeCyclePosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterCyclePosition = await getToggleButtonCenter(uiGrab);
      expect(afterCyclePosition).not.toBeNull();
      expectPositionStable(beforeCyclePosition!, afterCyclePosition!);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsClear();
      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
      // HACK: Wait for comments button hide animation
      await uiGrab.page.waitForTimeout(200);

      const afterClearPosition = await getToggleButtonCenter(uiGrab);
      expect(afterClearPosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterClearCyclePosition = await getToggleButtonCenter(uiGrab);
      expect(afterClearCyclePosition).not.toBeNull();
      expectPositionStable(afterClearPosition!, afterClearCyclePosition!);
    });
  });

  test.describe("Rapid Toggle", () => {
    test("rapid toggles should maintain toolbar visibility and state", async ({
      uiGrab,
    }) => {
      for (let toggleIndex = 0; toggleIndex < 6; toggleIndex++) {
        await uiGrab.clickToolbarEnabled();
        // HACK: Brief pause between rapid toggles
        await uiGrab.page.waitForTimeout(50);
      }

      // HACK: Wait for all toggle animations to fully settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS * 2);

      const toolbarInfo = await uiGrab.getToolbarInfo();
      expect(toolbarInfo.isVisible).toBe(true);
      expect(toolbarInfo.position).not.toBeNull();

      const togglePosition = await getToggleButtonCenter(uiGrab);
      expect(togglePosition).not.toBeNull();
    });

    test("position should stabilize after rapid toggles settle", async ({
      uiGrab,
    }) => {
      for (let toggleIndex = 0; toggleIndex < 6; toggleIndex++) {
        await uiGrab.clickToolbarEnabled();
        // HACK: Brief pause between rapid toggles
        await uiGrab.page.waitForTimeout(50);
      }

      // HACK: Wait for all toggle animations to fully settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS * 2);

      const settledPosition = await getToggleButtonCenter(uiGrab);
      expect(settledPosition).not.toBeNull();

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);
      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to settle
      await uiGrab.page.waitForTimeout(TOGGLE_ANIMATION_SETTLE_MS);

      const afterNormalCycle = await getToggleButtonCenter(uiGrab);
      expect(afterNormalCycle).not.toBeNull();
      expectPositionStable(settledPosition!, afterNormalCycle!);
    });
  });
});
