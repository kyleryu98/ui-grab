import { test, expect } from "./fixtures.js";

const COMMENT_ITEM_SELECTOR = "[data-react-grab-comment-item]";

const getFirstCommentItemText = async (reactGrab: {
  page: import("@playwright/test").Page;
}) =>
  reactGrab.page.evaluate((selector) => {
    const host = document.querySelector("[data-react-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-react-grab]");
    const commentItem = root?.querySelector<HTMLElement>(selector);
    return commentItem?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }, COMMENT_ITEM_SELECTOR);

test.describe("Shift Multi Select", () => {
  test("should wait for Shift release before entering prompt mode", async ({
    reactGrab,
  }) => {
    await reactGrab.clickToolbarToggle();

    await reactGrab.page.keyboard.down("Shift");
    await reactGrab.clickElement("li:first-child");

    await expect.poll(() => reactGrab.isPromptModeActive()).toBe(false);

    await reactGrab.clickElement("li:nth-child(2)");

    await expect.poll(() => reactGrab.isPromptModeActive()).toBe(false);
    await expect
      .poll(async () => (await reactGrab.getSelectionLabelInfo()).elementsCount)
      .toBe(2);

    await reactGrab.page.keyboard.up("Shift");

    await expect.poll(() => reactGrab.isPromptModeActive()).toBe(true);
  });

  test("should keep grouped selection prompt text in comment history", async ({
    reactGrab,
  }) => {
    await reactGrab.clickToolbarToggle();

    await reactGrab.page.keyboard.down("Shift");
    await reactGrab.clickElement("li:first-child");
    await reactGrab.clickElement("li:nth-child(2)");
    await reactGrab.page.keyboard.up("Shift");

    await expect.poll(() => reactGrab.isPromptModeActive()).toBe(true);

    await reactGrab.typeInInput("grouped prompt");
    await reactGrab.submitInput();

    await expect
      .poll(() => reactGrab.getClipboardContent(), { timeout: 5000 })
      .toBeTruthy();
    await expect
      .poll(() => reactGrab.isCommentsButtonVisible(), { timeout: 5000 })
      .toBe(true);

    await reactGrab.clickCommentsButton();

    await expect
      .poll(() => getFirstCommentItemText(reactGrab), { timeout: 5000 })
      .toContain("2 elements");
    await expect
      .poll(() => getFirstCommentItemText(reactGrab), { timeout: 5000 })
      .toContain("grouped prompt");
  });
});
