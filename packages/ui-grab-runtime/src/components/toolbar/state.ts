import type { ToolbarState } from "../../types.js";
import {
  DEFAULT_ACTION_ID,
  TOOLBAR_DEFAULT_HEIGHT_PX,
  TOOLBAR_DEFAULT_POSITION_RATIO,
  TOOLBAR_DEFAULT_SCALE,
  TOOLBAR_DEFAULT_WIDTH_PX,
  TOOLBAR_MAX_SCALE,
  TOOLBAR_MIN_SCALE,
} from "../../constants.js";

export type { ToolbarState };
export type SnapEdge = "top" | "bottom" | "left" | "right";

const STORAGE_KEY = "ui-grab-toolbar-state";

const isHorizontalEdge = (edge: SnapEdge) =>
  edge === "top" || edge === "bottom";

const readFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const clampToolbarScale = (value: number): number =>
  Math.max(TOOLBAR_MIN_SCALE, Math.min(TOOLBAR_MAX_SCALE, value));

export const resolveToolbarDimensions = (
  state: Partial<ToolbarState> | null | undefined,
  edge: SnapEdge,
): { width?: number; height?: number } => {
  const width = readFiniteNumber(state?.width);
  const height = readFiniteNumber(state?.height);
  const legacySize = readFiniteNumber(state?.size);

  return {
    width:
      width ??
      (legacySize !== undefined && isHorizontalEdge(edge) ? legacySize : undefined),
    height:
      height ??
      (legacySize !== undefined && !isHorizontalEdge(edge) ? legacySize : undefined),
  };
};

export const resolveToolbarScale = (
  state: Partial<ToolbarState> | null | undefined,
  _edge: SnapEdge,
): number => {
  const scale = readFiniteNumber(state?.scale);
  if (scale !== undefined) {
    return clampToolbarScale(scale);
  }

  const ratios: number[] = [];
  const width = readFiniteNumber(state?.width);
  const height = readFiniteNumber(state?.height);
  const legacySize = readFiniteNumber(state?.size);

  if (width !== undefined && TOOLBAR_DEFAULT_WIDTH_PX > 0) {
    ratios.push(width / TOOLBAR_DEFAULT_WIDTH_PX);
  }
  if (height !== undefined && TOOLBAR_DEFAULT_HEIGHT_PX > 0) {
    ratios.push(height / TOOLBAR_DEFAULT_HEIGHT_PX);
  }
  if (ratios.length === 0 && legacySize !== undefined) {
    if (TOOLBAR_DEFAULT_WIDTH_PX > 0) {
      ratios.push(legacySize / TOOLBAR_DEFAULT_WIDTH_PX);
    }
  }

  if (ratios.length === 0) {
    return TOOLBAR_DEFAULT_SCALE;
  }

  return clampToolbarScale(
    ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length,
  );
};

export const loadToolbarState = (): ToolbarState | null => {
  try {
    const serializedToolbarState = localStorage.getItem(STORAGE_KEY);
    if (!serializedToolbarState) return null;

    const parsed: unknown = JSON.parse(serializedToolbarState);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const edge: SnapEdge =
      record.edge === "top" ||
      record.edge === "bottom" ||
      record.edge === "left" ||
      record.edge === "right"
        ? record.edge
        : "bottom";
    const rawWidth = readFiniteNumber(record.width);
    const rawHeight = readFiniteNumber(record.height);
    const size = readFiniteNumber(record.size);
    const { width, height } = resolveToolbarDimensions(
      {
        width: rawWidth,
        height: rawHeight,
        size,
      },
      edge,
    );
    return {
      edge,
      ratio:
        typeof record.ratio === "number"
          ? record.ratio
          : TOOLBAR_DEFAULT_POSITION_RATIO,
      collapsed:
        typeof record.collapsed === "boolean" ? record.collapsed : false,
      enabled: typeof record.enabled === "boolean" ? record.enabled : true,
      scale: resolveToolbarScale(
        {
          scale: readFiniteNumber(record.scale),
          width: rawWidth,
          height: rawHeight,
          size,
        },
        edge,
      ),
      width,
      height,
      size,
      defaultAction:
        typeof record.defaultAction === "string"
          ? record.defaultAction
          : DEFAULT_ACTION_ID,
    };
  } catch (error) {
    console.warn(
      "[ui-grab] Failed to load toolbar state from localStorage:",
      error,
    );
  }
  return null;
};

export const saveToolbarState = (state: ToolbarState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn(
      "[ui-grab] Failed to save toolbar state to localStorage:",
      error,
    );
  }
};
