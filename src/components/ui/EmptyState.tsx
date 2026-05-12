import type { ReactNode } from "react";

export default function EmptyState({ title, message, action, secondary, safety }: { title: string; message: string; action?: ReactNode; secondary?: ReactNode; safety?: string }) {
  return (
    <div className="emptyState richEmpty">
      <strong>{title}</strong>
      <p>{message}</p>
      {safety && <small>{safety}</small>}
      {(action || secondary) && <div className="buttonRow">{action}{secondary}</div>}
    </div>
  );
}
