import {
  createMemo,
  createSignal,
  createEffect,
  on,
  onMount,
  onCleanup,
  Show,
} from "solid-js";
import type { Component } from "solid-js";
import type { Position } from "../../types.js";
import { cn } from "../../utils/cn.js";
import { formatShortcut } from "../../utils/format-shortcut.js";
import {
  loadToolbarState,
  resolveToolbarScale,
  saveToolbarState,
  type SnapEdge,
  type ToolbarState,
} from "./state.js";
import { IconSelect } from "../icons/icon-select.jsx";
import { IconComment } from "../icons/icon-comment.jsx";
import { IconResizeAxis } from "../icons/icon-resize-axis.jsx";
import {
  createSafePolygonTracker,
  type TargetRect,
} from "../../utils/safe-polygon.js";
import {
  TOOLBAR_SNAP_MARGIN_PX,
  TOOLBAR_FADE_IN_DELAY_MS,
  TOOLBAR_COLLAPSED_SHORT_PX,
  TOOLBAR_COLLAPSED_LONG_PX,
  TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS,
  TOGGLE_ANIMATION_BUFFER_MS,
  TOOLBAR_DEFAULT_SCALE,
  TOOLBAR_DEFAULT_WIDTH_PX,
  TOOLBAR_DEFAULT_HEIGHT_PX,
  TOOLBAR_MIN_SCALE,
  TOOLBAR_MAX_SCALE,
  TOOLBAR_DEFAULT_POSITION_RATIO,
  TOOLBAR_SHAKE_TOOLTIP_DURATION_MS,
  TOOLTIP_BASE_CLASS,
  FEEDBACK_DURATION_MS,
  HINT_FLIP_IN_ANIMATION,
  SAFE_POLYGON_BUFFER_PX,
  SELECTION_HINT_COUNT,
  SELECTION_HINT_CYCLE_INTERVAL_MS,
  Z_INDEX_OVERLAY,
} from "../../constants.js";
import { freezeUpdates } from "../../utils/freeze-updates.js";
import {
  freezeGlobalAnimations,
  unfreezeGlobalAnimations,
} from "../../utils/freeze-animations.js";
import {
  freezePseudoStates,
  unfreezePseudoStates,
} from "../../utils/freeze-pseudo-states.js";
import { Tooltip } from "../tooltip.jsx";
import { Kbd } from "../kbd.jsx";
import { getHitboxConstraintClass } from "../../utils/toolbar-layout.js";
import { ToolbarContent } from "./toolbar-content.js";
import {
  nativeCancelAnimationFrame,
  nativeRequestAnimationFrame,
} from "../../utils/native-raf.js";
import { getVisualViewport } from "../../utils/get-visual-viewport.js";
import {
  calculateExpandedPositionFromCollapsed,
  clampToRange,
  getCollapsedPosition,
  getPositionFromEdgeAndRatio,
  getRatioFromPosition,
} from "../../utils/toolbar-position.js";
import { createToolbarDrag } from "../../utils/create-toolbar-drag.js";

interface ToolbarProps {
  isActive?: boolean;
  isContextMenuOpen?: boolean;
  onToggle?: () => void;
  enabled?: boolean;
  onToggleEnabled?: () => void;
  shakeCount?: number;
  onStateChange?: (state: ToolbarState) => void;
  onSubscribeToStateChanges?: (
    callback: (state: ToolbarState) => void,
  ) => () => void;
  onSelectHoverChange?: (isHovered: boolean) => void;
  onContainerRef?: (element: HTMLDivElement) => void;
  commentItemCount?: number;
  clockFlashTrigger?: number;
  onToggleComments?: () => void;
  onCommentsButtonHover?: (isHovered: boolean) => void;
  isCommentsDropdownOpen?: boolean;
  isClearPromptOpen?: boolean;
  isCommentsPinned?: boolean;
  onToggleToolbarMenu?: () => void;
  isToolbarMenuOpen?: boolean;
}

interface FreezeHandlersOptions {
  shouldFreezeInteractions?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
  safePolygonTargets?: () => TargetRect[] | null;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let scaledContentRef: HTMLDivElement | undefined;
  let expandableButtonsRef: HTMLDivElement | undefined;
  let toolbarSizeObserver: ResizeObserver | undefined;
  let unfreezeUpdatesCallback: (() => void) | null = null;
  let lastKnownExpandableWidth = 0;
  let lastKnownExpandableHeight = 0;
  let initialLayoutSyncRafId: number | undefined;
  let hasSyncedInitialLayout = false;

  const safePolygonTracker = createSafePolygonTracker();

  const getElementRect = (selector: string): TargetRect | null => {
    if (!containerRef) return null;
    const rootNode = containerRef.getRootNode() as Document | ShadowRoot;
    const element = rootNode.querySelector<HTMLElement>(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x - SAFE_POLYGON_BUFFER_PX,
      y: rect.y - SAFE_POLYGON_BUFFER_PX,
      width: rect.width + SAFE_POLYGON_BUFFER_PX * 2,
      height: rect.height + SAFE_POLYGON_BUFFER_PX * 2,
    };
  };

  const getSafePolygonTargets = (
    ...selectors: string[]
  ): TargetRect[] | null => {
    const rects: TargetRect[] = [];
    for (const selector of selectors) {
      const rect = getElementRect(selector);
      if (rect) rects.push(rect);
    }
    return rects.length > 0 ? rects : null;
  };

  const savedState = loadToolbarState();
  const clampToolbarScale = (value: number) =>
    clampToRange(value, TOOLBAR_MIN_SCALE, TOOLBAR_MAX_SCALE);

  const [isVisible, setIsVisible] = createSignal(false);
  const [isCollapsed, setIsCollapsed] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [isToolbarHovered, setIsToolbarHovered] = createSignal(false);
  const [isResizeHandleHovered, setIsResizeHandleHovered] = createSignal(false);
  const [isResizeTooltipVisible, setIsResizeTooltipVisible] =
    createSignal(false);
  const [supportsHover, setSupportsHover] = createSignal(true);
  const [snapEdge, setSnapEdge] = createSignal<SnapEdge>(
    savedState?.edge ?? "bottom",
  );
  const isVertical = () => snapEdge() === "left" || snapEdge() === "right";
  const [positionRatio, setPositionRatio] = createSignal(
    savedState?.ratio ?? TOOLBAR_DEFAULT_POSITION_RATIO,
  );
  const [toolbarScale, setToolbarScale] = createSignal(
    clampToolbarScale(
      savedState
        ? resolveToolbarScale(savedState, savedState.edge)
        : TOOLBAR_DEFAULT_SCALE,
    ),
  );
  const [baseToolbarDimensions, setBaseToolbarDimensions] = createSignal({
    width: TOOLBAR_DEFAULT_WIDTH_PX,
    height: TOOLBAR_DEFAULT_HEIGHT_PX,
  });
  const scaledToolbarDimensions = createMemo(() => {
    const { width, height } = baseToolbarDimensions();
    const scale = toolbarScale();
    return {
      width: width * scale,
      height: height * scale,
    };
  });
  const scaledToolbarOffset = createMemo(() => {
    const { width, height } = baseToolbarDimensions();
    const scale = toolbarScale();
    const widthDelta = (scale - 1) * width;
    const heightDelta = (scale - 1) * height;

    switch (snapEdge()) {
      case "top":
        return { left: widthDelta / 2, top: 0 };
      case "bottom":
        return { left: widthDelta / 2, top: heightDelta };
      case "left":
        return { left: 0, top: heightDelta / 2 };
      case "right":
        return { left: widthDelta, top: heightDelta / 2 };
    }
  });
  const resizeHandleMetrics = createMemo(() => {
    const scale = toolbarScale();
    const primarySize = Math.round(clampToRange(40 * scale, 34, 56));
    const secondarySize = Math.round(clampToRange(26 * scale, 22, 36));
    const gap = Math.round(clampToRange(10 * scale, 8, 16));
    const bridgePadding = Math.round(clampToRange(10 * scale, 8, 16));
    const width = isVertical() ? secondarySize : primarySize;
    const height = isVertical() ? primarySize : secondarySize;
    return {
      width,
      height,
      icon: Math.round(clampToRange(13 * scale, 11, 19)),
      gap,
      bridgePadding,
      radius: Math.round(Math.min(width, height) / 2),
      innerRadius: Math.max(9, Math.round(Math.min(width, height) / 2) - 2),
      tooltipScale: clampToRange(scale, 1, 1.16),
    };
  });
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = createSignal(false);
  const [isCollapseAnimating, setIsCollapseAnimating] = createSignal(false);
  const [isSelectTooltipVisible, setIsSelectTooltipVisible] =
    createSignal(false);
  const [isToggleTooltipVisible, setIsToggleTooltipVisible] =
    createSignal(false);
  const [isShakeTooltipVisible, setIsShakeTooltipVisible] = createSignal(false);
  const [isToggleAnimating, setIsToggleAnimating] = createSignal(false);
  const [isRapidRetoggle, setIsRapidRetoggle] = createSignal(false);
  const [isCommentsTooltipVisible, setIsCommentsTooltipVisible] =
    createSignal(false);
  let clockFlashRef: HTMLSpanElement | undefined;
  const [selectionHintIndex, setSelectionHintIndex] = createSignal(0);
  const [hasHintCycled, setHasHintCycled] = createSignal(false);
  const drag = createToolbarDrag({
    getContainerRef: () => containerRef,
    isCollapsed,
    getExpandedDimensions: () => expandedDimensions,
    onDragStart: () => {
      if (unfreezeUpdatesCallback) {
        unfreezeUpdatesCallback();
        unfreezeUpdatesCallback = null;
        unfreezeGlobalAnimations();
        unfreezePseudoStates();
      }
    },
    onPositionUpdate: (newPosition) => setPosition(newPosition),
    onSnapEdgeChange: (edge, ratio) => {
      setSnapEdge(edge);
      setPositionRatio(ratio);
    },
    onSnapComplete: (result) => {
      expandedDimensions = result.expandedDimensions;
      setPosition(result.position);
      saveAndNotify({
        edge: result.edge,
        ratio: result.ratio,
        collapsed: isCollapsed(),
        enabled: props.enabled ?? true,
      });
    },
    onSnapAnimationEnd: () => {
      if (props.enabled) {
        measureExpandableDimension();
      }
    },
  });

  const hasLearnedSelectionHints = () => (props.clockFlashTrigger ?? 0) > 0;

  createEffect(
    on(
      () => [props.isActive, hasLearnedSelectionHints()] as const,
      ([isActive, hasLearned]) => {
        setSelectionHintIndex(0);
        setHasHintCycled(false);
        if (!isActive || hasLearned) return;
        const intervalId = setInterval(() => {
          if (!hasHintCycled()) setHasHintCycled(true);
          setSelectionHintIndex(
            (previousIndex) => (previousIndex + 1) % SELECTION_HINT_COUNT,
          );
        }, SELECTION_HINT_CYCLE_INTERVAL_MS);
        onCleanup(() => clearInterval(intervalId));
      },
      { defer: true },
    ),
  );

  const commentsTooltipLabel = () => {
    const count = props.commentItemCount ?? 0;
    return count > 0 ? `Comments (${count})` : "Comments";
  };

  const actionButtonClass = () =>
    cn(
      "contain-layout flex items-center justify-center cursor-pointer interactive-scale touch-hitbox rounded-[11px] border border-white/45 bg-white/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] backdrop-blur-[12px] transition-[background-color,border-color,box-shadow,color] duration-150 hover:bg-white/36",
      isVertical() ? "h-7 w-7 mb-1.5" : "h-7 w-7 mr-1.5",
      hitboxConstraintClass(),
    );

  const toggleButtonClass = () =>
    cn(
      "contain-layout flex items-center justify-center cursor-pointer interactive-scale outline-none rounded-[999px] border border-white/50 bg-white/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[12px] transition-colors duration-150 hover:bg-white/34",
      isVertical() ? "my-0.5 h-10 w-7" : "mx-0.5 h-7 w-10",
    );

  const commentsIconClass = () =>
    cn(
      "transition-colors",
      props.isCommentsPinned ? "text-black/48" : "text-black/42",
    );

  const measureToolbarBaseDimensions = () => {
    if (!scaledContentRef) return null;
    const width = scaledContentRef.offsetWidth;
    const height = scaledContentRef.offsetHeight;
    if (width <= 0 || height <= 0) return null;
    setBaseToolbarDimensions((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
    return { width, height };
  };

  const measureExpandableDimension = () => {
    if (!expandableButtonsRef) return;
    const rect = expandableButtonsRef.getBoundingClientRect();
    if (isVertical()) {
      lastKnownExpandableHeight = rect.height;
    } else {
      lastKnownExpandableWidth = rect.width;
    }
  };

  const measureForcedExpandedDimension = (isVerticalEdge: boolean) => {
    if (!expandableButtonsRef) return 0;

    const hasCommentItems = (props.commentItemCount ?? 0) > 0;
    const expandedWrappers = Array.from(expandableButtonsRef.children).filter(
      (child): child is HTMLElement => {
        if (!(child instanceof HTMLElement)) return false;
        if (child.querySelector("[data-ui-grab-toolbar-comments]")) {
          return hasCommentItems;
        }
        return true;
      },
    );
    const gridProperty = isVerticalEdge
      ? "gridTemplateRows"
      : "gridTemplateColumns";

    for (const wrapper of expandedWrappers) {
      wrapper.style.transition = "none";
      wrapper.style[gridProperty] = "1fr";
    }

    void expandableButtonsRef.offsetWidth;
    const rect = expandableButtonsRef.getBoundingClientRect();
    const dimension = isVerticalEdge ? rect.height : rect.width;

    for (const wrapper of expandedWrappers) {
      wrapper.style[gridProperty] = "";
    }
    void expandableButtonsRef.offsetWidth;
    for (const wrapper of expandedWrappers) {
      wrapper.style.transition = "";
    }

    if (isVerticalEdge) {
      lastKnownExpandableHeight = dimension;
    } else {
      lastKnownExpandableWidth = dimension;
    }

    return dimension;
  };

  const isTooltipAllowed = () =>
    !isCollapsed() &&
    !props.isCommentsDropdownOpen &&
    !props.isToolbarMenuOpen &&
    !props.isClearPromptOpen;

  const tooltipPosition = (): "top" | "bottom" | "left" | "right" => {
    const edge = snapEdge();
    switch (edge) {
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      case "left":
        return "right";
      case "right":
        return "left";
    }
  };

  const hitboxConstraintClass = () => getHitboxConstraintClass(isVertical());
  const resizeCursorClass = () => {
    const edge = snapEdge();
    return edge === "bottom" || edge === "top"
      ? "cursor-ns-resize"
      : "cursor-ew-resize";
  };
  const resizeHandleHitboxStyle = () => {
    const { width, height, gap, bridgePadding } = resizeHandleMetrics();

    if (isVertical()) {
      const hitboxWidth = width + gap;
      const hitboxHeight = height + bridgePadding * 2;

      switch (snapEdge()) {
        case "left":
          return {
            top: "50%",
            right: `-${width + gap}px`,
            width: `${hitboxWidth}px`,
            height: `${hitboxHeight}px`,
            transform: "translateY(-50%)",
          };
        case "right":
        default:
          return {
            top: "50%",
            left: `-${width + gap}px`,
            width: `${hitboxWidth}px`,
            height: `${hitboxHeight}px`,
            transform: "translateY(-50%)",
          };
      }
    }

    const hitboxWidth = width + bridgePadding * 2;
    const hitboxHeight = height + gap;

    switch (snapEdge()) {
      case "top":
        return {
          left: "50%",
          bottom: `-${height + gap}px`,
          width: `${hitboxWidth}px`,
          height: `${hitboxHeight}px`,
          transform: "translateX(-50%)",
        };
      case "bottom":
      default:
        return {
          left: "50%",
          top: `-${height + gap}px`,
          width: `${hitboxWidth}px`,
          height: `${hitboxHeight}px`,
          transform: "translateX(-50%)",
        };
    }
  };
  const resizeHandleButtonStyle = () => {
    const { width, height } = resizeHandleMetrics();

    if (isVertical()) {
      switch (snapEdge()) {
        case "left":
          return {
            top: "50%",
            right: "0",
            width: `${width}px`,
            height: `${height}px`,
            transform: "translateY(-50%)",
          };
        case "right":
        default:
          return {
            top: "50%",
            left: "0",
            width: `${width}px`,
            height: `${height}px`,
            transform: "translateY(-50%)",
          };
      }
    }

    switch (snapEdge()) {
      case "top":
        return {
          left: "50%",
          bottom: "0",
          width: `${width}px`,
          height: `${height}px`,
          transform: "translateX(-50%)",
        };
      case "bottom":
      default:
        return {
          left: "50%",
          top: "0",
          width: `${width}px`,
          height: `${height}px`,
          transform: "translateX(-50%)",
        };
    }
  };
  const resizeHandleTooltipPointClass = (): string => {
    switch (snapEdge()) {
      case "top":
        return "pointer-events-none absolute bottom-0 left-1/2";
      case "left":
        return "pointer-events-none absolute right-0 top-1/2";
      case "right":
        return "pointer-events-none absolute left-0 top-1/2";
      case "bottom":
      default:
        return "pointer-events-none absolute left-1/2 top-0";
    }
  };
  const resizeHandleTooltipBubblePositionClass = (): string => {
    const side = tooltipPosition();
    if (side === "left" || side === "right") {
      return cn(
        "absolute top-1/2 -translate-y-1/2",
        side === "left" ? "right-full mr-2.5" : "left-full ml-2.5",
      );
    }
    return cn(
      "absolute left-1/2 -translate-x-1/2",
      side === "top" ? "bottom-full mb-2.5" : "top-full mt-2.5",
    );
  };
  const resizeHandleIconClass = () =>
    cn(
      "pointer-events-none relative z-10 transition-transform duration-200 ease-out",
      isVertical() && "rotate-90",
    );
  const resizeTooltipBubbleClass = TOOLTIP_BASE_CLASS.replace("absolute ", "");
  const isResizeHandleVisible = () =>
    !supportsHover() ||
    isToolbarHovered() ||
    isResizeHandleHovered() ||
    isResizing();

  const shakeTooltipPositionClass = (): string => {
    const tooltipSide = tooltipPosition();
    if (isVertical()) {
      const placementClass =
        tooltipSide === "left" ? "right-full mr-0.5" : "left-full ml-0.5";
      return `top-1/2 -translate-y-1/2 ${placementClass}`;
    }
    const placementClass =
      tooltipSide === "top" ? "bottom-full mb-0.5" : "top-full mt-0.5";
    return `left-1/2 -translate-x-1/2 ${placementClass}`;
  };

  const guidanceTooltipTransformOrigin = (): string => {
    const tooltipSide = tooltipPosition();
    switch (tooltipSide) {
      case "top":
        return "center bottom";
      case "bottom":
        return "center top";
      case "left":
        return "right center";
      case "right":
      default:
        return "left center";
    }
  };

  const stopEventPropagation = (event: Event) => {
    event.stopImmediatePropagation();
  };

  const createFreezeHandlers = (
    setTooltipVisible: (visible: boolean) => void,
    options?: FreezeHandlersOptions,
  ) => ({
    onMouseEnter: () => {
      if (drag.isDragging()) return;
      safePolygonTracker.stop();
      setTooltipVisible(true);
      if (
        options?.shouldFreezeInteractions !== false &&
        !unfreezeUpdatesCallback
      ) {
        unfreezeUpdatesCallback = freezeUpdates();
        freezeGlobalAnimations();
        freezePseudoStates();
      }
      options?.onHoverChange?.(true);
    },
    onMouseLeave: (event: MouseEvent) => {
      setTooltipVisible(false);
      if (
        options?.shouldFreezeInteractions !== false &&
        !props.isActive &&
        !props.isContextMenuOpen
      ) {
        unfreezeUpdatesCallback?.();
        unfreezeUpdatesCallback = null;
        unfreezeGlobalAnimations();
        unfreezePseudoStates();
      }

      const targetRects = options?.safePolygonTargets?.();
      if (targetRects) {
        safePolygonTracker.start(
          { x: event.clientX, y: event.clientY },
          targetRects,
          () => options?.onHoverChange?.(false),
        );
        return;
      }

      options?.onHoverChange?.(false);
    },
  });

  let shakeTooltipTimeout: ReturnType<typeof setTimeout> | undefined;
  const clearShakeTooltipTimeout = () => {
    if (shakeTooltipTimeout !== undefined) {
      clearTimeout(shakeTooltipTimeout);
      shakeTooltipTimeout = undefined;
    }
  };

  createEffect(
    on(
      () => props.shakeCount,
      (count) => {
        if (count && !props.enabled) {
          setIsShaking(true);
          setIsShakeTooltipVisible(true);

          clearShakeTooltipTimeout();
          shakeTooltipTimeout = setTimeout(() => {
            setIsShakeTooltipVisible(false);
          }, TOOLBAR_SHAKE_TOOLTIP_DURATION_MS);
          onCleanup(() => {
            clearShakeTooltipTimeout();
          });
        }
      },
    ),
  );

  createEffect(
    on(
      () => props.enabled,
      (enabled) => {
        if (enabled && isShakeTooltipVisible()) {
          setIsShakeTooltipVisible(false);
          clearShakeTooltipTimeout();
        }
      },
    ),
  );

  createEffect(
    on(
      () => [props.isActive, props.isContextMenuOpen] as const,
      ([isActive, isContextMenuOpen]) => {
        if (!isActive && !isContextMenuOpen && unfreezeUpdatesCallback) {
          unfreezeUpdatesCallback();
          unfreezeUpdatesCallback = null;
        }
      },
    ),
  );

  const reclampToolbarToViewport = (animatePosition = true) => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    expandedDimensions = { width: rect.width, height: rect.height };

    const currentPos = position();
    const viewport = getVisualViewport();
    const edge = snapEdge();
    let clampedX = currentPos.x;
    let clampedY = currentPos.y;

    if (edge === "top" || edge === "bottom") {
      const minX = viewport.offsetLeft + TOOLBAR_SNAP_MARGIN_PX;
      const maxX = Math.max(
        minX,
        viewport.offsetLeft +
          viewport.width -
          rect.width -
          TOOLBAR_SNAP_MARGIN_PX,
      );
      clampedX = clampToRange(currentPos.x, minX, maxX);
      clampedY =
        edge === "top"
          ? viewport.offsetTop + TOOLBAR_SNAP_MARGIN_PX
          : viewport.offsetTop +
            viewport.height -
            rect.height -
            TOOLBAR_SNAP_MARGIN_PX;
    } else {
      const minY = viewport.offsetTop + TOOLBAR_SNAP_MARGIN_PX;
      const maxY = Math.max(
        minY,
        viewport.offsetTop +
          viewport.height -
          rect.height -
          TOOLBAR_SNAP_MARGIN_PX,
      );
      clampedY = clampToRange(currentPos.y, minY, maxY);
      clampedX =
        edge === "left"
          ? viewport.offsetLeft + TOOLBAR_SNAP_MARGIN_PX
          : viewport.offsetLeft +
            viewport.width -
            rect.width -
            TOOLBAR_SNAP_MARGIN_PX;
    }

    const newRatio = getRatioFromPosition(
      edge,
      clampedX,
      clampedY,
      rect.width,
      rect.height,
    );
    setPositionRatio(newRatio);

    const didPositionChange =
      clampedX !== currentPos.x || clampedY !== currentPos.y;
    if (didPositionChange) {
      if (!animatePosition) {
        setPosition({ x: clampedX, y: clampedY });
        return;
      }
      setIsCollapseAnimating(true);
      nativeRequestAnimationFrame(() => {
        nativeRequestAnimationFrame(() => {
          setPosition({ x: clampedX, y: clampedY });
          if (collapseAnimationTimeout) {
            clearTimeout(collapseAnimationTimeout);
          }
          collapseAnimationTimeout = setTimeout(() => {
            setIsCollapseAnimating(false);
          }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
        });
      });
    }
  };

  createEffect(
    on(
      () => props.clockFlashTrigger ?? 0,
      () => {
        if (props.isCommentsDropdownOpen) return;
        if (clockFlashRef) {
          clockFlashRef.classList.remove("animate-clock-flash");
          // HACK: force reflow between class removal/addition to restart the CSS animation
          void clockFlashRef.offsetHeight;
          clockFlashRef.classList.add("animate-clock-flash");
        }
        setIsCommentsTooltipVisible(true);
        const timerId = setTimeout(() => {
          clockFlashRef?.classList.remove("animate-clock-flash");
          setIsCommentsTooltipVisible(false);
        }, FEEDBACK_DURATION_MS);
        onCleanup(() => {
          clearTimeout(timerId);
          setIsCommentsTooltipVisible(false);
        });
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.commentItemCount ?? 0,
      () => {
        if (isCollapsed()) return;
        // HACK: Wait for grid-cols CSS transition to complete, then re-measure and clamp to viewport
        if (commentItemCountTimeout) {
          clearTimeout(commentItemCountTimeout);
        }
        commentItemCountTimeout = setTimeout(() => {
          measureExpandableDimension();
          reclampToolbarToViewport();
        }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
        onCleanup(() => {
          if (commentItemCountTimeout) {
            clearTimeout(commentItemCountTimeout);
          }
        });
      },
      { defer: true },
    ),
  );

  let expandedDimensions = {
    width: TOOLBAR_DEFAULT_WIDTH_PX,
    height: TOOLBAR_DEFAULT_HEIGHT_PX,
  };
  const [collapsedDimensions, setCollapsedDimensions] = createSignal({
    width: TOOLBAR_COLLAPSED_SHORT_PX,
    height: TOOLBAR_COLLAPSED_SHORT_PX,
  });

  const buildPersistedToolbarState = (
    overrides: Partial<ToolbarState> = {},
  ): ToolbarState => {
    const currentState = loadToolbarState();
    const edge = overrides.edge ?? currentState?.edge ?? snapEdge();
    const scale = clampToolbarScale(
      resolveToolbarScale(
        {
          ...currentState,
          ...overrides,
          edge,
          scale: overrides.scale ?? currentState?.scale ?? toolbarScale(),
        },
        edge,
      ),
    );
    return {
      edge,
      ratio: overrides.ratio ?? currentState?.ratio ?? positionRatio(),
      collapsed:
        overrides.collapsed ?? currentState?.collapsed ?? isCollapsed(),
      enabled:
        overrides.enabled ?? currentState?.enabled ?? props.enabled ?? true,
      scale,
      width: undefined,
      height: undefined,
      size: undefined,
      defaultAction: overrides.defaultAction ?? currentState?.defaultAction,
    };
  };

  const getExpandedFromCollapsed = (
    collapsedPosition: Position,
    edge: SnapEdge,
  ): { position: Position; ratio: number } => {
    const actualRect = containerRef?.getBoundingClientRect();
    const actualCollapsedWidth =
      actualRect?.width ?? TOOLBAR_COLLAPSED_SHORT_PX;
    const actualCollapsedHeight =
      actualRect?.height ?? TOOLBAR_COLLAPSED_SHORT_PX;
    return calculateExpandedPositionFromCollapsed(
      collapsedPosition,
      edge,
      expandedDimensions,
      actualCollapsedWidth,
      actualCollapsedHeight,
    );
  };

  const recalculatePosition = () => {
    const newPosition = getPositionFromEdgeAndRatio(
      snapEdge(),
      positionRatio(),
      expandedDimensions.width,
      expandedDimensions.height,
    );
    setPosition(newPosition);
  };

  const scheduleInitialLayoutSync = () => {
    if (hasSyncedInitialLayout || isCollapsed() || !containerRef) return;
    if (initialLayoutSyncRafId !== undefined) return;

    initialLayoutSyncRafId = nativeRequestAnimationFrame(() => {
      initialLayoutSyncRafId = undefined;
      nativeRequestAnimationFrame(() => {
        if (hasSyncedInitialLayout || isCollapsed() || !containerRef) return;
        const rect = containerRef.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        expandedDimensions = { width: rect.width, height: rect.height };
        setPosition(
          getPositionFromEdgeAndRatio(
            snapEdge(),
            positionRatio(),
            rect.width,
            rect.height,
          ),
        );
        hasSyncedInitialLayout = true;
      });
    });
  };

  const handleToggle = drag.createDragAwareHandler(() => props.onToggle?.());

  const handleComments = drag.createDragAwareHandler(() =>
    props.onToggleComments?.(),
  );

  const handleToggleCollapse = drag.createDragAwareHandler(() => {
    const rect = containerRef?.getBoundingClientRect();
    const wasCollapsed = isCollapsed();
    let newRatio = positionRatio();

    if (wasCollapsed) {
      const { position: newPos, ratio } = getExpandedFromCollapsed(
        currentPosition(),
        snapEdge(),
      );
      newRatio = ratio;
      setPosition(newPos);
      setPositionRatio(newRatio);
    } else if (rect) {
      expandedDimensions = { width: rect.width, height: rect.height };
    }

    setIsCollapseAnimating(true);
    setIsCollapsed((prev) => !prev);

    saveAndNotify({
      edge: snapEdge(),
      ratio: newRatio,
      collapsed: !wasCollapsed,
      enabled: props.enabled ?? true,
    });

    if (collapseAnimationTimeout) {
      clearTimeout(collapseAnimationTimeout);
    }
    collapseAnimationTimeout = setTimeout(() => {
      setIsCollapseAnimating(false);
      if (isCollapsed()) {
        const collapsedRect = containerRef?.getBoundingClientRect();
        if (collapsedRect) {
          setCollapsedDimensions({
            width: collapsedRect.width,
            height: collapsedRect.height,
          });
        }
      }
    }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
  });

  const handleToggleEnabled = drag.createDragAwareHandler(() => {
    const isCurrentlyEnabled = Boolean(props.enabled);
    const edge = snapEdge();
    const preTogglePosition = position();
    const isVerticalEdge = edge === "left" || edge === "right";
    const getToggleCenterOffset = () => {
      if (!containerRef) return null;
      const toggleButton = containerRef.querySelector<HTMLElement>(
        "[data-ui-grab-toolbar-enabled]",
      );
      if (!toggleButton) return null;
      const containerRect = containerRef.getBoundingClientRect();
      const toggleRect = toggleButton.getBoundingClientRect();
      return isVerticalEdge
        ? toggleRect.top + toggleRect.height / 2 - containerRect.top
        : toggleRect.left + toggleRect.width / 2 - containerRect.left;
    };
    const preToggleCenterOffset = getToggleCenterOffset();
    const stableToggleCenter =
      preToggleCenterOffset === null
        ? null
        : isVerticalEdge
          ? preTogglePosition.y + preToggleCenterOffset
          : preTogglePosition.x + preToggleCenterOffset;

    const readExpandableDimension = () =>
      isVerticalEdge ? lastKnownExpandableHeight : lastKnownExpandableWidth;

    // HACK: Skip measuring during an active toggle animation — the CSS grid transition is
    // mid-flight so getBoundingClientRect returns a partial value that contaminates
    // lastKnownExpandableWidth and causes permanent position drift.
    if (isCurrentlyEnabled && expandableButtonsRef && !isToggleAnimating()) {
      measureExpandableDimension();
    }
    let expandableDimension = readExpandableDimension();
    let shouldCompensatePosition = expandableDimension > 0;

    // HACK: Re-enabling after comments/count changes can leave the cached expandable
    // dimension stale. Measure the current expanded target synchronously from the
    // live DOM instead of trusting the last enabled-state cache.
    if (!isCurrentlyEnabled && expandableButtonsRef) {
      expandableDimension = measureForcedExpandedDimension(isVerticalEdge);
      shouldCompensatePosition = expandableDimension > 0;
    }

    if (shouldCompensatePosition) {
      setIsRapidRetoggle(isToggleAnimating());
      setIsToggleAnimating(true);
    }

    props.onToggleEnabled?.();

    if (shouldCompensatePosition) {
      const dimensionChange = isCurrentlyEnabled
        ? -expandableDimension
        : expandableDimension;

      if (isVerticalEdge) {
        expandedDimensions = {
          width: expandedDimensions.width,
          height: expandedDimensions.height + dimensionChange,
        };
      } else {
        expandedDimensions = {
          width: expandedDimensions.width + dimensionChange,
          height: expandedDimensions.height,
        };
      }

      const computeClampedPosition = (): Position => {
        const viewport = getVisualViewport();
        const currentToggleCenterOffset =
          getToggleCenterOffset() ?? preToggleCenterOffset ?? 0;
        const targetAxisPosition =
          stableToggleCenter === null
            ? isVerticalEdge
              ? preTogglePosition.y
              : preTogglePosition.x
            : stableToggleCenter - currentToggleCenterOffset;
        if (isVerticalEdge) {
          const clampMin = viewport.offsetTop + TOOLBAR_SNAP_MARGIN_PX;
          const clampMax =
            viewport.offsetTop +
            viewport.height -
            expandedDimensions.height -
            TOOLBAR_SNAP_MARGIN_PX;
          return {
            x: preTogglePosition.x,
            y: clampToRange(targetAxisPosition, clampMin, clampMax),
          };
        }
        const clampMin = viewport.offsetLeft + TOOLBAR_SNAP_MARGIN_PX;
        const clampMax =
          viewport.offsetLeft +
          viewport.width -
          expandedDimensions.width -
          TOOLBAR_SNAP_MARGIN_PX;
        return {
          x: clampToRange(targetAxisPosition, clampMin, clampMax),
          y: preTogglePosition.y,
        };
      };

      if (toggleAnimationRafId !== undefined) {
        nativeCancelAnimationFrame(toggleAnimationRafId);
      }

      if (isRapidRetoggle()) {
        setPosition(computeClampedPosition());
        toggleAnimationRafId = undefined;
      } else {
        const animationStartTime = performance.now();
        const syncPositionWithGrid = () => {
          const elapsed = performance.now() - animationStartTime;
          if (
            elapsed >
            TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS + TOGGLE_ANIMATION_BUFFER_MS
          ) {
            toggleAnimationRafId = undefined;
            return;
          }
          setPosition(computeClampedPosition());
          toggleAnimationRafId =
            nativeRequestAnimationFrame(syncPositionWithGrid);
        };
        toggleAnimationRafId =
          nativeRequestAnimationFrame(syncPositionWithGrid);
      }

      clearTimeout(toggleAnimationTimeout);
      toggleAnimationTimeout = setTimeout(() => {
        if (toggleAnimationRafId !== undefined) {
          nativeCancelAnimationFrame(toggleAnimationRafId);
          toggleAnimationRafId = undefined;
        }
        nativeRequestAnimationFrame(() => {
          nativeRequestAnimationFrame(() => {
            const settledPosition = position();
            const settledRect = containerRef?.getBoundingClientRect();
            if (settledRect) {
              expandedDimensions = {
                width: settledRect.width,
                height: settledRect.height,
              };
            }
            setIsToggleAnimating(false);
            setIsRapidRetoggle(false);
            const newRatio = getRatioFromPosition(
              edge,
              settledPosition.x,
              settledPosition.y,
              settledRect?.width ?? expandedDimensions.width,
              settledRect?.height ?? expandedDimensions.height,
            );
            setPositionRatio(newRatio);
            saveAndNotify({
              edge,
              ratio: newRatio,
              collapsed: isCollapsed(),
              enabled: !isCurrentlyEnabled,
            });
          });
        });
      }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS + TOGGLE_ANIMATION_BUFFER_MS);
    } else {
      saveAndNotify({
        edge,
        ratio: positionRatio(),
        collapsed: isCollapsed(),
        enabled: !isCurrentlyEnabled,
      });
    }
  });

  const computeCollapsedPosition = (): Position =>
    getCollapsedPosition(
      snapEdge(),
      position(),
      expandedDimensions,
      collapsedDimensions(),
    );

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  let collapseAnimationTimeout: ReturnType<typeof setTimeout> | undefined;
  let toggleAnimationTimeout: ReturnType<typeof setTimeout> | undefined;
  let toggleAnimationRafId: number | undefined;
  let commentItemCountTimeout: ReturnType<typeof setTimeout> | undefined;
  let toolbarResizeRafId: number | undefined;
  let resizePointerStartX = 0;
  let resizePointerStartY = 0;
  let resizeStartWidth = TOOLBAR_DEFAULT_WIDTH_PX;
  let resizeStartHeight = TOOLBAR_DEFAULT_HEIGHT_PX;
  let resizeBaseWidth = TOOLBAR_DEFAULT_WIDTH_PX;
  let resizeBaseHeight = TOOLBAR_DEFAULT_HEIGHT_PX;

  const syncToolbarResizeFrame = () => {
    if (toolbarResizeRafId !== undefined) return;
    toolbarResizeRafId = nativeRequestAnimationFrame(() => {
      toolbarResizeRafId = undefined;
      reclampToolbarToViewport(false);
    });
  };

  const handleToolbarResizePointerMove = (event: PointerEvent) => {
    const deltaX = event.clientX - resizePointerStartX;
    const deltaY = event.clientY - resizePointerStartY;
    const edge = snapEdge();
    const nextWidth = Math.max(
      1,
      resizeStartWidth + (edge === "right" ? -deltaX : deltaX),
    );
    const nextHeight = Math.max(
      1,
      resizeStartHeight + (edge === "bottom" ? -deltaY : deltaY),
    );
    const nextScale = clampToolbarScale(
      (nextWidth / resizeBaseWidth + nextHeight / resizeBaseHeight) / 2,
    );

    if (nextScale === toolbarScale()) {
      return;
    }

    setToolbarScale(nextScale);
    syncToolbarResizeFrame();
  };

  const completeToolbarResize = () => {
    window.removeEventListener("pointermove", handleToolbarResizePointerMove);
    window.removeEventListener("pointerup", completeToolbarResize);
    window.removeEventListener("pointercancel", completeToolbarResize);

    if (toolbarResizeRafId !== undefined) {
      nativeCancelAnimationFrame(toolbarResizeRafId);
      toolbarResizeRafId = undefined;
    }

    reclampToolbarToViewport(false);
    setIsResizing(false);
    setIsResizeTooltipVisible(false);
    const rect = containerRef?.getBoundingClientRect();
    if (!rect) return;
    expandedDimensions = { width: rect.width, height: rect.height };
    const newRatio = getRatioFromPosition(
      snapEdge(),
      position().x,
      position().y,
      rect.width,
      rect.height,
    );
    setPositionRatio(newRatio);
    saveAndNotify({
      ratio: newRatio,
      scale: toolbarScale(),
    });
  };

  const handleToolbarResizePointerDown = (event: PointerEvent) => {
    if (isCollapsed() || event.button !== 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setIsResizeTooltipVisible(false);
    resizePointerStartX = event.clientX;
    resizePointerStartY = event.clientY;
    const rect = containerRef?.getBoundingClientRect();
    const measuredBase = measureToolbarBaseDimensions();
    resizeStartWidth = rect?.width ?? scaledToolbarDimensions().width;
    resizeStartHeight = rect?.height ?? scaledToolbarDimensions().height;
    resizeBaseWidth = measuredBase?.width ?? baseToolbarDimensions().width;
    resizeBaseHeight = measuredBase?.height ?? baseToolbarDimensions().height;
    setToolbarScale(clampToolbarScale(toolbarScale()));
    setIsResizing(true);

    window.addEventListener("pointermove", handleToolbarResizePointerMove);
    window.addEventListener("pointerup", completeToolbarResize);
    window.addEventListener("pointercancel", completeToolbarResize);
  };

  const handleResize = () => {
    if (drag.isDragging()) return;

    setIsResizing(true);
    recalculatePosition();

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      setIsResizing(false);

      const newRatio = getRatioFromPosition(
        snapEdge(),
        position().x,
        position().y,
        expandedDimensions.width,
        expandedDimensions.height,
      );
      setPositionRatio(newRatio);
      saveAndNotify({ ratio: newRatio });
    }, TOOLBAR_FADE_IN_DELAY_MS);
  };

  const saveAndNotify = (overrides: Partial<ToolbarState>) => {
    const state = buildPersistedToolbarState(overrides);
    saveToolbarState(state);
    props.onStateChange?.(state);
    return state;
  };

  onMount(() => {
    if (containerRef) {
      props.onContainerRef?.(containerRef);
    }

    if (typeof window.matchMedia === "function") {
      setSupportsHover(window.matchMedia("(hover: hover)").matches);
    }

    measureToolbarBaseDimensions();
    const rect = containerRef?.getBoundingClientRect();
    const viewport = getVisualViewport();

    if (savedState) {
      if (rect) {
        // HACK: On initial mount, the element is always rendered expanded (isCollapsed defaults to false).
        // So rect always measures expanded dimensions, regardless of savedState.collapsed.
        expandedDimensions = { width: rect.width, height: rect.height };
      }
      if (savedState.collapsed) {
        const isHorizontalEdge =
          savedState.edge === "top" || savedState.edge === "bottom";
        setCollapsedDimensions({
          width: isHorizontalEdge
            ? TOOLBAR_COLLAPSED_LONG_PX
            : TOOLBAR_COLLAPSED_SHORT_PX,
          height: isHorizontalEdge
            ? TOOLBAR_COLLAPSED_SHORT_PX
            : TOOLBAR_COLLAPSED_LONG_PX,
        });
      }
      setIsCollapsed(savedState.collapsed);
      const newPosition = getPositionFromEdgeAndRatio(
        savedState.edge,
        savedState.ratio,
        expandedDimensions.width,
        expandedDimensions.height,
      );
      setPosition(newPosition);
      if (
        savedState.scale === undefined ||
        savedState.width !== undefined ||
        savedState.height !== undefined ||
        savedState.size !== undefined
      ) {
        saveAndNotify({
          edge: savedState.edge,
          ratio: savedState.ratio,
          collapsed: savedState.collapsed,
          enabled: savedState.enabled,
          scale: toolbarScale(),
          defaultAction: savedState.defaultAction,
        });
      }
    } else if (rect) {
      expandedDimensions = { width: rect.width, height: rect.height };
      setPosition({
        x: viewport.offsetLeft + (viewport.width - rect.width) / 2,
        y:
          viewport.offsetTop +
          viewport.height -
          rect.height -
          TOOLBAR_SNAP_MARGIN_PX,
      });
      setPositionRatio(TOOLBAR_DEFAULT_POSITION_RATIO);
    } else {
      const defaultPosition = getPositionFromEdgeAndRatio(
        "bottom",
        TOOLBAR_DEFAULT_POSITION_RATIO,
        expandedDimensions.width,
        expandedDimensions.height,
      );
      setPosition(defaultPosition);
    }

    if (props.enabled) {
      measureExpandableDimension();
    }

    scheduleInitialLayoutSync();

    if (scaledContentRef) {
      toolbarSizeObserver = new ResizeObserver(() => {
        measureToolbarBaseDimensions();
        scheduleInitialLayoutSync();
      });
      toolbarSizeObserver.observe(scaledContentRef);
    }

    if (props.onSubscribeToStateChanges) {
      const unsubscribe = props.onSubscribeToStateChanges(
        (state: ToolbarState) => {
          if (isCollapseAnimating() || isToggleAnimating()) return;

          const didCollapsedChange = isCollapsed() !== state.collapsed;
          const nextToolbarScale = clampToolbarScale(
            resolveToolbarScale(state, state.edge),
          );
          const didToolbarScaleChange = nextToolbarScale !== toolbarScale();

          setSnapEdge(state.edge);
          if (didToolbarScaleChange) {
            setToolbarScale(nextToolbarScale);
          }

          const applyState = () => {
            const rect = containerRef?.getBoundingClientRect();
            if (!rect) return;
            expandedDimensions = { width: rect.width, height: rect.height };

            if (didCollapsedChange && !state.collapsed) {
              const collapsedPos = currentPosition();
              setIsCollapseAnimating(true);
              setIsCollapsed(state.collapsed);
              const { position: newPos, ratio: newRatio } =
                getExpandedFromCollapsed(collapsedPos, state.edge);
              setPosition(newPos);
              setPositionRatio(newRatio);
              clearTimeout(collapseAnimationTimeout);
              collapseAnimationTimeout = setTimeout(() => {
                setIsCollapseAnimating(false);
              }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
            } else {
              if (didCollapsedChange) {
                setIsCollapseAnimating(true);
                clearTimeout(collapseAnimationTimeout);
                collapseAnimationTimeout = setTimeout(() => {
                  setIsCollapseAnimating(false);
                }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
              }
              setIsCollapsed(state.collapsed);
              const newPosition = getPositionFromEdgeAndRatio(
                state.edge,
                state.ratio,
                expandedDimensions.width,
                expandedDimensions.height,
              );
              setPosition(newPosition);
              setPositionRatio(state.ratio);
            }
          };

          if (didToolbarScaleChange) {
            nativeRequestAnimationFrame(applyState);
            return;
          }

          applyState();
        },
      );

      onCleanup(unsubscribe);
    }

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);

    const fadeInTimeout = setTimeout(() => {
      setIsVisible(true);
    }, TOOLBAR_FADE_IN_DELAY_MS);

    onCleanup(() => {
      clearTimeout(fadeInTimeout);
    });
  });

  onCleanup(() => {
    toolbarSizeObserver?.disconnect();
    window.removeEventListener("resize", handleResize);
    window.visualViewport?.removeEventListener("resize", handleResize);
    window.visualViewport?.removeEventListener("scroll", handleResize);
    window.removeEventListener("pointermove", handleToolbarResizePointerMove);
    window.removeEventListener("pointerup", completeToolbarResize);
    window.removeEventListener("pointercancel", completeToolbarResize);
    clearTimeout(resizeTimeout);
    clearTimeout(collapseAnimationTimeout);
    clearShakeTooltipTimeout();
    clearTimeout(toggleAnimationTimeout);
    clearTimeout(commentItemCountTimeout);
    if (toggleAnimationRafId !== undefined) {
      nativeCancelAnimationFrame(toggleAnimationRafId);
    }
    if (toolbarResizeRafId !== undefined) {
      nativeCancelAnimationFrame(toolbarResizeRafId);
    }
    if (initialLayoutSyncRafId !== undefined) {
      nativeCancelAnimationFrame(initialLayoutSyncRafId);
    }
    unfreezeUpdatesCallback?.();
    safePolygonTracker.stop();
  });

  const currentPosition = () => {
    const collapsed = isCollapsed();
    return collapsed ? computeCollapsedPosition() : position();
  };

  const getCursorClass = (): string => {
    if (isCollapsed()) {
      return "cursor-pointer";
    }
    if (drag.isDragging()) {
      return "cursor-grabbing";
    }
    return "cursor-grab";
  };

  const getTransitionClass = (): string => {
    if (isResizing()) {
      return "";
    }
    if (drag.isSnapping()) {
      return "transition-[transform,opacity] duration-300 ease-out";
    }
    if (isCollapseAnimating()) {
      return "transition-[transform,opacity] duration-150 ease-out";
    }
    if (isToggleAnimating()) {
      return "transition-opacity duration-150 ease-out";
    }
    return "transition-opacity duration-300 ease-out";
  };

  const getTransformOrigin = (): string => {
    const edge = snapEdge();
    switch (edge) {
      case "top":
        return "center top";
      case "bottom":
        return "center bottom";
      case "left":
        return "left center";
      case "right":
        return "right center";
      default:
        return "center center";
    }
  };

  return (
    <div
      ref={containerRef}
      data-ui-grab-ignore-events
      data-ui-grab-toolbar
      class={cn(
        "fixed left-0 top-0 font-sans text-[13px] antialiased select-none",
        getCursorClass(),
        getTransitionClass(),
        isVisible()
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      )}
      style={{
        "z-index": String(Z_INDEX_OVERLAY),
        transform: `translate(${currentPosition().x}px, ${
          currentPosition().y
        }px)`,
        width: `${scaledToolbarDimensions().width}px`,
        height: `${scaledToolbarDimensions().height}px`,
      }}
      on:pointerdown={(event) => {
        stopEventPropagation(event);
        drag.handlePointerDown(event);
      }}
      on:mousedown={stopEventPropagation}
      onMouseEnter={() => {
        setIsToolbarHovered(true);
        if (!isCollapsed()) {
          props.onSelectHoverChange?.(true);
        }
      }}
      onMouseLeave={() => {
        setIsToolbarHovered(false);
        props.onSelectHoverChange?.(false);
        setIsResizeTooltipVisible(false);
      }}
    >
      <div
        class="absolute"
        style={{
          left: `${scaledToolbarOffset().left}px`,
          top: `${scaledToolbarOffset().top}px`,
        }}
      >
        <div
          ref={scaledContentRef}
          class="inline-block h-max w-max"
          style={{
            width: "max-content",
            transform: `scale(${toolbarScale()})`,
            "transform-origin": getTransformOrigin(),
          }}
        >
          <ToolbarContent
            isActive={props.isActive}
            enabled={props.enabled}
            isCollapsed={isCollapsed()}
            snapEdge={snapEdge()}
            isShaking={isShaking()}
            isCommentsExpanded={(props.commentItemCount ?? 0) > 0}
            isCommentsPinned={props.isCommentsPinned}
            disableGridTransitions={isRapidRetoggle()}
            onAnimationEnd={() => setIsShaking(false)}
            onCollapseClick={handleToggleCollapse}
            onExpandableButtonsRef={(element) => {
              expandableButtonsRef = element;
            }}
            onPanelClick={(event) => {
              if (isCollapsed()) {
                event.stopPropagation();
                const { position: newPos, ratio: newRatio } =
                  getExpandedFromCollapsed(currentPosition(), snapEdge());
                setPosition(newPos);
                setPositionRatio(newRatio);
                setIsCollapseAnimating(true);
                setIsCollapsed(false);
                saveAndNotify({
                  edge: snapEdge(),
                  ratio: newRatio,
                  collapsed: false,
                  enabled: props.enabled ?? true,
                });
                if (collapseAnimationTimeout) {
                  clearTimeout(collapseAnimationTimeout);
                }
                collapseAnimationTimeout = setTimeout(() => {
                  setIsCollapseAnimating(false);
                }, TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS);
              }
            }}
            selectButton={
              <>
                <button
                  data-ui-grab-ignore-events
                  data-ui-grab-toolbar-toggle
                  aria-label={
                    props.isActive ? "Stop selecting element" : "Select element"
                  }
                  aria-pressed={Boolean(props.isActive)}
                  class={cn(
                    actionButtonClass(),
                    props.isActive &&
                      "border-white/60 bg-white/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                  )}
                  onClick={(event) => {
                    setIsSelectTooltipVisible(false);
                    handleToggle(event);
                  }}
                  on:contextmenu={(event: MouseEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsSelectTooltipVisible(false);
                    props.onToggleToolbarMenu?.();
                  }}
                  {...createFreezeHandlers(setIsSelectTooltipVisible)}
                >
                  <IconSelect
                    size={13}
                    class={cn(
                      "transition-colors",
                      props.isActive ? "text-black/82" : "text-black/54",
                    )}
                  />
                </button>
                <Tooltip
                  visible={isSelectTooltipVisible() && isTooltipAllowed()}
                  position={tooltipPosition()}
                >
                  Select element <Kbd>{formatShortcut("C")}</Kbd>
                </Tooltip>
              </>
            }
            commentsButton={
              <>
                <button
                  data-ui-grab-ignore-events
                  data-ui-grab-toolbar-comments
                  aria-label={`Open comments${
                    (props.commentItemCount ?? 0) > 0
                      ? ` (${props.commentItemCount ?? 0} items)`
                      : ""
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={Boolean(props.isCommentsDropdownOpen)}
                  class={cn(
                    actionButtonClass(),
                    props.isCommentsPinned &&
                      "border-white/60 bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]",
                  )}
                  onClick={(event) => {
                    setIsCommentsTooltipVisible(false);
                    handleComments(event);
                  }}
                  {...createFreezeHandlers(
                    (visible) => {
                      if (visible && props.isCommentsDropdownOpen) return;
                      setIsCommentsTooltipVisible(visible);
                    },
                    {
                      onHoverChange: (isHovered) =>
                        props.onCommentsButtonHover?.(isHovered),
                      shouldFreezeInteractions: false,
                      safePolygonTargets: () =>
                        props.isCommentsDropdownOpen
                          ? getSafePolygonTargets(
                              "[data-ui-grab-comments-dropdown]",
                            )
                          : null,
                    },
                  )}
                >
                  <span ref={clockFlashRef} class="inline-flex relative">
                    <IconComment size={13} class={commentsIconClass()} />
                    <Show when={(props.commentItemCount ?? 0) > 0}>
                      <span
                        data-ui-grab-unread-indicator
                        class="absolute -top-1 -right-1 min-w-2.5 h-2.5 px-0.5 flex items-center justify-center rounded-full bg-black/85 text-white text-[8px] font-semibold leading-none shadow-[0_1px_3px_rgba(0,0,0,0.22)]"
                      >
                        {props.commentItemCount}
                      </span>
                    </Show>
                  </span>
                </button>
                <Tooltip
                  visible={isCommentsTooltipVisible() && isTooltipAllowed()}
                  position={tooltipPosition()}
                >
                  {commentsTooltipLabel()}
                </Tooltip>
              </>
            }
            toggleButton={
              <>
                <button
                  data-ui-grab-ignore-events
                  data-ui-grab-toolbar-enabled
                  aria-label={
                    props.enabled ? "Disable UI Grab" : "Enable UI Grab"
                  }
                  aria-pressed={Boolean(props.enabled)}
                  class={toggleButtonClass()}
                  onClick={(event) => {
                    setIsToggleTooltipVisible(false);
                    handleToggleEnabled(event);
                  }}
                  onMouseEnter={() => setIsToggleTooltipVisible(true)}
                  onMouseLeave={() => setIsToggleTooltipVisible(false)}
                >
                  <div
                    class={cn(
                      "relative rounded-full border border-black/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors",
                      isVertical() ? "h-7 w-4" : "h-4 w-7",
                      props.enabled ? "bg-black/84" : "bg-black/18",
                    )}
                  >
                    <div
                      class={cn(
                        "absolute left-[1px] top-[1px] h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform",
                        !props.enabled &&
                          (isVertical() ? "translate-y-0" : "translate-x-0"),
                        props.enabled &&
                          (isVertical()
                            ? "translate-y-[11px]"
                            : "translate-x-[11px]"),
                      )}
                    />
                  </div>
                </button>
                <Tooltip
                  visible={isToggleTooltipVisible() && isTooltipAllowed()}
                  position={tooltipPosition()}
                >
                  {props.enabled ? "Disable" : "Enable"}
                </Tooltip>
              </>
            }
          />
          <Show when={!isCollapsed()}>
            <div
              data-ui-grab-ignore-events
              data-ui-grab-toolbar-resize-hitbox
              aria-hidden="true"
              class={cn(
                "absolute z-30 transition-opacity duration-200 ease-out",
                isResizeHandleVisible()
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              style={resizeHandleHitboxStyle()}
              on:pointerdown={stopEventPropagation}
              onMouseEnter={() => {
                setIsResizeHandleHovered(true);
                setIsResizeTooltipVisible(true);
              }}
              onMouseLeave={() => {
                setIsResizeHandleHovered(false);
                setIsResizeTooltipVisible(false);
              }}
            >
              <div
                class={cn(
                  "pointer-events-none absolute rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_100%)] opacity-60 blur-[1px]",
                  isVertical() ? "inset-y-2 w-2" : "inset-x-2 h-2",
                )}
                style={
                  isVertical()
                    ? snapEdge() === "left"
                      ? { right: "0" }
                      : { left: "0" }
                    : snapEdge() === "top"
                      ? { bottom: "0" }
                      : { top: "0" }
                }
              />
              <div
                data-ui-grab-ignore-events
                data-ui-grab-toolbar-resize-handle
                class={cn(
                  "absolute flex items-center justify-center overflow-hidden rounded-full border border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(210,216,226,0.14)_100%)] text-black/38 shadow-[0_10px_24px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.66),inset_0_-10px_18px_rgba(148,163,184,0.12)] backdrop-blur-[18px] transition-[transform,background-color,box-shadow,color] duration-200 ease-out",
                  resizeCursorClass(),
                  isResizeHandleHovered() &&
                    "bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(214,220,230,0.18)_100%)] text-black/50 shadow-[0_12px_28px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-12px_20px_rgba(148,163,184,0.14)]",
                  isResizeHandleVisible()
                    ? "pointer-events-auto opacity-100 scale-100"
                    : "pointer-events-none opacity-0 scale-[0.94]",
                )}
                style={resizeHandleButtonStyle()}
                on:pointerdown={handleToolbarResizePointerDown}
              >
                <span
                  class="pointer-events-none absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.12)_58%,rgba(255,255,255,0)_100%)]"
                  style={{ opacity: isResizeHandleHovered() ? "1" : "0.82" }}
                />
                <span
                  class="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.14)_100%)]"
                  style={{ opacity: isResizeHandleHovered() ? "0.85" : "0.65" }}
                />
                <IconResizeAxis
                  size={resizeHandleMetrics().icon}
                  class={resizeHandleIconClass()}
                />
                <Show
                  when={
                    isResizeTooltipVisible() &&
                    isResizeHandleVisible() &&
                    isTooltipAllowed() &&
                    !isResizing()
                  }
                >
                  <div
                    class={resizeHandleTooltipPointClass()}
                    style={{ "z-index": String(Z_INDEX_OVERLAY) }}
                  >
                    <div class={resizeHandleTooltipBubblePositionClass()}>
                      <div
                        class="relative"
                        style={{
                          transform: `scale(${resizeHandleMetrics().tooltipScale})`,
                          "transform-origin": guidanceTooltipTransformOrigin(),
                        }}
                      >
                        <div
                          data-ui-grab-toolbar-resize-tooltip
                          class={cn(
                            resizeTooltipBubbleClass,
                            "animate-tooltip-fade-in bg-white",
                          )}
                        >
                          Drag to resize
                        </div>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>
      <Show when={props.isActive && !hasLearnedSelectionHints()}>
        <div
          class={shakeTooltipPositionClass()}
          style={{
            "z-index": String(Z_INDEX_OVERLAY),
            [isVertical() ? "top" : "left"]: "50%",
          }}
        >
          <div
            data-ui-grab-selection-hint
            class={cn(
              TOOLTIP_BASE_CLASS,
              "flex items-center gap-1 animate-tooltip-fade-in [animation-fill-mode:backwards]",
              "bg-white",
            )}
            style={{
              transform: `scale(${toolbarScale()})`,
              "transform-origin": guidanceTooltipTransformOrigin(),
            }}
          >
            <Show when={selectionHintIndex() === 0}>
              <span
                class={cn(
                  "flex items-center gap-1",
                  hasHintCycled() && HINT_FLIP_IN_ANIMATION,
                )}
              >
                Click or
                <Kbd>↵</Kbd>
                to capture
              </span>
            </Show>
            <Show when={selectionHintIndex() === 1}>
              <span
                class={cn("flex items-center gap-1", HINT_FLIP_IN_ANIMATION)}
              >
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                to fine-tune target
              </span>
            </Show>
            <Show when={selectionHintIndex() === 2}>
              <span
                class={cn("flex items-center gap-1", HINT_FLIP_IN_ANIMATION)}
              >
                <Kbd>esc</Kbd>
                to cancel
              </span>
            </Show>
          </div>
        </div>
      </Show>
      <Show when={isShakeTooltipVisible()}>
        <div
          class={shakeTooltipPositionClass()}
          style={{
            "z-index": String(Z_INDEX_OVERLAY),
            [isVertical() ? "top" : "left"]: "50%",
          }}
        >
          <div
            data-ui-grab-shake-tooltip
            class={cn(
              TOOLTIP_BASE_CLASS,
              "animate-tooltip-fade-in",
              "bg-white",
            )}
            style={{
              transform: `scale(${toolbarScale()})`,
              "transform-origin": guidanceTooltipTransformOrigin(),
            }}
          >
            Enable to continue
          </div>
        </div>
      </Show>
    </div>
  );
};
