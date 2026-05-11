import { mockProject, mockPatches } from "../data/mockProject";
import { sections } from "../data/mockSections";
import { makeBrowserImportedFile } from "./fileImport";
import { scanText } from "./fileScanner";
import type { ReduxProject } from "../types/project";

export function createBrowserProject(projectName: string): ReduxProject {
  const now = new Date().toISOString();
  return {
    ...mockProject,
    version: "0.2.0",
    projectId: `browser-project-${Date.now()}`,
    projectName: projectName || "Browser Mock Project",
    createdAt: now,
    updatedAt: now,
    saveStatus: "Saved",
    notes: "Browser fallback project. Tauri app uses real local project folders.",
    projectRoot: "browser-mock/ReduxAIProjects/Browser_Mock_Project",
    projectJsonPath: "browser-mock/ReduxAIProjects/Browser_Mock_Project/project.json",
    workspacePath: "browser-mock/ReduxAIProjects/Browser_Mock_Project/workspace",
    sections,
    files: [],
    aiHistory: [],
    patches: mockPatches,
    textures: []
  };
}

export function importBrowserFile(project: ReduxProject, relativePath: string): ReduxProject {
  const file = makeBrowserImportedFile(relativePath);
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    saveStatus: "Saved",
    files: [...project.files.filter((item) => item.relativePath !== file.relativePath), file]
  };
}

export function scanBrowserProject(project: ReduxProject): ReduxProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    saveStatus: "Saved",
    files: project.files.map((file) =>
      file.status === "text-readable" && file.preview ? { ...file, scanMatches: scanText(file, file.preview) } : { ...file, scanMatches: [] }
    )
  };
}
