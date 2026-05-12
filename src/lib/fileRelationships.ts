import type { ReduxProject } from "../types/project";

export function fileRelationships(project: ReduxProject, fileId: string) {
  const file = project.files.find((item) => item.id === fileId);
  if (!file) return [];
  const backups = (project.backups ?? []).filter((backup) => backup.workspacePath === file.workspacePath || backup.backupPath.includes(file.fileName));
  const patches = (project.patchReviews ?? []).filter((review) => review.suggestion.targetFilePath === file.relativePath);
  const texture = project.textures.find((item) => item.relativePath === file.relativePath);
  const exports = (project.exportHistory ?? []).filter((entry) => entry.sections.includes(file.section));
  return [
    ...patches.map((patch) => ({ kind: "patch", label: patch.suggestion.title, detail: patch.reviewStatus })),
    ...backups.map((backup) => ({ kind: "backup", label: backup.backupPath, detail: backup.timestamp })),
    ...(texture ? [{ kind: "texture", label: texture.fileName, detail: texture.conversionStatus }] : []),
    ...exports.map((entry) => ({ kind: "export", label: entry.exportName, detail: entry.status }))
  ];
}
