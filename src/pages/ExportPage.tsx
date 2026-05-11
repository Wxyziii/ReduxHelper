import { useMemo, useState } from "react";
import { CheckCircle2, Download, ShieldCheck } from "lucide-react";
import ExportPreview from "../components/ExportPreview";
import PageHeader from "../components/PageHeader";
import WarningPanel from "../components/WarningPanel";
import { createExportPreview } from "../lib/exportManager";
import type { ReduxProject, SectionId } from "../types/project";

export default function ExportPage({ project, actions }: { project: ReduxProject; actions: { exportProject: () => Promise<void> } }) {
  const [exportName, setExportName] = useState("Redux_AI_Atmosphere_v1");
  const [includeTextures, setIncludeTextures] = useState(true);
  const [completed, setCompleted] = useState(false);
  const { manifest, tree } = useMemo(() => createExportPreview(project, exportName), [project, exportName]);
  const included = new Set<SectionId>(manifest.sectionsIncluded);
  if (includeTextures) included.add("textures");
  const applied = project.changelogEntries ?? [];
  const acceptedUnapplied = (project.patchReviews ?? []).filter((review) => review.reviewStatus === "accepted");

  return (
    <div className="page">
      <PageHeader title="Export" description="Final review screen. Accepted edits export as copies with backups, reports, install notes, changelog, and manifest." />
      <WarningPanel warnings={manifest.warnings} />
      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Applied Workspace Changes</div>
            <h3>Patch state before export</h3>
          </div>
        </div>
        <div className="aiStats">
          <span>{applied.length} applied changes</span>
          <span>{project.backups?.length ?? 0} backups</span>
          <span>{acceptedUnapplied.length} accepted but unapplied</span>
        </div>
        {!!acceptedUnapplied.length && <div className="validation bad">Accepted patches remain unapplied. Apply or reject before final export.</div>}
        <div className="activityList">
          {applied.slice(-6).reverse().map((entry) => (
            <div key={entry.id} className="activityRow">
              <span>{entry.suggestionTitle}</span>
              <span className="mono">{entry.filePath}</span>
            </div>
          ))}
          {!applied.length && <div className="emptyState">No workspace patches applied yet.</div>}
        </div>
      </section>
      <section className="panel">
        <div className="formGrid">
          <label>
            <span className="uppercaseLabel">Export name</span>
            <input value={exportName} onChange={(event) => setExportName(event.target.value)} />
          </label>
          <label>
            <span className="uppercaseLabel">Output folder</span>
            <input value={`${project.settings.exportDirectory}/${exportName}`} readOnly />
          </label>
        </div>
        <div className="checkGrid">
          {(["timecycle", "tracers", "hitEffects", "optimization", "textures"] as SectionId[]).map((id) => (
            <label key={id} className="checkRow">
              <input
                type="checkbox"
                checked={id === "textures" ? includeTextures : included.has(id)}
                onChange={(event) => {
                  if (id === "textures") {
                    setIncludeTextures(event.target.checked);
                    setCompleted(false);
                  }
                }}
                disabled={id !== "textures"}
              />
              <span>{project.sections[id].name}</span>
            </label>
          ))}
        </div>
        <button
          className="exportBtn"
          onClick={() => {
            setCompleted(true);
            void actions.exportProject();
          }}
        >
          <Download size={16} /> Mock export package
        </button>
        {completed && (
          <div className="exportResult">
            <CheckCircle2 size={16} />
            <div>
              <strong>Mock export complete</strong>
              <p>{`${project.settings.exportDirectory}/${exportName}`} staged with edited copies, original backups, reports, manifest, install notes, and changelog.</p>
            </div>
          </div>
        )}
        <div className="infoStrip"><ShieldCheck size={15} /> No original source path is written. Old exports are never overwritten without confirmation.</div>
      </section>
      <ExportPreview manifest={{ ...manifest, sectionsIncluded: Array.from(included) }} tree={tree} />
    </div>
  );
}
