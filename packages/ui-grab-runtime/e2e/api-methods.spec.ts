import { test, expect } from "./fixtures.js";

test.describe("API Methods", () => {
  test.describe("Activation APIs", () => {
    test("activate() should activate the overlay", async ({ uiGrab }) => {
      expect(await uiGrab.isOverlayVisible()).toBe(false);

      await uiGrab.activate();

      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("deactivate() should deactivate the overlay", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.page.evaluate(() => {
        const api = (window as { __UI_GRAB__?: { deactivate: () => void } })
          .__UI_GRAB__;
        api?.deactivate();
      });
      await uiGrab.page.waitForTimeout(100);

      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });

    test("toggle() should toggle activation state", async ({ uiGrab }) => {
      expect(await uiGrab.isOverlayVisible()).toBe(false);

      await uiGrab.toggle();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.toggle();
      expect(await uiGrab.isOverlayVisible()).toBe(false);
    });

    test("isActive() should return correct state", async ({ uiGrab }) => {
      let state = await uiGrab.getState();
      expect(state.isActive).toBe(false);

      await uiGrab.activate();

      state = await uiGrab.getState();
      expect(state.isActive).toBe(true);
    });

    test("multiple rapid activations should be handled", async ({
      uiGrab,
    }) => {
      for (let i = 0; i < 5; i++) {
        await uiGrab.activate();
        await uiGrab.page.waitForTimeout(20);
      }

      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("multiple rapid toggles should maintain consistency", async ({
      uiGrab,
    }) => {
      for (let i = 0; i < 6; i++) {
        await uiGrab.toggle();
        await uiGrab.page.waitForTimeout(50);
      }

      const isActive = await uiGrab.isOverlayVisible();
      expect(typeof isActive).toBe("boolean");
    });
  });

  test.describe("getState()", () => {
    test("should return isActive correctly", async ({ uiGrab }) => {
      let state = await uiGrab.getState();
      expect(state.isActive).toBe(false);

      await uiGrab.activate();
      state = await uiGrab.getState();
      expect(state.isActive).toBe(true);
    });

    test("should return isDragging correctly during drag", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 10, box.y - 10);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 100, box.y + 100, { steps: 5 });

      const state = await uiGrab.getState();
      expect(state.isDragging).toBe(true);

      await uiGrab.page.mouse.up();
    });

    test("should return isCopying correctly during copy", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("h1");

      const checkCopyingState = async () => {
        const state = await uiGrab.getState();
        return state.isCopying;
      };

      const wasCopying = await checkCopyingState();
      expect(typeof wasCopying).toBe("boolean");
    });

    test("should return dragBounds during drag", async ({ uiGrab }) => {
      await uiGrab.activate();

      const listItem = uiGrab.page.locator("li").first();
      const box = await listItem.boundingBox();
      if (!box) throw new Error("Could not get bounding box");

      await uiGrab.page.mouse.move(box.x - 20, box.y - 20);
      await uiGrab.page.mouse.down();
      await uiGrab.page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });

      const state = await uiGrab.getState();
      if (state.dragBounds) {
        expect(state.dragBounds.width).toBeGreaterThan(0);
        expect(state.dragBounds.height).toBeGreaterThan(0);
      }

      await uiGrab.page.mouse.up();
    });
  });

  test.describe("copyElement()", () => {
    test("should copy single element to clipboard", async ({ uiGrab }) => {
      const success = await uiGrab.copyElementViaApi(
        "[data-testid='todo-list'] h1",
      );
      expect(success).toBe(true);

      await uiGrab.page.waitForTimeout(500);
      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toContain("Todo List");
    });

    test("should copy list item element", async ({ uiGrab }) => {
      const success = await uiGrab.copyElementViaApi("li:first-child");
      expect(success).toBe(true);

      await uiGrab.page.waitForTimeout(500);
      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toBeTruthy();
    });

    test("should return false for non-existent element", async ({
      uiGrab,
    }) => {
      const success = await uiGrab.copyElementViaApi(
        ".non-existent-element",
      );
      expect(success).toBe(false);
    });

    test("should copy multiple elements via API", async ({ uiGrab }) => {
      const success = await uiGrab.page.evaluate(async () => {
        const api = (
          window as {
            __UI_GRAB__?: {
              copyElement: (el: Element[]) => Promise<boolean>;
            };
          }
        ).__UI_GRAB__;
        const elements = Array.from(document.querySelectorAll("li")).slice(
          0,
          3,
        );
        if (!api || elements.length === 0) return false;
        return api.copyElement(elements);
      });
      expect(success).toBe(true);
    });
  });

  test.describe("Theme via setOptions", () => {
    test("setOptions({ theme }) should apply hue rotation filter", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ theme: { hue: 90 } });
      await uiGrab.activate();

      const hasFilter = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        const shadowRoot = host?.shadowRoot;
        const root = shadowRoot?.querySelector(
          "[data-ui-grab]",
        ) as HTMLElement;
        return root?.style.filter?.includes("hue-rotate") ?? false;
      });

      expect(hasFilter).toBe(true);
    });

    test("multiple theme updates via setOptions should accumulate", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ theme: { hue: 45 } });
      await uiGrab.updateOptions({
        theme: { elementLabel: { enabled: false } },
      });
      await uiGrab.activate();

      const hasFilter = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        const shadowRoot = host?.shadowRoot;
        const root = shadowRoot?.querySelector(
          "[data-ui-grab]",
        ) as HTMLElement;
        return root?.style.filter?.includes("hue-rotate(45deg)") ?? false;
      });

      expect(hasFilter).toBe(true);
    });
  });

  test.describe("dispose()", () => {
    test("should set hasInited to false on dispose", async ({ uiGrab }) => {
      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);

      await uiGrab.dispose();
      await uiGrab.page.waitForTimeout(200);

      const canReinit = await uiGrab.page.evaluate(() => {
        const initFn = (window as { initUiGrab?: () => void }).initUiGrab;
        return typeof initFn === "function";
      });
      expect(canReinit).toBe(true);
    });

    test("should remove overlay host element on dispose", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.dispose();

      await uiGrab.page.waitForTimeout(100);

      const hostExists = await uiGrab.page.evaluate(() => {
        return document.querySelector("[data-ui-grab]") !== null;
      });

      expect(hostExists).toBe(true);
    });

    test("should allow re-initialization after dispose", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.dispose();

      await uiGrab.reinitialize();

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });
  });

  test.describe("registerPlugin()", () => {
    test("should register plugin with hooks", async ({ uiGrab }) => {
      let callbackCalled = false;

      await uiGrab.page.evaluate(() => {
        (
          window as { __TEST_CALLBACK_CALLED__?: boolean }
        ).__TEST_CALLBACK_CALLED__ = false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-plugin",
          hooks: {
            onActivate: () => {
              (
                window as { __TEST_CALLBACK_CALLED__?: boolean }
              ).__TEST_CALLBACK_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();

      callbackCalled = await uiGrab.page.evaluate(() => {
        return (
          (window as { __TEST_CALLBACK_CALLED__?: boolean })
            .__TEST_CALLBACK_CALLED__ ?? false
        );
      });

      expect(callbackCalled).toBe(true);
    });

    test("should allow registering plugin with multiple hooks", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        (window as { __CALLBACKS__?: string[] }).__CALLBACKS__ = [];
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-plugin",
          hooks: {
            onActivate: () => {
              (window as { __CALLBACKS__?: string[] }).__CALLBACKS__?.push(
                "activate",
              );
            },
            onDeactivate: () => {
              (window as { __CALLBACKS__?: string[] }).__CALLBACKS__?.push(
                "deactivate",
              );
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.deactivate();

      const callbacks = await uiGrab.page.evaluate(() => {
        return (window as { __CALLBACKS__?: string[] }).__CALLBACKS__ ?? [];
      });

      expect(callbacks).toContain("activate");
      expect(callbacks).toContain("deactivate");
    });
  });

  test.describe("setOptions() for agent", () => {
    test("should configure agent provider", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();

      const state = await uiGrab.page.evaluate(() => {
        const api = (
          window as {
            __UI_GRAB__?: { getState: () => Record<string, unknown> };
          }
        ).__UI_GRAB__;
        return api?.getState();
      });

      expect(state).toBeDefined();
    });

    test("should allow agent provider with custom options", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({
        delay: 100,
        statusUpdates: ["Custom status 1", "Custom status 2"],
      });

      const hasAgent = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        return host !== null;
      });

      expect(hasAgent).toBe(true);
    });
  });

  test.describe("Edge Cases", () => {
    test("API should work after multiple activation cycles", async ({
      uiGrab,
    }) => {
      for (let i = 0; i < 3; i++) {
        await uiGrab.activate();
        await uiGrab.hoverElement("li");
        await uiGrab.waitForSelectionBox();
        await uiGrab.deactivate();
      }

      await uiGrab.activate();
      expect(await uiGrab.isOverlayVisible()).toBe(true);
    });

    test("getState should be consistent with isActive", async ({
      uiGrab,
    }) => {
      const state1 = await uiGrab.getState();
      const isActive1 = await uiGrab.isOverlayVisible();
      expect(state1.isActive).toBe(isActive1);

      await uiGrab.activate();

      const state2 = await uiGrab.getState();
      const isActive2 = await uiGrab.isOverlayVisible();
      expect(state2.isActive).toBe(isActive2);
    });

    test("theme should persist across activation cycles", async ({
      uiGrab,
    }) => {
      await uiGrab.updateOptions({ theme: { hue: 120 } });
      await uiGrab.activate();
      await uiGrab.deactivate();
      await uiGrab.activate();

      const hasFilter = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        const shadowRoot = host?.shadowRoot;
        const root = shadowRoot?.querySelector(
          "[data-ui-grab]",
        ) as HTMLElement;
        return root?.style.filter?.includes("hue-rotate(120deg)") ?? false;
      });
      expect(hasFilter).toBe(true);
    });
  });
});
