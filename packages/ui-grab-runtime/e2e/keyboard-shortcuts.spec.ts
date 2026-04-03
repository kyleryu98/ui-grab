import { test, expect } from "./fixtures.js";

test.describe("Keyboard Shortcuts", () => {
  test("should copy selected element when clicking", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] h1");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("[data-testid='todo-list'] h1");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toContain("Todo List");
  });

  test("should deactivate when pressing Escape while hovering", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressEscape();
    await uiGrab.page.waitForTimeout(100);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should not activate when pressing C without Cmd/Ctrl modifier", async ({
    uiGrab,
  }) => {
    await uiGrab.page.keyboard.down("c");
    await uiGrab.page.waitForTimeout(50);
    await uiGrab.page.keyboard.up("c");

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should copy list item when clicked", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:nth-child(2)");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("[data-testid='todo-list'] li:nth-child(2)");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toContain("Walk the dog");
  });

  test("should keep overlay active while navigating with arrow keys", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    for (let i = 0; i < 5; i++) {
      await uiGrab.page.keyboard.press("ArrowDown");
      await uiGrab.page.waitForTimeout(50);
    }

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should deactivate after successful click copy in toggle mode", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("li:first-child");
    await uiGrab.page.waitForTimeout(2000);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });
});
