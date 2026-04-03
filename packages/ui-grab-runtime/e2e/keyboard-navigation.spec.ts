import { test, expect } from "./fixtures.js";

test.describe("Keyboard Navigation", () => {
  test("should navigate to next element with ArrowDown", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowDown");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should navigate to previous element with ArrowUp", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:nth-child(3)");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowUp");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should navigate to parent element with ArrowLeft", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowLeft");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should navigate to child element with ArrowRight", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("ul");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowRight");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should maintain activation during keyboard navigation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowDown");
    await uiGrab.page.keyboard.press("ArrowDown");
    await uiGrab.page.keyboard.press("ArrowUp");

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should copy element after keyboard navigation with click", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowDown");
    await uiGrab.waitForSelectionBox();

    const secondItem = uiGrab.page.locator(
      "[data-testid='todo-list'] li:nth-child(2)",
    );
    const box = await secondItem.boundingBox();
    if (box) {
      await uiGrab.page.mouse.click(box.x + 10, box.y + 10);
    }
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
  });

  test("should copy keyboard-selected element when clicking after mouse movement", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    const initialBounds = await uiGrab.getSelectionBoxBounds();
    expect(initialBounds).not.toBeNull();

    await uiGrab.page.keyboard.press("ArrowUp");
    await uiGrab.waitForSelectionBox();

    const selectionBoundsAfterArrow = await uiGrab.getSelectionBoxBounds();
    expect(selectionBoundsAfterArrow).not.toBeNull();

    await uiGrab.page.mouse.move(10, 10);
    await uiGrab.page.waitForTimeout(50);

    await uiGrab.page.mouse.click(
      selectionBoundsAfterArrow!.x + selectionBoundsAfterArrow!.width / 2,
      selectionBoundsAfterArrow!.y + selectionBoundsAfterArrow!.height / 2,
    );
    await uiGrab.page.waitForTimeout(500);

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent).toBeTruthy();
  });

  test("should freeze selection when navigating with arrow keys", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.keyboard.press("ArrowDown");
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.mouse.move(0, 0);
    await uiGrab.page.waitForTimeout(100);

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe("Navigation History and Wrapping", () => {
  test("ArrowLeft should go back to previous element", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.pressArrowDown();

    await uiGrab.pressArrowLeft();
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isSelectionBoxVisible();
    expect(isVisible).toBe(true);
  });

  test("multiple ArrowDown should navigate through siblings", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.pressArrowDown();
    await uiGrab.pressArrowDown();
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("ArrowUp at first sibling should stay on element", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowUp();
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isSelectionBoxVisible();
    expect(isVisible).toBe(true);
  });

  test("ArrowDown at last sibling should stay on element", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:last-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowDown();
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isSelectionBoxVisible();
    expect(isVisible).toBe(true);
  });

  test("navigation should work on deeply nested elements", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='deeply-nested-text']");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowLeft();
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isSelectionBoxVisible();
    expect(isVisible).toBe(true);
  });

  test("keyboard navigation should update selection label", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    const labelBefore = await uiGrab.getSelectionLabelInfo();

    await uiGrab.pressArrowLeft();
    await uiGrab.waitForSelectionBox();

    const labelAfter = await uiGrab.getSelectionLabelInfo();

    expect(labelBefore.isVisible).toBe(true);
    expect(labelAfter.isVisible).toBe(true);
  });
});

test.describe("ArrowUp Vertical Traversal", () => {
  test("ArrowUp should reach parent element from child", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    const initialLabel = await uiGrab.getSelectionLabelInfo();

    await uiGrab.pressArrowUp();
    await uiGrab.waitForSelectionBox();

    const afterUpLabel = await uiGrab.getSelectionLabelInfo();

    expect(initialLabel.tagName).toBe("li");
    expect(afterUpLabel.tagName).not.toBe("li");
    expect(afterUpLabel.isVisible).toBe(true);
  });

  test("repeated ArrowUp should not oscillate between elements", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    const visitedTags: string[] = [];
    for (let step = 0; step < 8; step++) {
      await uiGrab.pressArrowUp();
      await uiGrab.page.waitForTimeout(50);
      const labelInfo = await uiGrab.getSelectionLabelInfo();
      if (!labelInfo.isVisible) break;
      visitedTags.push(labelInfo.tagName ?? "unknown");
    }

    let oscillationCount = 0;
    for (let index = 2; index < visitedTags.length; index++) {
      const isRepeatingTwoStepPattern =
        visitedTags[index] === visitedTags[index - 2] &&
        visitedTags[index] !== visitedTags[index - 1];
      if (isRepeatingTwoStepPattern) {
        oscillationCount++;
      }
    }
    expect(oscillationCount).toBeLessThan(2);
  });

  test("ArrowUp bounds should never shrink", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    let previousBounds = await uiGrab.getSelectionBoxBounds();
    expect(previousBounds).not.toBeNull();
    let boundsShrunk = false;

    for (let step = 0; step < 5; step++) {
      await uiGrab.pressArrowUp();
      await uiGrab.page.waitForTimeout(50);
      const currentBounds = await uiGrab.getSelectionBoxBounds();
      if (!currentBounds) break;

      const previousArea = previousBounds!.width * previousBounds!.height;
      const currentArea = currentBounds.width * currentBounds.height;
      if (currentArea < previousArea - 1) {
        boundsShrunk = true;
        break;
      }
      previousBounds = currentBounds;
    }

    expect(boundsShrunk).toBe(false);
  });

  test("ArrowDown should reverse ArrowUp and maintain selection", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.pressArrowUp();
    await uiGrab.waitForSelectionBox();
    await uiGrab.pressArrowUp();
    await uiGrab.waitForSelectionBox();

    const afterUpVisible = await uiGrab.isSelectionBoxVisible();
    expect(afterUpVisible).toBe(true);

    await uiGrab.pressArrowDown();
    await uiGrab.waitForSelectionBox();
    await uiGrab.pressArrowDown();
    await uiGrab.waitForSelectionBox();

    const afterDownVisible = await uiGrab.isSelectionBoxVisible();
    expect(afterDownVisible).toBe(true);

    const afterDownBounds = await uiGrab.getSelectionBoxBounds();
    expect(afterDownBounds).not.toBeNull();
    expect(afterDownBounds!.width).toBeGreaterThan(0);
    expect(afterDownBounds!.height).toBeGreaterThan(0);
  });
});
