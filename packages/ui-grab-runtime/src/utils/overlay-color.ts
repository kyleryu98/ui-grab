import { supportsDisplayP3 } from "./supports-display-p3.js";

const isWideGamut = supportsDisplayP3();
const SRGB_COMPONENTS = "118, 198, 255";
const P3_COMPONENTS = "0.46 0.76 0.98";

export const overlayColor = (alpha: number): string =>
  isWideGamut
    ? `color(display-p3 ${P3_COMPONENTS} / ${alpha})`
    : `rgba(${SRGB_COMPONENTS}, ${alpha})`;
