import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, ExternalLink, FileJson, ShieldCheck } from "lucide-react";
import ExportPreview from "../components/ExportPreview";
import PageHeader from "../components/PageHeader";
import WarningPanel from "../components/WarningPanel";
import HelpBlock from "../components/ui/HelpBlock";
import { buildExportPreview, openExportFolder } from "../lib/exportApi";
import { createExportPreview } from "../lib/exportManager";
import type { ExportPreviewModel } from "../types/exports";
import type { ReduxProject } from "../types/project";

export default function ExportPage({
  project,
  actions
}: {
  project: ReduxProject;
  actions: { exportProject: (exportName?: string, includeReports?: boolean, includeAllBackups?: boolean, conflictStrategy?: string) => Promise<void> };
}) {
  const [exportName, setExportName] = useState("Redux_AI_Atmosphere_v1");
  const [includeReports, setIncludeReports] = useState(true);
  const [includeAllBackups, setIncludeAllBackups] = useState(false);
  const [filter, setFilter] = useState<"included" | "excluded" | "warnings" | "all">("all");
  const [preview, setPreview] = useState<ExportPreviewModel>(() => createExportPreview(project, exportName, { includeReports, includeAllBackups }).preview);
  const [completedPath, setCompletedPath] = useState("");
  const { manifest, tree } = useMemo(() => createExportPreview(project, exportName, { includeReports, includeAllBackups }), [project, exportName, includeReports, includeAllBackups]);

  useEffect(() => {
    let live = true;
    void buildExportPreview(project, exportName, includeReports, includeAllBackups).then((next) => {
      if (live) setPreview(next);
    });
    return () => {
      live = false;
    };
  }, [project, exportName, includeReports, includeAllBackups]);

  const shownIncluded = filter === "all" || filter === "included";
  const shownExcluded = filter === "all" || filter === "excluded";
  const shownWarnings = filter === "all" || filter === "warnings";

  return (
    <div className="page">
      <PageHeader title="Export" description="Create manual export package. No automatic install, no archive writes, no original file writes." />
      <WarningPanel warnings={preview.blockers.length ? preview.blockers : preview.warnings.slice(0, 6)} />
      <HelpBlock title="How to use this export">
        <p>This page creates a manual package only. It does not install files, edit game folders, or write to `.rpf` archives. Review `warnings.md`, then use `install_notes.txt` to map `edited_files/` and `compiled_textures/` into your modding tool manually.</p>
      </HelpBlock>

      <section className="panel">
        <div className="formGrid">
          <label>
            <span className="uppercaseLabel">Export name</span>
            <input value={exportName} onChange={(event) => setExportName(event.target.value)} />
          </label>
          <label>
            <span className="uppercaseLabel">Output folder</span>
            <input value={preview.outputFolder} readOnly />
          </label>
        </div>
        <div className="checkGrid">
          <label className="checkRow"><input type="checkbox" checked={includeReports} onChange={(event) => setIncludeReports(event.target.checked)} /> Include reports</label>
          <label className="checkRow"><input type="checkbox" checked={includeAllBackups} onChange={(event) => setIncludeAllBackups(event.target.checked)} /> Include all backups</label>
        </div>
        <div className="buttonRow">
          {(["all", "included", "excluded", "warnings"] as const).map((item) => (
            <button key={item} className={`smallBtn ${filter === item ? "filled" : ""}`} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="aiStats">
          <span>{preview.estimatedFileCount} files est.</span>
          <span>{Math.round(preview.estimatedExportSizeBytes / 1024)} KB est.</span>
          <span>{preview.includedSections.join(", ") || "no sections"}</span>
          <span>{preview.unappliedAcceptedPatches} accepted unapplied</span>
          <span>{preview.highRiskChanges} high-risk</span>
        </div>
        <button
          className="exportBtn"
          disabled={preview.blockers.length > 0}
          onClick={async () => {
            await actions.exportProject(exportName, includeReports, includeAllBackups, "version");
            setCompletedPath(preview.outputFolder);
          }}
        >
          <Download size={16} /> Create export package
        </button>
        <div className="infoStrip"><ShieldCheck size={15} /> Export writes only under project exports folder. `update.rpf` and original paths are never destinations.</div>
      </section>

      <section className="exportGrid">
        <div className="panel">
          <div className="uppercaseLabel">Included / Excluded</div>
          {shownIncluded && preview.includedFiles.map((file) => (
            <div key={file.id} className="activityRow">
              <span>{file.type}</span>
              <span className="mono">{file.outputRelativePath}</span>
            </div>
          ))}
          {shownIncluded && !preview.includedFiles.length && <div className="emptyMini">No eligible files.</div>}
          {shownExcluded && preview.excludedItems.map((item) => (
            <div key={item.id} className="activityRow">
              <span>{item.reason}</span>
              <span className="mono">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="uppercaseLabel">Warnings / Install Notes</div>
          {shownWarnings && preview.warnings.map((warning) => <div key={warning} className="validation bad">{warning}</div>)}
          <pre className="manifest">{preview.installNotesPreview}</pre>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Manifest Preview</div>
            <h3>manifest.json</h3>
          </div>
          <FileJson size={16} />
        </div>
        <pre className="manifest">{JSON.stringify(preview.manifestPreview, null, 2)}</pre>
      </section>

      {completedPath && (
        <section className="exportResult">
          <CheckCircle2 size={16} />
          <div>
            <strong>Export package requested</strong>
            <p>{completedPath}</p>
            <div className="buttonRow">
              <button className="smallBtn" onClick={() => void openExportFolder(completedPath)}><ExternalLink size={14} /> Open folder</button>
              <button className="smallBtn" onClick={() => void navigator.clipboard?.writeText(completedPath)}><Copy size={14} /> Copy path</button>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="uppercaseLabel">Export History</div>
        {(project.exportHistory ?? []).slice(0, 8).map((entry) => (
          <div key={entry.exportId} className="activityRow">
            <span>{entry.status}: {entry.exportName}</span>
            <span className="mono">{entry.exportPath}</span>
          </div>
        ))}
        {!project.exportHistory?.length && <div className="emptyMini">No exports yet.</div>}
      </section>

      <ExportPreview manifest={{ ...manifest, sectionsIncluded: preview.includedSections as never }} tree={tree} />
    </div>
  );
}
