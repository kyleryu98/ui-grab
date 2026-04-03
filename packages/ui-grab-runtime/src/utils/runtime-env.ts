type RuntimeProcess = {
  env?: Record<string, string | undefined>;
};

const runtimeProcess: RuntimeProcess | undefined =
  typeof globalThis !== "undefined" && "process" in globalThis
    ? (globalThis as { process?: RuntimeProcess }).process
    : undefined;

export const getRuntimeEnv = (key: string): string | undefined =>
  runtimeProcess?.env?.[key];

export const isProductionRuntime = (): boolean =>
  getRuntimeEnv("NODE_ENV") === "production";
