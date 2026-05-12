import { mockProject, mockPatches } from "../data/mockProject";
import { sections } from "../data/mockSections";
import { makeBrowserImportedFile } from "./fileImport";
import { scanText } from "./fileScanner";
import { guessTextureRole, metadataWarnings, textureRoleWarnings } from "./textureClassifier";
import { isTextureExtension } from "./textureTypes";
import type { ReduxProject } from "../types/project";
import type { TextureAsset } from "../types/textures";

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
    textures: [],
    exportHistory: [],
    imageGenerationHistory: [],
    promptBasket: [],
    diagnostics: [],
    lastIndexedAt: now,
    scanCache: {},
    operationHistory: []
  };
}

export function importBrowserFile(project: ReduxProject, relativePath: string): ReduxProject {
  const file = makeBrowserImportedFile(relativePath);
  const texture = makeBrowserTexture(file);
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    saveStatus: "Saved",
    files: [...project.files.filter((item) => item.relativePath !== file.relativePath), file],
    textures: texture ? [...project.textures.filter((item) => item.relativePath !== file.relativePath), texture] : project.textures
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

function makeBrowserTexture(file: ReturnType<typeof makeBrowserImportedFile>): TextureAsset | undefined {
  if (!isTextureExtension(file.extension) || file.extension !== ".dds") return undefined;
  const roleGuess = guessTextureRole(file.relativePath);
  const metadata = {
    filePath: file.workspacePath ?? "",
    filename: file.fileName,
    width: 1024,
    height: 1024,
    format: "Mock DDS metadata",
    mipmapCount: 1,
    hasAlpha: "unknown" as const,
    fileSizeBytes: file.sizeBytes,
    roleGuess,
    warnings: textureRoleWarnings(roleGuess)
  };
  metadata.warnings = metadataWarnings(metadata);
  return {
    textureId: `browser-texture-${Date.now()}`,
    section: "textures",
    originalPath: file.sourcePath,
    workspacePath: file.workspacePath ?? "",
    relativePath: file.relativePath,
    fileName: file.fileName,
    metadata,
    roleGuess,
    warnings: metadata.warnings,
    conversionStatus: "metadata_ready",
    exportReady: false,
    notes: "Browser mock DDS record. Real conversion requires Tauri and texconv."
  };
}
