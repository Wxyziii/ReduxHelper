import { fileRelationships } from "../lib/fileRelationships";
import type { ReduxProject } from "../types/project";

export default function FileRelationshipsPanel({ project, fileId }: { project: ReduxProject; fileId?: string }) {
  const relations = fileId ? fileRelationships(project, fileId) : [];
  return (
    <section className="panel">
      <div className="uppercaseLabel">Relationships</div>
      {relations.map((item, index) => (
        <div key={`${item.kind}-${index}`} className="activityRow">
          <span>{item.kind}: {item.label}</span>
          <span className="mono">{item.detail}</span>
        </div>
      ))}
      {!relations.length && <div className="emptyMini">No relationships selected.</div>}
    </section>
  );
}
