import type { Component } from "solid-js";
import type { BottomSectionProps } from "../../types.js";

export const BottomSection: Component<BottomSectionProps> = (props) => (
  <div
    class="[font-synthesis:none] contain-layout shrink-0 flex flex-col items-start px-2 py-1.5 w-auto h-fit self-stretch [border-top-width:0.5px] border-t-solid antialiased rounded-t-none rounded-b-[10px]"
    style={{
      "border-top-color": "rgba(15, 23, 42, 0.1)",
      background: "rgba(255, 255, 255, 0.18)",
    }}
  >
    {props.children}
  </div>
);
