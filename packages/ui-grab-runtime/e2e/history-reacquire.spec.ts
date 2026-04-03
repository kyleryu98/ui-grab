import { test, expect } from "./fixtures.js";
import type { UiGrabPageObject } from "./fixtures.js";

interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const getViewportRect = async (
  uiGrab: UiGrabPageObject,
  selector: string,
): Promise<ViewportRect | null> => {
  return uiGrab.page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, selector);
};

const setHiddenToggleSectionMarginTopPx = async (
  uiGrab: UiGrabPageObject,
  marginTopPx: number,
) => {
  await uiGrab.page.evaluate((marginTop) => {
    const section = document.querySelector(
      '[data-testid="hidden-toggle-section"]',
    );
    if (section instanceof HTMLElement) {
      section.style.marginTop = `${marginTop}px`;
    }
  }, marginTopPx);
};

const toggleToggleableElement = async (uiGrab: UiGrabPageObject) => {
  await uiGrab.page
    .locator('[data-testid="toggle-visibility-button"]')
    .click({ force: true });
};

const copyElementWithComment = async (
  uiGrab: UiGrabPageObject,
  selector: string,
) => {
  await uiGrab.registerCommentAction();
  await uiGrab.enterPromptMode(selector);
  await uiGrab.typeInInput("comment");
  await uiGrab.submitInput();
  await expect
    .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
    .toBeTruthy();
  // HACK: allow comment item to be persisted + mapped
  await uiGrab.page.waitForTimeout(300);
};

const expectCloseTo = (
  actual: number,
  expected: number,
  tolerancePx: number,
) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerancePx);
};

test.describe("Comment selector reacquire", () => {
  test("should reacquire a remounted element and update hover preview bounds", async ({
    uiGrab,
  }) => {
    const toggleableSelector = '[data-testid="toggleable-element"]';

    await uiGrab.page
      .locator('[data-testid="hidden-toggle-section"]')
      .scrollIntoViewIfNeeded();

    const beforeRect = await getViewportRect(uiGrab, toggleableSelector);
    expect(beforeRect).not.toBeNull();

    await copyElementWithComment(uiGrab, toggleableSelector);

    await expect
      .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
      .toBe(true);

    await toggleToggleableElement(uiGrab);
    await expect(uiGrab.page.locator(toggleableSelector)).toHaveCount(0);

    await setHiddenToggleSectionMarginTopPx(uiGrab, 240);

    await toggleToggleableElement(uiGrab);
    await expect(uiGrab.page.locator(toggleableSelector)).toHaveCount(1);
    await uiGrab.page.locator(toggleableSelector).scrollIntoViewIfNeeded();

    const afterRect = await getViewportRect(uiGrab, toggleableSelector);
    expect(afterRect).not.toBeNull();
    expect(Math.abs(afterRect!.y - beforeRect!.y)).toBeGreaterThan(40);

    await uiGrab.clickCommentsButton();
    expect((await uiGrab.getCommentsDropdownInfo()).itemCount).toBe(1);

    await uiGrab.hoverCommentItem(0);

    await expect
      .poll(async () => {
        const info = await uiGrab.getGrabbedBoxInfo();
        return info.boxes.filter((box) => box.id.startsWith("comment-hover-"))
          .length;
      })
      .toBeGreaterThan(0);

    const grabbedBoxes = await uiGrab.getGrabbedBoxInfo();
    const hoverBox = grabbedBoxes.boxes.find((box) =>
      box.id.startsWith("comment-hover-"),
    );
    expect(hoverBox).toBeTruthy();

    expectCloseTo(hoverBox!.bounds.x, afterRect!.x, 8);
    expectCloseTo(hoverBox!.bounds.y, afterRect!.y, 8);
    expectCloseTo(hoverBox!.bounds.width, afterRect!.width, 8);
    expectCloseTo(hoverBox!.bounds.height, afterRect!.height, 8);
  });

  test("should show copied label feedback when selecting a reacquired comment item", async ({
    uiGrab,
  }) => {
    const toggleableSelector = '[data-testid="toggleable-element"]';

    await uiGrab.page
      .locator('[data-testid="hidden-toggle-section"]')
      .scrollIntoViewIfNeeded();

    await copyElementWithComment(uiGrab, toggleableSelector);

    await toggleToggleableElement(uiGrab);
    await expect(uiGrab.page.locator(toggleableSelector)).toHaveCount(0);

    await setHiddenToggleSectionMarginTopPx(uiGrab, 220);

    await toggleToggleableElement(uiGrab);
    await expect(uiGrab.page.locator(toggleableSelector)).toHaveCount(1);

    await uiGrab.clickCommentsButton();
    await uiGrab.clickCommentItem(0);

    await expect
      .poll(async () => {
        const labels = await uiGrab.getLabelInstancesInfo();
        return labels.filter((label) => label.status === "copied").length;
      })
      .toBeGreaterThan(0);
  });
});
