import type { AppErrorInfo } from "../types/errors";

export type LogLevel = "info" | "warn" | "error";

export interface LogEvent {
  level: LogLevel;
  event: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const logs: LogEvent[] = [];
const redactedKeys = ["apiKey", "authorization", "token", "password", "prompt"];

export function logEvent(level: LogLevel, event: string, message: string, details?: Record<string, unknown>) {
  logs.unshift({ level, event, message, timestamp: new Date().toISOString(), details: redact(details) });
  logs.splice(250);
}

export function logError(event: string, error: AppErrorInfo) {
  logEvent("error", event, error.message, { code: error.code, operation: error.operation, recoverable: error.recoverable });
}

export function getLogs() {
  return [...logs];
}

export function clearLogs() {
  logs.splice(0);
}

function redact(details?: Record<string, unknown>) {
  if (!details) return undefined;
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [key, redactedKeys.some((item) => key.toLowerCase().includes(item.toLowerCase())) ? "[redacted]" : value]));
}
