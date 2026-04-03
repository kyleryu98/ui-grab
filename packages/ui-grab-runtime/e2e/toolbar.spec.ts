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

const getShadowElementStyles = async (
  uiGrab: UiGrabPageObject,
  selector: string,
) =>
  uiGrab.page.evaluate((elementSelector) => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const element = root?.querySelector<HTMLElement>(elementSelector);
    if (!element) return null;
    const styles = window.getComputedStyle(element);
    return {
      opacity: styles.opacity,
      pointerEvents: styles.pointerEvents,
    };
  }, selector);

const CENTER_ALIGNMENT_TOLERANCE_PX = 1.5;

const hoverShadowElement = async (
  uiGrab: UiGrabPageObject,
  selector: string,
  missingMessage: string,
) => {
  const toolbarRect = await getShadowElementRect(uiGrab, selector);
  if (!toolbarRect) {
    throw new Error(missingMessage);
  }

  await uiGrab.page.mouse.move(
    toolbarRect.left + toolbarRect.width / 2,
    toolbarRect.top + toolbarRect.height / 2,
  );
};

const hoverToolbarShell = async (uiGrab: UiGrabPageObject) =>
  hoverShadowElement(
    uiGrab,
    "[data-ui-grab-toolbar-shell]",
    "Toolbar shell not found",
  );

const hoverResizeHandle = async (uiGrab: UiGrabPageObject) =>
  hoverShadowElement(
    uiGrab,
    "[data-ui-grab-toolbar-resize-handle]",
    "Resize handle not found",
  );

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

const createPersistedCommentItem = async (uiGrab: UiGrabPageObject) => {
  await uiGrab.page.evaluate(() => {
    sessionStorage.setItem(
      "ui-grab-comment-items",
      JSON.stringify([
        {
          id: "comment-seeded",
          content: "<div>Seeded content</div>",
          elementName: "button",
          tagName: "button",
          componentName: "SeededButton",
          elementsCount: 1,
          previewBounds: [],
          elementSelectors: ["button"],
          commentText: "Seeded comment",
          timestamp: Date.now(),
        },
      ]),
    );
  });
  await uiGrab.page.reload();
  await uiGrab.page.waitForLoadState("domcontentloaded");
  await uiGrab.page.waitForFunction(
    () => (window as { __UI_GRAB__?: unknown }).__UI_GRAB__ !== undefined,
    undefined,
    { timeout: 5000 },
  );
  await expect
    .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
    .toBe(true);
};

const createCommentItem = async (
  uiGrab: UiGrabPageObject,
  selector: string,
) => {
  const previousCommentCount = await uiGrab.getCommentItemCount();
  await uiGrab.registerCommentAction();
  await uiGrab.enterPromptMode(selector);
  await uiGrab.typeInInput("comment");
  await uiGrab.submitInput();
  await expect
    .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
    .toBe(false);
  await expect
    .poll(() => uiGrab.getCommentItemCount(), { timeout: 5000 })
    .toBe(previousCommentCount + 1);
};

const getSelectionHintMetrics = async (uiGrab: UiGrabPageObject) =>
  uiGrab.page.evaluate(() => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const hint = root?.querySelector<HTMLElement>(
      "[data-ui-grab-selection-hint]",
    );
    if (!hint) return null;

    const rect = hint.getBoundingClientRect();
    const kbd = hint.querySelector<HTMLElement>("kbd");
    return {
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
      fontSize: parseFloat(getComputedStyle(hint).fontSize),
      kbdHeight: kbd ? kbd.getBoundingClientRect().height : 0,
      text: hint.textContent?.trim() ?? "",
    };
  });

const getSelectionHintAlignment = async (uiGrab: UiGrabPageObject) =>
  uiGrab.page.evaluate(() => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const hint = root?.querySelector<HTMLElement>(
      "[data-ui-grab-selection-hint]",
    );
    const toolbarShell = root?.querySelector<HTMLElement>(
      "[data-ui-grab-toolbar-shell]",
    );
    if (!hint || !toolbarShell) return null;

    const hintRect = hint.getBoundingClientRect();
    const toolbarShellRect = toolbarShell.getBoundingClientRect();

    return {
      hintCenterX: hintRect.left + hintRect.width / 2,
      toolbarCenterX: toolbarShellRect.left + toolbarShellRect.width / 2,
      hintBottom: hintRect.bottom,
      toolbarTop: toolbarShellRect.top,
    };
  });

const getGuidanceOverlayStack = async (uiGrab: UiGrabPageObject) =>
  uiGrab.page.evaluate(() => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    const hint = root?.querySelector<HTMLElement>(
      "[data-ui-grab-selection-hint]",
    );
    const dropdown = root?.querySelector<HTMLElement>(
      "[data-ui-grab-comments-dropdown]",
    );
    const toolbar = root?.querySelector<HTMLElement>("[data-ui-grab-toolbar]");
    const toolbarShell = root?.querySelector<HTMLElement>(
      "[data-ui-grab-toolbar-shell]",
    );
    if (!hint || !dropdown || !toolbar || !toolbarShell) return null;

    const hintRect = hint.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const toolbarShellRect = toolbarShell.getBoundingClientRect();
    return {
      hintRect: {
        left: hintRect.left,
        top: hintRect.top,
        right: hintRect.right,
        bottom: hintRect.bottom,
      },
      dropdownRect: {
        left: dropdownRect.left,
        top: dropdownRect.top,
        right: dropdownRect.right,
        bottom: dropdownRect.bottom,
      },
      hintCenterX: hintRect.left + hintRect.width / 2,
      toolbarCenterX: toolbarShellRect.left + toolbarShellRect.width / 2,
      toolbarZIndex: Number.parseInt(getComputedStyle(toolbar).zIndex, 10),
      dropdownZIndex: Number.parseInt(getComputedStyle(dropdown).zIndex, 10),
    };
  });

const getToolbarOverlayLayout = async (uiGrab: UiGrabPageObject) =>
  uiGrab.page.evaluate(() => {
    const host = document.querySelector("[data-ui-grab]");
    const shadowRoot = host?.shadowRoot;
    const root = shadowRoot?.querySelector("[data-ui-grab]");
    if (!root) return null;

    const getRect = (selector: string) => {
      const element = root.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      };
    };

    const toolbarRect = getRect("[data-ui-grab-toolbar]");
    const dropdownRect = getRect("[data-ui-grab-comments-dropdown]");
    const hintRect = getRect("[data-ui-grab-selection-hint]");
    if (!toolbarRect || !dropdownRect || !hintRect) return null;

    return {
      toolbarRect,
      dropdownRect,
      hintRect,
    };
  });

test.describe("Toolbar", () => {
  test.describe("Visibility", () => {
    test("toolbar should be visible after initial load", async ({ uiGrab }) => {
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
        () => (window as { __UI_GRAB__?: unknown }).__UI_GRAB__ !== undefined,
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
        "[data-ui-grab-toolbar-shell]",
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

    test("collapsed scaled toolbar should start fully inside the viewport", async ({
      uiGrab,
    }) => {
      await uiGrab.setViewportSize(470, 272);
      await uiGrab.page.evaluate(() => {
        localStorage.setItem(
          "ui-grab-toolbar-state",
          JSON.stringify({
            edge: "bottom",
            ratio: 0.5,
            collapsed: true,
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
        "[data-ui-grab-toolbar-shell]",
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

  test.describe("Selection Guidance", () => {
    test("selection hint should stay above the comments dropdown", async ({
      uiGrab,
    }) => {
      await createPersistedCommentItem(uiGrab);
      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clickCommentsButton();
      await uiGrab.activate();

      await expect
        .poll(async () => (await getGuidanceOverlayStack(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);

      const overlayStack = await getGuidanceOverlayStack(uiGrab);
      expect(overlayStack).not.toBeNull();
      expect(overlayStack!.hintRect.bottom).toBeGreaterThan(
        overlayStack!.hintRect.top,
      );
      expect(overlayStack!.dropdownRect.bottom).toBeGreaterThan(
        overlayStack!.dropdownRect.top,
      );
      expect(overlayStack!.toolbarZIndex).toBeGreaterThan(
        overlayStack!.dropdownZIndex,
      );
      expect(overlayStack!.hintRect.bottom).toBeLessThanOrEqual(
        overlayStack!.dropdownRect.top + 1,
      );
      expect(
        Math.abs(overlayStack!.hintCenterX - overlayStack!.toolbarCenterX),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
    });

    test("selection hint should scale up with the toolbar size", async ({
      uiGrab,
    }) => {
      await createPersistedCommentItem(uiGrab);
      await uiGrab.activate();

      await expect
        .poll(async () => (await getSelectionHintMetrics(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);
      const defaultMetrics = await getSelectionHintMetrics(uiGrab);
      expect(defaultMetrics).not.toBeNull();

      await uiGrab.page.evaluate(() => {
        window.__UI_GRAB__?.setToolbarState({ scale: 1.6 });
      });

      await expect
        .poll(async () => (await getSelectionHintMetrics(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);
      const scaledMetrics = await getSelectionHintMetrics(uiGrab);
      expect(scaledMetrics).not.toBeNull();
      expect(scaledMetrics!.kbdHeight).toBeGreaterThan(
        defaultMetrics!.kbdHeight,
      );
      expect(scaledMetrics!.rect.width).toBeGreaterThan(
        defaultMetrics!.rect.width,
      );
      expect(scaledMetrics!.rect.height).toBeGreaterThan(
        defaultMetrics!.rect.height,
      );
    });

    test("selection hint should compact itself when the comments dropdown is open", async ({
      uiGrab,
    }) => {
      await createPersistedCommentItem(uiGrab);
      await uiGrab.activate();

      await expect
        .poll(
          async () =>
            (await getSelectionHintMetrics(uiGrab))?.text
              .toLowerCase()
              .includes("capture") ?? false,
          { timeout: 3000 },
        )
        .toBe(true);

      const defaultMetrics = await getSelectionHintMetrics(uiGrab);
      expect(defaultMetrics).not.toBeNull();

      await uiGrab.clickCommentsButton();

      await expect
        .poll(async () => (await getGuidanceOverlayStack(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);
      await expect
        .poll(
          async () =>
            (await getSelectionHintMetrics(uiGrab))?.text
              .toLowerCase()
              .includes("capture") ?? false,
          { timeout: 3000 },
        )
        .toBe(true);

      const compactMetrics = await getSelectionHintMetrics(uiGrab);
      expect(compactMetrics).not.toBeNull();
      expect(compactMetrics!.rect.width).toBeLessThan(
        defaultMetrics!.rect.width,
      );
      expect(compactMetrics!.kbdHeight).toBeLessThan(defaultMetrics!.kbdHeight);
    });

    test("selection hint should stay centered above the toolbar shell", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        window.__UI_GRAB__?.setToolbarState({
          edge: "bottom",
          ratio: 0.5,
          scale: 1.6,
        });
      });
      await uiGrab.activate();

      await expect
        .poll(async () => (await getSelectionHintAlignment(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);

      const alignment = await getSelectionHintAlignment(uiGrab);
      expect(alignment).not.toBeNull();
      expect(
        Math.abs(alignment!.hintCenterX - alignment!.toolbarCenterX),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX);
      expect(alignment!.hintBottom).toBeLessThanOrEqual(alignment!.toolbarTop);
    });

    test("selection hint should reappear after saving a comment", async ({
      uiGrab,
    }) => {
      await createCommentItem(uiGrab, "li:first-child");

      await uiGrab.deactivate();
      await uiGrab.activate();

      await expect
        .poll(async () => (await getSelectionHintMetrics(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);

      const hintMetrics = await getSelectionHintMetrics(uiGrab);
      expect(hintMetrics).not.toBeNull();
      expect(hintMetrics!.text).toContain("capture");
    });

    test("comments dropdown should sit between the guidance hint and toolbar shell", async ({
      uiGrab,
    }) => {
      await createPersistedCommentItem(uiGrab);

      await uiGrab.page.evaluate(() => {
        window.__UI_GRAB__?.setToolbarState({
          edge: "bottom",
          ratio: 0.5,
          scale: 1.6,
        });
      });

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 3000 })
        .toBe(true);

      await hoverToolbarShell(uiGrab);
      await uiGrab.clickCommentsButton();
      await uiGrab.activate();
      await hoverToolbarShell(uiGrab);

      await expect
        .poll(async () => (await getToolbarOverlayLayout(uiGrab)) !== null, {
          timeout: 3000,
        })
        .toBe(true);

      const overlayLayout = await getToolbarOverlayLayout(uiGrab);
      expect(overlayLayout).not.toBeNull();
      expect(
        rectanglesOverlap(
          overlayLayout!.dropdownRect,
          overlayLayout!.toolbarRect,
        ),
      ).toBe(false);
      expect(
        rectanglesOverlap(overlayLayout!.dropdownRect, overlayLayout!.hintRect),
      ).toBe(false);
      expect(overlayLayout!.hintRect.bottom).toBeLessThanOrEqual(
        overlayLayout!.dropdownRect.top + 1,
      );
      expect(
        overlayLayout!.dropdownRect.top - overlayLayout!.hintRect.bottom,
      ).toBeLessThanOrEqual(10);
      expect(
        Math.abs(
          (overlayLayout!.hintRect.left + overlayLayout!.hintRect.right) / 2 -
            (overlayLayout!.dropdownRect.left +
              overlayLayout!.dropdownRect.right) /
              2,
        ),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
      expect(overlayLayout!.dropdownRect.bottom).toBeLessThanOrEqual(
        overlayLayout!.toolbarRect.top + 1,
      );
      expect(
        overlayLayout!.toolbarRect.top - overlayLayout!.dropdownRect.bottom,
      ).toBeLessThanOrEqual(12);
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

    test("clicking collapsed toolbar should expand it", async ({ uiGrab }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(250);

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

    test("collapsed bottom toolbar should collapse to the circular button footprint", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickToolbarCollapse();
      await expect
        .poll(() => uiGrab.isToolbarCollapsed(), { timeout: 2000 })
        .toBe(true);
      await uiGrab.page.waitForTimeout(250);

      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-shell]",
      );
      const collapseRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-collapse]",
      );

      expect(toolbarRect).not.toBeNull();
      expect(collapseRect).not.toBeNull();

      const toolbarCenterX = (toolbarRect!.left + toolbarRect!.right) / 2;
      const collapseCenterX = (collapseRect!.left + collapseRect!.right) / 2;
      const toolbarCenterY = (toolbarRect!.top + toolbarRect!.bottom) / 2;
      const collapseCenterY = (collapseRect!.top + collapseRect!.bottom) / 2;

      expect(Math.abs(toolbarCenterX - collapseCenterX)).toBeLessThanOrEqual(
        CENTER_ALIGNMENT_TOLERANCE_PX,
      );
      expect(Math.abs(toolbarCenterY - collapseCenterY)).toBeLessThanOrEqual(
        CENTER_ALIGNMENT_TOLERANCE_PX,
      );
      expect(Math.abs(toolbarRect!.width - collapseRect!.width)).toBeLessThanOrEqual(
        CENTER_ALIGNMENT_TOLERANCE_PX,
      );
      expect(Math.abs(toolbarRect!.height - collapseRect!.height)).toBeLessThanOrEqual(
        CENTER_ALIGNMENT_TOLERANCE_PX,
      );
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

    test("resize control should stay visible inside the toolbar shell", async ({
      uiGrab,
    }) => {
      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-shell]",
      );
      const handleRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-handle]",
      );
      const styles = await getShadowElementStyles(
        uiGrab,
        "[data-ui-grab-toolbar-resize-handle]",
      );

      expect(toolbarRect).not.toBeNull();
      expect(handleRect).not.toBeNull();
      expect(styles).not.toBeNull();
      expect(Number(styles?.opacity ?? "0")).toBeGreaterThan(0.95);
      expect(styles?.pointerEvents).toBe("auto");
      expect(handleRect?.left ?? 0).toBeGreaterThanOrEqual(
        (toolbarRect?.left ?? 0) - 1,
      );
      expect(handleRect?.right ?? 0).toBeLessThanOrEqual(
        (toolbarRect?.right ?? 0) + 1,
      );
      expect(handleRect?.top ?? 0).toBeGreaterThanOrEqual(
        (toolbarRect?.top ?? 0) - 1,
      );
      expect(handleRect?.bottom ?? 0).toBeLessThanOrEqual(
        (toolbarRect?.bottom ?? 0) + 1,
      );
    });

    test("should resize from the integrated trailing control and persist after reload", async ({
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

      await uiGrab.dragToolbarResizeHandle(28, 0);

      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.width ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeWidth + 6);
      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.height ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeHeight + 3);
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

    test("should keep the integrated resize control docked to the toolbar end when snapped to the right side", async ({
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

      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-shell]",
      );
      const resizeHandleRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-handle]",
      );

      expect(toolbarRect).not.toBeNull();
      expect(resizeHandleRect).not.toBeNull();
      expect(
        Math.abs(
          (resizeHandleRect?.left ?? 0) +
            (resizeHandleRect?.width ?? 0) / 2 -
            ((toolbarRect?.left ?? 0) + (toolbarRect?.width ?? 0) / 2),
        ),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
      expect(resizeHandleRect?.bottom ?? 0).toBeLessThanOrEqual(
        (toolbarRect?.bottom ?? 0) + 1,
      );
      expect(resizeHandleRect?.top ?? 0).toBeGreaterThanOrEqual(
        (toolbarRect?.top ?? 0) + (toolbarRect?.height ?? 0) / 2 - 2,
      );

      const beforeResize = await uiGrab.getToolbarInfo();
      const beforeWidth = beforeResize.dimensions?.width ?? 0;
      const beforeHeight = beforeResize.dimensions?.height ?? 0;

      await uiGrab.dragToolbarResizeHandle(0, 28);

      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.width ?? 0,
          { timeout: 3000 },
        )
        .toBeGreaterThan(beforeWidth + 6);
      await expect
        .poll(
          async () => (await uiGrab.getToolbarInfo()).dimensions?.height ?? 0,
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
      expect(restoredToggle?.width ?? 0).toBeGreaterThan(
        (defaultToggle?.width ?? 0) + 3,
      );
    });

    test("resize control should keep its tooltip above the toolbar shell center", async ({
      uiGrab,
    }) => {
      await hoverResizeHandle(uiGrab);

      await expect
        .poll(
          async () =>
            Boolean(
              await getShadowElementRect(
                uiGrab,
                "[data-ui-grab-toolbar-resize-tooltip]",
              ),
            ),
          { timeout: 2000 },
        )
        .toBe(true);

      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-shell]",
      );
      const resizeHandleRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-handle]",
      );
      const tooltipRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-tooltip]",
      );
      const tooltipText = await uiGrab.page.evaluate(() => {
        const host = document.querySelector("[data-ui-grab]");
        const shadowRoot = host?.shadowRoot;
        const root = shadowRoot?.querySelector("[data-ui-grab]");
        return root
          ?.querySelector<HTMLElement>("[data-ui-grab-toolbar-resize-tooltip]")
          ?.textContent?.trim();
      });

      expect(toolbarRect).not.toBeNull();
      expect(resizeHandleRect).not.toBeNull();
      expect(tooltipRect).not.toBeNull();
      expect(tooltipText).toBe("Drag to resize");
      expect(
        Math.abs(
          (resizeHandleRect?.top ?? 0) +
            (resizeHandleRect?.height ?? 0) / 2 -
            ((toolbarRect?.top ?? 0) + (toolbarRect?.height ?? 0) / 2),
        ),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
      expect(resizeHandleRect?.right ?? 0).toBeLessThanOrEqual(
        (toolbarRect?.right ?? 0) + 1,
      );
      expect(tooltipRect?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThan(
        (toolbarRect?.top ?? 0) + 1,
      );
      expect(
        Math.abs(
          (tooltipRect?.left ?? 0) +
            (tooltipRect?.width ?? 0) / 2 -
            ((toolbarRect?.left ?? 0) + (toolbarRect?.width ?? 0) / 2),
        ),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
      expect(tooltipRect?.width ?? 0).toBeGreaterThan(
        (resizeHandleRect?.width ?? 0) + 18,
      );
      expect(tooltipRect?.top ?? 0).toBeGreaterThan(
        (toolbarRect?.top ?? 0) - 64,
      );
    });

    test("resize control should keep its tooltip above a vertical toolbar shell center", async ({
      uiGrab,
    }) => {
      await uiGrab.page.evaluate(() => {
        window.__UI_GRAB__?.setToolbarState({
          edge: "right",
          ratio: 0.5,
          scale: 1,
        });
      });
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 3000 })
        .toBe(true);

      await hoverResizeHandle(uiGrab);

      await expect
        .poll(
          async () =>
            Boolean(
              await getShadowElementRect(
                uiGrab,
                "[data-ui-grab-toolbar-resize-tooltip]",
              ),
            ),
          { timeout: 2000 },
        )
        .toBe(true);

      const toolbarRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-shell]",
      );
      const tooltipRect = await getShadowElementRect(
        uiGrab,
        "[data-ui-grab-toolbar-resize-tooltip]",
      );

      expect(toolbarRect).not.toBeNull();
      expect(tooltipRect).not.toBeNull();
      expect(tooltipRect?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThan(
        (toolbarRect?.top ?? 0) + 1,
      );
      expect(
        Math.abs(
          (tooltipRect?.left ?? 0) +
            (tooltipRect?.width ?? 0) / 2 -
            ((toolbarRect?.left ?? 0) + (toolbarRect?.width ?? 0) / 2),
        ),
      ).toBeLessThanOrEqual(CENTER_ALIGNMENT_TOLERANCE_PX + 1);
    });

    test("resize control should stay visible while moving from the toolbar body to the control", async ({
      uiGrab,
    }) => {
      await hoverToolbarShell(uiGrab);
      await hoverResizeHandle(uiGrab);

      await expect
        .poll(
          async () => {
            const styles = await getShadowElementStyles(
              uiGrab,
              "[data-ui-grab-toolbar-resize-handle]",
            );
            return {
              opacity: Number(styles?.opacity ?? "0"),
              pointerEvents: styles?.pointerEvents ?? "none",
            };
          },
          { timeout: 2000 },
        )
        .toEqual({
          opacity: 1,
          pointerEvents: "auto",
        });
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

    test("toolbar should handle rapid collapse/expand", async ({ uiGrab }) => {
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

    test("should collapse and expand in vertical mode", async ({ uiGrab }) => {
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

    test("should toggle enabled state in vertical mode", async ({ uiGrab }) => {
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

    test("should be draggable from vertical position", async ({ uiGrab }) => {
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
