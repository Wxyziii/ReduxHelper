import { classifySection } from "./sectionClassifier";
import { detectFileStatus, getExtension, getFileWarnings } from "./fileTypes";
import type { ProjectFile } from "../types/project";

export function makeBrowserImportedFile(relativePath: string): ProjectFile {
  const fileName = relativePath.split(/[\\/]/).at(-1) ?? relativePath;
  const extension = getExtension(fileName);
  const status = detectFileStatus(extension);
  const section = classifySection(relativePath, extension);
  const preview = status === "text-readable" ? browserPreviewFor(fileName) : undefined;
  return {
    id: `browser-file-${Date.now()}`,
    sourcePath: `browser-mock-source/${relativePath}`,
    workspacePath: `browser-mock-workspace/${relativePath}`,
    relativePath,
    fileName,
    extension,
    sizeBytes: preview?.length ?? 2048,
    status,
    section,
    warnings: getFileWarnings(extension, status),
    scanMatches: [],
    preview
  };
}

function browserPreviewFor(fileName: string) {
  if (fileName.toLowerCase().includes("visualsettings")) {
    return "misc.Bloom.Intensity 0.650\nmisc.SunGlare.Intensity 1.000\nmisc.Reflection.Global 1.000";
  }
  return "<timecycle>\n  <weather name=\"EXTRASUNNY\">\n    <sky value=\"1.0\" />\n    <fog value=\"0.35\" />\n    <bloom value=\"0.65\" />\n  </weather>\n</timecycle>";
}
