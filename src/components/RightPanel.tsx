import { Lightbulb } from "lucide-react";
import { getSectionStats } from "../lib/sectionStats";
import type { ReduxProject, SectionId } from "../types/project";

interface Props {
  project: ReduxProject;
  activePage: SectionId;
}

export default function RightPanel({ project, activePage }: Props) {
  const section = project.sections[activePage];
  const stats = getSectionStats(project, activePage);
  const currentFile = project.files.find((file) => file.section === activePage) ?? project.files[0];

  return (
    <aside className="rightPanel">
      <section>
        <div className="uppercaseLabel panelTitle">Section Status</div>
        <div className="statGroup">
          <Stat label="Files added" value={stats.files} />
          <Stat label="AI suggestions" value={stats.suggestions} tone="ai" />
          <Stat label="Accepted" value={stats.accepted} tone="success" />
          <Stat label="Rejected" value={stats.rejected} />
          <Stat label="Warnings" value={stats.warnings} tone="warning" />
          <Stat label="Export ready" value={stats.exportReady ? "Yes" : "No"} tone={stats.exportReady ? "success" : "muted"} />
        </div>
      </section>
      <section>
        <div className="uppercaseLabel panelTitle">Current File</div>
        {currentFile ? (
          <div className="statGroup">
            <Stat label="Name" value={currentFile.fileName} mono />
            <Stat label="Type" value={currentFile.extension.toUpperCase()} mono />
            <Stat label="Status" value={currentFile.status} />
          </div>
        ) : (
          <div className="emptyMini">No imported files.</div>
        )}
      </section>
      <section className="grow">
        <div className="uppercaseLabel panelTitle">Safety Model</div>
        <div className="smallList">
          <span>Original source files: never modified</span>
          <span>Workspace cache: previews and scans</span>
          <span>Export folder: accepted copies only</span>
          <span>Manifest: required for every package</span>
        </div>
      </section>
      <div className="tipBox">
        <Lightbulb size={18} />
        <p>{section.id === "textures" ? "DDS metadata warnings stay visible until converter inspection confirms format, alpha, and mipmaps." : "Review failed or high-risk patches before export. Binary files get manual notes, not direct edits."}</p>
      </div>
    </aside>
  );
}

function Stat({ label, value, tone, mono }: { label: string; value: string | number; tone?: string; mono?: boolean }) {
  return (
    <div className="statRow">
      <span>{label}</span>
      <strong className={`${tone ?? ""} ${mono ? "mono" : ""}`}>{value}</strong>
    </div>
  );
}
