import { test, expect } from "./fixtures.js";

test.describe("Viewport and Scroll Handling", () => {
  test("should maintain selection after scrolling page", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.evaluate(() => {
      window.scrollBy(0, 50);
    });
    await uiGrab.page.waitForTimeout(200);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should re-detect element under cursor after scroll without mouse movement", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const firstItem = uiGrab.page
      .locator("[data-testid='todo-list'] li")
      .first();
    const firstItemBox = await firstItem.boundingBox();
    expect(firstItemBox).not.toBeNull();

    await uiGrab.page.mouse.move(
      firstItemBox!.x + firstItemBox!.width / 2,
      firstItemBox!.y + firstItemBox!.height / 2,
    );
    await uiGrab.page.waitForTimeout(150);
    await uiGrab.waitForSelectionBox();

    const initialLabel = await uiGrab.getSelectionLabelInfo();
    expect(initialLabel.isVisible).toBe(true);

    await uiGrab.page.evaluate(() => {
      window.scrollBy(0, 100);
    });
    await uiGrab.page.waitForTimeout(200);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should update selection to new element after scroll changes element under cursor", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const heading = uiGrab.page.locator("[data-testid='main-title']");
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();

    const cursorX = headingBox!.x + headingBox!.width / 2;
    const cursorY = headingBox!.y + headingBox!.height / 2;

    await uiGrab.page.mouse.move(cursorX, cursorY);
    await uiGrab.page.waitForTimeout(150);
    await uiGrab.waitForSelectionBox();

    const initialBounds = await uiGrab.getSelectionBoxBounds();
    expect(initialBounds).not.toBeNull();

    await uiGrab.page.evaluate(() => {
      window.scrollBy(0, 200);
    });
    await uiGrab.page.waitForTimeout(200);

    const newBounds = await uiGrab.getSelectionBoxBounds();
    if (newBounds !== null && initialBounds !== null) {
      const boundsChanged =
        newBounds.y !== initialBounds.y ||
        newBounds.height !== initialBounds.height;
      expect(boundsChanged).toBe(true);
    }
  });

  test("should re-detect element after viewport resize without mouse movement", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const heading = uiGrab.page.locator("[data-testid='main-title']");
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();

    await uiGrab.page.mouse.move(
      headingBox!.x + headingBox!.width / 2,
      headingBox!.y + headingBox!.height / 2,
    );
    await uiGrab.page.waitForTimeout(150);
    await uiGrab.waitForSelectionBox();

    const initialBounds = await uiGrab.getSelectionBoxBounds();
    expect(initialBounds).not.toBeNull();

    await uiGrab.setViewportSize(800, 400);
    await uiGrab.page.waitForTimeout(200);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    await uiGrab.setViewportSize(1280, 720);
  });

  test("should not re-detect element during drag operation on scroll", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const todoList = uiGrab.page.locator("[data-testid='todo-list'] ul");
    const listBox = await todoList.boundingBox();
    expect(listBox).not.toBeNull();

    const startX = listBox!.x - 10;
    const startY = listBox!.y;
    const endX = listBox!.x + listBox!.width + 10;
    const endY = listBox!.y + listBox!.height;

    await uiGrab.page.mouse.move(startX, startY);
    await uiGrab.page.mouse.down();
    await uiGrab.page.mouse.move(endX, endY, { steps: 5 });

    const state = await uiGrab.getState();
    expect(state.isDragging).toBe(true);

    await uiGrab.page.evaluate(() => {
      window.scrollBy(0, 50);
    });
    await uiGrab.page.waitForTimeout(100);

    const stateAfterScroll = await uiGrab.getState();
    expect(stateAfterScroll.isDragging).toBe(true);

    await uiGrab.page.mouse.up();
  });

  test("should not re-detect element when selection is frozen via arrow navigation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.page.waitForTimeout(100);

    const labelBeforeScroll = await uiGrab.getSelectionLabelInfo();

    await uiGrab.page.evaluate(() => {
      window.scrollBy(0, 30);
    });
    await uiGrab.page.waitForTimeout(200);

    const labelAfterScroll = await uiGrab.getSelectionLabelInfo();

    expect(labelAfterScroll.tagName).toBe(labelBeforeScroll.tagName);
  });

  test("should update selection position after viewport resize", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.setViewportSize({ width: 800, height: 600 });
    await uiGrab.page.waitForTimeout(200);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    await uiGrab.page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should handle mouse movement after scroll", async ({ uiGrab }) => {
    await uiGrab.activate();

    await uiGrab.scrollPage(100);

    await uiGrab.hoverElement("li:nth-child(5)");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should allow drag selection after scrolling", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.scrollPage(50);

    await uiGrab.dragSelect("li:first-child", "li:nth-child(3)");
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
  });

  test("should preserve frozen selection during scroll via arrow navigation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.scrollPage(100);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should handle keyboard navigation after scroll", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.scrollPage(50);

    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.pressArrowDown();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should recalculate bounds after visual viewport change", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const heading = uiGrab.page.locator("[data-testid='main-title']");
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();

    await uiGrab.page.mouse.move(
      headingBox!.x + headingBox!.width / 2,
      headingBox!.y + headingBox!.height / 2,
    );
    await uiGrab.page.waitForTimeout(150);
    await uiGrab.waitForSelectionBox();

    const initialBounds = await uiGrab.getSelectionBoxBounds();
    expect(initialBounds).not.toBeNull();

    await uiGrab.page.evaluate(() => {
      window.visualViewport?.dispatchEvent(new Event("resize"));
      window.visualViewport?.dispatchEvent(new Event("scroll"));
    });
    await uiGrab.page.waitForTimeout(200);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);

    const boundsAfter = await uiGrab.getSelectionBoxBounds();
    expect(boundsAfter).not.toBeNull();
  });

  test("should copy element after resize using click", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] h1");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.setViewportSize({ width: 600, height: 400 });
    await uiGrab.page.waitForTimeout(200);

    await uiGrab.hoverElement("[data-testid='todo-list'] h1");
    await uiGrab.waitForSelectionBox();
    await uiGrab.clickElement("[data-testid='todo-list'] h1");

    await expect
      .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
      .toContain("Todo List");

    await uiGrab.page.setViewportSize({ width: 1280, height: 720 });
  });
});
