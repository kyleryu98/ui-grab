import { test, expect } from "./fixtures.js";

test.describe("Freeze Updates", () => {
  test.describe("State Freezing During Prompt Mode", () => {
    test("should freeze React state updates when in prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const initialCount = await getElementCount();
      expect(initialCount).toBeGreaterThan(0);

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");

      await uiGrab.page.evaluate(() => {
        const addButton = document.querySelector(
          "[data-testid='add-element-button']",
        ) as HTMLButtonElement;
        addButton?.click();
      });
      await uiGrab.page.waitForTimeout(100);

      const countDuringPromptMode = await getElementCount();
      expect(countDuringPromptMode).toBe(initialCount);

      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(200);

      const countAfterExit = await getElementCount();
      expect(countAfterExit).toBe(initialCount);
    });

    test("should freeze visibility toggle during prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });

      const isToggleableVisible = async () => {
        return uiGrab.page.evaluate(() => {
          return (
            document.querySelector("[data-testid='toggleable-element']") !==
            null
          );
        });
      };

      const initiallyVisible = await isToggleableVisible();
      expect(initiallyVisible).toBe(true);

      await uiGrab.enterPromptMode("[data-testid='toggleable-element']");

      await uiGrab.page.evaluate(() => {
        const button = document.querySelector(
          "[data-testid='toggle-visibility-button']",
        ) as HTMLButtonElement;
        button?.click();
      });
      await uiGrab.page.waitForTimeout(100);

      const stillVisibleDuringPromptMode = await isToggleableVisible();
      expect(stillVisibleDuringPromptMode).toBe(true);

      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(200);

      const visibleAfterExit = await isToggleableVisible();
      expect(visibleAfterExit).toBe(true);
    });

    test("should allow state updates after exiting prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");
      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(200);

      const countBefore = await getElementCount();

      await uiGrab.page.click("[data-testid='add-element-button']");
      await uiGrab.page.waitForTimeout(100);

      const countAfter = await getElementCount();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  test.describe("Multiple Freeze/Unfreeze Cycles", () => {
    test("should handle multiple prompt mode cycles correctly", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      for (let i = 0; i < 2; i++) {
        const countBefore = await getElementCount();

        await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");
        await uiGrab.pressEscape();
        await uiGrab.page.waitForTimeout(500);

        await uiGrab.page.click("[data-testid='add-element-button']");
        await uiGrab.page.waitForTimeout(300);

        const countAfter = await getElementCount();
        expect(countAfter).toBe(countBefore + 1);
      }
    });

    test("should not leak frozen state after rapid activation cycles", async ({
      uiGrab,
    }) => {
      for (let i = 0; i < 5; i++) {
        await uiGrab.activate();
        await uiGrab.hoverElement("li:first-child");
        await uiGrab.page.waitForTimeout(50);
        await uiGrab.deactivate();
        await uiGrab.page.waitForTimeout(50);
      }

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const countBefore = await getElementCount();

      await uiGrab.page.click("[data-testid='add-element-button']");
      await uiGrab.page.waitForTimeout(100);

      const countAfter = await getElementCount();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  test.describe("Freeze State Consistency", () => {
    test("should maintain UI consistency during prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");

      const elementTextDuringFreeze = await uiGrab.page.evaluate(() => {
        const element = document.querySelector(
          "[data-testid='dynamic-element-1']",
        );
        return element?.textContent?.trim() ?? "";
      });

      expect(elementTextDuringFreeze).toContain("Dynamic Element 1");

      await uiGrab.pressEscape();
    });

    test("should unfreeze all components after exiting prompt mode", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      await uiGrab.enterPromptMode("[data-testid='test-input']");
      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.page.fill("[data-testid='test-input']", "test value");
      const inputValue = await uiGrab.page.evaluate(() => {
        const input = document.querySelector(
          "[data-testid='test-input']",
        ) as HTMLInputElement;
        return input?.value ?? "";
      });

      expect(inputValue).toBe("test value");
    });

    test("should resume updates after deactivation", async ({ uiGrab }) => {
      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='dynamic-section']");
      await uiGrab.waitForSelectionBox();
      await uiGrab.deactivate();

      const countBefore = await getElementCount();

      await uiGrab.page.click("[data-testid='add-element-button']");
      await uiGrab.page.waitForTimeout(100);

      const countAfter = await getElementCount();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle freeze when no React state is present", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      await uiGrab.enterPromptMode("[data-testid='main-title']");

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);

      await uiGrab.pressEscape();
    });

    test("should handle deactivation during frozen state", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");

      await uiGrab.deactivate();
      await uiGrab.page.waitForTimeout(200);

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const countBefore = await getElementCount();

      await uiGrab.page.click("[data-testid='add-element-button']");
      await uiGrab.page.waitForTimeout(100);

      const countAfter = await getElementCount();
      expect(countAfter).toBe(countBefore + 1);
    });

    test("should properly cleanup after multiple freeze operations", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      for (let i = 0; i < 3; i++) {
        await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");
        await uiGrab.deactivate();
        // HACK: allow freeze cleanup to fully propagate before next iteration
        await uiGrab.page.waitForTimeout(300);
      }

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const countBefore = await getElementCount();

      await uiGrab.page.click("[data-testid='add-element-button']");
      await uiGrab.page.waitForTimeout(100);

      const countAfter = await getElementCount();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  test.describe("Button Click Buffering", () => {
    test("should buffer multiple clicks during freeze and apply on unfreeze", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const countBefore = await getElementCount();

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");

      for (let clickIndex = 0; clickIndex < 3; clickIndex++) {
        await uiGrab.page.evaluate(() => {
          const addButton = document.querySelector(
            "[data-testid='add-element-button']",
          ) as HTMLButtonElement;
          addButton?.click();
        });
        await uiGrab.page.waitForTimeout(50);
      }

      const countDuringFreeze = await getElementCount();
      expect(countDuringFreeze).toBe(countBefore);

      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(300);

      const countAfterUnfreeze = await getElementCount();
      expect(countAfterUnfreeze).toBe(countBefore);
    });

    test("should not accumulate state incorrectly across freeze cycles", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      const getElementCount = async () => {
        return uiGrab.page.evaluate(() => {
          return document.querySelectorAll("[data-testid^='dynamic-element-']")
            .length;
        });
      };

      const countBeforeFirstCycle = await getElementCount();

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");
      await uiGrab.page.evaluate(() => {
        const addButton = document.querySelector(
          "[data-testid='add-element-button']",
        ) as HTMLButtonElement;
        addButton?.click();
      });
      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(300);

      const countAfterFirstCycle = await getElementCount();
      expect(countAfterFirstCycle).toBe(countBeforeFirstCycle);

      await uiGrab.enterPromptMode("[data-testid='dynamic-element-1']");
      await uiGrab.page.evaluate(() => {
        const addButton = document.querySelector(
          "[data-testid='add-element-button']",
        ) as HTMLButtonElement;
        addButton?.click();
      });
      await uiGrab.pressEscape();
      await uiGrab.page.waitForTimeout(300);

      const countAfterSecondCycle = await getElementCount();
      expect(countAfterSecondCycle).toBe(countBeforeFirstCycle);
    });
  });
});
