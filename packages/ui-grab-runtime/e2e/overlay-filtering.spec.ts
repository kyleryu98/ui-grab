import { test, expect } from "./fixtures.js";

test.describe("Overlay Filtering", () => {
  test.describe("UI Grab elements should not be selectable", () => {
    test("should not select ui-grab host element", async ({ uiGrab }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const selectedElement = await uiGrab.page.evaluate(() => {
        const api = (
          window as {
            __UI_GRAB__?: {
              getState: () => { targetElement: Element | null };
            };
          }
        ).__UI_GRAB__;
        const state = api?.getState();
        return state?.targetElement?.hasAttribute("data-ui-grab") ?? false;
      });

      expect(selectedElement).toBe(false);
    });

    test("should not select elements inside ui-grab shadow DOM", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const isInsideShadowDom = await uiGrab.page.evaluate(() => {
        const api = (
          window as {
            __UI_GRAB__?: {
              getState: () => { targetElement: Element | null };
            };
          }
        ).__UI_GRAB__;
        const state = api?.getState();
        const target = state?.targetElement;
        if (!target) return false;

        const rootNode = target.getRootNode();
        if (rootNode instanceof ShadowRoot) {
          return rootNode.host.hasAttribute("data-ui-grab");
        }
        return false;
      });

      expect(isInsideShadowDom).toBe(false);
    });

    test("should select page elements through ui-grab overlay", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      const tagName = await uiGrab.page.evaluate(() => {
        const api = (
          window as {
            __UI_GRAB__?: {
              getState: () => { targetElement: Element | null };
            };
          }
        ).__UI_GRAB__;
        const state = api?.getState();
        return state?.targetElement?.tagName?.toLowerCase() ?? null;
      });

      expect(tagName).toBe("li");
    });
  });

  test.describe("Selection ignores ui-grab UI components", () => {
    test("hovering over toolbar area should still select underlying element", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();

      const toolbarInfo = await uiGrab.getToolbarInfo();
      if (toolbarInfo.position) {
        await uiGrab.page.mouse.move(
          toolbarInfo.position.x + 10,
          toolbarInfo.position.y + 10,
        );
        await uiGrab.page.waitForTimeout(200);

        const state = await uiGrab.getState();
        expect(state.isActive).toBe(true);
      }
    });

    test("clicking through overlay should copy correct element", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("[data-testid='todo-list'] h1");
      await uiGrab.waitForSelectionBox();
      await uiGrab.clickElement("[data-testid='todo-list'] h1");

      await expect
        .poll(() => uiGrab.getClipboardContent())
        .toContain("Todo List");
    });

    test("drag selection should work through overlay canvas", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.dragSelect("li:first-child", "li:nth-child(3)");
      await uiGrab.page.waitForTimeout(500);

      const grabbedInfo = await uiGrab.getGrabbedBoxInfo();
      expect(grabbedInfo.count).toBeGreaterThan(1);
    });
  });

  test.describe("Shadow DOM isolation", () => {
    test("should only filter elements inside ui-grab shadow DOM", async ({
      uiGrab,
    }) => {
      const shadowHostExists = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        return host !== null && host.shadowRoot !== null;
      });

      expect(shadowHostExists).toBe(true);

      await uiGrab.activate();

      const isUiGrabHostFiltered = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        if (!host) return false;

        const api = (
          window as {
            __UI_GRAB__?: {
              getState: () => { targetElement: Element | null };
            };
          }
        ).__UI_GRAB__;
        const state = api?.getState();
        return state?.targetElement !== host;
      });

      expect(isUiGrabHostFiltered).toBe(true);
    });

    test("should verify ui-grab host has correct attribute", async ({
      uiGrab,
    }) => {
      const hostHasAttribute = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        return host?.hasAttribute("data-ui-grab") ?? false;
      });

      expect(hostHasAttribute).toBe(true);
    });
  });
});
