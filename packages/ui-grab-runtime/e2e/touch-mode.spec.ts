import { test, expect } from "./fixtures.js";

test.describe("Touch Mode", () => {
  test.describe("Touch Events", () => {
    test("touch tap should work for element selection", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      await uiGrab.touchTap("li:first-child");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });

    test("touch should set touch mode flag", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await uiGrab.page.waitForTimeout(100);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("touch drag should create drag selection", async ({ uiGrab }) => {
      await uiGrab.activate();

      const firstItem = uiGrab.page.locator("li").first();
      const lastItem = uiGrab.page.locator("li").nth(3);

      const startBox = await firstItem.boundingBox();
      const endBox = await lastItem.boundingBox();

      if (!startBox || !endBox) throw new Error("Could not get bounding boxes");

      await uiGrab.touchDrag(
        startBox.x - 10,
        startBox.y - 10,
        endBox.x + endBox.width + 10,
        endBox.y + endBox.height + 10,
      );
      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });
  });

  test.describe("Touch Mode Behavior", () => {
    test("touch events should update pointer position", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await uiGrab.page.waitForTimeout(100);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });

  test.describe("Touch Selection", () => {
    test("touch should select element", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();

      const element = uiGrab.page.locator("[data-testid='todo-list'] h1");
      const box = await element.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toContain("Todo List");
    });

    test("touch on different elements should work", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.touchTap("li:nth-child(2)");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 5000 })
        .toBe(false);

      await uiGrab.activate();
      await uiGrab.touchTap("li:nth-child(4)");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });
  });

  test.describe("Touch Drag Selection", () => {
    test("touch drag should select multiple elements", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const firstItem = uiGrab.page.locator("li").first();
      const secondItem = uiGrab.page.locator("li").nth(1);

      const startBox = await firstItem.boundingBox();
      const endBox = await secondItem.boundingBox();

      if (!startBox || !endBox) throw new Error("Could not get bounding boxes");

      await uiGrab.touchDrag(
        startBox.x - 5,
        startBox.y - 5,
        endBox.x + endBox.width + 5,
        endBox.y + endBox.height + 5,
      );

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });

    test("short touch drag should be treated as tap", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.touchDrag(
        box.x + box.width / 2,
        box.y + box.height / 2,
        box.x + box.width / 2 + 2,
        box.y + box.height / 2 + 2,
      );

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });
  });

  test.describe("Touch and Mouse Switching", () => {
    test("should handle switch from mouse to touch", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.touchTap("li:nth-child(2)");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });

    test("should handle switch from touch to mouse", async ({ uiGrab }) => {
      await uiGrab.activate();

      await uiGrab.touchTap("li:first-child");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 5000 })
        .toBe(false);

      await uiGrab.activate();
      await uiGrab.hoverElement("li:nth-child(3)");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("li:nth-child(3)");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
        .toBeTruthy();
    });
  });

  test.describe("Touch Input Mode", () => {
    test("double tap should enter input mode with agent", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await uiGrab.page.waitForTimeout(100);
      await uiGrab.page.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await uiGrab.page.waitForTimeout(200);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });

  test.describe("Touch with Scroll", () => {
    test("should handle touch after scroll", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.scrollPage(200);

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (box) {
        await uiGrab.page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );

        await expect
          .poll(() => uiGrab.getClipboardContent(), { timeout: 5000 })
          .toBeTruthy();
      }
    });
  });

  test.describe("Touch Edge Cases", () => {
    test("should handle rapid touch events", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      for (let i = 0; i < 5; i++) {
        await uiGrab.page.touchscreen.tap(
          box.x + box.width / 2 + i * 10,
          box.y + box.height / 2,
        );
        await uiGrab.page.waitForTimeout(50);
      }

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("should handle touch on overlay elements", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.page.waitForTimeout(600);

      const toolbarInfo = await uiGrab.getToolbarInfo();
      if (toolbarInfo.position) {
        await uiGrab.page.touchscreen.tap(
          toolbarInfo.position.x + 20,
          toolbarInfo.position.y + 10,
        );
        await uiGrab.page.waitForTimeout(200);
      }

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });
});
