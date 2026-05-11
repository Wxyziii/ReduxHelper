import { Bot, Check, Download, FileInput, FolderInput, FolderOpen, FolderPlus, FolderSearch, Save, Settings, ShieldCheck } from "lucide-react";
import type { ReduxProject, SectionId } from "../types/project";

interface Props {
  project: ReduxProject;
  setActivePage: (page: SectionId) => void;
  actions: {
    createProject: () => Promise<void>;
    openProject: () => Promise<void>;
    importFiles: () => Promise<void>;
    importFolder: () => Promise<void>;
    scanProject: () => Promise<void>;
    saveProject: () => Promise<void>;
  };
}

export default function TopBar({ project, setActivePage, actions }: Props) {
  return (
    <header className="topBar">
      <div className="brandDot" />
      <div className="brand">Redux AI</div>
      <div className="projectPill">{project.projectName}</div>
      <div className={`saveState ${project.saveStatus === "Saved" ? "ok" : "warn"}`}>
        {project.saveStatus === "Saved" ? <Check size={14} /> : <Save size={14} />}
        {project.saveStatus}
      </div>
      <div className="topActions">
        <button className="topBtn" onClick={actions.createProject} title="Create local project">
          <FolderPlus size={15} /> Create
        </button>
        <button className="topBtn" onClick={actions.openProject} title="Open project.json">
          <FolderOpen size={15} /> Open
        </button>
        <button className="topBtn" onClick={actions.importFiles} title="Copy files into workspace">
          <FileInput size={15} /> Import Files
        </button>
        <button className="topBtn" onClick={actions.importFolder} title="Copy folder into workspace">
          <FolderInput size={15} /> Import Folder
        </button>
        <button className="topBtn" onClick={actions.scanProject} title="Scan readable workspace copies">
          <FolderSearch size={15} /> Scan
        </button>
        <button className="topBtn" onClick={() => setActivePage("timecycle")} title="Open AI suggestions">
          <Bot size={15} /> Ask AI
        </button>
        <button className="topBtn filled" onClick={() => setActivePage("export")} title="Export accepted copies">
          <Download size={15} /> Export
        </button>
        <button className="iconBtn" onClick={actions.saveProject} title="Save project.json">
          <ShieldCheck size={17} />
        </button>
        <button className="iconBtn" onClick={() => setActivePage("settings")} title="Settings">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
