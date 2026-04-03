export interface UiGrabAgentContext {
  content: string[];
  prompt?: string;
  options?: unknown;
  sessionId?: string;
}

export interface UiGrabPlugin {
  name: string;
  hooks?: {
    onCopySuccess?: (elements: Element[], content: string) => void;
    transformAgentContext?: (
      context: UiGrabAgentContext,
      elements: Element[],
    ) => UiGrabAgentContext | Promise<UiGrabAgentContext>;
  };
}

export interface ReactGrabAPI {
  registerPlugin: (plugin: UiGrabPlugin) => void;
}
