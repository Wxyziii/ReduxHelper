import type { AiChangeType, AiRiskLevel, AiSuggestion } from "./ai";
import type { SectionId } from "./project";

export type PatchValidationStatus =
  | "can_apply"
  | "cannot_apply"
  | "ambiguous_match"
  | "unsupported_file_type"
  | "missing_target_file"
  | "invalid_syntax_after_patch"
  | "requires_manual_review"
  | "already_applied"
  | "rejected"
  | "applied";

export type PatchReviewStatus = "pending_review" | "validated" | "accepted" | "rejected" | "applied" | "failed";

export interface PatchMatchLocation {
  line: number;
  preview: string;
}

export interface PatchValidationResult {
  id: string;
  suggestionId: string;
  section: SectionId;
  targetFilePath: string;
  workspacePath?: string;
  status: PatchValidationStatus;
  message: string;
  canApply: boolean;
  matchCount: number;
  matchLocations: PatchMatchLocation[];
  originalSnippet?: string;
  proposedSnippet?: string;
  risk: AiRiskLevel;
  reason: string;
  testingNotes: string[];
  changeType: AiChangeType;
}

export interface PatchReviewState {
  id: string;
  suggestionId: string;
  section: SectionId;
  suggestion: AiSuggestion;
  reviewStatus: PatchReviewStatus;
  validation?: PatchValidationResult;
  userDecisionAt?: string;
  appliedAt?: string;
  error?: string;
}

export interface BackupRecord {
  id: string;
  backupPath: string;
  workspacePath: string;
  timestamp: string;
  patchId: string;
  suggestionId: string;
  section: SectionId;
  reason: string;
}

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  section: SectionId;
  filePath: string;
  patchId: string;
  suggestionTitle: string;
  risk: AiRiskLevel;
  summary: string;
  backupPath: string;
  applyStatus: "applied" | "failed";
}

export interface PatchApplyResult {
  patchId: string;
  suggestionId: string;
  status: "applied" | "failed" | "skipped";
  message: string;
  backup?: BackupRecord;
  changelog?: ChangelogEntry;
}

export interface PatchBatch {
  id: string;
  timestamp: string;
  section?: SectionId;
  patchIds: string[];
  appliedCount: number;
  failedCount: number;
  backupRoot?: string;
}
