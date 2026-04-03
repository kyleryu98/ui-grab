import { test, expect } from "./fixtures.js";

test.describe("Copy styles", () => {
  test.describe("Context Menu", () => {
    test("should show Copy styles in context menu", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='todo-list'] h1");

      const menuInfo = await uiGrab.getContextMenuInfo();
      expect(menuInfo.isVisible).toBe(true);
      expect(
        menuInfo.menuItems.map((item: string) => item.toLowerCase()),
      ).toContain("copy styles");
    });

    test("should copy CSS declarations to clipboard via context menu", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='todo-list'] h1");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toMatch(/[\w-]+:\s*.+;/);
    });

    test("should include className header when element has a class", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='todo-list'] h1");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toContain("className:");
    });

    test("should contain CSS property-value pairs", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='submit-button']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='submit-button']");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toMatch(/[\w-]+:\s*.+;/);

      const content = await uiGrab.getClipboardContent();
      const hasRelevantProperty =
        content.includes("background-color:") ||
        content.includes("color:") ||
        content.includes("padding-");
      expect(hasRelevantProperty).toBe(true);
    });
  });

  test.describe("Feedback", () => {
    test("should show Copied feedback after Copy styles", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='submit-button']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='submit-button']");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getLabelStatusText(), { timeout: 5000 })
        .toBe("Copied");
    });

    test("should dismiss context menu after Copy styles action", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("li:first-child");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.isContextMenuVisible(), { timeout: 2000 })
        .toBe(false);
    });
  });

  test.describe("Different Elements", () => {
    test("should copy CSS for element with background and color styles", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='gradient-div']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='gradient-div']");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toMatch(/[\w-]+:\s*.+;/);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toMatch(/width:|height:|background/);
    });

    test("should produce output for a plain element with no custom styles", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='deeply-nested-text']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='deeply-nested-text']");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });

    test("should copy different CSS for different elements", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='submit-button']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='submit-button']");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toMatch(/[\w-]+:\s*.+;/);

      const firstCss = await uiGrab.getClipboardContent();

      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("[data-testid='todo-list'] h1");
      await uiGrab.clickContextMenuItem("Copy styles");

      await expect
        .poll(
          async () => {
            const content = await uiGrab.getClipboardContent();
            return content !== firstCss;
          },
          { timeout: 5000 },
        )
        .toBe(true);
    });
  });
});
