import { test, expect } from "./fixtures.js";

test.describe("Toolbar Menu", () => {
  test.describe("Open and Close", () => {
    test("right-clicking select button should open the menu", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();

      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("pressing Escape should close the menu", async ({ uiGrab }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();
      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.pressEscape();

      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(false);
    });
  });

  test.describe("Menu Items", () => {
    test("menu should display registered actions", async ({ uiGrab }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();

      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);

      const labels = await uiGrab.getToolbarMenuItemLabels();
      expect(labels.length).toBeGreaterThan(0);
    });

    test("clicking a menu item should close the menu", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();
      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);

      const labels = await uiGrab.getToolbarMenuItemLabels();
      expect(labels.length).toBeGreaterThan(0);

      await uiGrab.clickToolbarMenuItem("comment");

      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(false);
    });
  });

  test.describe("Interaction with Other Dropdowns", () => {
    test("opening context menu should dismiss toolbar menu", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();
      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("li:first-child");

      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("opening toolbar menu should dismiss comments dropdown", async ({
      uiGrab,
    }) => {
      await uiGrab.registerCommentAction();
      await uiGrab.enterPromptMode("li:first-child");
      await uiGrab.typeInInput("comment");
      await uiGrab.submitInput();
      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
      await uiGrab.page.waitForTimeout(300);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickCommentsButton();
      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.rightClickToolbarToggle();

      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(false);
      await expect
        .poll(() => uiGrab.isToolbarMenuVisible(), { timeout: 2000 })
        .toBe(true);
    });
  });
});
