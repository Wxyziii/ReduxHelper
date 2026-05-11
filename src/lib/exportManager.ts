import { buildManifest } from "../data/mockProject";
import type { ReduxProject } from "../types/project";

export function createExportPreview(project: ReduxProject, exportName: string) {
  const manifest = buildManifest(project, exportName);
  const tree = [
    `exports/${exportName}/`,
    "  edited_files/",
    ...manifest.files.map((file) => `    ${file.relativePath}`),
    "  original_backups/",
    ...manifest.files.map((file) => `    ${file.relativePath}`),
    "  reports/",
    "    ai_report.md",
    "    scan_report.md",
    "    texture_report.md",
    "  manifest.json",
    "  install_notes.txt",
    "  changelog.md"
  ];

  return { manifest, tree };
}
