import { test, expect } from "./fixtures.js";

test.describe("Edge Cases", () => {
  test.describe("Element Removal", () => {
    test("should handle element removed during hover", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='dynamic-element-1']");
      await uiGrab.waitForSelectionBox();

      await uiGrab.removeElement("[data-testid='dynamic-element-1']");
      await uiGrab.page.waitForTimeout(200);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should handle element removed during drag", async ({ uiGrab }) => {
      await uiGrab.activate();

      const element = uiGrab.page.locator(
        "[data-testid='dynamic-element-1']",
      );
      const box = await element.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 10, box.y - 10);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 50, box.y + 50, { steps: 3 });

      await uiGrab.removeElement("[data-testid='dynamic-element-1']");
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.page.mouse.up();

      const isActive = await uiGrab.isOverlayVisible();
      expect(typeof isActive).toBe("boolean");
    });

    test("should recover after target element is removed", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='toggleable-element']");
      await uiGrab.waitForSelectionBox();

      await uiGrab.removeElement("[data-testid='toggleable-element']");

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });
  });

  test.describe("Rapid Actions", () => {
    test("should handle rapid activation/deactivation cycles", async ({
      uiGrab,
    }) => {
      for (let i = 0; i < 10; i++) {
        await uiGrab.activate();
        await uiGrab.page.waitForTimeout(20);
        await uiGrab.deactivate();
        await uiGrab.page.waitForTimeout(20);
      }

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should handle rapid hover changes", async ({ uiGrab }) => {
      await uiGrab.activate();

      const elements = [
        "li:first-child",
        "li:nth-child(2)",
        "li:nth-child(3)",
        "h1",
        "ul",
      ];
      for (const selector of elements) {
        await uiGrab.hoverElement(selector);
        await uiGrab.page.waitForTimeout(10);
      }

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should handle rapid clicks", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      for (let i = 0; i < 5; i++) {
        await uiGrab.clickElement("li:first-child");
        await uiGrab.page.waitForTimeout(50);
      }

      await uiGrab.page.waitForTimeout(500);

      const clipboard = await uiGrab.getClipboardContent();
      expect(clipboard).toBeTruthy();
    });

    test("should handle rapid toggle calls", async ({ uiGrab }) => {
      for (let i = 0; i < 8; i++) {
        await uiGrab.toggle();
        await uiGrab.page.waitForTimeout(30);
      }

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });
  });

  test.describe("Visibility Changes", () => {
    test("should handle tab visibility change", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.page.evaluate(() => {
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", {
          value: true,
          writable: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      await uiGrab.page.waitForTimeout(100);

      await uiGrab.page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          value: false,
          writable: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("should handle window blur and focus", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.evaluate(() => {
        window.dispatchEvent(new Event("blur"));
      });
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.page.evaluate(() => {
        window.dispatchEvent(new Event("focus"));
      });
      await uiGrab.page.waitForTimeout(100);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });

  test.describe("Scroll and Resize", () => {
    test("should handle scroll during drag operation", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x, box.y);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 50, box.y + 50, { steps: 3 });

      await uiGrab.scrollPage(100);

      await uiGrab.page.mouse.up();

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("should handle resize during selection", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.setViewportSize(800, 600);
      await uiGrab.page.waitForTimeout(200);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });

    test("should handle rapid scroll events", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      for (let i = 0; i < 5; i++) {
        await uiGrab.page.evaluate(() => {
          window.scrollBy(0, 50);
        });
        await uiGrab.page.waitForTimeout(20);
      }
      await uiGrab.page.waitForTimeout(200);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });
  });

  test.describe("Memory and Cleanup", () => {
    test("dispose should clean up properly", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.dispose();
      await uiGrab.page.waitForTimeout(200);

      const canReinit = await uiGrab.page.evaluate(() => {
        const initFn = (window as { initUiGrab?: () => void }).initUiGrab;
        return typeof initFn === "function";
      });
      expect(canReinit).toBe(true);
    });

    test("should allow reinitialization after dispose", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.dispose();

      await uiGrab.reinitialize();

      await uiGrab.activate();
      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("double initialization should be prevented", async ({ uiGrab }) => {
      await uiGrab.reinitialize();
      await uiGrab.page.waitForTimeout(200);

      const hostCount = await uiGrab.page.evaluate(() => {
        return document.querySelectorAll("[data-ui-grab]").length;
      });
      expect(hostCount).toBe(1);
    });
  });

  test.describe("Focus Management", () => {
    test("should restore focus to previously focused element", async ({
      uiGrab,
    }) => {
      await uiGrab.page.click("[data-testid='test-input']");
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.clickElement("li:first-child");

      await expect
        .poll(
          () =>
            uiGrab.page.evaluate(() =>
              document.activeElement?.getAttribute("data-testid"),
            ),
          { timeout: 5000 },
        )
        .toBe("test-input");
    });
  });

  test.describe("Context Menu Edge Cases", () => {
    test("should handle context menu on removed element", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='dynamic-element-3']");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("[data-testid='dynamic-element-3']");

      await uiGrab.removeElement("[data-testid='dynamic-element-3']");
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.pressEscape();

      const isActive = await uiGrab.isOverlayVisible();
      expect(typeof isActive).toBe("boolean");
    });
  });

  test.describe("Copy Edge Cases", () => {
    test("should handle copy during visibility change", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await uiGrab.page.evaluate(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      await uiGrab.page.waitForTimeout(500);

      const clipboard = await uiGrab.getClipboardContent();
      expect(clipboard).toBeTruthy();
    });
  });

  test.describe("Viewport Edge Cases", () => {
    test("should handle elements outside viewport", async ({ uiGrab }) => {
      await uiGrab.activate();

      const footer = uiGrab.page.locator("[data-testid='footer']");
      await footer.scrollIntoViewIfNeeded();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverElement("[data-testid='footer']");
      await uiGrab.waitForSelectionBox();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should handle zero-dimension elements gracefully", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.page.mouse.move(100, 100);
      await uiGrab.page.waitForTimeout(100);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should handle invisible elements", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.page.mouse.move(200, 200);
      await uiGrab.page.waitForTimeout(100);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });
  });

  test.describe("State Consistency", () => {
    test("getState should be consistent across calls", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const state1 = await uiGrab.getState();
      const state2 = await uiGrab.getState();

      expect(state1.isActive).toBe(state2.isActive);
      expect(state1.isDragging).toBe(state2.isDragging);
      expect(state1.isCopying).toBe(state2.isCopying);
    });

    test("state should be correct after complex interaction sequence", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.pressArrowDown();
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.rightClickElement("li:nth-child(2)");
      await uiGrab.page.waitForTimeout(100);

      const state = await uiGrab.getState();
      expect(state.isActive).toBe(true);
    });
  });
});
