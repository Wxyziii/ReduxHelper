import type { AiHistoryEntry } from "../types/ai";
import type { SectionId } from "../types/project";

export default function AiHistoryPanel({ history, sectionId }: { history: AiHistoryEntry[]; sectionId?: SectionId }) {
  const filtered = sectionId ? history.filter((entry) => entry.section === sectionId) : history;
  const recent = filtered.slice(0, 6);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">AI History</div>
          <h3>{sectionId ? "Section requests" : "Recent requests"}</h3>
        </div>
      </div>
      <div className="activityList">
        {recent.map((entry) => (
          <div key={entry.id} className="historyRow">
            <div>
              <strong>{entry.section}</strong>
              <p>{entry.model} / {entry.validationStatus} / {entry.suggestionsCount} suggestions</p>
            </div>
            <span className="mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
        {!recent.length && <div className="emptyState">No AI requests yet.</div>}
      </div>
    </section>
  );
}
