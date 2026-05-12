import type { SectionId } from "./project";

export type ExportFileType = "edited_text" | "compiled_texture" | "report" | "backup" | "script" | "note";
export type ExportHistoryStatus = "success" | "failed";

export interface ExportFileRecord {
  id: string;
  section: SectionId | "reports" | "backups";
  type: ExportFileType;
  sourceWorkspacePath: string;
  outputRelativePath: string;
  intendedGameRelativePath: string;
  originalPath?: string;
  originalHash?: string;
  outputHash?: string;
  sizeBytes: number;
  riskLevel?: string;
  patchIds: string[];
  textureId?: string;
  warnings: string[];
}

export interface ExportExcludedItem {
  id: string;
  label: string;
  section?: SectionId;
  reason: string;
}

export interface ExportPreviewModel {
  exportId: string;
  projectId: string;
  projectName: string;
  exportName: string;
  outputFolder: string;
  includedSections: string[];
  includedFiles: ExportFileRecord[];
  excludedItems: ExportExcludedItem[];
  warnings: string[];
  blockers: string[];
  unappliedAcceptedPatches: number;
  highRiskChanges: number;
  estimatedFileCount: number;
  estimatedExportSizeBytes: number;
  installNotesPreview: string;
  manifestPreview: unknown;
}

export interface ExportValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExportHistoryEntry {
  exportId: string;
  exportName: string;
  createdAt: string;
  exportPath: string;
  fileCount: number;
  sections: string[];
  warningsCount: number;
  manifestPath: string;
  status: ExportHistoryStatus;
  error?: string;
}

export interface ExportPackageResult {
  ok: boolean;
  message: string;
  preview: ExportPreviewModel;
  validation: ExportValidationResult;
  exportPath?: string;
  manifestPath?: string;
  installNotesPath?: string;
  summaryPath?: string;
}
