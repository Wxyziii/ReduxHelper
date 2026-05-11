# Development Plan

This prototype now includes Phase 2 local project/file support, Phase 3A prompt/AI JSON validation, Phase 3B OpenRouter request/response integration through Tauri, and Phase 4 safe workspace patch validation/apply. Keep export writing, DDS conversion, `.rpf` editing, OpenIV integration, and real mod installation disabled until their phases.

## 1. Tauri Shell

- Tauri shell is now added.
- Next: define narrow filesystem permissions for Phase 2.
- Next: keep original source paths read-only through command boundaries.
- Next: add native dialogs for opening folders and choosing export destinations.

## 2. Project State

- Done: create/open/save `project.json`.
- Done: copy imported files/folders into project `workspace/`.
- Done: detect file type, classify section, warn unsupported files, scan readable copies.
- Next: add schema validation against `schemas/project.schema.json`.
- Add migration versioning for project files.

## 3. File Import And Scanner

- Done: file/folder import through Tauri commands.
- Done: preserve source path and relative path where possible.
- Done: classify text-readable, binary unsupported, unsupported, and section assignment.
- Done: implement keyword scanner from docs.
- Add cancellable scan jobs for larger folders.
- Add file preview size limits and encoding detection.

## 4. Prompt Builder And AI Parsing

- Done: generate section-specific prompts from goals, metadata, scan results, and selected snippets.
- Done: preview/copy/save prompt reports.
- Done: paste/load mock AI JSON response.
- Done: runtime validation for required fields, section/risk/change types, find_replace patch payloads, manual steps, and target file paths.
- Done: structured suggestion cards with mock accept/reject state.
- Done: OpenRouter-compatible request support through Tauri backend after user action.
- Done: JSON extraction from raw/fenced/mixed responses before validation.
- Done: basic AI request history.
- Next: move API key to secure OS credential storage.
- Align runtime schema with repository JSON schemas or add a dedicated Phase 3A schema file.
- Handle invalid JSON, timeout, and model errors without losing project state.

## 5. Patch Validation And Local Copies

- Done: validate AI find/replace patches against imported workspace files.
- Done: block unsupported/binary patch targets.
- Done: block missing targets, missing find text, duplicate matches, empty replace text, and invalid JSON/XML output.
- Done: show side-by-side diff before accept/apply.
- Done: persist patch review state in `project.json`.
- Done: apply accepted patches only to workspace/project-local copies.
- Done: create backups before writes.
- Done: write changelog entries to `project.json` and `reports/changelog.md`.
- Next: add explicit manual match picker for ambiguous patches.
- Next: add separate high-risk confirmation modal instead of relying on risk/status labels.
- Next: add unit tests around validator/applier edge cases.

## 6. Export System

- Export page now reflects applied workspace changes, backups, and unapplied accepted patch warnings.
- Write accepted edited copies to `exports/<name>/edited_files/`.
- Write originals to `exports/<name>/original_backups/`.
- Generate `manifest.json`, `install_notes.txt`, `changelog.md`, and section reports.
- Refuse overwrite unless user explicitly confirms.
- Validate export names and destination access.

## 7. DDS Texture Pipeline

- Add configurable converter commands from Settings.
- Inspect DDS metadata when tool support exists.
- Convert DDS to PNG preview.
- Import edited PNG.
- Validate dimensions and alpha preservation.
- Convert PNG back to DDS with original filename.
- Preserve compression/mipmap warnings until converter confirms settings.

## 8. Testing

- Add unit tests for scanner, prompt builder, patch validation, export manifest generation, and texture metadata warnings.
- Add Playwright smoke tests for navigation, accept/reject patch state, settings inputs, export completion state, and texture slider.
- Add regression tests for no direct original-file writes.
- Add Tauri integration test fixture that imports temp files, applies a patch, confirms original path hash unchanged, confirms workspace hash changed, and confirms backup exists.

## 9. Polish

- Add keyboard navigation and focus states.
- Add large-file preview limits.
- Add section reports and project activity history.
- Add clearer empty/error states for unsupported files and failed converter runs.
