import debug from "debug";

const logCronyxPlugin = debug("cronyx:plugin");

/**
 * @internal
 */
export function log(formatter: unknown, ...args: unknown[]) {
  logCronyxPlugin(formatter, ...args);
}
