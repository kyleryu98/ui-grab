import { test, expect } from "./fixtures.js";

const COMMENT_ITEM_SELECTOR = "[data-ui-grab-comment-item]";

const getFirstCommentItemText = async (uiGrab: {
  page: import("@playwright/test").Page;
}) =>
  uiGrab.page.evaluate((selector) => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const commentItem = root?.querySelector<HTMLElement>(selector);
    return commentItem?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }, COMMENT_ITEM_SELECTOR);

test.describe("Shift Multi Select", () => {
  test("should keep showing the next candidate preview after the first Shift-click", async ({
    uiGrab,
  }) => {
    await uiGrab.activateViaKeyboard();

    await uiGrab.page.keyboard.down("Shift");
    await uiGrab.clickElement("li:first-child");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);

    const hoveredBounds = await uiGrab.getElementBounds("li:nth-child(2)");
    expect(hoveredBounds).not.toBeNull();

    await uiGrab.hoverElement("li:nth-child(2)");

    await expect
      .poll(async () => (await uiGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await expect
      .poll(async () => {
        const selectionBounds = await uiGrab.getSelectionBoxBounds();
        if (!selectionBounds || !hoveredBounds) return false;
        return (
          Math.abs(selectionBounds.x - hoveredBounds.x) < 3 &&
          Math.abs(selectionBounds.y - hoveredBounds.y) < 3 &&
          Math.abs(selectionBounds.width - hoveredBounds.width) < 3 &&
          Math.abs(selectionBounds.height - hoveredBounds.height) < 3
        );
      })
      .toBe(true);

    await uiGrab.page.keyboard.up("Shift");
    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
  });

  test("should allow grouped selection after keyboard activation once Shift-click starts", async ({
    uiGrab,
  }) => {
    await uiGrab.activateViaKeyboard();

    await uiGrab.page.keyboard.down("Shift");
    await uiGrab.clickElement("li:first-child");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    await uiGrab.hoverElement("li:nth-child(2)");
    await expect
      .poll(async () => (await uiGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await uiGrab.clickElement("li:nth-child(2)");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    await expect
      .poll(async () => (await uiGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await uiGrab.page.keyboard.up("Shift");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
  });

  test("should wait for Shift release before entering prompt mode", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.page.keyboard.down("Shift");
    await uiGrab.clickElement("li:first-child");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    await uiGrab.hoverElement("li:nth-child(2)");
    await expect
      .poll(async () => (await uiGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await uiGrab.clickElement("li:nth-child(2)");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    await expect
      .poll(async () => (await uiGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await uiGrab.page.keyboard.up("Shift");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
  });

  test("should keep grouped selection prompt text in comment history", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.page.keyboard.down("Shift");
    await uiGrab.clickElement("li:first-child");
    await uiGrab.hoverElement("li:nth-child(2)");
    await uiGrab.clickElement("li:nth-child(2)");
    await uiGrab.page.keyboard.up("Shift");

    await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);

    await uiGrab.typeInInput("grouped prompt");
    await uiGrab.submitInput();

    await expect
      .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
      .toBeTruthy();
    await expect
      .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 5000 })
      .toBe(true);

    await uiGrab.clickCommentsButton();

    await expect
      .poll(() => getFirstCommentItemText(uiGrab), { timeout: 5000 })
      .toContain("2 elements");
    await expect
      .poll(() => getFirstCommentItemText(uiGrab), { timeout: 5000 })
      .toContain("grouped prompt");
  });
});
