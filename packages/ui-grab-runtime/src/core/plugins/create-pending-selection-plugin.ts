import type {
  Plugin,
  UiGrabAPI,
  ActionContextHooks,
  ContextMenuAction,
} from "../../types.js";

type ContextMenuActionFactory =
  | ContextMenuAction
  | ((api: UiGrabAPI, hooks: ActionContextHooks) => ContextMenuAction);

interface PendingSelectionPluginConfig {
  name: string;
  contextMenuAction: ContextMenuActionFactory;
  cleanup?: () => void;
}

export const createPendingSelectionPlugin = (
  config: PendingSelectionPluginConfig,
): Plugin => ({
  name: config.name,
  setup: (api, hooks) => {
    const resolvedContextMenuAction =
      typeof config.contextMenuAction === "function"
        ? config.contextMenuAction(api, hooks)
        : config.contextMenuAction;

    return {
      actions: [resolvedContextMenuAction],
      cleanup: config.cleanup,
    };
  },
});
