/**
 * Logger utility for HoverTV Frontend.
 * Enforces structured format: [UI:module:function] message
 */

export function logInfo(module: string, fn: string, message: string): void {
  console.log(`[UI:${module}:${fn}] ${message}`);
}

export function logWarn(module: string, fn: string, message: string): void {
  console.warn(`[UI:${module}:${fn}] ${message}`);
}

export function logBoundaryError(module: string, fn: string, err: unknown, context?: string): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const details = context ? ` | ${context}` : '';
  console.error(`[UI:${module}:${fn}] ERROR: ${errMsg}${details}`);
}
