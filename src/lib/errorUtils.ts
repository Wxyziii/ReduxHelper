import type { AppErrorInfo } from "../types/errors";

export function toAppError(error: unknown, defaults: Partial<AppErrorInfo> = {}): AppErrorInfo {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    code: defaults.code ?? "APP_UNEXPECTED_ERROR",
    title: defaults.title ?? "Operation failed",
    message: defaults.message ?? err.message,
    technicalDetails: defaults.technicalDetails ?? err.stack,
    severity: defaults.severity ?? "error",
    operation: defaults.operation,
    path: defaults.path,
    recoverable: defaults.recoverable ?? true,
    suggestedAction: defaults.suggestedAction ?? "Retry the operation. If it keeps failing, save the project and check logs.",
    timestamp: new Date().toISOString()
  };
}

export function errorToText(error: AppErrorInfo) {
  return `${error.code}: ${error.title}\n${error.message}\n${error.technicalDetails ?? ""}`;
}
