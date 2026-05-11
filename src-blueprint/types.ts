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

export type FileStatus =
  | "text-readable"
  | "texture-workflow"
  | "binary-unsupported"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high";

export interface ReduxProject {
  version: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  sections: Record<string, ProjectSection>;
  settings: ProjectSettings;
}

export interface ProjectSection {
  id: SectionId | string;
  name: string;
  goal: string;
  files: ProjectFile[];
  aiRequests: AiRequest[];
  aiResponses: AiResponse[];
  patches: PatchSuggestion[];
  warnings: string[];
}

export interface ProjectFile {
  id: string;
  sourcePath: string;
  relativePath: string;
  fileName: string;
  extension: string;
  sizeBytes?: number;
  status: FileStatus;
  warnings: string[];
}

export interface ProjectSettings {
  aiProvider?: string;
  model?: string;
  exportDirectory?: string;
  converterPaths?: Record<string, string>;
}

export interface AiRequest {
  id: string;
  createdAt: string;
  section: string;
  prompt: string;
  model?: string;
}

export interface AiResponse {
  id: string;
  requestId: string;
  createdAt: string;
  rawText: string;
  parsed?: AiPatchResponse;
  error?: string;
}

export interface AiPatchResponse {
  section: string;
  summary: string;
  warnings: string[];
  patches: PatchSuggestion[];
  manualNotes: string[];
  testingChecklist: string[];
}

export interface PatchSuggestion {
  id: string;
  filePath: string;
  patchType: "find_replace" | "full_file_replace" | "insert_before" | "insert_after" | "delete_block";
  find?: string;
  replace?: string;
  reason: string;
  risk: RiskLevel;
  requiresManualReview: boolean;
  status?: "pending" | "accepted" | "rejected" | "failed";
}

export interface ExportManifest {
  projectName: string;
  exportName: string;
  createdAt: string;
  sectionsIncluded: string[];
  files: ExportedFileRecord[];
  warnings: string[];
}

export interface ExportedFileRecord {
  section: string;
  sourcePath?: string;
  relativePath: string;
  exportPath: string;
  backupPath?: string;
  changeCount?: number;
  status: string;
}
