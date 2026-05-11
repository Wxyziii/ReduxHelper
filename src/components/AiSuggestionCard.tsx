import { Check, ClipboardCopy, Eye, X } from "lucide-react";
import { useState } from "react";
import type { PatchStatus, PatchSuggestion } from "../types/project";

interface Props {
  patch: PatchSuggestion;
  selected: boolean;
  onReview: () => void;
  onStatus: (status: PatchStatus) => void;
}

export default function AiSuggestionCard({ patch, selected, onReview, onStatus }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPatch() {
    const payload = JSON.stringify(patch, null, 2);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(payload);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <article className={`suggestionCard ${selected ? "selected" : ""}`}>
      <div className="suggestionTop">
        <span className="mono muted">{patch.filePath}</span>
        <span className={`risk ${patch.risk}`}>{patch.risk} risk</span>
      </div>
      <h3>{patch.summary}</h3>
      <p>{patch.reason}</p>
      <div className={`validation ${patch.validation.ok ? "ok" : "bad"}`}>{patch.validation.reason}</div>
      <div className="buttonRow">
        <button className="smallBtn" onClick={onReview}><Eye size={14} /> Review</button>
        <button className="smallBtn" title="Copy patch JSON" onClick={copyPatch}><ClipboardCopy size={14} /> {copied ? "Copied" : "Copy patch"}</button>
        <button className="smallBtn success" disabled={!patch.validation.ok || patch.status === "accepted"} onClick={() => onStatus("accepted")}><Check size={14} /> Accept</button>
        <button className="smallBtn danger" disabled={patch.status === "rejected"} onClick={() => onStatus("rejected")}><X size={14} /> Reject</button>
      </div>
      <div className="statusLine">Status: <strong className={`statusBadge ${patch.status}`}>{patch.status}</strong></div>
    </article>
  );
}
