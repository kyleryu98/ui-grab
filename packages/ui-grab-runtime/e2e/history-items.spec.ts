import { test, expect } from "./fixtures.js";
import type { UiGrabPageObject } from "./fixtures.js";

const copyElement = async (
  uiGrab: UiGrabPageObject,
  selector: string,
  expectedCommentCount?: number,
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
    .toBe(expectedCommentCount ?? previousCommentCount + 1);
  await expect
    .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 5000 })
    .toBe(true);
  // HACK: Wait for copy feedback transition and toolbar layout animation
  await uiGrab.page.waitForTimeout(300);
};

const getStoredCommentItems = async (uiGrab: UiGrabPageObject) => {
  return uiGrab.page.evaluate(() => {
    const rawItems = sessionStorage.getItem("ui-grab-comment-items");
    if (!rawItems) return [];
    const parsed = JSON.parse(rawItems) as Array<{
      id: string;
      commentText?: string;
      content: string;
    }>;
    return parsed.map((item) => ({
      id: item.id,
      commentText: item.commentText ?? "",
      content: item.content,
    }));
  });
};

test.describe("Comment Items", () => {
  test.describe("Toolbar Comments Button", () => {
    test("should not be visible before any elements are copied", async ({
      uiGrab,
    }) => {
      await expect
        .poll(() => uiGrab.isToolbarVisible(), { timeout: 2000 })
        .toBe(true);

      const isCommentsVisible = await uiGrab.isCommentsButtonVisible();
      expect(isCommentsVisible).toBe(false);
    });

    test("should become visible after copying an element", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);
    });
  });

  test.describe("Dropdown Open/Close", () => {
    test("should open when clicking the comments button", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      const isDropdownVisible = await uiGrab.isCommentsDropdownVisible();
      expect(isDropdownVisible).toBe(true);
    });

    test("should close when clicking the comments button again", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(false);
    });

    test("should close when pressing Escape", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.pressEscape();
      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should close when context menu is opened", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.activate();
      await uiGrab.hoverElement("li:first-child");
      await uiGrab.waitForSelectionBox();
      await uiGrab.rightClickElement("li:first-child");

      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(false);
      expect(await uiGrab.isContextMenuVisible()).toBe(true);
    });
  });

  test.describe("Dropdown Content", () => {
    test("should display one item after copying an element", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.isVisible).toBe(true);
      expect(dropdownInfo.itemCount).toBe(1);
    });

    test("should display multiple items after copying different elements", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.itemCount).toBe(2);
    });

    test("should hide comments button after clearing all items", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsClear();

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(false);
    });
  });

  test.describe("Item Selection", () => {
    test("should enter prompt mode with comment text when clicking a comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 3000 })
        .toBe(true);

      const inputValue = await uiGrab.getInputValue();
      expect(inputValue).toBe("comment");
    });

    test("should keep the dropdown open after selecting an item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.clickCommentItem(0);

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });

    test("should scroll to the referenced element when selecting an offscreen comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.page.evaluate(() => window.scrollTo(0, 900));
      const scrollBefore = await uiGrab.page.evaluate(() => window.scrollY);
      expect(scrollBefore).toBeGreaterThan(0);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
        .toBe(true);

      await expect
        .poll(() => uiGrab.page.evaluate(() => window.scrollY), {
          timeout: 5000,
        })
        .toBeLessThan(scrollBefore);

      await expect
        .poll(async () => {
          const box = await uiGrab.page
            .getByRole("listitem")
            .filter({ hasText: "Buy groceries" })
            .boundingBox();
          if (!box) return null;
          return box.y + box.height / 2;
        })
        .toBeGreaterThan(0);

      const labelInfo = await uiGrab.getSelectionLabelInfo();
      expect(labelInfo.isVisible).toBe(true);
      expect(labelInfo.tagName).toBe("li");
    });

    test("should not copy comment content when clicking a comment row", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.page.evaluate(() => navigator.clipboard.writeText("seed"));

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 3000 })
        .toBe(true);

      expect(await uiGrab.getClipboardContent()).toBe("seed");
    });
  });

  test.describe("Item Actions", () => {
    test("should copy a comment item from the row action", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.page.evaluate(() => navigator.clipboard.writeText(""));

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItemCopy(0);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toContain("comment");
      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });

    test("should delete a single comment item from the row action", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItemDelete(0);

      await expect
        .poll(() => uiGrab.getCommentItemCount(), { timeout: 2000 })
        .toBe(1);

      expect((await uiGrab.getCommentsDropdownInfo()).itemCount).toBe(1);
    });

    test("should update an existing comment message in place when editing from the list", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      const beforeItems = await getStoredCommentItems(uiGrab);
      expect(beforeItems).toHaveLength(1);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clearInput();
      await uiGrab.typeInInput("updated comment");
      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return;
        const submitButton = root.querySelector<HTMLButtonElement>(
          "[data-ui-grab-submit]",
        );
        submitButton?.click();
      }, "data-ui-grab");

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
        .toBe(false);

      const afterItems = await getStoredCommentItems(uiGrab);
      expect(afterItems).toHaveLength(1);
      expect(afterItems[0]?.id).toBe(beforeItems[0]?.id);
      expect(afterItems[0]?.commentText).toBe("updated comment");
      expect(afterItems[0]?.content.startsWith("updated comment\n\n")).toBe(
        true,
      );
    });

    test("should persist the latest edited comment text when submitting with Enter", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      const beforeItems = await getStoredCommentItems(uiGrab);
      expect(beforeItems).toHaveLength(1);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clearInput();
      await uiGrab.typeInInput("updated via enter");
      await uiGrab.pressEnter();

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
        .toBe(false);

      const afterItems = await getStoredCommentItems(uiGrab);
      expect(afterItems).toHaveLength(1);
      expect(afterItems[0]?.id).toBe(beforeItems[0]?.id);
      expect(afterItems[0]?.commentText).toBe("updated via enter");
      expect(afterItems[0]?.content.startsWith("updated via enter\n\n")).toBe(
        true,
      );
    });

    test("should copy the updated comment content only from the row copy action", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 3000 })
        .toBe(true);

      await uiGrab.clearInput();
      await uiGrab.typeInInput("edited copy text");
      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return;
        const submitButton = root.querySelector<HTMLButtonElement>(
          "[data-ui-grab-submit]",
        );
        submitButton?.click();
      }, "data-ui-grab");

      await expect
        .poll(() => uiGrab.isPromptModeActive(), { timeout: 5000 })
        .toBe(false);

      await uiGrab.page.evaluate(() => navigator.clipboard.writeText(""));
      await uiGrab.clickCommentItemCopy(0);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toContain("edited copy text");
    });
  });

  test.describe("Copy All", () => {
    test("should copy combined content of all items to clipboard", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.page.evaluate(() => navigator.clipboard.writeText(""));

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsCopyAll();

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toContain("[1]");
      expect(clipboardContent).toContain("[2]");
    });

    test("should keep the dropdown open after copy all", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.clickCommentsCopyAll();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });

    test("should not trigger copy all via Enter key", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.page.evaluate(() => navigator.clipboard.writeText(""));

      await uiGrab.clickCommentsButton();
      await uiGrab.pressEnter();
      await uiGrab.page.waitForTimeout(200);

      const clipboardContent = await uiGrab.getClipboardContent();
      expect(clipboardContent).toBe("");
    });
  });

  test.describe("Clear All", () => {
    test("should remove all comment items", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      expect((await uiGrab.getCommentsDropdownInfo()).itemCount).toBe(2);

      await uiGrab.clickCommentsClear();

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should hide the comments button in toolbar after clearing", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentsClear();

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should close the dropdown after clearing", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.clickCommentsClear();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(false);
    });
  });

  test.describe("Deduplication", () => {
    test("should deduplicate when copying the same element twice", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:first-child", 1);

      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.itemCount).toBe(1);
    });

    test("should not deduplicate when copying different elements", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.itemCount).toBe(2);
    });
  });

  test.describe("Hover Behavior", () => {
    test("should show a highlight box on the element when hovering a comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      const grabbedBoxesBefore = await uiGrab.getGrabbedBoxInfo();
      const initialBoxCount = grabbedBoxesBefore.count;

      await uiGrab.hoverCommentItem(0);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.count;
          },
          { timeout: 2000 },
        )
        .toBeGreaterThan(initialBoxCount);
    });

    test("should remove highlight box when mouse leaves a comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      await uiGrab.hoverCommentItem(0);
      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.count;
          },
          { timeout: 2000 },
        )
        .toBeGreaterThan(0);

      await uiGrab.page.mouse.move(0, 0);
      await uiGrab.page.waitForTimeout(200);

      const grabbedBoxesAfter = await uiGrab.getGrabbedBoxInfo();
      const hasCommentHoverBox = grabbedBoxesAfter.boxes.some((box) =>
        box.id.startsWith("comment-hover-"),
      );
      expect(hasCommentHoverBox).toBe(false);
    });
  });

  test.describe("Comments Button Hover Preview", () => {
    test("should show highlight boxes for all comment items when hovering the comments button", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      const grabbedBoxesBefore = await uiGrab.getGrabbedBoxInfo();
      const initialBoxCount = grabbedBoxesBefore.count;

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.count;
          },
          { timeout: 2000 },
        )
        .toBeGreaterThanOrEqual(initialBoxCount + 2);

      const grabbedBoxes = await uiGrab.getGrabbedBoxInfo();
      const allHoverBoxes = grabbedBoxes.boxes.filter((box) =>
        box.id.startsWith("comment-all-hover-"),
      );
      expect(allHoverBoxes.length).toBe(2);
    });

    test("should remove all highlight boxes when mouse leaves the comments button", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.boxes.filter((box) =>
              box.id.startsWith("comment-all-hover-"),
            ).length;
          },
          { timeout: 2000 },
        )
        .toBe(2);

      await uiGrab.page.mouse.move(0, 0);
      await uiGrab.page.waitForTimeout(200);

      const grabbedBoxesAfter = await uiGrab.getGrabbedBoxInfo();
      const remainingHoverBoxes = grabbedBoxesAfter.boxes.filter((box) =>
        box.id.startsWith("comment-all-hover-"),
      );
      expect(remainingHoverBoxes.length).toBe(0);
    });

    test("should clear button hover boxes when pinning the dropdown", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.boxes.filter((box) =>
              box.id.startsWith("comment-all-hover-"),
            ).length;
          },
          { timeout: 2000 },
        )
        .toBe(1);

      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return;
        root
          .querySelector<HTMLButtonElement>("[data-ui-grab-toolbar-comments]")
          ?.click();
      }, "data-ui-grab");
      await uiGrab.page.waitForTimeout(200);

      const grabbedBoxesAfter = await uiGrab.getGrabbedBoxInfo();
      const remainingHoverBoxes = grabbedBoxesAfter.boxes.filter((box) =>
        box.id.startsWith("comment-all-hover-"),
      );
      expect(remainingHoverBoxes.length).toBe(0);
    });

    test("should show highlight box for a single comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.boxes.filter((box) =>
              box.id.startsWith("comment-all-hover-"),
            ).length;
          },
          { timeout: 2000 },
        )
        .toBe(1);
    });
  });

  test.describe("Item Row Click", () => {
    test("should keep the dropdown open after clicking a row", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });
  });

  test.describe("Dropdown Positioning", () => {
    test("should position the dropdown within the viewport", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      await expect
        .poll(
          async () => {
            const position = await uiGrab.getCommentsDropdownPosition();
            return position?.left ?? -9999;
          },
          { timeout: 3000 },
        )
        .toBeGreaterThanOrEqual(0);

      const position = await uiGrab.getCommentsDropdownPosition();
      expect(position).not.toBeNull();
      expect(position!.top).toBeGreaterThanOrEqual(0);
    });

    test("should reposition when toolbar is dragged to top edge", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.dragToolbar(0, -600);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getToolbarInfo();
            return info.snapEdge;
          },
          { timeout: 5000 },
        )
        .toBe("top");

      // HACK: wait for snap animation and toolbar layout transition to fully settle
      await uiGrab.page.waitForTimeout(500);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 5000 })
        .toBe(true);

      const commentsButtonRect = await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return null;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return null;
        const button = root.querySelector<HTMLElement>(
          "[data-ui-grab-toolbar-comments]",
        );
        if (!button) return null;
        const rect = button.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }, "data-ui-grab");

      expect(commentsButtonRect).not.toBeNull();
      await uiGrab.page.mouse.click(
        commentsButtonRect!.x + commentsButtonRect!.width / 2,
        commentsButtonRect!.y + commentsButtonRect!.height / 2,
      );

      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 5000 })
        .toBe(true);

      await expect
        .poll(
          async () => {
            const position = await uiGrab.getCommentsDropdownPosition();
            return position?.top ?? -9999;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Accessibility Scaling", () => {
    test("should enlarge the comments dropdown when the toolbar is resized larger", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      const beforeMetrics = await uiGrab.getCommentsDropdownMetrics();
      expect(beforeMetrics).not.toBeNull();

      await uiGrab.dragToolbarResizeHandle(36, -24);

      await expect
        .poll(async () => {
          const metrics = await uiGrab.getCommentsDropdownMetrics();
          return metrics?.width ?? 0;
        })
        .toBeGreaterThan((beforeMetrics?.width ?? 0) + 8);

      await expect
        .poll(async () => {
          const metrics = await uiGrab.getCommentsDropdownMetrics();
          return metrics?.headerFontSize ?? 0;
        })
        .toBeGreaterThan((beforeMetrics?.headerFontSize ?? 0) + 0.5);

      await expect
        .poll(async () => {
          const metrics = await uiGrab.getCommentsDropdownMetrics();
          return metrics?.actionButtonHeight ?? 0;
        })
        .toBeGreaterThan((beforeMetrics?.actionButtonHeight ?? 0) + 1.5);
    });

    test("should reduce the comments dropdown baseline size when the toolbar scale is smaller", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      const defaultMetrics = await uiGrab.getCommentsDropdownMetrics();
      expect(defaultMetrics).not.toBeNull();

      await uiGrab.page.evaluate(() => {
        window.__UI_GRAB__?.setToolbarState({ scale: 0.9 });
      });

      await expect
        .poll(async () => {
          const metrics = await uiGrab.getCommentsDropdownMetrics();
          return metrics?.width ?? 0;
        })
        .toBeLessThan((defaultMetrics?.width ?? 0) - 8);

      await expect
        .poll(async () => {
          const metrics = await uiGrab.getCommentsDropdownMetrics();
          return metrics?.rowTitleFontSize ?? 0;
        })
        .toBeLessThan((defaultMetrics?.rowTitleFontSize ?? 0) - 0.5);
    });
  });

  test.describe("Persistence Across Copies", () => {
    test("should accumulate items across multiple copy operations", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, '[data-testid="card-title"]');
      await copyElement(uiGrab, '[data-testid="submit-button"]');

      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.itemCount).toBe(3);
    });

    test("should maintain comment items after activation cycle", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.activate();
      await uiGrab.deactivate();
      await uiGrab.page.waitForTimeout(200);

      await expect
        .poll(() => uiGrab.isCommentsButtonVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.clickCommentsButton();

      const dropdownInfo = await uiGrab.getCommentsDropdownInfo();
      expect(dropdownInfo.itemCount).toBe(1);
    });
  });

  test.describe("Dismiss Behavior", () => {
    test("should not dismiss when clicking outside the dropdown", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.page.mouse.click(10, 10);
      await uiGrab.page.waitForTimeout(200);

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });

    test("should dismiss when pressing Escape", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.pressEscape();
      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(false);
    });

    test("should dismiss when clicking the comments button to toggle off", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);

      await uiGrab.clickCommentsButton();

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(false);
    });
  });

  test.describe("Hover to Open", () => {
    test("should open dropdown when hovering the comments button", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(true);
    });

    test("should show all preview boxes when hovering the comments button", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.boxes.filter((box) =>
              box.id.startsWith("comment-all-hover-"),
            ).length;
          },
          { timeout: 2000 },
        )
        .toBe(2);
    });

    test("should pin dropdown open when clicking the comments button while hover-opened", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");

      await uiGrab.hoverCommentsButton();

      await expect
        .poll(() => uiGrab.isCommentsDropdownVisible(), { timeout: 2000 })
        .toBe(true);

      await uiGrab.page.evaluate((attrName) => {
        const host = document.querySelector(`[${attrName}]`);
        const shadowRoot = host?.shadowRoot;
        if (!shadowRoot) return;
        const root = shadowRoot.querySelector(`[${attrName}]`);
        if (!root) return;
        root
          .querySelector<HTMLButtonElement>("[data-ui-grab-toolbar-comments]")
          ?.click();
      }, "data-ui-grab");
      await uiGrab.page.waitForTimeout(300);

      await uiGrab.page.mouse.move(0, 0);
      await uiGrab.page.waitForTimeout(500);

      expect(await uiGrab.isCommentsDropdownVisible()).toBe(true);
    });
  });

  test.describe("Preview Suppression After Copy", () => {
    test("should clear hover preview boxes after entering edit mode via row click", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();

      await uiGrab.clickCommentItem(0);
      await uiGrab.page.waitForTimeout(300);

      const grabbedBoxes = await uiGrab.getGrabbedBoxInfo();
      const hoverBoxCount = grabbedBoxes.boxes.filter(
        (box) =>
          box.id.startsWith("comment-hover-") ||
          box.id.startsWith("comment-all-hover-"),
      ).length;
      expect(hoverBoxCount).toBe(0);
    });

    test("should clear all hover preview boxes after copy all", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.clickCommentsCopyAll();
      await uiGrab.page.waitForTimeout(300);

      const grabbedBoxes = await uiGrab.getGrabbedBoxInfo();
      const allHoverBoxes = grabbedBoxes.boxes.filter(
        (box) =>
          box.id.startsWith("comment-all-hover-") ||
          box.id.startsWith("comment-hover-"),
      );
      expect(allHoverBoxes.length).toBe(0);
    });

    test("should allow item hover after clicking a row", async ({ uiGrab }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.clickCommentItem(0);
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverCommentItem(1);

      await expect
        .poll(
          async () => {
            const info = await uiGrab.getGrabbedBoxInfo();
            return info.boxes.filter((box) =>
              box.id.startsWith("comment-hover-"),
            ).length;
          },
          { timeout: 2000 },
        )
        .toBeGreaterThan(0);
    });
  });

  test.describe("Selection Label Lifecycle on Copy", () => {
    test("should show selection label when hovering a comment item", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverCommentItem(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            ).length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThan(0);
    });

    test("should clear idle labels and show copied label after copy all", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await copyElement(uiGrab, "li:last-child");

      await uiGrab.clickCommentsButton();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverCopyAllButton();
      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            ).length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(2);

      await uiGrab.clickCommentsCopyAll();

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            const idlePreviewLabels = labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            );
            return idlePreviewLabels.length;
          },
          { timeout: 5000 },
        )
        .toBe(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter((label) => label.status === "copied").length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(1);
    });

    test("should clear idle labels and show copied label after individual copy", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverCommentItem(0);
      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            ).length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThan(0);

      await uiGrab.clickCommentItemCopy(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            const idlePreviewLabels = labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            );
            return idlePreviewLabels.length;
          },
          { timeout: 5000 },
        )
        .toBe(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter((label) => label.status === "copied").length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(1);
    });

    test("should clear idle labels without showing copied feedback after row click edit", async ({
      uiGrab,
    }) => {
      await copyElement(uiGrab, "li:first-child");
      await uiGrab.clickCommentsButton();
      await uiGrab.page.waitForTimeout(200);

      await uiGrab.hoverCommentItem(0);
      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            ).length;
          },
          { timeout: 5000 },
        )
        .toBeGreaterThan(0);

      await uiGrab.clickCommentItem(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            const idlePreviewLabels = labels.filter(
              (label) => label.status === "idle" && label.createdAt === 0,
            );
            return idlePreviewLabels.length;
          },
          { timeout: 5000 },
        )
        .toBe(0);

      await expect
        .poll(
          async () => {
            const labels = await uiGrab.getLabelInstancesInfo();
            return labels.filter((label) => label.status === "copied").length;
          },
          { timeout: 5000 },
        )
        .toBe(0);

      expect(await uiGrab.isPromptModeActive()).toBe(true);
    });
  });
});
