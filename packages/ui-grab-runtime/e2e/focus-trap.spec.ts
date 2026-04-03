import { test, expect } from "./fixtures.js";

const FOCUS_TRAP_CONTAINER_ID = "focus-trap-test-container";

const injectFocusTrap = async (page: import("@playwright/test").Page) => {
  await page.evaluate((containerId) => {
    const container = document.createElement("div");
    container.id = containerId;
    container.innerHTML = `
      <div id="focus-trap-modal" style="
        position: fixed; bottom: 16px; right: 16px;
        width: 400px; padding: 24px; background: white; border: 2px solid #333;
        border-radius: 8px; z-index: 9000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <h2>Focus-trapped Modal</h2>
        <input id="trap-input-1" type="text" placeholder="First input" style="display:block; margin: 8px 0; padding: 8px; width: 100%;" />
        <input id="trap-input-2" type="text" placeholder="Second input" style="display:block; margin: 8px 0; padding: 8px; width: 100%;" />
        <button id="trap-button" style="padding: 8px 16px; margin-top: 8px;">Trapped Button</button>
      </div>
      <div id="focus-trap-backdrop" style="
        position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 8999;
      "></div>
    `;
    document.body.appendChild(container);

    const modal = document.getElementById("focus-trap-modal")!;
    const focusableSelector =
      'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () =>
      Array.from(modal.querySelectorAll(focusableSelector)) as HTMLElement[];

    const focusInHandler = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!modal.contains(target)) {
        event.stopImmediatePropagation();
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };
    document.addEventListener("focusin", focusInHandler, true);

    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener("keydown", keydownHandler, true);

    (window as { __FOCUS_TRAP_CLEANUP__?: () => void }).__FOCUS_TRAP_CLEANUP__ =
      () => {
        document.removeEventListener("focusin", focusInHandler, true);
        document.removeEventListener("keydown", keydownHandler, true);
      };

    const firstInput = document.getElementById("trap-input-1");
    firstInput?.focus();
  }, FOCUS_TRAP_CONTAINER_ID);
};

const removeFocusTrap = async (page: import("@playwright/test").Page) => {
  await page.evaluate((containerId) => {
    (
      window as { __FOCUS_TRAP_CLEANUP__?: () => void }
    ).__FOCUS_TRAP_CLEANUP__?.();
    document.getElementById(containerId)?.remove();
  }, FOCUS_TRAP_CONTAINER_ID);
};

test.describe("Focus Trap Resistance", () => {
  test.afterEach(async ({ uiGrab }) => {
    await removeFocusTrap(uiGrab.page);
  });

  test.describe("Activation", () => {
    test("should activate via API while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should deactivate with Escape while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();
      await uiGrab.deactivate();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(false);
    });
  });

  test.describe("Element Selection", () => {
    test("should hover and select elements behind focus trap backdrop", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await injectFocusTrap(uiGrab.page);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });

    test("should select elements inside the focus-trapped modal", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("#trap-button");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });

    test("should update selection when hovering different elements", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("#trap-input-1");
      await uiGrab.waitForSelectionBox();
      const bounds1 = await uiGrab.getSelectionBoxBounds();

      await uiGrab.hoverElement("#trap-button");
      await uiGrab.waitForSelectionBox();
      const bounds2 = await uiGrab.getSelectionBoxBounds();

      if (bounds1 && bounds2) {
        const didSelectionChange =
          bounds1.y !== bounds2.y || bounds1.height !== bounds2.height;
        expect(didSelectionChange).toBe(true);
      }
    });
  });

  test.describe("Copy", () => {
    test("should copy element while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("#trap-button");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("#trap-button");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 2000 })
        .toBeTruthy();
    });

    test("should copy element outside modal while focus trap is active", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await injectFocusTrap(uiGrab.page);

      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("h1");

      await expect
        .poll(() => uiGrab.getClipboardContent(), { timeout: 2000 })
        .toBeTruthy();
    });
  });

  test.describe("Prompt Mode", () => {
    test("should enter prompt mode while focus trap is active", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await injectFocusTrap(uiGrab.page);

      await uiGrab.enterPromptMode("li:first-child");

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);
    });

    test("textarea should receive typed input despite focus trap", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await injectFocusTrap(uiGrab.page);

      await uiGrab.enterPromptMode("li:first-child");
      await uiGrab.typeInInput("Hello from inside focus trap");

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe("Hello from inside focus trap");
    });

    test("should submit prompt while focus trap is active", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await injectFocusTrap(uiGrab.page);

      await uiGrab.enterPromptMode("li:first-child");
      await uiGrab.typeInInput("Test prompt");
      await uiGrab.submitInput();

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    });

    test("Escape should dismiss prompt mode despite focus trap", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await injectFocusTrap(uiGrab.page);

      await uiGrab.enterPromptMode("li:first-child");
      await uiGrab.pressEscape();
      await uiGrab.pressEscape();

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 5000 })
        .toBe(false);
    });
  });

  test.describe("Context Menu", () => {
    test("should open context menu while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("#trap-button");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("#trap-button");

      const isVisible = await uiGrab.isContextMenuVisible();
      expect(isVisible).toBe(true);
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("arrow key navigation should work while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.pressArrowDown();
      await uiGrab.waitForSelectionBox();

      const isActive = await uiGrab.isOverlayVisible();
      const isSelectionVisible = await uiGrab.isSelectionBoxVisible();
      expect(isActive).toBe(true);
      expect(isSelectionVisible).toBe(true);
    });

    test("Escape should deactivate from selection while focus trap is active", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.deactivate();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(false);
    });
  });

  test.describe("Focus Trap Lifecycle", () => {
    test("should continue working after focus trap is removed", async ({
      uiGrab,
    }) => {
      await injectFocusTrap(uiGrab.page);
      await uiGrab.activate();

      await uiGrab.hoverElement("#trap-button");
      await uiGrab.waitForSelectionBox();

      await removeFocusTrap(uiGrab.page);
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });

    test("should work when focus trap appears after activation", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await injectFocusTrap(uiGrab.page);
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.hoverElement("h1");
      await uiGrab.waitForSelectionBox();

      const isVisible = await uiGrab.isSelectionBoxVisible();
      expect(isVisible).toBe(true);
    });
  });
});
