export type AppErrorSeverity = "info" | "warning" | "error" | "critical";

export interface AppErrorInfo {
  code: string;
  title: string;
  message: string;
  technicalDetails?: string;
  severity: AppErrorSeverity;
  operation?: string;
  path?: string;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: string;
}
