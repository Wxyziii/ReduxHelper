import type { ProjectIndexEntry } from "../types/indexing";
import type { ReduxProject } from "../types/project";

export function buildProjectIndex(project: ReduxProject): ProjectIndexEntry[] {
  return project.files.map((file) => {
    const texture = project.textures.find((item) => item.relativePath === file.relativePath);
    const patches = (project.patchReviews ?? []).filter((review) => review.suggestion.targetFilePath === file.relativePath);
    const sourceType = file.sourcePath?.toLowerCase().includes(".rpf") || file.relativePath.includes("archive") ? "archive" : "direct";
    return {
      fileId: file.id,
      fileName: file.fileName,
      workspacePath: file.workspacePath,
      originalPath: file.sourcePath,
      archiveSource: readLoose(file, "archiveSource"),
      internalArchivePath: readLoose(file, "internalArchivePath"),
      intendedGameRelativePath: file.relativePath,
      section: file.section,
      fileType: file.status,
      extension: file.extension,
      sizeBytes: file.sizeBytes,
      lastModified: readLoose(file, "lastModified"),
      sourceType,
      readable: file.status === "text-readable",
      keywords: Array.from(new Set(file.scanMatches.map((match) => match.keyword))),
      scanResultCount: file.scanMatches.length,
      warnings: file.warnings,
      patchCount: patches.length,
      textureStatus: texture?.conversionStatus,
      exportEligible: patches.some((review) => review.reviewStatus === "applied") || !!texture?.exportReady
    };
  });
}

function readLoose(file: unknown, key: string) {
  return typeof file === "object" && file ? (file as Record<string, string | undefined>)[key] : undefined;
}
