import { AlertTriangle, CheckCircle2, Clock, Download, FileText } from "lucide-react";
import AiHistoryPanel from "../components/AiHistoryPanel";
import PageHeader from "../components/PageHeader";
import SectionStatusCard from "../components/SectionStatusCard";
import ToolSetupCenter from "../components/ToolSetupCenter";
import WorkflowGuide from "../components/guides/WorkflowGuide";
import EmptyState from "../components/ui/EmptyState";
import { sectionOrder } from "../data/mockSections";
import { projectHealth } from "../lib/projectDiagnostics";
import type { ReduxProject, SectionId } from "../types/project";

export default function DashboardPage({
  project,
  setActivePage,
  actions,
  message
}: {
  project: ReduxProject;
  setActivePage: (page: SectionId) => void;
  actions: {
    createProject: () => Promise<void>;
    openProject: () => Promise<void>;
    importFiles: () => Promise<void>;
    importFolder: () => Promise<void>;
    scanProject: () => Promise<void>;
  };
  message: string;
}) {
  const accepted = (project.patchReviews ?? []).filter((patch) => patch.reviewStatus === "accepted");
  const applied = (project.patchReviews ?? []).filter((patch) => patch.reviewStatus === "applied");
  const failed = (project.patchReviews ?? []).filter((patch) => patch.reviewStatus === "failed");
  const pending = (project.patchReviews ?? []).filter((patch) => ["pending_review", "validated"].includes(patch.reviewStatus));
  const warnings = project.files.flatMap((file) => file.warnings).length + failed.length;
  const lastExport = project.exportHistory?.[0];
  const exportReadyTextures = (project.textures ?? []).filter((texture) => texture.exportReady).length;
  const health = projectHealth(project);

  return (
    <div className="page">
      <PageHeader
        title="Dashboard Overview"
        description="Local project state, copied workspace files, scan results, safety checks, AI suggestions, and export readiness."
        actions={
          <>
            <button className="actionBtn" onClick={actions.createProject}>Create Project</button>
            <button className="actionBtn" onClick={actions.openProject}>Open Project</button>
            <button className="actionBtn" onClick={actions.importFiles}>Import Files</button>
            <button className="actionBtn" onClick={actions.importFolder}>Import Folder</button>
            <button className="actionBtn filled" onClick={actions.scanProject}>Scan Project</button>
          </>
        }
      />
      <div className="infoStrip">{message}</div>
      {!project.files.length && (
        <EmptyState
          title="No files imported yet"
          message="Start by importing exported GTA files or read-only archive extractions into the project workspace."
          safety="Original files and .rpf archives remain untouched."
          action={<button className="smallBtn filled" onClick={actions.importFiles}>Import Files</button>}
          secondary={<button className="smallBtn" onClick={actions.importFolder}>Import Folder</button>}
        />
      )}
      {project.projectRoot && (
        <div className="panel">
          <div className="uppercaseLabel">Project Workspace</div>
          <div className="pathGrid">
            <span>Root</span><strong className="mono">{project.projectRoot}</strong>
            <span>project.json</span><strong className="mono">{project.projectJsonPath}</strong>
            <span>Workspace copies</span><strong className="mono">{project.workspacePath}</strong>
          </div>
        </div>
      )}
      <div className="metricGrid">
        <Metric icon={<FileText size={18} />} label="Files loaded" value={project.files.length} sub="Section assigned" />
        <Metric icon={<CheckCircle2 size={18} />} label="Accepted patches" value={accepted.length} sub={`${applied.length} applied`} tone="success" />
        <Metric icon={<AlertTriangle size={18} />} label="Warnings" value={warnings} sub="Review before export" tone="warning" />
        <Metric icon={<Download size={18} />} label="Export ready" value={applied.length + exportReadyTextures} sub={lastExport ? `Last: ${lastExport.exportName}` : `${pending.length} pending review`} tone="ai" />
      </div>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Project Health</div>
            <h3>{health.status}</h3>
          </div>
        </div>
        <div className="aiStats">
          <span>{health.readableFiles} readable</span>
          <span>{health.unsupportedFiles} unsupported</span>
          <span>{health.scannedFiles} scanned</span>
          <span>{health.unscannedFiles} unscanned</span>
          <span>{health.conflictsCount} conflicts</span>
          <span>{health.exportReadyTextures} export-ready textures</span>
          <span>last export: {health.lastExportStatus ?? "none"}</span>
        </div>
      </section>

      <ToolSetupCenter project={project} onOpenSettings={setActivePage} />
      <WorkflowGuide onOpen={setActivePage} />

      <div className="dashboardGrid">
        <section className="panel wide">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">Sections</div>
              <h3>Progress list</h3>
            </div>
          </div>
          <div className="sectionGrid">
            {sectionOrder.filter((id) => !["dashboard", "settings"].includes(id)).map((id) => (
              <SectionStatusCard key={id} project={project} sectionId={id} onOpen={setActivePage} />
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="uppercaseLabel">Recent Activity</div>
          <div className="activityList">
            {(project.changelogEntries ?? []).slice(-5).reverse().map((entry) => (
              <Activity key={entry.id} text={`${entry.suggestionTitle} -> ${entry.filePath}`} time={entry.timestamp} />
            ))}
            {!project.changelogEntries?.length && <Activity text="No applied patch changelog yet" time="-" />}
          </div>
        </section>
        <section className="panel">
          <div className="uppercaseLabel">Next Action</div>
          <div className="nextAction">
            <Clock size={20} />
            <strong>{applied.length || exportReadyTextures ? "Create export package" : "Review pending patches"}</strong>
            <p>{applied.length || exportReadyTextures ? "Open Export, review blockers/warnings, then write manual package." : "Accept only validated changes, then open Export for manifest and folder tree preview."}</p>
          </div>
        </section>
        <section className="panel">
          <div className="uppercaseLabel">Recent Exports</div>
          <div className="activityList">
            {(project.exportHistory ?? []).slice(0, 4).map((entry) => (
              <Activity key={entry.exportId} text={`${entry.status}: ${entry.exportName}`} time={entry.createdAt} />
            ))}
            {!project.exportHistory?.length && <Activity text="No export packages yet" time="-" />}
          </div>
        </section>
        <AiHistoryPanel history={project.aiHistory ?? []} />
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string | number; sub: string; tone?: string }) {
  return (
    <div className="metricCard">
      <div className={tone ?? ""}>{icon}</div>
      <div className="uppercaseLabel">{label}</div>
      <strong className={tone ?? ""}>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function Activity({ text, time }: { text: string; time: string }) {
  return (
    <div className="activityRow">
      <span>{text}</span>
      <span className="mono">{time}</span>
    </div>
  );
}
