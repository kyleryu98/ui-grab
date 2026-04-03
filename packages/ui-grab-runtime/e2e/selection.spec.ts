import { test, expect } from "./fixtures.js";

test.describe("Element Selection", () => {
  test("should show selection box when hovering over element while active", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li");
    await uiGrab.waitForSelectionBox();

    const hasSelectionContent = await uiGrab.page.evaluate(() => {
      const host = document.querySelector("[data-ui-grab]");
      const shadowRoot = host?.shadowRoot;
      if (!shadowRoot) return false;
      const root = shadowRoot.querySelector("[data-ui-grab]");
      return root !== null && root.innerHTML.length > 0;
    });

    expect(hasSelectionContent).toBe(true);
  });

  test("should copy element content to clipboard on click", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("li");
    await expect.poll(() => uiGrab.getClipboardContent()).toBeTruthy();

    const clipboardContent = await uiGrab.getClipboardContent();
    expect(clipboardContent.length).toBeGreaterThan(0);
  });

  test("should copy heading element to clipboard", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] h1");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("[data-testid='todo-list'] h1");
    await expect
      .poll(() => uiGrab.getClipboardContent())
      .toContain("Todo List");
  });

  test("should write UI Grab clipboard metadata on copy", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='todo-list'] h1");
    await uiGrab.waitForSelectionBox();

    const copyPayloadPromise = uiGrab.captureNextClipboardWrites();
    await uiGrab.clickElement("[data-testid='todo-list'] h1");
    const copyPayload = await copyPayloadPromise;
    const clipboardMetadataText = copyPayload["application/x-ui-grab"];
    if (!clipboardMetadataText) {
      throw new Error("Missing UI Grab clipboard metadata");
    }

    const clipboardMetadata = JSON.parse(clipboardMetadataText);
    expect(clipboardMetadata.content).toContain("Todo List");
    expect(clipboardMetadata.entries).toHaveLength(1);
    expect(clipboardMetadata.entries[0].content).toContain("Todo List");
  });

  test("should highlight different elements when hovering", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    await uiGrab.hoverElement("h1");
    await uiGrab.waitForSelectionBox();

    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    await uiGrab.hoverElement("ul");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });

  test("should deactivate after successful copy in toggle mode", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li");
    await uiGrab.clickElement("li");

    await expect
      .poll(() => uiGrab.isOverlayVisible(), { timeout: 3000 })
      .toBe(false);
  });

  test("should not show selection when inactive", async ({ uiGrab }) => {
    const isVisibleBefore = await uiGrab.isOverlayVisible();
    expect(isVisibleBefore).toBe(false);

    await uiGrab.hoverElement("li");

    const isVisibleAfter = await uiGrab.isOverlayVisible();
    expect(isVisibleAfter).toBe(false);
  });

  test("should select nested elements correctly", async ({ uiGrab }) => {
    await uiGrab.activate();

    await uiGrab.hoverElement("li:nth-child(3)");
    await uiGrab.waitForSelectionBox();
    await uiGrab.clickElement("li:nth-child(3)");

    await expect.poll(() => uiGrab.getClipboardContent()).toBeTruthy();
  });

  test("should maintain selection target while hovering", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const listItem = uiGrab.page.locator("li").first();
    const box = await listItem.boundingBox();
    if (!box) throw new Error("Could not get bounding box");

    await uiGrab.page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2,
    );
    await uiGrab.waitForSelectionBox();

    await uiGrab.page.mouse.move(
      box.x + box.width / 2 + 5,
      box.y + box.height / 2 + 5,
    );
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe("Selection Bounds and Mutations", () => {
  test("selection box should update when element size changes", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    const initialBounds = await uiGrab.getSelectionBoxBounds();
    expect(initialBounds).not.toBeNull();

    await uiGrab.page.evaluate(() => {
      const element = document.querySelector("li:first-child") as HTMLElement;
      if (element) {
        element.style.height = "200px";
      }
    });

    await expect
      .poll(async () => {
        const bounds = await uiGrab.getSelectionBoxBounds();
        return bounds?.height ?? 0;
      })
      .toBeGreaterThan(initialBounds?.height ?? 0);
  });

  test("selection should handle element being hidden", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='toggleable-element']");
    await uiGrab.waitForSelectionBox();

    await uiGrab.hideElement("[data-testid='toggleable-element']");

    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    const isVisible = await uiGrab.isSelectionBoxVisible();
    expect(isVisible).toBe(true);
  });

  test("selection should recalculate after scroll", async ({ uiGrab }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("li:first-child");
    await uiGrab.waitForSelectionBox();

    const boundsBefore = await uiGrab.getSelectionBoxBounds();

    await uiGrab.scrollPage(50);

    if (boundsBefore) {
      await expect
        .poll(async () => {
          const bounds = await uiGrab.getSelectionBoxBounds();
          return bounds?.y;
        })
        .not.toBe(boundsBefore.y);
    }
  });

  test("multiple selection boxes should display for drag selection", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.dragSelect("li:first-child", "li:nth-child(3)");
    await uiGrab.page.waitForTimeout(500);

    await expect
      .poll(async () => {
        const info = await uiGrab.getGrabbedBoxInfo();
        return info.count;
      })
      .toBeGreaterThan(1);
  });

  test("selection should work on deeply nested elements", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    await uiGrab.hoverElement("[data-testid='deeply-nested-text']");
    await uiGrab.waitForSelectionBox();

    await uiGrab.clickElement("[data-testid='deeply-nested-text']");

    await expect
      .poll(() => uiGrab.getClipboardContent())
      .toContain("깊게 중첩된");
  });
});
