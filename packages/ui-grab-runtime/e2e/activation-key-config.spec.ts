import { test, expect } from "./fixtures.js";

test.describe("Activation Key Configuration", () => {
  test.describe.configure({ mode: "serial" });

  test.describe("Configuration via reinitialize", () => {
    test("should accept activationKey option", async ({ uiGrab }) => {
      await uiGrab.reinitialize({
        activationKey: "g",
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept modifier+key activationKey", async ({ uiGrab }) => {
      await uiGrab.reinitialize({
        activationKey: "Meta+k",
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept activationMode toggle option", async ({
      uiGrab,
    }) => {
      await uiGrab.reinitialize({
        activationKey: "g",
        activationMode: "toggle",
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept activationMode hold option", async ({ uiGrab }) => {
      await uiGrab.reinitialize({
        activationKey: "Space",
        activationMode: "hold",
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept keyHoldDuration option", async ({ uiGrab }) => {
      await uiGrab.reinitialize({
        keyHoldDuration: 200,
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept allowActivationInsideInput option", async ({
      uiGrab,
    }) => {
      await uiGrab.reinitialize({
        allowActivationInsideInput: true,
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });

    test("should accept all options combined", async ({ uiGrab }) => {
      await uiGrab.reinitialize({
        activationKey: "Ctrl+Shift+g",
        activationMode: "toggle",
        keyHoldDuration: 150,
        allowActivationInsideInput: false,
      });

      const state = await uiGrab.getState();
      expect(typeof state.isActive).toBe("boolean");
    });
  });

  test.describe("API activation with default config", () => {
    test("should activate via API", async ({ uiGrab }) => {
      expect(await uiGrab.isOverlayVisible()).toBe(false);

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("should deactivate via Escape", async ({ uiGrab }) => {
      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.deactivate();
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });

    test("should toggle via API", async ({ uiGrab }) => {
      await uiGrab.toggle();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.toggle();
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });
  });

  test.describe("Selection with default config", () => {
    test("should show selection box", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();

      expect(await uiGrab.isSelectionBoxVisible()).toBe(true);
    });

    test("should copy element", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("[data-testid='todo-list'] h1");
      await uiGrab.page.waitForTimeout(500);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toContain("Todo List");
    });
  });

  test.describe("Dynamic option updates", () => {
    test("should update activationKey via updateOptions", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({
        activationKey: "k",
      });

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("should update activationMode via updateOptions", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({
        activationMode: "hold",
      });

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("should update keyHoldDuration via updateOptions", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({
        keyHoldDuration: 100,
      });

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });
  });

  test.describe("Keyboard activation with hold duration", () => {
    test("should activate with default key after holding", async ({
      uiGrab,
    }) => {
      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("should not activate without holding long enough", async ({
      uiGrab,
    }) => {
      await uiGrab.page.click("body");
      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.page.waitForTimeout(50);
      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });
  });

  test.describe("Input field interaction", () => {
    test("should activate in input by default", async ({ uiGrab }) => {
      await uiGrab.page.click("[data-testid='test-input']");

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await uiGrab.page.waitForTimeout(500);
      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 1000 })
        .toBe(true);
    });

    test("should not activate in input when disabled", async ({
      uiGrab,
    }) => {
      await uiGrab.reinitialize({ allowActivationInsideInput: false });
      await uiGrab.page.click("[data-testid='test-input']");

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.down("c");
      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 2000 })
        .toBe(false);
      await uiGrab.page.keyboard.up("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
    });

    test("should activate outside input after clicking away", async ({
      uiGrab,
    }) => {
      await uiGrab.page.click("[data-testid='test-input']");
      await uiGrab.page.click("body", { position: { x: 10, y: 10 } });

      await uiGrab.activateViaKeyboard();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });
  });

  test.describe("State persistence", () => {
    test("should maintain activation state after viewport resize", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.setViewportSize(1024, 768);
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });

    test("should maintain activation state after scroll", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.scrollPage(200);
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });
  });
});
