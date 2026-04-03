import { test, expect } from "./fixtures.js";

test.describe("Hold Activation Mode", () => {
  test("should not activate when pressing C without Cmd/Ctrl modifier", async ({
    uiGrab,
  }) => {
    await uiGrab.page.click("body");
    await uiGrab.page.keyboard.down("c");
    await uiGrab.page.waitForTimeout(50);
    await uiGrab.page.keyboard.up("c");

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should allow multiple API activations in sequence", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    let isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    await uiGrab.pressEscape();
    await uiGrab.page.waitForTimeout(100);

    isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);

    await uiGrab.activate();

    isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should allow selection after API activation", async ({ uiGrab }) => {
    await uiGrab.activate();

    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should allow dragging after API activation", async ({ uiGrab }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const firstBox = await firstItem.boundingBox();
    if (!firstBox) throw new Error("Could not get bounding box");

    await uiGrab.page.mouse.move(firstBox.x - 10, firstBox.y - 10);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(firstBox.x + 100, firstBox.y + 100, {
      steps: 5,
    });

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    await uiGrab.page.mouse.up();
  });

  test("should cancel hold when pressing a non-activation key during hold", async ({
    uiGrab,
  }) => {
    await uiGrab.page.click("body");

    await uiGrab.page.keyboard.down(uiGrab.modifierKey);
    await uiGrab.page.keyboard.down("c");
    await uiGrab.page.waitForTimeout(50);

    await uiGrab.page.keyboard.down("a");
    await uiGrab.page.keyboard.up("c");

    await uiGrab.page.waitForTimeout(500);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);

    await uiGrab.page.keyboard.up("a");
    await uiGrab.page.keyboard.up(uiGrab.modifierKey);
  });

  test("should copy heading element after API activation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.hoverElement("[data-testid='main-title']");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("[data-testid='main-title']");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toContain("UI Grab");
  });
});
