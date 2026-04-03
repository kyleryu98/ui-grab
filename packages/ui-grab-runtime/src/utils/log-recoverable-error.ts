import { isProductionRuntime } from "./runtime-env.js";

export const logRecoverableError = (context: string, error: unknown): void => {
  if (!isProductionRuntime()) {
    console.warn(`[ui-grab] ${context}:`, error);
  }
};
