import { buildProjectIndex } from "./projectIndex";
import type { ProjectDiagnostic, ProjectHealth } from "../types/indexing";
import type { ReduxProject } from "../types/project";

export function runProjectDiagnostics(project: ReduxProject): ProjectDiagnostic[] {
  const index = buildProjectIndex(project);
  const diagnostics: ProjectDiagnostic[] = [];
  addDuplicates(diagnostics, "duplicate-path", index.map((entry) => [entry.intendedGameRelativePath, entry.fileId]), "Duplicate intended game path.", "Review source; keep one export target.");
  addDuplicates(diagnostics, "duplicate-name", index.map((entry) => [entry.fileName, entry.fileId]), "Duplicate file name.", "Use paths to verify which file matters.");
  addDuplicates(diagnostics, "workspace-conflict", index.map((entry) => [entry.workspacePath ?? "", entry.fileId]), "Workspace path conflict.", "Re-import or remove duplicate workspace copy.");
  const unsupported = index.filter((entry) => entry.fileType === "unsupported" || entry.fileType === "binary-unsupported");
  unsupported.forEach((entry) => diagnostics.push({ id: `unsupported-${entry.fileId}`, severity: "warning", affectedFiles: [entry.fileId], reason: "Unsupported file imported.", suggestedAction: "Keep for reference only or extract a supported editable copy." }));
  const ambiguous = (project.patchReviews ?? []).filter((review) => review.validation?.status === "ambiguous_match");
  ambiguous.forEach((review) => diagnostics.push({ id: `ambiguous-${review.id}`, severity: "critical", affectedFiles: [review.suggestion.targetFilePath], reason: "Patch has ambiguous target.", suggestedAction: "Reject or refine patch before apply." }));
  return diagnostics;
}

export function projectHealth(project: ReduxProject): ProjectHealth {
  const diagnostics = runProjectDiagnostics(project);
  const warningsCount = project.files.flatMap((file) => file.warnings).length + project.textures.flatMap((texture) => texture.warnings).length;
  const blocked = diagnostics.some((item) => item.severity === "critical");
  return {
    status: blocked ? "Blocked" : warningsCount || diagnostics.length ? "Needs Review" : "Good",
    totalFiles: project.files.length,
    readableFiles: project.files.filter((file) => file.status === "text-readable").length,
    unsupportedFiles: project.files.filter((file) => file.status === "unsupported" || file.status === "binary-unsupported").length,
    archiveExtractedFiles: project.files.filter((file) => file.sourcePath?.toLowerCase().includes(".rpf")).length,
    scannedFiles: project.files.filter((file) => file.scanMatches.length > 0).length,
    unscannedFiles: project.files.filter((file) => file.status === "text-readable" && file.scanMatches.length === 0).length,
    warningsCount,
    conflictsCount: diagnostics.length,
    pendingPatches: (project.patchReviews ?? []).filter((patch) => patch.reviewStatus !== "applied").length,
    appliedPatches: (project.patchReviews ?? []).filter((patch) => patch.reviewStatus === "applied").length,
    exportReadyTextures: project.textures.filter((texture) => texture.exportReady).length,
    failedConversions: project.textures.filter((texture) => texture.conversionStatus === "failed").length,
    failedAiRequests: (project.imageGenerationHistory ?? []).filter((item) => item.status === "failed").length,
    lastExportStatus: project.exportHistory?.[0]?.status
  };
}

function addDuplicates(diagnostics: ProjectDiagnostic[], prefix: string, pairs: string[][], reason: string, suggestedAction: string) {
  const groups = new Map<string, string[][]>();
  pairs.filter(([key]) => !!key).forEach((pair) => groups.set(pair[0], [...(groups.get(pair[0]) ?? []), pair]));
  groups.forEach((items, key) => {
    if (items.length > 1) diagnostics.push({ id: `${prefix}-${key}`, severity: "warning", affectedFiles: items.map(([, id]) => id), reason, suggestedAction });
  });
}
