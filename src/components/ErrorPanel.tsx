import { Copy } from "lucide-react";
import { errorToText } from "../lib/errorUtils";
import type { AppErrorInfo } from "../types/errors";

export default function ErrorPanel({ error, onDashboard, onReload }: { error: AppErrorInfo; onDashboard?: () => void; onReload?: () => void }) {
  return (
    <section className="panel errorPanel">
      <div>
        <div className="uppercaseLabel">{error.severity}</div>
        <h3>{error.title}</h3>
        <p>{error.message}</p>
      </div>
      {error.suggestedAction && <div className="infoStrip">{error.suggestedAction}</div>}
      <div className="buttonRow">
        {onDashboard && <button className="smallBtn" onClick={onDashboard}>Go to dashboard</button>}
        {onReload && <button className="smallBtn" onClick={onReload}>Reload project</button>}
        <button className="smallBtn" onClick={() => void navigator.clipboard?.writeText(errorToText(error))}><Copy size={14} /> Copy error details</button>
      </div>
      <pre className="manifest">{error.technicalDetails}</pre>
    </section>
  );
}
