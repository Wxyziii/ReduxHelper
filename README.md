# Redux AI Assistant Prototype

This repo contains a runnable React + TypeScript frontend prototype wrapped in Tauri for Redux AI Assistant. It uses real local project/workspace files in desktop mode, while AI patch review remains gated by explicit user validation and apply actions.

## Status

Phase 4 patch review is active. Tauri creates/opens `project.json`, copies imported files into a project workspace, classifies file types, scans readable workspace copies, sends prompts to OpenRouter through the Tauri backend, validates returned JSON, validates AI find/replace patches against workspace files, shows side-by-side diffs, creates backups, applies accepted patches only to workspace copies, and writes `reports/changelog.md`. It does not convert DDS textures, edit original source files, edit `.rpf` archives, or install mods.

## Current prototype

- React + TypeScript + Vite.
- Tauri 2 desktop shell.
- Permanent sidebar, top bar, main workspace, and right context panel.
- Dashboard, Timecycle, Tracers, Hit Effects, Kill Effect, Optimization, Textures, Export, and Settings pages.
- Mock project files, scan matches, structured AI responses, real patch validation, accept/reject state, workspace diff review, DDS workflow UI, export tree, and manifest preview.
- Shared page structure and component system for headers, panels, warnings, files, suggestions, diffs, texture preview, export preview, and settings forms.
- Placeholder Tauri commands for Phase 2: `create_project`, `open_project`, `import_files`, `import_folder`, `scan_project`, `save_project`, and `export_project`.
- Real Phase 2 Tauri commands for project creation/open/save, file/folder import, type detection, section assignment, and readable-file scanning.
- Phase 3A prompt builder on section pages and Textures.
- Runtime AI response validation with `zod`.
- Prompt and AI response report saving to `reports/`.
- OpenRouter chat-completions requests through Tauri backend.
- JSON extraction from direct JSON, fenced JSON, or first valid JSON object.
- AI request history on Dashboard and section workbenches.
- Phase 4 patch reviews persisted in `project.json`.
- Workspace backup records, applied patch results, patch batches, and changelog entries.

## Requirements

- Node.js 20 or newer recommended.
- npm.
- Rust and Cargo.
- Windows WebView2 runtime.

## Install

```bash
npm install
```

## Run Dev Server

```bash
npm run dev
```

Open the printed local URL, usually:

```text
http://127.0.0.1:5173/
```

## Run Tauri Desktop App

```bash
npm run tauri dev
```

This starts Vite and opens the Tauri desktop window named `Redux AI Assistant`.

## Type Check

```bash
npm run typecheck
```

## Production Build

```bash
npm run build
```

## Preview Built App

```bash
npm run preview
```

## Check Tauri Backend

```bash
cd src-tauri
cargo check
```

## Safety model in prototype

- Original source files are never modified.
- Imports copy selected files into `workspace/` under the local Redux AI project folder.
- Scanning reads only workspace copies.
- AI patches are validated before accept actions.
- Applying patches writes only to `workspace/` files.
- Backups are created under `backups/<patch_batch_id>/...` before each write.
- `reports/changelog.md` records applied workspace changes.
- Binary `.rpf` and DDS files are shown as workflow/manual-review items, not directly edited.
- Export output is previewed as `edited_files/`, `original_backups/`, `reports/`, `manifest.json`, `install_notes.txt`, and `changelog.md`.

## Local Project Layout

Tauri creates projects under the user's Documents folder:

```text
ReduxAIProjects/
  Project_Name/
    project.json
    workspace/
    backups/
    reports/
    exports/
```

`project.json` stores project metadata, sections, imported files, original paths, workspace paths, warnings, settings, and scan matches.

## Patch Review Workflow

1. Create/open a project in Tauri.
2. Import files/folder.
3. Scan project.
4. Open a section page.
5. Select scan snippets.
6. Load/paste AI JSON or send prompt to OpenRouter.
7. Validate AI response. Suggestions are saved into `patchReviews`.
8. Click `Validate patches`.
9. Review status and side-by-side diff.
10. Accept or reject each patch.
11. Click `Apply accepted patches`.
12. Tauri creates backups, writes workspace copies only, updates `project.json`, and writes `reports/changelog.md`.

Validation blocks missing files, unsupported/binary targets, missing find text, duplicate find matches, empty replace text, invalid JSON/XML output, rejected patches, and already-applied changes.

## Mock Interactions

- Sidebar navigation switches pages.
- File row selection updates file preview and matching diff state.
- AI suggestion cards support review, copy patch JSON, accept, and reject.
- Texture page has selectable texture assets and an A/B comparison slider.
- Export page has section toggles and mock completed export state.
- Settings include OpenRouter API key, model, base URL, optional app headers, max tokens, temperature, and timeout.
- Create/Open/Import/Scan/Save use Tauri in desktop mode and browser fallback mocks in Vite-only mode.
- Select scan snippets, preview/copy/save prompt, load/paste mock JSON response or send to OpenRouter, validate response, validate patches, review diffs, accept/reject, and apply accepted safe patches to workspace copies.

## Tauri Commands

Frontend wrappers live in:

```text
src/lib/tauriApi.ts
```

Rust command stubs live in:

```text
src-tauri/src/lib.rs
```

`create_project`, `open_project`, `import_files`, `import_folder`, `scan_project`, and `save_project` perform local project work. `send_openrouter_chat_request` sends real chat-completions requests through Tauri. `validate_patch`, `validate_patches`, `read_workspace_file`, `create_workspace_backup`, `write_workspace_file`, `apply_patch_to_workspace`, and `apply_accepted_patches` enforce workspace-only patch review/apply. `save_prompt_report` and `save_ai_response_report` write reports. `export_project` is still a safe mock placeholder for later phases. In browser dev mode, `tauriApi.ts` returns browser mock responses instead of calling Tauri.

## Configure OpenRouter

1. Open Settings.
2. Enter API key in `API key`.
3. Confirm model, default `openai/gpt-oss-120b:free`.
4. Confirm base URL, default `https://openrouter.ai/api/v1/chat/completions`.
5. Optionally set site URL/app name headers.
6. Adjust max tokens, temperature, and timeout.
7. Save project.

API key is stored in local project settings for now and sent only to the Tauri backend request command. Secure OS credential storage should replace this later.

## Verify Original Files Stay Untouched

1. Import a test file from any folder outside the project.
2. Note its original path in the file details panel.
3. Apply a Phase 4 patch.
4. Compare original path content with `workspace/<relative path>`.
5. Only the workspace copy should change.
6. Backup should exist under `backups/<patch_batch_id>/...`.

## Source docs retained

```text
docs/
prompts/
schemas/
examples/
src-blueprint/
```

See `DEVELOPMENT_PLAN.md` for next implementation phases.
