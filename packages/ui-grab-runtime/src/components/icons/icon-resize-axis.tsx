import type { Component, JSX } from "solid-js";

interface IconResizeAxisProps {
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
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
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      style={props.style}
    >
      <path d="M6.5 12h11" />
      <path d="m8.9 9.4-2.9 2.6 2.9 2.6" />
      <path d="m15.1 9.4 2.9 2.6-2.9 2.6" />
    </svg>
  );
};
