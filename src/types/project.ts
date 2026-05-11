import type { AiHistoryEntry, AiSuggestion } from "./ai";
import type { BackupRecord, ChangelogEntry, PatchApplyResult, PatchBatch, PatchReviewState } from "./patches";

export type SectionId =
  | "dashboard"
  | "timecycle"
  | "tracers"
  | "hitEffects"
  | "killEffect"
  | "optimization"
  | "textures"
  | "export"
  | "settings";

export type FileStatus = "text-readable" | "texture-workflow" | "binary-unsupported" | "unsupported" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type PatchStatus = "pending" | "accepted" | "rejected" | "failed";

export interface ProjectFile {
  id: string;
  sourcePath: string;
  workspacePath?: string;
  relativePath: string;
  fileName: string;
  extension: string;
  sizeBytes: number;
  status: FileStatus;
  section: SectionId;
  warnings: string[];
  scanMatches: ScanMatch[];
  preview?: string;
}

export interface ScanMatch {
  filePath?: string;
  line: number;
  keyword: string;
  snippet: string;
}

export interface PatchSuggestion {
  id: string;
  section: SectionId;
  filePath: string;
  patchType: "find_replace" | "full_file_replace" | "insert_before" | "insert_after" | "delete_block";
  find?: string;
  replace?: string;
  reason: string;
  summary: string;
  risk: RiskLevel;
  requiresManualReview: boolean;
  status: PatchStatus;
  validation: {
    ok: boolean;
    reason: string;
    matchCount: number;
  };
}

export interface AiResponse {
  id: string;
  section: SectionId;
  summary: string;
  warnings: string[];
  patches: PatchSuggestion[];
  manualNotes: string[];
  testingChecklist: string[];
}

export interface ProjectSection {
  id: SectionId;
  name: string;
  description: string;
  goal: string;
  warnings: string[];
}

export interface TextureAsset {
  id: string;
  fileName: string;
  relativePath: string;
  width: number;
  height: number;
  format: string;
  hasAlpha: "yes" | "no" | "unknown";
  mipmaps: "yes" | "no" | "unknown";
  guessedType: "diffuse" | "normal" | "mask" | "alpha";
  status: "Imported" | "Preview ready" | "Needs AI edit" | "Edited image ready" | "DDS exported" | "Warning";
  warnings: string[];
  notes: string;
}

export interface ExportManifest {
  projectName: string;
  exportName: string;
  createdAt: string;
  sectionsIncluded: SectionId[];
  files: {
    section: SectionId;
    sourcePath: string;
    relativePath: string;
    exportPath: string;
    backupPath: string;
    changeCount: number;
    status: string;
  }[];
  warnings: string[];
}

export interface AppSettings {
  aiProvider: string;
  apiKey: string;
  model: string;
  openRouterBaseUrl: string;
  openRouterSiteUrl: string;
  openRouterAppName: string;
  maxTokens: number;
  temperature: number;
  timeoutSeconds: number;
  exportDirectory: string;
  projectStorage: string;
  converterPaths: {
    ddsToImage: string;
    imageToDds: string;
    metadataInspector: string;
  };
  safety: {
    createBackups: boolean;
    validatePatchTargets: boolean;
    blockBinaryPatches: boolean;
    requireManifest: boolean;
    warnTextureMetadata: boolean;
  };
  experimental: {
    imageWorkflow: boolean;
    batchTextures: boolean;
  };
}

export interface ReduxProject {
  version: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  saveStatus: "Saved" | "Unsaved changes" | "Scanning" | "Mock export ready";
  notes: string;
  projectRoot?: string;
  projectJsonPath?: string;
  workspacePath?: string;
  sections: Record<SectionId, ProjectSection>;
  files: ProjectFile[];
  aiResponses: AiResponse[];
  aiHistory: AiHistoryEntry[];
  aiSuggestions: AiSuggestion[];
  patchReviews: PatchReviewState[];
  appliedPatches: PatchApplyResult[];
  backups: BackupRecord[];
  changelogEntries: ChangelogEntry[];
  patchBatches: PatchBatch[];
  patches: PatchSuggestion[];
  textures: TextureAsset[];
  settings: AppSettings;
}
