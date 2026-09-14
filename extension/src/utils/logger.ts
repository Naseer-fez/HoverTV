/**
 * Logger utility for Browser Extension.
 * Enforces structured format: [EXT:module:function] message
 */

export function logInfo(module: string, fn: string, message: string): void {
  console.log(`[EXT:${module}:${fn}] ${message}`);
}

export function logWarn(module: string, fn: string, message: string): void {
  console.warn(`[EXT:${module}:${fn}] ${message}`);
}

export function logBoundaryError(module: string, fn: string, err: unknown, context?: string): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const details = context ? ` | ${context}` : '';
  console.error(`[EXT:${module}:${fn}] ERROR: ${errMsg}${details}`);
}
