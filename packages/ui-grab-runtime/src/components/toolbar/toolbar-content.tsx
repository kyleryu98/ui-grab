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
  onShellRef?: (element: HTMLDivElement) => void;
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
      aria-label={
        props.enabled === false ? "Enable UI Grab" : "Expand toolbar"
      }
      class={cn(
        "contain-layout relative shrink-0 flex items-center justify-center overflow-hidden cursor-pointer interactive-scale rounded-full border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,248,248,0.76)_52%,rgba(236,236,236,0.58)_100%)] shadow-[0_10px_24px_rgba(17,24,39,0.14),0_1px_0_rgba(255,255,255,0.72)_inset,0_-1px_0_rgba(255,255,255,0.3)_inset] backdrop-blur-[18px] transition-[background-color,box-shadow,transform] duration-150 hover:shadow-[0_12px_28px_rgba(17,24,39,0.16),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(255,255,255,0.34)_inset]",
        "h-9 w-9",
      )}
      onClick={props.onCollapseClick}
    >
      <span class="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.34)_45%,rgba(255,255,255,0.2)_100%)] opacity-90" />
      <span class="pointer-events-none absolute inset-x-[22%] top-[2px] h-[42%] rounded-full bg-white/55 blur-[8px] opacity-75" />
      <IconChevron
        size={13}
        class={cn(
          "relative z-10 text-black/42 transition-transform duration-150",
          chevronRotation(),
        )}
      />
    </button>
  );

  return (
    <div
      data-ui-grab-toolbar-shell
      class={cn(
        "inline-flex items-center antialiased relative [font-synthesis:none]",
        isVertical() && "flex-col",
        props.isCollapsed
          ? "justify-center overflow-visible"
          : "justify-between overflow-hidden rounded-[14px] [corner-shape:superellipse(1.25)] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(247,247,247,0.56)_48%,rgba(238,238,238,0.4)_100%)] shadow-[0_12px_28px_rgba(17,24,39,0.14),0_2px_6px_rgba(255,255,255,0.66)_inset,0_-1px_0_rgba(255,255,255,0.28)_inset]",
        !props.isCollapsed &&
          (isVertical()
            ? "px-[7px] gap-[6px] py-[8px]"
            : "py-[7px] gap-[6px] px-[8px]"),
        props.isShaking && "animate-shake",
      )}
      onAnimationEnd={props.onAnimationEnd}
      onClick={props.onPanelClick}
    >
      {!props.isCollapsed && (
        <>
          <span class="pointer-events-none absolute inset-[1px] rounded-[13px] bg-[linear-gradient(135deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.28)_42%,rgba(255,255,255,0.22)_100%)] opacity-90" />
        </>
      )}
      <div
        class={cn(
          "relative z-10 grid",
          props.isCollapsed ? "overflow-hidden" : "overflow-visible",
          isVertical() ? "min-h-0" : "min-w-0",
          gridSizeTransitionClass(),
          props.isCollapsed
            ? isVertical()
              ? "grid-rows-[0fr] h-0 pointer-events-none"
              : "grid-cols-[0fr] w-0 pointer-events-none"
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
          props.isCollapsed
            ? "items-center justify-center"
            : isVertical()
              ? "flex-col items-center gap-[6px] pt-[6px]"
              : "items-center gap-[5px] pl-[6px]",
        )}
      >
        {props.collapseButton ?? defaultCollapseButton()}
      </div>
    </div>
  );
};
