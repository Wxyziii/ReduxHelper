import { toAppError } from "./errorUtils";
import type { OperationTask } from "../types/operations";

export function createOperation(label: string, cancellable = true): OperationTask {
  return { id: `op-${Date.now()}-${Math.random().toString(16).slice(2)}`, label, status: "running", progress: 0, step: "Starting", startedAt: new Date().toISOString(), cancellable };
}

export function completeOperation(task: OperationTask, step = "Done"): OperationTask {
  return { ...task, status: "completed", progress: 100, step, finishedAt: new Date().toISOString() };
}

export function failOperation(task: OperationTask, error: unknown): OperationTask {
  return { ...task, status: "failed", error: toAppError(error, { operation: task.label }), finishedAt: new Date().toISOString() };
}

export function cancelOperation(task: OperationTask): OperationTask {
  return { ...task, status: "cancelled", step: "Cancelled by user; stale result ignored.", finishedAt: new Date().toISOString() };
}
