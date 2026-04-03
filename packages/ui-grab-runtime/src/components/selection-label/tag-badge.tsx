import { Show, createSignal } from "solid-js";
import type { Component } from "solid-js";
import type { TagBadgeProps } from "../../types.js";
import { cn } from "../../utils/cn.js";
import { IconOpen } from "../icons/icon-open.jsx";

export const TagBadge: Component<TagBadgeProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    props.onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    props.onHoverChange?.(false);
  };

  return (
    <div
      class={cn(
        "contain-layout flex items-center gap-1 max-w-[280px] overflow-hidden",
        props.shrink && "shrink-0",
        props.isClickable && "cursor-pointer",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={props.onClick}
    >
      <span class="text-[13px] leading-4 h-fit font-medium overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
        <Show when={props.componentName}>
          <span class="text-slate-950/92">{props.componentName}</span>
          <span class="text-slate-900/45">.{props.tagName}</span>
        </Show>
        <Show when={!props.componentName}>
          <span class="text-slate-950/92">{props.tagName}</span>
        </Show>
      </span>
      <Show when={props.isClickable || props.forceShowIcon}>
        <IconOpen
          size={10}
          class={cn(
            "text-slate-950/68 transition-all duration-100 shrink-0",
            isHovered() || props.forceShowIcon
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75 -ml-[2px] w-0",
          )}
        />
      </Show>
    </div>
  );
};
