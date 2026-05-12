import { invoke } from "@tauri-apps/api/core";
import { createExportPreview } from "./exportManager";
import type { ReduxProject } from "../types/project";
import type { ExportPackageResult, ExportPreviewModel, ExportValidationResult } from "../types/exports";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function callTauri<T>(command: string, browserMock: T, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) return browserMock;
  return invoke<T>(command, args);
}

export function buildExportPreview(project: ReduxProject, exportName: string, includeReports = true, includeAllBackups = false) {
  const browser = createExportPreview(project, exportName, { includeReports, includeAllBackups }).preview;
  return callTauri<ExportPreviewModel>("build_export_preview", browser, { project, exportName, includeReports, includeAllBackups });
}

export function createExportPackage(project: ReduxProject, exportName: string, includeReports = true, includeAllBackups = false, conflictStrategy = "version") {
  const preview = createExportPreview(project, exportName, { includeReports, includeAllBackups }).preview;
  const result: ExportPackageResult = {
    ok: true,
    message: "Browser mock export created. Real package writing requires Tauri.",
    preview,
    validation: { ok: true, errors: [], warnings: ["Browser mock export. No files written."] },
    exportPath: preview.outputFolder,
    manifestPath: `${preview.outputFolder}/manifest.json`,
    installNotesPath: `${preview.outputFolder}/install_notes.txt`,
    summaryPath: `${preview.outputFolder}/export_summary.json`
  };
  return callTauri<ExportPackageResult>("create_export_package", result, { project, exportName, includeReports, includeAllBackups, conflictStrategy });
}

export function validateExportPackage(project: ReduxProject, exportPath: string) {
  return callTauri<ExportValidationResult>("validate_export_package", { ok: true, errors: [], warnings: ["Browser mock validation."] }, { project, exportPath });
}

export function openExportFolder(exportPath: string) {
  return callTauri<{ ok: boolean; action: string; message: string }>(
    "open_export_folder",
    { ok: true, action: "open_export_folder", message: `Browser mock: ${exportPath}` },
    { exportPath }
  );
}
