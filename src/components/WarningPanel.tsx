import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function WarningPanel({ title = "Warnings", warnings }: { title?: string; warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <div className="warningPanel">
      <ShieldAlert size={18} />
      <div>
        <h3>{title}</h3>
        {warnings.map((warning) => (
          <p key={warning}><AlertTriangle size={13} /> {warning}</p>
        ))}
      </div>
    </div>
  );
}
