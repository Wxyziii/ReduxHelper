import { AlertTriangle, CheckCircle2, Clock, Download, FileText } from "lucide-react";
import AiHistoryPanel from "../components/AiHistoryPanel";
import PageHeader from "../components/PageHeader";
import SectionStatusCard from "../components/SectionStatusCard";
import { sectionOrder } from "../data/mockSections";
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
        <Metric icon={<Download size={18} />} label="Pending review" value={pending.length} sub="Validate before apply" tone="ai" />
      </div>

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
            <strong>Review pending patches</strong>
            <p>Accept only validated changes, then open Export for manifest and folder tree preview.</p>
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
