import type { AppErrorInfo } from "./errors";

export type OperationStatus = "running" | "completed" | "failed" | "cancelled";

export interface OperationTask {
  id: string;
  label: string;
  status: OperationStatus;
  progress?: number;
  step?: string;
  startedAt: string;
  finishedAt?: string;
  cancellable: boolean;
  error?: AppErrorInfo;
}
