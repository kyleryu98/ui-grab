import { test, expect } from "./fixtures.js";

test.describe("Activation Flows", () => {
  test("should activate overlay via API", async ({ uiGrab }) => {
    const isVisibleBefore = await uiGrab.isOverlayVisible();
    expect(isVisibleBefore).toBe(false);

    await uiGrab.activate();

    const isVisibleAfter = await uiGrab.isOverlayVisible();
    expect(isVisibleAfter).toBe(true);
  });

  test("should not activate when pressing C without Cmd/Ctrl modifier", async ({
    uiGrab,
  }) => {
    await uiGrab.page.keyboard.down("c");
    await uiGrab.page.keyboard.up("c");

    const isVisible = await uiGrab.isOverlayVisible();
    expect(isVisible).toBe(false);
  });

  test("should deactivate overlay when pressing Escape", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.deactivate();

    expect(await uiGrab.isOverlayVisible()).toBe(false);
  });

  test("should toggle activation state with repeated activation", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.deactivate();
    expect(await uiGrab.isOverlayVisible()).toBe(false);

    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("should maintain activation during mouse movement", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.page.mouse.move(100, 100);
    await uiGrab.page.mouse.move(200, 200);
    await uiGrab.page.mouse.move(300, 300);

    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("should create overlay host element with correct attribute", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();

    const hostExists = await uiGrab.page.evaluate(() => {
      const host = document.querySelector("[data-ui-grab]");
      return host !== null && host.getAttribute("data-ui-grab") === "true";
    });
    expect(hostExists).toBe(true);
  });

  test("should have shadow DOM structure", async ({ uiGrab }) => {
    await uiGrab.activate();

    const hasShadowRoot = await uiGrab.page.evaluate(() => {
      const host = document.querySelector("[data-ui-grab]");
      return host?.shadowRoot !== null;
    });

    expect(hasShadowRoot).toBe(true);
  });
});

test.describe("Activation Mode Configuration", () => {
  test("toggle mode should activate on first keyboard activation", async ({
    uiGrab,
  }) => {
    await uiGrab.activateViaKeyboard();
    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("API toggle should deactivate on second call", async ({ uiGrab }) => {
    await uiGrab.toggle();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.toggle();
    expect(await uiGrab.isOverlayVisible()).toBe(false);
  });

  test("keyboard activation in toggle mode requires Escape to deactivate", async ({
    uiGrab,
  }) => {
    await uiGrab.activateViaKeyboard();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.deactivate();
    expect(await uiGrab.isOverlayVisible()).toBe(false);
  });

  test("should activate when focused on input element", async ({
    uiGrab,
  }) => {
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

  test("should activate when focused on textarea", async ({ uiGrab }) => {
    await uiGrab.page.click("[data-testid='test-textarea']");

    await uiGrab.page.keyboard.down(uiGrab.modifierKey);
    await uiGrab.page.keyboard.down("c");
    await uiGrab.page.waitForTimeout(500);
    await uiGrab.page.keyboard.up("c");
    await uiGrab.page.keyboard.up(uiGrab.modifierKey);

    await expect
      .poll(() => uiGrab.isOverlayVisible(), { timeout: 1000 })
      .toBe(true);
  });

  test("activation should work after clicking outside input", async ({
    uiGrab,
  }) => {
    await uiGrab.page.click("[data-testid='test-input']");
    await uiGrab.page.click("body", { position: { x: 10, y: 10 } });

    await uiGrab.activateViaKeyboard();
    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("API activation should work even when input is focused", async ({
    uiGrab,
  }) => {
    await uiGrab.page.click("[data-testid='test-input']");

    await uiGrab.activate();

    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("should handle activation during page scroll", async ({ uiGrab }) => {
    await uiGrab.scrollPage(200);

    await uiGrab.activate();

    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("should remain activated after viewport resize", async ({
    uiGrab,
  }) => {
    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.setViewportSize(1024, 768);

    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.setViewportSize(1280, 720);
  });

  test("activation state should survive DOM changes", async ({ uiGrab }) => {
    await uiGrab.activate();
    expect(await uiGrab.isOverlayVisible()).toBe(true);

    await uiGrab.page.evaluate(() => {
      const newDiv = document.createElement("div");
      newDiv.textContent = "Dynamic content";
      document.body.appendChild(newDiv);
    });

    expect(await uiGrab.isOverlayVisible()).toBe(true);
  });

  test("should handle multiple rapid API toggle calls", async ({
    uiGrab,
  }) => {
    for (let i = 0; i < 5; i++) {
      await uiGrab.toggle();
    }

    const state = await uiGrab.getState();
    expect(typeof state.isActive).toBe("boolean");
  });
});
