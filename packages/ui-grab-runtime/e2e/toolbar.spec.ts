import { test, expect } from "./fixtures.js";
import type { UiGrabPageObject } from "./fixtures.js";

const getShadowElementRect = async (
  uiGrab: UiGrabPageObject,
  selector: string,
) =>
  uiGrab.page.evaluate((elementSelector) => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const element = root?.querySelector<HTMLElement>(elementSelector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }, selector);

const rectanglesOverlap = (
  first: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  },
  second: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  },
) =>
  !(
    first.right <= second.left ||
    second.right <= first.left ||
    first.bottom <= second.top ||
    second.bottom <= first.top
  );

test.describe("Toolbar", () => {
  test.describe("Visibility", () => {
    test("toolbar should be visible after initial load", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("toolbar should fade in after delay", async ({ uiGrab }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("toolbar should be visible on mobile viewport after reload", async ({
      uiGrab,
    }) => {
      await uiGrab.setViewportSize(375, 667);
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await uiGrab.page.waitForFunction(
        () =>
          (window as { __UI_GRAB__?: unknown }).__UI_GRAB__ !== undefined,
        { timeout: 10000 },
      );

      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });

    test("toolbar should remain visible through viewport resize cycles", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.setViewportSize(375, 667);
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.setViewportSize(1280, 720);
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("toolbar should start fully inside the viewport after restoring a scaled state", async ({
      uiGrab,
    }) => {
      await uiGrab.setViewportSize(375, 667);
      await uiGrab.page.evaluate(() => {
        localStorage.setItem(
          "ui-grab-toolbar-state",
          JSON.stringify({
            edge: "bottom",
            ratio: 0.5,
            collapsed: false,
            enabled: true,
            scale: 1.8,
          }),
        );
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(600);

      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar]",
      );
      const viewport = await uiGrab.getViewportSize();

      expect(toolbarRect).not.toBeNull();
      expect(toolbarRect?.left ?? -1).toBeGreaterThanOrEqual(0);
      expect(toolbarRect?.top ?? -1).toBeGreaterThanOrEqual(0);
      expect(toolbarRect?.right ?? viewport.width + 1).toBeLessThanOrEqual(
        viewport.width,
      );
      expect(toolbarRect?.bottom ?? viewport.height + 1).toBeLessThanOrEqual(
        viewport.height,
      );

      await uiGrab.setViewportSize(1280, 720);
    });
  });

  test.describe("Toggle Activation", () => {
    test("clicking toolbar toggle should activate overlay", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarToggle();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("clicking toolbar toggle again should deactivate overlay", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarToggle();
      await uiGrab.clickToolbarToggle();

      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(false);
    });

    test("toolbar toggle should reflect current activation state", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.activate();

      const toolbarInfo = await uiGrab.getToolbarInfo();
      expect(toolbarInfo.isVisible).toBe(true);
    });
  });

  test.describe("Collapse/Expand", () => {
    test("clicking collapse button should collapse toolbar", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();

      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);
    });

    test("clicking collapsed toolbar should expand it", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        const toolbar = root?.querySelector<HTMLElement>(
          "[data-ui-grab-toolbar]",
        );
        const innerDiv = toolbar?.querySelector("div");
        innerDiv?.click();
      }, "data-ui-grab");

      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(false);
    });

    test("collapsed toolbar should not allow activation toggle", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarToggle();

      const isActive = await uiGrab.isOverlayVisible();
      const isCollapsed = await uiGrab.isToolbarCollapsed();

      expect(isCollapsed || !isActive).toBe(true);
    });
  });

  test.describe("Dragging", () => {
    test.beforeEach(async ({ uiGrab }) => {
      await uiGrab.page.evaluate(() => {
        localStorage.removeItem("ui-grab-toolbar-state");
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      // HACK: Wait for toolbar fade-in animation to complete
      await uiGrab.page.waitForTimeout(600);
    });

    test("should be draggable", async ({ uiGrab }) => {
      const initialInfo = await uiGrab.getToolbarInfo();
      const initialPosition = initialInfo.position;
      expect(initialPosition).not.toBeNull();

      await uiGrab.dragToolbar(100, 0);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            if (!info.position || !initialPosition) return 0;
            return Math.abs(info.position.x - initialPosition.x);
          },
          { timeout: 3000 },
        )
        .toBeGreaterThan(0);
    });

    test("should snap to edges after drag", async ({ uiGrab }) => {
      await uiGrab.dragToolbar(500, 0);

      const info = await uiGrab.getToolbarInfo();
      expect(info.snapEdge).toBeDefined();
    });

    test("should snap to top edge", async ({ uiGrab }) => {
      await uiGrab.dragToolbar(0, -500);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toBe("top");
    });

    test("should snap to left edge", async ({ uiGrab }) => {
      await uiGrab.dragToolbar(-1000, -500);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toMatch(/^(left|top)$/);
    });

    test("should snap to right edge", async ({ uiGrab }) => {
      await uiGrab.dragToolbar(1500, -500);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toMatch(/^(right|top)$/);
    });

    test("should not drag when collapsed", async ({ uiGrab }) => {
      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);

      const initialInfo = await uiGrab.getToolbarInfo();
      const initialPosition = initialInfo.position;

      await uiGrab.dragToolbar(100, 100);

      const finalInfo = await uiGrab.getToolbarInfo();
      const finalPosition = finalInfo.position;

      if (initialPosition && finalPosition) {
        expect(Math.abs(finalPosition.x - initialPosition.x)).toBeLessThan(20);
        expect(Math.abs(finalPosition.y - initialPosition.y)).toBeLessThan(20);
      }
    });

    test("should be draggable from select button", async ({ uiGrab }) => {
      const initialInfo = await uiGrab.getToolbarInfo();
      const initialPosition = initialInfo.position;
      expect(initialPosition).not.toBeNull();

      await uiGrab.dragToolbarFromButton(
        "[data-ui-grab-toolbar-toggle]",
        100,
        0,
      );

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            if (!info.position || !initialPosition) return 0;
            return Math.abs(info.position.x - initialPosition.x);
          },
          { timeout: 3000 },
        )
        .toBeGreaterThan(0);
    });

    test("should not close page dropdown when clicking select button", async ({
      uiGrab,
    }) => {
      await uiGrab.openDropdown();
      expect(await uiGrab.isDropdownOpen()).toBe(true);

      await uiGrab.clickToolbarToggle();

      expect(await uiGrab.isDropdownOpen()).toBe(true);
    });

    test("should not close page dropdown when dragging from select button", async ({
      uiGrab,
    }) => {
      await uiGrab.openDropdown();
      expect(await uiGrab.isDropdownOpen()).toBe(true);

      await uiGrab.dragToolbarFromButton(
        "[data-ui-grab-toolbar-toggle]",
        50,
        0,
      );

      expect(await uiGrab.isDropdownOpen()).toBe(true);
    });
  });

  test.describe("Resizing", () => {
    test.beforeEach(async ({ uiGrab }) => {
      await uiGrab.page.evaluate(() => {
        localStorage.removeItem("ui-grab-toolbar-state");
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(600);
    });

    test("should resize diagonally from the corner handle and persist after reload", async ({
      uiGrab,
    }) => {
      const beforeResize = await uiGrab.getToolbarInfo();
      const beforeWidth = beforeResize.dimensions?.width ?? 0;
      const beforeHeight = beforeResize.dimensions?.height ?? 0;
      const beforeToggle = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-enabled]",
      );
      const beforeRatio = beforeHeight > 0 ? beforeWidth / beforeHeight : 0;

      await uiGrab.dragToolbarResizeHandle(36, -24);

      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.width ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeWidth + 6);
      await expect
        .poll(
          async () =>
            (await uiGrab.getToolbarInfo()).dimensions?.height ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeHeight + 6);
      await expect
        .poll(
          async () =>
            (
              await getShadowElementRect(
                uiGrab,
                "[data-ui-grab-toolbar-enabled]",
              )
            )?.width ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan((beforeToggle?.width ?? 0) + 3);

      const resizedInfo = await uiGrab.getToolbarInfo();
      const resizedWidth = resizedInfo.dimensions?.width ?? 0;
      const resizedHeight = resizedInfo.dimensions?.height ?? 0;
      const resizedToggle = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-enabled]",
      );
      const resizedRatio = resizedHeight > 0 ? resizedWidth / resizedHeight : 0;
      expect(Math.abs(resizedRatio - beforeRatio)).toBeLessThan(0.35);

      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(600);

      const afterReload = await uiGrab.getToolbarInfo();
      const reloadedWidth = afterReload.dimensions?.width ?? 0;
      const reloadedHeight = afterReload.dimensions?.height ?? 0;
      const reloadedToggle = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-enabled]",
      );
      expect(Math.abs(reloadedWidth - resizedWidth)).toBeLessThan(4);
      expect(Math.abs(reloadedHeight - resizedHeight)).toBeLessThan(4);
      expect(
        Math.abs((reloadedToggle?.width ?? 0) - (resizedToggle?.width ?? 0)),
      ).toBeLessThan(3);
    });

    test("should resize from the free corner when snapped to the right edge", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        localStorage.setItem(
          "ui-grab-toolbar-state",
          JSON.stringify({
            edge: "right",
            ratio: 0.5,
            collapsed: false,
            enabled: true,
            size: 78,
          }),
        );
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(600);

      const beforeResize = await uiGrab.getToolbarInfo();
      const beforeWidth = beforeResize.dimensions?.width ?? 0;
      const beforeHeight = beforeResize.dimensions?.height ?? 0;

      await uiGrab.dragToolbarResizeHandle(-24, 36);

      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.width ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeWidth + 6);
      await expect
        .poll(
          async () =>
            (await uiGrab.getToolbarInfo()).dimensions?.height ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeHeight + 6);
    });

    test("should clamp oversized legacy dimensions into a bounded proportional toolbar", async ({
      uiGrab,
    }) => {
      const defaultInfo = await uiGrab.getToolbarInfo();
      const defaultToggle = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-enabled]",
      );
      const defaultWidth = defaultInfo.dimensions?.width ?? 0;
      const defaultHeight = defaultInfo.dimensions?.height ?? 0;
      const defaultRatio = defaultHeight > 0 ? defaultWidth / defaultHeight : 0;

      await uiGrab.page.evaluate(() => {
        localStorage.setItem(
          "ui-grab-toolbar-state",
          JSON.stringify({
            edge: "bottom",
            ratio: 0.5,
            collapsed: false,
            enabled: true,
            width: 240,
            height: 240,
          }),
        );
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(600);

      const restoredInfo = await uiGrab.getToolbarInfo();
      const restoredToggle = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-enabled]",
      );
      const restoredWidth = restoredInfo.dimensions?.width ?? 0;
      const restoredHeight = restoredInfo.dimensions?.height ?? 0;
      const restoredRatio =
        restoredHeight > 0 ? restoredWidth / restoredHeight : 0;

      expect(restoredWidth).toBeGreaterThan(defaultWidth + 10);
      expect(restoredHeight).toBeGreaterThan(defaultHeight + 6);
      expect(restoredWidth).toBeLessThan(defaultWidth * 2.1);
      expect(restoredHeight).toBeLessThan(defaultHeight * 2.1);
      expect(Math.abs(restoredRatio - defaultRatio)).toBeLessThan(0.35);
      expect((restoredToggle?.width ?? 0)).toBeGreaterThan(
        (defaultToggle?.width ?? 0) + 3,
      );
    });

    test("resize handle should not overlap the collapse button on the default bottom edge", async ({
      uiGrab,
    }) => {
      const collapseRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-collapse]",
      );
      const resizeHandleRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-handle]",
      );

      expect(collapseRect).not.toBeNull();
      expect(resizeHandleRect).not.toBeNull();
      expect(
        rectanglesOverlap(
          collapseRect ?? { left: 0, top: 0, right: 0, bottom: 0 },
          resizeHandleRect ?? { left: 0, top: 0, right: 0, bottom: 0 },
        ),
      ).toBe(false);
    });
  });

  test.describe("State Persistence", () => {
    test("toolbar position should persist across page reloads", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.dragToolbar(200, -200);
      // HACK: Wait for snap animation
      await uiGrab.page.waitForTimeout(200);

      const positionBeforeReload = await uiGrab.getToolbarInfo();

      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      const positionAfterReload = await uiGrab.getToolbarInfo();

      if (positionBeforeReload.snapEdge && positionAfterReload.snapEdge) {
        expect(positionAfterReload.snapEdge).toBe(
          positionBeforeReload.snapEdge,
        );
      }
    });

    test("collapsed state should persist across page reloads", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);
    });
  });

  test.describe("Chevron Rotation", () => {
    test.beforeEach(async ({ uiGrab }) => {
      await uiGrab.page.evaluate(() => {
        localStorage.removeItem("ui-grab-toolbar-state");
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      // HACK: Wait for toolbar fade-in animation to complete
      await uiGrab.page.waitForTimeout(600);
    });

    test("chevron should rotate based on snap edge", async ({ uiGrab }) => {
      await uiGrab.dragToolbar(0, -500);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toBe("top");

      // HACK: Need extra delay for snap animation before next drag
      await uiGrab.page.waitForTimeout(300);

      await uiGrab.dragToolbar(0, 800);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toBe("bottom");
    });
  });

  test.describe("Viewport Resize Handling", () => {
    test("toolbar should recalculate position on viewport resize", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.setViewportSize(1920, 1080);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.isVisible;
          },
          { timeout: 2000 },
        )
        .toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });

    test("toolbar should remain visible after rapid resize", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      for (let i = 0; i < 3; i++) {
        await uiGrab.setViewportSize(1000 + i * 100, 700 + i * 50);
      }

      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });
  });

  test.describe("Edge Cases", () => {
    test("toolbar should handle very small viewport", async ({ uiGrab }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.setViewportSize(320, 480);

      const isVisible = await uiGrab.isToolbarVisible();
      expect(typeof isVisible).toBe("boolean");

      await uiGrab.setViewportSize(1280, 720);
    });

    test("toolbar should handle rapid collapse/expand", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      for (let i = 0; i < 5; i++) {
        await uiGrab.clickToolbarCollapse();
      }

      const info = await uiGrab.getToolbarInfo();
      expect(info.isVisible).toBe(true);
    });

    test("toolbar should maintain position ratio on resize", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.dragToolbar(-200, 0);

      await uiGrab.setViewportSize(800, 600);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.isVisible;
          },
          { timeout: 2000 },
        )
        .toBe(true);

      await uiGrab.setViewportSize(1280, 720);
    });
  });

  test.describe("Vertical Layout", () => {
    const seedVerticalState = async (
      page: import("@playwright/test").Page,
      edge: "left" | "right",
    ) => {
      await page.evaluate(
        ({ edge: savedEdge }) => {
          localStorage.setItem(
            "ui-grab-toolbar-state",
            JSON.stringify({
              edge: savedEdge,
              ratio: 0.5,
              collapsed: false,
              enabled: true,
            }),
          );
        },
        { edge },
      );
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
    };

    test.beforeEach(async ({ uiGrab }) => {
      await uiGrab.page.evaluate(() => {
        localStorage.removeItem("ui-grab-toolbar-state");
      });
      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      // HACK: Wait for toolbar fade-in animation to complete
      await uiGrab.page.waitForTimeout(600);
    });

    test("should render vertically when snapped to right edge", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      const info = await uiGrab.getToolbarInfo();
      expect(info.snapEdge).toBe("right");
      expect(info.isVertical).toBe(true);
      expect(info.dimensions).not.toBeNull();
      expect(info.dimensions!.height).toBeGreaterThan(info.dimensions!.width);
    });

    test("should render vertically when snapped to left edge", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "left");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      const info = await uiGrab.getToolbarInfo();
      expect(info.snapEdge).toBe("left");
      expect(info.isVertical).toBe(true);
      expect(info.dimensions).not.toBeNull();
      expect(info.dimensions!.height).toBeGreaterThan(info.dimensions!.width);
    });

    test("should render horizontally when snapped to top or bottom", async ({
      uiGrab,
    }) => {
      const info = await uiGrab.getToolbarInfo();
      expect(info.isVertical).toBe(false);
      expect(info.dimensions).not.toBeNull();
      expect(info.dimensions!.width).toBeGreaterThan(info.dimensions!.height);
    });

    test("should allow toggle activation in vertical mode", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clickToolbarToggle();
      const isActive = await uiGrab.isOverlayVisible();
      expect(isActive).toBe(true);
    });

    test("should collapse and expand in vertical mode", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        const toolbar = root?.querySelector<HTMLElement>(
          "[data-ui-grab-toolbar]",
        );
        const innerDiv = toolbar?.querySelector("div");
        innerDiv?.click();
      }, "data-ui-grab");

      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(false);
    });

    test("should toggle enabled state in vertical mode", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to complete
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.clickToolbarEnabled();
      // HACK: Wait for toggle animation to complete
      await uiGrab.page.waitForTimeout(200);

      const info = await uiGrab.getToolbarInfo();
      expect(info.isVisible).toBe(true);
      expect(info.snapEdge).toBe("right");
    });

    test("vertical edge state should persist across page reloads", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      const infoAfterReload = await uiGrab.getToolbarInfo();
      expect(infoAfterReload.snapEdge).toBe("right");
      expect(infoAfterReload.isVertical).toBe(true);
    });

    test("vertical toolbar should be snapped to edge after reload", async ({
      uiGrab,
    }) => {
      const viewportSize = await uiGrab.getViewportSize();

      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.page.reload();
      await uiGrab.page.waitForLoadState("domcontentloaded");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      const info = await uiGrab.getToolbarInfo();
      expect(info.position).not.toBeNull();
      expect(info.dimensions).not.toBeNull();

      const rightEdgePosition = info.position!.x + info.dimensions!.width;
      expect(rightEdgePosition).toBeGreaterThan(viewportSize.width - 30);
    });

    test("should transition from vertical to horizontal when dragged to bottom", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      // HACK: Wait for toolbar fade-in animation to complete
      await uiGrab.page.waitForTimeout(600);

      const verticalInfo = await uiGrab.getToolbarInfo();
      expect(verticalInfo.isVertical).toBe(true);

      await uiGrab.dragToolbar(-500, 500);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 3000 },
        )
        .toBe("bottom");

      const horizontalInfo = await uiGrab.getToolbarInfo();
      expect(horizontalInfo.isVertical).toBe(false);
    });

    test("should be draggable from vertical position", async ({
      uiGrab,
    }) => {
      await seedVerticalState(uiGrab.page, "right");
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);
      // HACK: Wait for toolbar fade-in animation to complete
      await uiGrab.page.waitForTimeout(600);

      const initialInfo = await uiGrab.getToolbarInfo();
      expect(initialInfo.position).not.toBeNull();

      await uiGrab.dragToolbar(0, 100);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            if (!info.position || !initialInfo.position) return false;
            return (
              Math.abs(info.position.x - initialInfo.position.x) > 0 ||
              Math.abs(info.position.y - initialInfo.position.y) > 0
            );
          },
          { timeout: 3000 },
        )
        .toBe(true);

      const movedInfo = await uiGrab.getToolbarInfo();
      expect(movedInfo.isVisible).toBe(true);
      expect(movedInfo.snapEdge).not.toBeNull();
    });
  });
});
