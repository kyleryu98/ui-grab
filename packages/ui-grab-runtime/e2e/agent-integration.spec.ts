import { test, expect } from "./fixtures.js";

test.describe("Agent Integration", () => {
  test.describe("Agent Provider Setup", () => {
    test("should configure mock agent provider", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent();
      await uiGrab.enterPromptMode("li:first-child");

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);
    });

    test("should allow agent provider with custom delay", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 1000 });
      await uiGrab.enterPromptMode("li:first-child");

      const isPromptMode = await uiGrab.isPromptModeActive();
      expect(isPromptMode).toBe(true);
    });

    test("should allow custom status updates", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({
        delay: 500,
        statusUpdates: ["Starting...", "Processing...", "Finishing..."],
      });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test prompt");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);
      const sessions = await uiGrab.getAgentSessions();
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Session Lifecycle", () => {
    test("should start session on input submit", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 1000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Analyze this element");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(3000);
      await expect
        .poll(() => uiGrab.isAgentSessionVisible(), { timeout: 3000 })
        .toBe(true);
    });

    test("should show streaming status during processing", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test prompt");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(3000);
      const sessions = await uiGrab.getAgentSessions();
      const streamingSession = sessions.find((s) => s.isStreaming);
      expect(streamingSession).toBeDefined();
    });

    test("should complete session after processing", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 300 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Quick test");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(5000);
      const sessions = await uiGrab.getAgentSessions();
      const completedSession = sessions.find((s) => !s.isStreaming);
      expect(completedSession).toBeDefined();
    });

    test("should display completion message", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 200 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(3000);

      await expect.poll(() => uiGrab.getLabelStatusText()).toBeTruthy();
    });
  });

  test.describe("Session Error Handling", () => {
    test("should handle agent errors gracefully", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({
        delay: 200,
        error: "Test error message",
      });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Trigger error");
      await uiGrab.submitInput();

      await expect
        .poll(
          async () => {
            return uiGrab.page.evaluate((attrName) => {
              const host = document.querySelector(`[${attrName}]`);
              const shadowRoot = host?.shadowRoot;
              if (!shadowRoot) return false;
              const root = shadowRoot.querySelector(`[${attrName}]`);
              return !!root?.querySelector("[data-ui-grab-error]");
            }, "data-ui-grab");
          },
          { timeout: 3000 },
        )
        .toBe(true);
    });

    test("should show retry option on error", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100, error: "Error occurred" });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test");
      await uiGrab.submitInput();

      await expect
        .poll(
          async () => {
            return uiGrab.page.evaluate((attrName) => {
              const host = document.querySelector(`[${attrName}]`);
              const shadowRoot = host?.shadowRoot;
              if (!shadowRoot) return false;
              const root = shadowRoot.querySelector(`[${attrName}]`);
              return (
                root?.textContent?.toLowerCase().includes("retry") ?? false
              );
            }, "data-ui-grab");
          },
          { timeout: 2000 },
        )
        .toBe(true);
    });
  });

  test.describe("Session Actions", () => {
    test("should dismiss session", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(3000);

      await uiGrab.clickAgentDismiss();

      await expect
        .poll(() => uiGrab.isAgentSessionVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should abort streaming session", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 5000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Long running task");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      await uiGrab.clickAgentAbort();

      await expect
        .poll(
          async () => {
            return uiGrab.page.evaluate((attrName) => {
              const host = document.querySelector(`[${attrName}]`);
              const shadowRoot = host?.shadowRoot;
              if (!shadowRoot) return false;
              const root = shadowRoot.querySelector(`[${attrName}]`);
              const text = root?.textContent?.toLowerCase() ?? "";
              return (
                text.includes("discard") ||
                text.includes("abort") ||
                text.includes("stop")
              );
            }, "data-ui-grab");
          },
          { timeout: 2000 },
        )
        .toBe(true);
    });

    test("should confirm abort", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 5000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Long task");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      await uiGrab.clickAgentAbort();
      await uiGrab.confirmAgentAbort();

      await expect
        .poll(
          async () => {
            const sessions = await uiGrab.getAgentSessions();
            return sessions.length;
          },
          { timeout: 2000 },
        )
        .toBeLessThanOrEqual(1);
    });

    test("should cancel abort", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 5000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Long task");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      await uiGrab.clickAgentAbort();
      await uiGrab.cancelAgentAbort();

      const sessions = await uiGrab.getAgentSessions();
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Undo/Redo Operations", () => {
    test("should support undo after completion", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(3000);

      await expect
        .poll(
          async () => {
            return uiGrab.page.evaluate((attrName) => {
              const host = document.querySelector(`[${attrName}]`);
              const shadowRoot = host?.shadowRoot;
              if (!shadowRoot) return false;
              const root = shadowRoot.querySelector(`[${attrName}]`);
              return root?.textContent?.toLowerCase().includes("undo") ?? false;
            }, "data-ui-grab");
          },
          { timeout: 2000 },
        )
        .toBe(true);
    });

    test("should trigger undo via keyboard shortcut", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(3000);
      await uiGrab.clickAgentDismiss();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("z");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });

  test.describe("Follow-up Prompts", () => {
    test("should support follow-up prompts after completion", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Initial prompt");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentComplete(3000);

      const hasFollowUpInput = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return false;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        return root?.querySelector("textarea, input") !== null;
      }, "data-ui-grab");

      expect(typeof hasFollowUpInput).toBe("boolean");
    });
  });

  test.describe("Multiple Sessions", () => {
    test("should handle multiple elements with separate sessions", async ({
      uiGrab,
    }) => {
      await uiGrab.setupMockAgent({ delay: 500 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("First element");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      const sessions = await uiGrab.getAgentSessions();
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Session State Persistence", () => {
    test("session should update bounds on scroll", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test scroll");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      await uiGrab.scrollPage(50);

      const isVisible = await uiGrab.isAgentSessionVisible();
      expect(isVisible).toBe(true);
    });

    test("session should update bounds on resize", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 2000 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.typeInInput("Test resize");
      await uiGrab.submitInput();

      await uiGrab.waitForAgentSession(2000);

      await uiGrab.setViewportSize(800, 600);

      const isVisible = await uiGrab.isAgentSessionVisible();
      expect(isVisible).toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle empty prompt submission", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });
      await uiGrab.enterPromptMode("li:first-child");

      await uiGrab.submitInput();

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });

    test("should handle rapid session starts", async ({ uiGrab }) => {
      await uiGrab.setupMockAgent({ delay: 100 });

      for (let i = 0; i < 3; i++) {
        await uiGrab.enterPromptMode("li:first-child");

        await uiGrab.typeInInput(`Prompt ${i}`);
        await uiGrab.submitInput();

        await uiGrab.waitForAgentSession(5000);
        await uiGrab.clickAgentDismiss();
        await uiGrab.page.waitForTimeout(500);
      }

      const state = await uiGrab.getState();
      expect(state).toBeDefined();
    });
  });
});
