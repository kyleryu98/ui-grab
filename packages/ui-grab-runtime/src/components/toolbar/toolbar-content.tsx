import type { Component, JSX } from "solid-js";
import { cn } from "../../utils/cn.js";
import { IconChevron } from "../icons/icon-chevron.jsx";
import {
  getExpandGridClass,
  getMinDimensionClass,
} from "../../utils/toolbar-layout.js";

interface ToolbarContentProps {
  isActive?: boolean;
  enabled?: boolean;
  isCollapsed?: boolean;
  snapEdge?: "top" | "bottom" | "left" | "right";
  isShaking?: boolean;
  isCommentsExpanded?: boolean;
  isCommentsPinned?: boolean;
  disableGridTransitions?: boolean;
  onAnimationEnd?: () => void;
  onPanelClick?: (event: MouseEvent) => void;
  onCollapseClick?: (event: MouseEvent) => void;
  onExpandableButtonsRef?: (element: HTMLDivElement) => void;
  selectButton?: JSX.Element;
  commentsButton?: JSX.Element;
  toggleButton?: JSX.Element;
  collapseButton?: JSX.Element;
}

export const ToolbarContent: Component<ToolbarContentProps> = (props) => {
  const edge = () => props.snapEdge ?? "bottom";
  const isVertical = () => edge() === "left" || edge() === "right";

  const expandGridClass = (
    isExpanded: boolean,
    collapsedExtra?: string,
  ): string => getExpandGridClass(isVertical(), isExpanded, collapsedExtra);

  const gridTransitionClass = (): string => {
    if (props.disableGridTransitions) return "";
    if (isVertical()) {
      return "transition-[grid-template-rows,opacity] duration-150 ease-out";
    }
    return "transition-[grid-template-columns,opacity] duration-150 ease-out";
  };

  const gridSizeTransitionClass = (): string => {
    if (props.disableGridTransitions) return "";
    if (isVertical()) {
      return "transition-[grid-template-rows] duration-150 ease-out";
    }
    return "transition-[grid-template-columns] duration-150 ease-out";
  };

  const minDimensionClass = () => getMinDimensionClass(isVertical());

  const collapsedEdgeClasses = () => {
    if (!props.isCollapsed) return "";
    const roundedClass = {
      top: "rounded-t-none rounded-b-[10px]",
      bottom: "rounded-b-none rounded-t-[10px]",
      left: "rounded-l-none rounded-r-[10px]",
      right: "rounded-r-none rounded-l-[10px]",
    }[edge()];
    const paddingClass = isVertical() ? "px-0.25 py-2" : "px-2 py-0.25";
    return `${roundedClass} ${paddingClass}`;
  };

  const chevronRotation = () => {
    const collapsed = props.isCollapsed;
    switch (edge()) {
      case "top":
        return collapsed ? "rotate-180" : "rotate-0";
      case "bottom":
        return collapsed ? "rotate-0" : "rotate-180";
      case "left":
        return collapsed ? "rotate-90" : "-rotate-90";
      case "right":
        return collapsed ? "-rotate-90" : "rotate-90";
      default:
        return "rotate-0";
    }
  };

  const defaultCollapseButton = () => (
    <button
      data-ui-grab-ignore-events
      data-ui-grab-toolbar-collapse
      aria-label={props.isCollapsed ? "Expand toolbar" : "Collapse toolbar"}
      class={cn(
        "contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale rounded-[10px] border border-white/45 bg-white/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-[12px] transition-colors hover:bg-white/34",
        isVertical() ? "h-6 w-6" : "h-6 w-6",
      )}
      onClick={props.onCollapseClick}
    >
      <IconChevron
        size={12}
        class={cn(
          "text-black/42 transition-transform duration-150",
          chevronRotation(),
        )}
      />
    </button>
  );

  return (
    <div
      class={cn(
        "inline-flex items-center justify-between rounded-[14px] antialiased relative overflow-hidden [font-synthesis:none] [corner-shape:superellipse(1.25)] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(247,247,247,0.56)_48%,rgba(238,238,238,0.4)_100%)] shadow-[0_12px_28px_rgba(17,24,39,0.14),0_2px_6px_rgba(255,255,255,0.66)_inset,0_-1px_0_rgba(255,255,255,0.28)_inset] backdrop-blur-[22px]",
        isVertical() && "flex-col",
        !props.isCollapsed &&
          (isVertical()
            ? "px-[7px] gap-[6px] py-[8px]"
            : "py-[7px] gap-[6px] px-[8px]"),
        collapsedEdgeClasses(),
        props.isShaking && "animate-shake",
      )}
      onAnimationEnd={props.onAnimationEnd}
      onClick={props.onPanelClick}
    >
      <span class="pointer-events-none absolute inset-[1px] rounded-[13px] bg-[linear-gradient(135deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.28)_42%,rgba(255,255,255,0.22)_100%)] opacity-90" />
      <span class="pointer-events-none absolute inset-x-[8%] top-0 h-[44%] rounded-full bg-white/45 blur-[10px] opacity-55" />
      <div
        class={cn(
          "relative z-10 grid overflow-visible",
          gridSizeTransitionClass(),
          props.isCollapsed
            ? isVertical()
              ? "grid-rows-[0fr] pointer-events-none"
              : "grid-cols-[0fr] pointer-events-none"
            : isVertical()
              ? "grid-rows-[1fr]"
              : "grid-cols-[1fr]",
        )}
      >
        <div
          class={cn(
            "flex",
            isVertical()
              ? "flex-col items-center min-h-0"
              : "items-center min-w-0",
            props.isCollapsed ? "opacity-0" : "opacity-100",
            !props.disableGridTransitions &&
              "transition-opacity duration-150 ease-out",
          )}
        >
          <div
            ref={(element) => props.onExpandableButtonsRef?.(element)}
            class={cn("flex items-center", isVertical() && "flex-col")}
          >
            <div
              class={cn(
                "grid",
                gridTransitionClass(),
                expandGridClass(Boolean(props.enabled)),
              )}
            >
              <div class={cn("relative overflow-visible", minDimensionClass())}>
                {props.selectButton}
              </div>
            </div>
            <div
              class={cn(
                "grid",
                gridTransitionClass(),
                expandGridClass(
                  Boolean(props.enabled) && Boolean(props.isCommentsExpanded),
                  "pointer-events-none",
                ),
              )}
            >
              <div class={cn("relative overflow-visible", minDimensionClass())}>
                {props.commentsButton}
              </div>
            </div>
          </div>
          <div class="relative shrink-0 overflow-visible">
            {props.toggleButton}
          </div>
        </div>
      </div>
      <div
        class={cn(
          "relative z-10 shrink-0 flex",
          isVertical()
            ? "flex-col items-center gap-[6px] pt-[6px]"
            : "items-center gap-[5px] pl-[6px]",
        )}
      >
        {props.collapseButton ?? defaultCollapseButton()}
      </div>
    </div>
  );
};
