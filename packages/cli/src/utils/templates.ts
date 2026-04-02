export type AgentIntegration = "mcp" | "none";

export const NEXT_APP_ROUTER_SCRIPT = `{process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/ui-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}`;

export const NEXT_PAGES_ROUTER_SCRIPT = NEXT_APP_ROUTER_SCRIPT;

export const VITE_IMPORT = `if (import.meta.env.DEV) {
  import("ui-grab");
}`;

export const WEBPACK_IMPORT = `if (process.env.NODE_ENV === "development") {
  import("ui-grab");
}`;

export const TANSTACK_EFFECT = `useEffect(() => {
    if (import.meta.env.DEV) {
      void import("ui-grab");
    }
  }, []);`;

export const SCRIPT_IMPORT = 'import Script from "next/script";';
