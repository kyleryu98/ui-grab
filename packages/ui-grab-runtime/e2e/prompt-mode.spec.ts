import { test, expect } from "./fixtures.js";

test.describe("Prompt Mode", () => {
  test.describe("Entering Prompt Mode", () => {
    test("context menu edit should enter prompt mode when agent is configured", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("li:first-child");
      await uiGrab.clickContextMenuItem("Edit");

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
    });

    test("single click should copy without entering prompt mode when no agent", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect.poll(() => uiGrab.getClipboardContent()).toBeTruthy();
    });

    test("keyboard activation single click should enter prompt mode when agent is configured", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.activateViaKeyboard();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.clickElement("li:first-child");

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
    });

    test("should focus input textarea when entering prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      const isFocused = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return false;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return false;
        const textarea = root.querySelector("textarea");
        return (
          document.activeElement === textarea ||
          shadowRoot.activeElement === textarea
        );
      }, "data-ui-grab");

      expect(isFocused).toBe(true);
    });

    test("prompt mode should show input textarea", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("h1");

      const hasTextarea = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return false;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return false;
        return root.querySelector("textarea") !== null;
      }, "data-ui-grab");

      expect(hasTextarea).toBe(true);
    });
  });

  test.describe("Prompt Mode Control", () => {
    test("API toggle should exit prompt mode", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.toggle();

      await expect
        .poll(() => uiGrab.isOverlayVisible(), { timeout: 2000 })
        .toBe(false);
      expect(await uiGrab.isPromptModeActive()).toBe(false);
    });
  });

  test.describe("Text Input and Editing", () => {
    test("should accept text input", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test prompt text");

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe("Test prompt text");
    });

    test("should allow editing typed text", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Hello");
      await uiGrab.page.keyboard.press("Backspace");
      await uiGrab.page.keyboard.press("Backspace");
      await uiGrab.typeInInput("p!");

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe("Help!");
    });

    test("should handle long text input", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      const longText =
        "This is a very long prompt that should be handled properly by the textarea input field and might need to scroll within the container.";
      await uiGrab.typeInInput(longText);

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe(longText);
    });

    test("should handle multiline input with shift+enter", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Line 1");
      await uiGrab.page.keyboard.down("Shift");
      await uiGrab.page.keyboard.press("Enter");
      await uiGrab.page.keyboard.up("Shift");
      await uiGrab.typeInInput("Line 2");

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toContain("Line 1");
      expect(inputValue).toContain("Line 2");
    });
  });

  test.describe("Submit and Cancel", () => {
    test("Enter key should submit input", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test prompt");
      await uiGrab.submitInput();

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    });

    test("Escape should cancel prompt mode", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.pressEscape();

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    });

    test("Escape in textarea should dismiss prompt mode directly", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      expect(await uiGrab.isPromptModeActive()).toBe(true);

      await uiGrab.typeInInput("Some unsaved text");

      await uiGrab.pressEscape();

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    });

    test("confirming dismiss should close prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Some text");
      await uiGrab.pressEscape();
      await uiGrab.pressEscape();

      await expect.poll(() => uiGrab.isOverlayVisible()).toBe(false);
    });

    test("empty input should cancel without confirmation", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.pressEscape();

      const isPendingDismiss = await uiGrab.isPendingDismissVisible();
      expect(isPendingDismiss).toBe(false);
    });
  });

  test.describe("Prompt Mode with Selection", () => {
    test("should freeze selection while in prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.page.mouse.move(500, 500);

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);
    });
  });

  test.describe("Keyboard Shortcuts in Prompt Mode", () => {
    test("arrow keys should not navigate elements in prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.pressArrowDown();

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);
    });

    test("activation shortcut should not cancel prompt mode when input is focused", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("c");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
    });
  });

  test.describe("Input Preservation", () => {
    test("input should be cleared after dismissing prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Some text");
      await uiGrab.pressEscape();

      await uiGrab.enterPromptMode("li:first-child");

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe("");
    });
  });

  test.describe("Edge Cases", () => {
    test("clicking outside should cancel prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.page.mouse.click(10, 10);
      await uiGrab.page.mouse.click(10, 10);

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(false);
    });

    test("context menu edit maintains overlay in prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      const isPromptActive = await uiGrab.isPromptModeActive();
      expect(isPromptActive).toBe(true);

      const isOverlayActive = await uiGrab.isOverlayVisible();
      expect(isOverlayActive).toBe(true);
    });

    test("prompt mode should work after scroll", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.activate();
      await uiGrab.scrollPage(100);

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("li:first-child");
      await uiGrab.clickContextMenuItem("Edit");

      await expect.poll(() => uiGrab.isPromptModeActive()).toBe(true);
    });
  });
});
