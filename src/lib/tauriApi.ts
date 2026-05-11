import { invoke } from "@tauri-apps/api/core";
import { createBrowserProject, importBrowserFile, scanBrowserProject } from "./projectStore";
import type { OpenRouterRequest, OpenRouterResponse } from "../types/ai";
import type { PatchReviewState, PatchValidationResult } from "../types/patches";
import type { ReduxProject } from "../types/project";

export interface TauriCommandResponse {
  ok: boolean;
  action: string;
  message: string;
}

export interface ImportedFileMock {
  file_name: string;
  relative_path: string;
  status: string;
}

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const response = (action: string, message: string): TauriCommandResponse => ({
  ok: true,
  action,
  message
});

export function createProject(projectName: string) {
  return callTauri<ReduxProject>("create_project", createBrowserProject(projectName), { projectName });
}

export function openProject() {
  return callTauri<ReduxProject | null>("open_project", createBrowserProject("Browser Mock Project"));
}

export function importFiles(project: ReduxProject) {
  return callTauri<ReduxProject>("import_files", importBrowserFile(project, "browser_mock_timecycle.xml"), { project });
}

export function importFolder(project: ReduxProject) {
  return callTauri<ReduxProject>("import_folder", importBrowserFile(project, "browser_mock_folder/visualsettings.dat"), { project });
}

export function scanProject(project: ReduxProject) {
  return callTauri<ReduxProject>("scan_project", scanBrowserProject(project), { project });
}

export function saveProject(project: ReduxProject) {
  return callTauri<ReduxProject>("save_project", { ...project, saveStatus: "Saved" }, { project });
}

export function exportProject(project: ReduxProject) {
  return callTauri("export_project", response("export_project", "Browser mock: export staged."), { project });
}

export function savePromptReport(project: ReduxProject, section: string, content: string) {
  return callTauri("save_prompt_report", response("save_prompt_report", "Browser mock: prompt report saved."), { project, section, content });
}

export function saveAiResponseReport(project: ReduxProject, section: string, content: string) {
  return callTauri("save_ai_response_report", response("save_ai_response_report", "Browser mock: AI response report saved."), { project, section, content });
}

export function sendOpenRouterChatRequest(request: OpenRouterRequest) {
  return callTauri<OpenRouterResponse>(
    "send_openrouter_chat_request",
    {
      ok: false,
      rawResponseText: "",
      assistantContent: "",
      modelUsed: request.model,
      requestMs: 0,
      error: "Real OpenRouter requests require the Tauri desktop backend. Browser mode keeps mock AI behavior only."
    },
    { request }
  );
}

export function validatePatches(project: ReduxProject, reviews: PatchReviewState[]) {
  return callTauri<PatchValidationResult[]>("validate_patches", validatePatchesBrowser(project, reviews), { project, reviews });
}

export function applyAcceptedPatches(project: ReduxProject, reviews: PatchReviewState[]) {
  return callTauri<ReduxProject>("apply_accepted_patches", applyAcceptedPatchesBrowser(project, reviews), { project, reviews });
}

export function readWorkspaceFile(project: ReduxProject, relativePath: string) {
  const file = project.files.find((item) => item.relativePath === relativePath);
  return callTauri<string>("read_workspace_file", file?.preview ?? "", { project, relativePath });
}

async function callTauri<T>(command: string, browserMock: T, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    return browserMock;
  }

  return invoke<T>(command, args);
}

function validatePatchesBrowser(project: ReduxProject, reviews: PatchReviewState[]): PatchValidationResult[] {
  return reviews.map((review) => {
    const suggestion = review.suggestion;
    const file = project.files.find((item) => item.relativePath === suggestion.targetFilePath);
    const text = file?.preview ?? "";
    const find = suggestion.patch?.find ?? "";
    const replace = suggestion.patch?.replace ?? "";
    const matchCount = find ? text.split(find).length - 1 : 0;
    const status =
      !file ? "missing_target_file" :
      file.status !== "text-readable" ? "unsupported_file_type" :
      suggestion.changeType !== "find_replace" ? "requires_manual_review" :
      !find || !replace ? "cannot_apply" :
      matchCount === 0 ? (text.includes(replace) ? "already_applied" : "cannot_apply") :
      matchCount > 1 ? "ambiguous_match" :
      "can_apply";

    return {
      id: review.id,
      suggestionId: review.suggestionId,
      section: review.section,
      targetFilePath: suggestion.targetFilePath,
      workspacePath: file?.workspacePath,
      status,
      canApply: status === "can_apply",
      matchCount,
      matchLocations: matchCount ? [{ line: findLine(text, find), preview: find }] : [],
      originalSnippet: find,
      proposedSnippet: replace,
      risk: suggestion.risk,
      reason: suggestion.reason,
      testingNotes: suggestion.testingNotes ?? [],
      changeType: suggestion.changeType,
      message: browserValidationMessage(status)
    };
  });
}

function applyAcceptedPatchesBrowser(project: ReduxProject, reviews: PatchReviewState[]): ReduxProject {
  const now = new Date().toISOString();
  const accepted = reviews.filter((review) => review.reviewStatus === "accepted" && review.validation?.canApply);
  return {
    ...project,
    saveStatus: "Unsaved changes",
    patchReviews: project.patchReviews.map((review) =>
      accepted.some((item) => item.id === review.id) ? { ...review, reviewStatus: "applied", appliedAt: now } : review
    ),
    appliedPatches: [
      ...(project.appliedPatches ?? []),
      ...accepted.map((review) => ({ patchId: review.id, suggestionId: review.suggestionId, status: "applied" as const, message: "Browser mock: no file write." }))
    ],
    changelogEntries: [
      ...(project.changelogEntries ?? []),
      ...accepted.map((review) => ({
        id: `browser-change-${review.id}`,
        timestamp: now,
        section: review.section,
        filePath: review.suggestion.targetFilePath,
        patchId: review.id,
        suggestionTitle: review.suggestion.title,
        risk: review.suggestion.risk,
        summary: review.suggestion.reason,
        backupPath: "browser-mock-backup",
        applyStatus: "applied" as const
      }))
    ]
  };
}

function findLine(text: string, needle: string) {
  const index = text.indexOf(needle);
  return index < 0 ? 0 : text.slice(0, index).split("\n").length;
}

function browserValidationMessage(status: PatchValidationResult["status"]) {
  const messages: Record<PatchValidationResult["status"], string> = {
    can_apply: "Browser mock: find text appears once.",
    cannot_apply: "Find/replace missing or find text not found.",
    ambiguous_match: "Find text appears multiple times. Manual review required.",
    unsupported_file_type: "Unsupported/binary file cannot receive text patch.",
    missing_target_file: "Target file not found in imported project files.",
    invalid_syntax_after_patch: "Resulting file failed syntax validation.",
    requires_manual_review: "Manual/report suggestion cannot be auto-applied.",
    already_applied: "Replacement already appears in preview.",
    rejected: "Patch rejected.",
    applied: "Patch already applied."
  };
  return messages[status];
}
