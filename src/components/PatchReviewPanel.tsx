import { Check, ClipboardCopy, FileDiff, ShieldCheck, X } from "lucide-react";
import { buildDiffRows } from "../lib/diffBuilder";
import type { PatchReviewState } from "../types/patches";

interface Props {
  reviews: PatchReviewState[];
  selectedId?: string;
  isApplying: boolean;
  onSelect: (id: string) => void;
  onValidate: () => Promise<void>;
  onDecision: (id: string, status: "accepted" | "rejected") => void;
  onApply: () => Promise<void>;
}

export default function PatchReviewPanel({ reviews, selectedId, isApplying, onSelect, onValidate, onDecision, onApply }: Props) {
  const selected = reviews.find((review) => review.id === selectedId) ?? reviews[0];
  const acceptedCount = reviews.filter((review) => review.reviewStatus === "accepted").length;
  const pendingCount = reviews.filter((review) => ["pending_review", "validated"].includes(review.reviewStatus)).length;
  const appliedCount = reviews.filter((review) => review.reviewStatus === "applied").length;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Patch Review</div>
          <h3>Validate, diff, accept, apply workspace copies only</h3>
        </div>
        <div className="buttonRow">
          <button className="smallBtn" onClick={onValidate}><ShieldCheck size={14} /> Validate patches</button>
          <button className="smallBtn success" disabled={!acceptedCount || isApplying} onClick={onApply}>
            {isApplying ? "Applying..." : "Apply accepted patches"}
          </button>
        </div>
      </div>

      <div className="aiStats">
        <span>{reviews.length} suggestions</span>
        <span>{pendingCount} pending/validated</span>
        <span>{acceptedCount} accepted</span>
        <span>{appliedCount} applied</span>
      </div>

      {!reviews.length && <div className="emptyState">No validated AI suggestions persisted yet. Validate an AI response above to create patch reviews.</div>}

      {!!reviews.length && (
        <div className="patchReviewLayout">
          <div className="patchReviewList">
            {reviews.map((review) => (
              <button key={review.id} className={`patchReviewItem ${review.id === selected?.id ? "selected" : ""}`} onClick={() => onSelect(review.id)}>
                <span className="mono muted">{review.suggestion.targetFilePath}</span>
                <strong>{review.suggestion.title}</strong>
                <span className={`statusBadge ${review.reviewStatus}`}>{review.reviewStatus}</span>
                {review.validation && <span className={`statusBadge ${review.validation.status}`}>{review.validation.status}</span>}
              </button>
            ))}
          </div>

          {selected && (
            <article className="patchDiffPanel">
              <div className="suggestionTop">
                <span className={`risk ${selected.suggestion.risk}`}>{selected.suggestion.risk} risk</span>
                <span className="mono">{selected.suggestion.changeType}</span>
              </div>
              <h3>{selected.suggestion.title}</h3>
              <p>{selected.suggestion.reason}</p>
              {selected.validation ? (
                <div className={`validation ${selected.validation.canApply ? "ok" : "bad"}`}>
                  {selected.validation.message}
                  {selected.validation.matchLocations.length > 0 && (
                    <div className="matchList">
                      {selected.validation.matchLocations.map((match) => (
                        <span key={`${match.line}-${match.preview}`} className="mono">line {match.line}: {match.preview}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="validation bad">Not validated yet. Validation required before accept/apply.</div>
              )}

              <div className="diffShell">
                <div className="diffHeader">
                  <FileDiff size={15} />
                  <span>{selected.validation?.targetFilePath ?? selected.suggestion.targetFilePath}</span>
                </div>
                <div className="diffGrid sideBySide">
                  <strong>Workspace current</strong>
                  <strong>Proposed</strong>
                  {buildDiffRows(selected.validation).map((row) => (
                    <DiffRow key={`${row.line}-${row.kind}`} row={row} />
                  ))}
                  {!selected.validation?.originalSnippet && <div className="emptyState">No diff available for manual/report-only suggestion.</div>}
                </div>
              </div>

              {!!selected.suggestion.manualSteps?.length && (
                <div className="manualSteps">
                  <strong>Manual steps</strong>
                  {selected.suggestion.manualSteps.map((step) => <span key={step}>{step}</span>)}
                </div>
              )}
              {!!selected.suggestion.testingNotes?.length && <p className="muted">Testing: {selected.suggestion.testingNotes.join(" ")}</p>}
              {selected.error && <div className="validation bad">{selected.error}</div>}

              <div className="buttonRow">
                <button className="smallBtn" onClick={() => void navigator.clipboard?.writeText(JSON.stringify(selected.suggestion, null, 2))}>
                  <ClipboardCopy size={14} /> Copy JSON
                </button>
                <button
                  className="smallBtn success"
                  disabled={!selected.validation?.canApply || selected.reviewStatus === "applied"}
                  onClick={() => {
                    if (selected.suggestion.risk === "high" && !window.confirm("High-risk patch. Accept only after manual review of the diff and testing notes.")) return;
                    onDecision(selected.id, "accepted");
                  }}
                >
                  <Check size={14} /> Accept patch
                </button>
                <button className="smallBtn danger" disabled={selected.reviewStatus === "applied"} onClick={() => onDecision(selected.id, "rejected")}>
                  <X size={14} /> Reject patch
                </button>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

function DiffRow({ row }: { row: ReturnType<typeof buildDiffRows>[number] }) {
  const label = row.kind === "same" ? "Same" : row.kind === "added" ? "Added" : row.kind === "removed" ? "Removed" : "Changed";
  return (
    <>
      <pre className={`diffCell ${row.kind}`}><span>{label}</span>{row.original || " "}</pre>
      <pre className={`diffCell ${row.kind}`}><span>{label}</span>{row.proposed || " "}</pre>
    </>
  );
}
