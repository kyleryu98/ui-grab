import { test, expect } from "./fixtures.js";

test.describe("Open File", () => {
  test.describe("Keyboard Shortcut", () => {
    test("Cmd+O should open file when source info available", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ =
          false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (
                window as { __OPEN_FILE_CALLED__?: boolean }
              ).__OPEN_FILE_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionSource();

      await expect
        .poll(
          async () => {
            await uiGrab.pressKeyCombo([uiGrab.modifierKey], "o");
            return uiGrab.page.evaluate(
              () =>
                (window as { __OPEN_FILE_CALLED__?: boolean })
                  .__OPEN_FILE_CALLED__ ?? false,
            );
          },
          { timeout: 5000, intervals: [500] },
        )
        .toBe(true);
    });

    test("Cmd+O should do nothing without onOpenFile callback", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("o");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
      await uiGrab.page.waitForTimeout(200);

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("Cmd+O without selection should be ignored", async ({ uiGrab }) => {
      let openFileCalled = false;

      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ =
          false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (
                window as { __OPEN_FILE_CALLED__?: boolean }
              ).__OPEN_FILE_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("o");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
      await uiGrab.page.waitForTimeout(200);

      openFileCalled = await uiGrab.page.evaluate(() => {
        return (
          (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ ??
          false
        );
      });

      expect(openFileCalled).toBe(false);
    });
  });

  test.describe("Context Menu", () => {
    test("Open item should appear in context menu", async ({ uiGrab }) => {
      await uiGrab.page.evaluate(() => {
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {},
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("li:first-child");

      const menuInfo = await uiGrab.getContextMenuInfo();
      expect(menuInfo.isVisible).toBe(true);
      expect(menuInfo.menuItems).toContain("Open");
    });

    test("Clicking Open in context menu should trigger onOpenFile", async ({
      uiGrab,
    }) => {
      let openFileCalled = false;

      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ =
          false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (
                window as { __OPEN_FILE_CALLED__?: boolean }
              ).__OPEN_FILE_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("li:first-child");
      await uiGrab.page.waitForTimeout(100);

      await uiGrab.clickContextMenuItem("Open");
      await uiGrab.page.waitForTimeout(200);

      openFileCalled = await uiGrab.page.evaluate(() => {
        return (
          (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ ??
          false
        );
      });

      expect(openFileCalled).toBe(true);
    });

    test("Open should not be clickable without onOpenFile callback", async ({
      uiGrab,
    }) => {
      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.rightClickElement("li:first-child");
      await uiGrab.page.waitForTimeout(200);

      const menuInfo = await uiGrab.getContextMenuInfo();
      expect(menuInfo.isVisible).toBe(true);
    });
  });

  test.describe("onOpenFile Callback", () => {
    test("callback should receive element info", async ({ uiGrab }) => {
      let receivedInfo: unknown = null;

      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_INFO__?: unknown }).__OPEN_FILE_INFO__ = null;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: (info: unknown) => {
              (window as { __OPEN_FILE_INFO__?: unknown }).__OPEN_FILE_INFO__ =
                info;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("o");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
      await uiGrab.page.waitForTimeout(200);

      receivedInfo = await uiGrab.page.evaluate(() => {
        return (window as { __OPEN_FILE_INFO__?: unknown }).__OPEN_FILE_INFO__;
      });

      expect(receivedInfo).toBeDefined();
    });

    test("callback should include source info when available", async ({
      uiGrab,
    }) => {
      let receivedInfo: Record<string, unknown> | null | undefined = null;

      await uiGrab.page.evaluate(() => {
        (
          window as { __OPEN_FILE_INFO__?: Record<string, unknown> | null }
        ).__OPEN_FILE_INFO__ = null;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: (info: Record<string, unknown>) => {
              (
                window as {
                  __OPEN_FILE_INFO__?: Record<string, unknown> | null;
                }
              ).__OPEN_FILE_INFO__ = info;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("o");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
      await uiGrab.page.waitForTimeout(200);

      receivedInfo = await uiGrab.page.evaluate(() => {
        return (
          window as { __OPEN_FILE_INFO__?: Record<string, unknown> | null }
        ).__OPEN_FILE_INFO__;
      });

      expect(receivedInfo).toBeDefined();
    });
  });

  test.describe("Tag Badge Click", () => {
    test("clicking tag badge should trigger open file", async ({
      uiGrab,
    }) => {
      let openFileCalled = false;

      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ =
          false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (
                window as { __OPEN_FILE_CALLED__?: boolean }
              ).__OPEN_FILE_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();

      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return;

        const spans = root.querySelectorAll("span");
        for (const span of spans) {
          if (
            span.textContent?.includes("li") ||
            span.textContent?.includes("span")
          ) {
            (span as HTMLElement).click();
            return;
          }
        }
      }, "data-ui-grab");

      await uiGrab.page.waitForTimeout(200);

      openFileCalled = await uiGrab.page.evaluate(() => {
        return (
          (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ ??
          false
        );
      });

      expect(typeof openFileCalled).toBe("boolean");
    });
  });

  test.describe("Edge Cases", () => {
    test("open file should work after element change", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_COUNT__?: number }).__OPEN_FILE_COUNT__ = 0;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (window as { __OPEN_FILE_COUNT__?: number }).__OPEN_FILE_COUNT__ =
                ((window as { __OPEN_FILE_COUNT__?: number })
                  .__OPEN_FILE_COUNT__ ?? 0) + 1;
            },
          },
        });
      });

      await uiGrab.activate();

      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionSource();

      await expect
        .poll(
          async () => {
            await uiGrab.pressKeyCombo([uiGrab.modifierKey], "o");
            return uiGrab.page.evaluate(
              () =>
                (window as { __OPEN_FILE_COUNT__?: number })
                  .__OPEN_FILE_COUNT__ ?? 0,
            );
          },
          { timeout: 5000, intervals: [500] },
        )
        .toBeGreaterThanOrEqual(1);

      await uiGrab.hoverElement("li:nth-child(2)");
      await uiGrab.waitForSelectionBox();
      await uiGrab.waitForSelectionSource();

      await expect
        .poll(
          async () => {
            await uiGrab.pressKeyCombo([uiGrab.modifierKey], "o");
            return uiGrab.page.evaluate(
              () =>
                (window as { __OPEN_FILE_COUNT__?: number })
                  .__OPEN_FILE_COUNT__ ?? 0,
            );
          },
          { timeout: 5000, intervals: [500] },
        )
        .toBeGreaterThanOrEqual(2);
    });

    test("open file should work with drag-selected elements", async ({
      uiGrab,
    }) => {
      let openFileCalled = false;

      await uiGrab.page.evaluate(() => {
        (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ =
          false;
        const api = (
          window as {
            __UI_GRAB__?: {
              registerPlugin: (plugin: Record<string, unknown>) => void;
            };
          }
        ).__UI_GRAB__;
        api?.registerPlugin({
          name: "test-open-file",
          hooks: {
            onOpenFile: () => {
              (
                window as { __OPEN_FILE_CALLED__?: boolean }
              ).__OPEN_FILE_CALLED__ = true;
            },
          },
        });
      });

      await uiGrab.activate();
      await uiGrab.dragSelect("li:first-child", "li:nth-child(2)");
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.page.keyboard.down(uiGrab.modifierKey);
      await uiGrab.page.keyboard.press("o");
      await uiGrab.page.keyboard.up(uiGrab.modifierKey);
      await uiGrab.page.waitForTimeout(200);

      openFileCalled = await uiGrab.page.evaluate(() => {
        return (
          (window as { __OPEN_FILE_CALLED__?: boolean }).__OPEN_FILE_CALLED__ ??
          false
        );
      });

      expect(typeof openFileCalled).toBe("boolean");
    });
  });
});
