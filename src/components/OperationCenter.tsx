import { XCircle } from "lucide-react";
import type { OperationTask } from "../types/operations";

export default function OperationCenter({ operations, onCancel }: { operations: OperationTask[]; onCancel: (id: string) => void }) {
  const visible = operations.slice(0, 8);
  return (
    <section className="panel">
      <div className="uppercaseLabel">Operation Center</div>
      {visible.map((op) => (
        <div key={op.id} className="operationRow">
          <span>{op.label}</span>
          <span>{op.status}</span>
          <progress value={op.progress ?? 0} max={100} />
          <span>{op.step}</span>
          {op.cancellable && op.status === "running" && <button className="iconBtn" onClick={() => onCancel(op.id)}><XCircle size={14} /></button>}
        </div>
      ))}
      {!visible.length && <div className="emptyMini">No recent operations.</div>}
    </section>
  );
}
