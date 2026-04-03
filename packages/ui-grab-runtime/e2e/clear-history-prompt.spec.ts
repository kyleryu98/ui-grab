import { test, expect } from "./fixtures.js";
import type { UiGrabPageObject } from "./fixtures.js";

const copyElement = async (uiGrab: UiGrabPageObject, selector: string) => {
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
  await uiGrab.page.waitForTimeout(300);
};

test.describe("Comments Panel Bulk Actions", () => {
  test("should keep the toolbar copy-all button hidden even when comments are open", async ({
    uiGrab,
  }) => {
    await copyElement(uiGrab, "li:first-child");
    await uiGrab.clickCommentsButton();

    await expect
      .poll(() => uiGrab.isToolbarCopyAllVisible(), { timeout: 2000 })
      .toBe(false);
  });

  test("should copy all comments items to clipboard from the panel header", async ({
    uiGrab,
  }) => {
    await copyElement(uiGrab, "li:first-child");
    await copyElement(uiGrab, "li:last-child");

    await uiGrab.page.evaluate(() => navigator.clipboard.writeText(""));

    await uiGrab.clickCommentsButton();
    await uiGrab.clickCommentsCopyAll();

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toContain("[1]");
    expect(clipboardContent).toContain("[2]");
  });

  test("should show clear comments prompt after copying all from the panel header", async ({
    uiGrab,
  }) => {
    await copyElement(uiGrab, "li:first-child");
    await uiGrab.clickCommentsButton();
    await uiGrab.clickCommentsCopyAll();

    await expect
      .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
      .toBe(true);
  });
});

test.describe("Clear History Prompt", () => {
  test.describe("Appearance", () => {
    test("should appear after comments dropdown copy all", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);
    });
  });

  test.describe("Confirm", () => {
    test("should clear comments when confirmed via button click", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.confirmClearCommentsPrompt();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should clear comments when confirmed via Enter key", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.pressEnter();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should dismiss the prompt after confirming", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.confirmClearCommentsPrompt();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should skip prompt on subsequent copy-all after confirming once", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.confirmClearCommentsPrompt();

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);

      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
    });
  });

  test.describe("Cancel", () => {
    test("should keep comments when cancelled via button click", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.cancelClearCommentsPrompt();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("should dismiss prompt when cancelled via Escape key", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);
    });
  });

  test.describe("Dismiss Interactions", () => {
    test("should dismiss when opening context menu", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("li:first-child");

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should dismiss when toolbar is disabled", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarEnabled();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isClearCommentsPromptVisible(), { timeout: 2000 })
        .toBe(false);
    });
  });
});
