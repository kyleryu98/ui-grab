import {
  Show,
  For,
  onMount,
  onCleanup,
  createSignal,
  createMemo,
  createEffect,
  on,
} from "solid-js";
import type { Component } from "solid-js";
import type { CommentItem, DropdownAnchor } from "../types.js";
import {
  DROPDOWN_EDGE_TRANSFORM_ORIGIN,
  DROPDOWN_MAX_WIDTH_PX,
  DROPDOWN_MIN_WIDTH_PX,
  DROPDOWN_VIEWPORT_PADDING_PX,
  FEEDBACK_DURATION_MS,
  SAFE_POLYGON_BUFFER_PX,
  TOOLBAR_DEFAULT_SCALE,
  TOOLBAR_MAX_SCALE,
  TOOLBAR_MIN_SCALE,
  Z_INDEX_FLOATING_PANEL,
} from "../constants.js";
import { createSafePolygonTracker } from "../utils/safe-polygon.js";
import { cn } from "../utils/cn.js";
import { IconTrash } from "./icons/icon-trash.jsx";
import { IconCopy } from "./icons/icon-copy.jsx";
import { createMenuHighlight } from "../utils/create-menu-highlight.js";
import { suppressMenuEvent } from "../utils/suppress-menu-event.js";
import { createAnchoredDropdown } from "../utils/create-anchored-dropdown.js";
import { formatRelativeTime } from "../utils/format-relative-time.js";

interface CommentsDropdownProps {
  position: DropdownAnchor | null;
  items: CommentItem[];
  disconnectedItemIds?: Set<string>;
  activeItemId?: string | null;
  isPromptMode?: boolean;
  onActivateItem?: (item: CommentItem) => void;
  onEditItem?: (item: CommentItem) => void;
  onCopyItem?: (item: CommentItem) => void;
  onDeleteItem?: (item: CommentItem) => void;
  onItemHover?: (commentItemId: string | null) => void;
  onCopyAll?: () => void;
  onCopyAllHover?: (isHovered: boolean) => void;
  onClearAll?: () => void;
  onDismiss?: () => void;
  onDropdownHover?: (isHovered: boolean) => void;
}

const getCommentItemDisplayName = (item: CommentItem): string => {
  if (item.elementsCount && item.elementsCount > 1) {
    return `${item.elementsCount} elements`;
  }
  return item.componentName ?? item.tagName;
};

export const CommentsDropdown: Component<CommentsDropdownProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  const {
    containerRef: highlightContainerRef,
    highlightRef,
    updateHighlight,
    clearHighlight,
  } = createMenuHighlight();

  const safePolygonTracker = createSafePolygonTracker();

  const getToolbarTargetRects = () => {
    if (!containerRef) return null;
    const rootNode = containerRef.getRootNode() as Document | ShadowRoot;
    const toolbar = rootNode.querySelector<HTMLElement>(
      "[data-ui-grab-toolbar]",
    );
    if (!toolbar) return null;
    const rect = toolbar.getBoundingClientRect();
    return [
      {
        x: rect.x - SAFE_POLYGON_BUFFER_PX,
        y: rect.y - SAFE_POLYGON_BUFFER_PX,
        width: rect.width + SAFE_POLYGON_BUFFER_PX * 2,
        height: rect.height + SAFE_POLYGON_BUFFER_PX * 2,
      },
    ];
  };

  const dropdown = createAnchoredDropdown(
    () => containerRef,
    () => props.position,
  );

  const toPx = (value: number) => `${Math.round(value * 100) / 100}px`;

  const dropdownScale = () =>
    Math.max(
      TOOLBAR_MIN_SCALE,
      Math.min(
        TOOLBAR_MAX_SCALE,
        props.position?.toolbarScale ?? TOOLBAR_DEFAULT_SCALE,
      ),
    );

  const [isCopyAllConfirmed, setIsCopyAllConfirmed] = createSignal(false);

  let copyAllFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  const metrics = createMemo(() => {
    const scale = dropdownScale();
    return {
      scale,
      minWidth: DROPDOWN_MIN_WIDTH_PX * scale,
      maxWidth: DROPDOWN_MAX_WIDTH_PX * scale,
      panelRadius: 10 * scale,
      headerPaddingX: 8 * scale,
      headerPaddingTop: 6 * scale,
      headerPaddingBottom: 4 * scale,
      headerLabelFontSize: 11 * scale,
      headerActionHeight: 24 * scale,
      headerActionRadius: 8 * scale,
      headerActionPaddingX: 10 * scale,
      headerActionFontSize: 11 * scale,
      actionGap: 6 * scale,
      listPaddingX: 8 * scale,
      listPaddingY: 6 * scale,
      listMaxHeight: 240 * scale,
      rowGap: 12 * scale,
      rowRadius: 8 * scale,
      rowPaddingX: 8 * scale,
      rowPaddingY: 6 * scale,
      titleFontSize: 12 * scale,
      titleLineHeight: 16 * scale,
      commentFontSize: 11 * scale,
      commentLineHeight: 12 * scale,
      commentMarginTop: 2 * scale,
      timeFontSize: 10 * scale,
      metaGap: 4 * scale,
      itemActionHeight: 20 * scale,
      itemActionRadius: 7 * scale,
      itemActionPaddingX: 6 * scale,
      itemActionFontSize: 10 * scale,
      iconSize: 10 * scale,
    };
  });

  createEffect(
    on(
      () => dropdown.isAnimatedIn(),
      (animatedIn) => {
        if (animatedIn && containerRef?.matches(":hover")) {
          props.onDropdownHover?.(true);
        }
      },
      { defer: true },
    ),
  );

  const clampedMaxWidth = () =>
    Math.min(
      metrics().maxWidth,
      window.innerWidth -
        dropdown.displayPosition().left -
        DROPDOWN_VIEWPORT_PADDING_PX,
    );

  const clampedMaxHeight = () =>
    window.innerHeight -
    dropdown.displayPosition().top -
    DROPDOWN_VIEWPORT_PADDING_PX;

  const panelMinWidth = () =>
    Math.max(metrics().minWidth, props.position?.toolbarWidth ?? 0);

  const headerActionClass = (intent: "neutral" | "danger" = "neutral") =>
    cn(
      "contain-layout inline-flex h-6 items-center justify-center rounded-[8px] px-2.5 text-[11px] font-medium transition-all press-scale",
      intent === "danger"
        ? "bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
        : "border border-[#CFCFCF] bg-white text-black/72 hover:bg-[#F5F5F5]",
    );

  const itemActionClass = (intent: "neutral" | "danger" = "neutral") =>
    cn(
      "contain-layout inline-flex h-5 items-center gap-1 rounded-[7px] px-1.5 text-[10px] font-medium transition-all press-scale",
      intent === "danger"
        ? "bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
        : "bg-black/[0.045] text-black/62 hover:bg-black/[0.08]",
    );

  onMount(() => {
    dropdown.measure();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!props.position) return;
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        props.onDismiss?.();
        return;
      }

      if (props.isPromptMode) {
        return;
      }

      const target = event.target;
      const isInteractiveTarget =
        target instanceof HTMLElement &&
        Boolean(target.closest("button, input, textarea"));
      if (
        event.code === "Enter" &&
        !isInteractiveTarget &&
        props.activeItemId
      ) {
        const activeItem = props.items.find(
          (item) => item.id === props.activeItemId,
        );
        if (!activeItem) return;
        event.preventDefault();
        event.stopPropagation();
        props.onEditItem?.(activeItem);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    onCleanup(() => {
      clearTimeout(copyAllFeedbackTimeout);
      dropdown.clearAnimationHandles();
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      safePolygonTracker.stop();
    });
  });

  return (
    <Show when={dropdown.shouldMount()}>
      <div
        ref={containerRef}
        data-ui-grab-ignore-events
        data-ui-grab-comments-dropdown
        class="fixed font-sans text-[13px] antialiased filter-[drop-shadow(0px_1px_2px_#51515140)] select-none transition-[opacity,transform] duration-100 ease-out will-change-[opacity,transform]"
        style={{
          top: `${dropdown.displayPosition().top}px`,
          left: `${dropdown.displayPosition().left}px`,
          "z-index": `${Z_INDEX_FLOATING_PANEL}`,
          "font-size": toPx(13 * metrics().scale),
          "pointer-events": dropdown.isAnimatedIn() ? "auto" : "none",
          "transform-origin":
            DROPDOWN_EDGE_TRANSFORM_ORIGIN[dropdown.lastAnchorEdge()],
          opacity: dropdown.isAnimatedIn() ? "1" : "0",
          transform: dropdown.isAnimatedIn() ? "scale(1)" : "scale(0.95)",
        }}
        onPointerDown={suppressMenuEvent}
        onMouseDown={suppressMenuEvent}
        onClick={suppressMenuEvent}
        onContextMenu={suppressMenuEvent}
        onMouseEnter={() => {
          safePolygonTracker.stop();
          props.onDropdownHover?.(true);
        }}
        onMouseLeave={(event: MouseEvent) => {
          const targetRects = getToolbarTargetRects();
          if (targetRects) {
            safePolygonTracker.start(
              { x: event.clientX, y: event.clientY },
              targetRects,
              () => props.onDropdownHover?.(false),
            );
            return;
          }
          props.onDropdownHover?.(false);
        }}
      >
        <div
          class={cn(
            "contain-layout flex h-fit w-fit flex-col overflow-hidden rounded-[10px] antialiased [font-synthesis:none] [corner-shape:superellipse(1.25)]",
            "bg-white",
          )}
          style={{
            "border-radius": toPx(metrics().panelRadius),
            "min-width": `${panelMinWidth()}px`,
            "max-width": `${clampedMaxWidth()}px`,
            "max-height": `${clampedMaxHeight()}px`,
          }}
        >
          <div
            class="contain-layout shrink-0 flex items-center justify-between px-2 pt-1.5 pb-1"
            style={{
              "padding-left": toPx(metrics().headerPaddingX),
              "padding-right": toPx(metrics().headerPaddingX),
              "padding-top": toPx(metrics().headerPaddingTop),
              "padding-bottom": toPx(metrics().headerPaddingBottom),
            }}
          >
            <span
              class="text-[11px] font-medium text-black/40"
              style={{
                "font-size": toPx(metrics().headerLabelFontSize),
                "line-height": toPx(metrics().headerActionHeight),
              }}
            >
              Comments
            </span>
            <Show when={props.items.length > 0}>
              <div
                class="flex items-center gap-1.5"
                style={{ gap: toPx(metrics().actionGap) }}
              >
                <button
                  data-ui-grab-ignore-events
                  data-ui-grab-comments-copy-all
                  class={headerActionClass()}
                  style={{
                    height: toPx(metrics().headerActionHeight),
                    "border-radius": toPx(metrics().headerActionRadius),
                    "padding-left": toPx(metrics().headerActionPaddingX),
                    "padding-right": toPx(metrics().headerActionPaddingX),
                    "font-size": toPx(metrics().headerActionFontSize),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onCopyAll?.();
                    setIsCopyAllConfirmed(true);
                    clearTimeout(copyAllFeedbackTimeout);
                    copyAllFeedbackTimeout = setTimeout(() => {
                      setIsCopyAllConfirmed(false);
                    }, FEEDBACK_DURATION_MS);
                  }}
                  onMouseEnter={() => {
                    if (!isCopyAllConfirmed()) {
                      props.onCopyAllHover?.(true);
                    }
                  }}
                  onMouseLeave={() => props.onCopyAllHover?.(false)}
                >
                  {isCopyAllConfirmed() ? "Copied" : "All Copy"}
                </button>
                <button
                  data-ui-grab-ignore-events
                  data-ui-grab-comments-clear
                  class={headerActionClass("danger")}
                  style={{
                    height: toPx(metrics().headerActionHeight),
                    "border-radius": toPx(metrics().headerActionRadius),
                    "padding-left": toPx(metrics().headerActionPaddingX),
                    "padding-right": toPx(metrics().headerActionPaddingX),
                    "font-size": toPx(metrics().headerActionFontSize),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onClearAll?.();
                  }}
                >
                  Clear
                </button>
              </div>
            </Show>
          </div>

          <div
            class="min-h-0 border-t-[0.5px] border-t-[#D9D9D9] px-2 py-1.5"
            style={{
              "padding-left": toPx(metrics().listPaddingX),
              "padding-right": toPx(metrics().listPaddingX),
              "padding-top": toPx(metrics().listPaddingY),
              "padding-bottom": toPx(metrics().listPaddingY),
            }}
          >
            <div
              ref={highlightContainerRef}
              class="relative -mx-2 -my-1.5 flex max-h-[240px] flex-col overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(0,0,0,0.15)_transparent]"
              style={{
                "max-height": toPx(metrics().listMaxHeight),
                "margin-left": toPx(-metrics().listPaddingX),
                "margin-right": toPx(-metrics().listPaddingX),
                "margin-top": toPx(-metrics().listPaddingY),
                "margin-bottom": toPx(-metrics().listPaddingY),
              }}
            >
              <div
                ref={highlightRef}
                class="pointer-events-none absolute bg-black/5 opacity-0 transition-[top,left,width,height,opacity] duration-75 ease-out"
              />
              <For each={props.items}>
                {(item) => {
                  const isDisconnected = () =>
                    Boolean(props.disconnectedItemIds?.has(item.id));
                  const isActive = () => props.activeItemId === item.id;

                  return (
                    <div
                      data-ui-grab-ignore-events
                      data-ui-grab-comment-item
                      class="group relative z-1 contain-layout flex w-full cursor-pointer items-start justify-between gap-3 rounded-[8px] px-2 py-1.5 text-left transition-colors"
                      style={{
                        gap: toPx(metrics().rowGap),
                        "border-radius": toPx(metrics().rowRadius),
                        "padding-left": toPx(metrics().rowPaddingX),
                        "padding-right": toPx(metrics().rowPaddingX),
                        "padding-top": toPx(metrics().rowPaddingY),
                        "padding-bottom": toPx(metrics().rowPaddingY),
                      }}
                      classList={{
                        "opacity-45 hover:opacity-100": isDisconnected(),
                        "bg-black/[0.045]": isActive(),
                      }}
                      tabindex="0"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        event.currentTarget.focus({ preventScroll: true });
                        props.onActivateItem?.(item);
                        props.onEditItem?.(item);
                      }}
                      onKeyDown={(event) => {
                        if (
                          (event.code === "Enter" || event.code === "Space") &&
                          event.currentTarget === event.target
                        ) {
                          event.preventDefault();
                          event.stopPropagation();
                          props.onEditItem?.(item);
                          return;
                        }
                      }}
                      onMouseEnter={(event) => {
                        if (!isDisconnected()) {
                          props.onItemHover?.(item.id);
                        }
                        updateHighlight(event.currentTarget);
                      }}
                      onMouseLeave={() => {
                        props.onItemHover?.(null);
                        clearHighlight();
                      }}
                      onFocus={(event) => {
                        props.onActivateItem?.(item);
                        updateHighlight(event.currentTarget);
                      }}
                      onBlur={clearHighlight}
                    >
                      <span class="flex min-w-0 flex-1 flex-col">
                        <span
                          class="truncate text-[12px] font-medium leading-4 text-black"
                          style={{
                            "font-size": toPx(metrics().titleFontSize),
                            "line-height": toPx(metrics().titleLineHeight),
                          }}
                        >
                          {getCommentItemDisplayName(item)}
                        </span>
                        <Show when={item.commentText}>
                          <span
                            class="mt-0.5 truncate text-[11px] leading-3 text-black/40"
                            style={{
                              "margin-top": toPx(metrics().commentMarginTop),
                              "font-size": toPx(metrics().commentFontSize),
                              "line-height": toPx(metrics().commentLineHeight),
                            }}
                          >
                            {item.commentText}
                          </span>
                        </Show>
                      </span>
                      <span
                        class="flex shrink-0 flex-col items-end gap-1"
                        style={{ gap: toPx(metrics().metaGap) }}
                      >
                        <span
                          class="flex items-center justify-end text-[10px] text-black/25"
                          style={{ "font-size": toPx(metrics().timeFontSize) }}
                        >
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        <span
                          class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                          style={{ gap: toPx(metrics().metaGap) }}
                        >
                          <button
                            data-ui-grab-ignore-events
                            data-ui-grab-comment-copy
                            class={itemActionClass()}
                            style={{
                              height: toPx(metrics().itemActionHeight),
                              "border-radius": toPx(metrics().itemActionRadius),
                              "padding-left": toPx(
                                metrics().itemActionPaddingX,
                              ),
                              "padding-right": toPx(
                                metrics().itemActionPaddingX,
                              ),
                              "font-size": toPx(metrics().itemActionFontSize),
                              gap: toPx(metrics().metaGap),
                            }}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              props.onActivateItem?.(item);
                              props.onCopyItem?.(item);
                            }}
                          >
                            <IconCopy
                              size={metrics().iconSize}
                              class="text-current"
                            />
                            <span>Copy</span>
                          </button>
                          <button
                            data-ui-grab-ignore-events
                            data-ui-grab-comment-delete
                            class={itemActionClass("danger")}
                            style={{
                              height: toPx(metrics().itemActionHeight),
                              "border-radius": toPx(metrics().itemActionRadius),
                              "padding-left": toPx(
                                metrics().itemActionPaddingX,
                              ),
                              "padding-right": toPx(
                                metrics().itemActionPaddingX,
                              ),
                              "font-size": toPx(metrics().itemActionFontSize),
                              gap: toPx(metrics().metaGap),
                            }}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              props.onDeleteItem?.(item);
                            }}
                          >
                            <IconTrash
                              size={metrics().iconSize}
                              class="text-current"
                            />
                            <span>Delete</span>
                          </button>
                        </span>
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
