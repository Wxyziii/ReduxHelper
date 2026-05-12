import type { SectionId } from "./project";

export type IndexSourceType = "direct" | "archive" | "generated" | "unknown";
export type DiagnosticSeverity = "info" | "warning" | "critical";

export interface ProjectIndexEntry {
  fileId: string;
  fileName: string;
  workspacePath?: string;
  originalPath?: string;
  archiveSource?: string;
  internalArchivePath?: string;
  intendedGameRelativePath: string;
  section: SectionId;
  fileType: string;
  extension: string;
  sizeBytes: number;
  lastModified?: string;
  sourceType: IndexSourceType;
  readable: boolean;
  keywords: string[];
  scanResultCount: number;
  warnings: string[];
  patchCount: number;
  textureStatus?: string;
  exportEligible: boolean;
}

export interface ProjectDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  affectedFiles: string[];
  reason: string;
  suggestedAction: string;
}

export interface ProjectHealth {
  status: "Good" | "Needs Review" | "Blocked";
  totalFiles: number;
  readableFiles: number;
  unsupportedFiles: number;
  archiveExtractedFiles: number;
  scannedFiles: number;
  unscannedFiles: number;
  warningsCount: number;
  conflictsCount: number;
  pendingPatches: number;
  appliedPatches: number;
  exportReadyTextures: number;
  failedConversions: number;
  failedAiRequests: number;
  lastExportStatus?: string;
}
