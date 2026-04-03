import type { Component } from "solid-js";

interface IconResizeAxisProps {
  size?: number;
  class?: string;
}

export const IconResizeAxis: Component<IconResizeAxisProps> = (props) => {
  const size = () => props.size ?? 12;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.15"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="M12 4v16" />
      <path d="m8.75 7.25 3.25-3.25 3.25 3.25" />
      <path d="m8.75 16.75 3.25 3.25 3.25-3.25" />
      <path d="M9 12h6" opacity="0.34" />
    </svg>
  );
};
