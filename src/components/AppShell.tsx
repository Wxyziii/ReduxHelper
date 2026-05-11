import type { ReactNode } from "react";
import RightPanel from "./RightPanel";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { ReduxProject, SectionId } from "../types/project";

interface Props {
  children: ReactNode;
  project: ReduxProject;
  activePage: SectionId;
  setActivePage: (page: SectionId) => void;
  actions: {
    createProject: () => Promise<void>;
    openProject: () => Promise<void>;
    importFiles: () => Promise<void>;
    importFolder: () => Promise<void>;
    scanProject: () => Promise<void>;
    saveProject: () => Promise<void>;
  };
  message: string;
}

export default function AppShell({ children, project, activePage, setActivePage, actions, message }: Props) {
  return (
    <div className="app">
      <TopBar project={project} setActivePage={setActivePage} actions={actions} />
      <div className="statusBanner">{message}</div>
      <div className="appBody">
        <Sidebar project={project} activePage={activePage} setActivePage={setActivePage} />
        <main className="workspace">{children}</main>
        <RightPanel project={project} activePage={activePage} />
      </div>
    </div>
  );
}
