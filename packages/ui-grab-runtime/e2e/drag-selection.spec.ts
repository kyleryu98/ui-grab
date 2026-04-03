import { test, expect } from "./fixtures.js";

test.describe("Drag Selection", () => {
  test("should create drag box when clicking and dragging", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const firstBox = await firstItem.boundingBox();
    if (!firstBox) throw new Error("Could not get bounding box");

    const startX = firstBox.x - 20;
    const startY = firstBox.y - 20;

    await uiGrab.page.mouse.move(startX, startY);
    await uiGrab.page.mouse.down();
    await uiGrab.page.waitForTimeout(50);

    await uiGrab.page.mouse.move(startX + 100, startY + 100, { steps: 5 });
    await uiGrab.page.waitForTimeout(100);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    await uiGrab.page.mouse.up();
  });

  test("should select multiple elements within drag bounds", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.dragSelect("li:first-child", "li:nth-child(3)");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent.length).toBeGreaterThan(0);
  });

  test("should copy all selected elements to clipboard", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.dragSelect("li:first-child", "li:nth-child(5)");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();

    expect(clipboardContent).toContain("Buy groceries");
  });

  test("should cancel drag selection on Escape", async ({ uiGrab }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const firstBox = await firstItem.boundingBox();
    if (!firstBox) throw new Error("Could not get bounding box");

    await uiGrab.page.mouse.move(firstBox.x - 10, firstBox.y - 10);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(firstBox.x + 200, firstBox.y + 200, {
      steps: 5,
    });

    await uiGrab.pressEscape();
    await uiGrab.page.mouse.up();

    await uiGrab.page.waitForTimeout(100);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should not trigger drag for small movements", async ({ uiGrab }) => {
    await uiGrab.activate();

    const listItem = uiGrab.page.locator("li").first();
    const box = await listItem.boundingBox();
    if (!box) throw new Error("Could not get bounding box");

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await uiGrab.page.mouse.move(centerX, centerY);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(centerX + 1, centerY + 1);
    await uiGrab.page.mouse.up();

    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
  });

  test("should deactivate after drag selection in toggle mode", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.dragSelect("li:first-child", "li:nth-child(2)");

    await uiGrab.page.waitForTimeout(2000);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should handle drag across entire list", async ({ uiGrab }) => {
    await uiGrab.activate();

    await uiGrab.dragSelect(
      "[data-testid='todo-list'] li:first-child",
      "[data-testid='todo-list'] li:last-child",
    );
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent).toContain("Buy groceries");
    expect(clipboardContent).toContain("Write tests");
  });

  test("should show visual feedback during drag", async ({ uiGrab }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const lastItem = uiGrab.page.locator("li").last();

    const startBox = await firstItem.boundingBox();
    const endBox = await lastItem.boundingBox();
    if (!startBox || !endBox) throw new Error("Could not get bounding boxes");

    await uiGrab.page.mouse.move(startBox.x - 10, startBox.y - 10);
    await uiGrab.page.mouse.down();

    await uiGrab.page.mouse.move(
      endBox.x + endBox.width + 10,
      endBox.y + endBox.height + 10,
      { steps: 10 },
    );

    const hasContent = await uiGrab.page.evaluate(() => {
      const host = document.querySelector("[data-ui-grab]");
      const shadowRoot = host?.shadowRoot;
      if (!shadowRoot) return false;
      const root = shadowRoot.querySelector("[data-ui-grab]");
      return root !== null && root.innerHTML.length > 0;
    });

    expect(hasContent).toBe(true);

    await uiGrab.page.mouse.up();
  });
});

test.describe("Drag Selection with Scroll", () => {
  test("should handle drag selection with scroll offset", async ({
    uiGrab,
  }) => {
    await uiGrab.scrollPage(100);
    await uiGrab.page.waitForTimeout(100);

    await uiGrab.activate();
    await uiGrab.dragSelect("li:first-child", "li:nth-child(2)");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
  });

  test("should maintain drag while scrolling", async ({ uiGrab }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const firstBox = await firstItem.boundingBox();
    if (!firstBox) throw new Error("Could not get bounding box");

    await uiGrab.page.mouse.move(firstBox.x - 10, firstBox.y - 10);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(firstBox.x + 100, firstBox.y + 100, {
      steps: 5,
    });

    await uiGrab.scrollPage(50);
    await uiGrab.page.waitForTimeout(100);

    await uiGrab.page.mouse.up();

    const state = await uiGrab.getState();
    expect(state).toBeDefined();
  });

  test("should select elements after scrolling down", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.scrollPage(300);
    await uiGrab.page.waitForTimeout(200);

    const listItems = uiGrab.page.locator("li");
    const count = await listItems.count();

    if (count > 0) {
      await uiGrab.dragSelect("li:first-child", "li:nth-child(2)");
      await uiGrab.page.waitForTimeout(500);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toBeTruthy();
    }
  });

  test("drag bounds should exist during drag operation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page.locator("li").first();
    const firstBox = await firstItem.boundingBox();
    if (!firstBox) throw new Error("Could not get bounding box");

    await uiGrab.page.mouse.move(firstBox.x - 10, firstBox.y - 10);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(firstBox.x + 200, firstBox.y + 200, {
      steps: 5,
    });
    await uiGrab.page.waitForTimeout(100);

    const bounds = await uiGrab.getDragBoxBounds();
    expect(bounds).not.toBeNull();

    await uiGrab.page.mouse.up();
  });

  test("drag selection should work in scrollable container", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const scrollContainer = uiGrab.page.locator(
      "[data-testid='scroll-container']",
    );
    const box = await scrollContainer.boundingBox();

    if (box) {
      await uiGrab.page.mouse.move(box.x + 10, box.y + 10);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 200, box.y + 100, { steps: 5 });
      await uiGrab.page.mouse.up();
      await uiGrab.page.waitForTimeout(500);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toBeTruthy();
    }
  });
});
