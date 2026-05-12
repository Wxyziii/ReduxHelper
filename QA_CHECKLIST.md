# QA Checklist

## Project
- Create project.
- Open existing `project.json`.
- Save project after edits.
- Corrupt/invalid project shows recoverable error.

## Import / Archive
- Import files and folders into workspace copies.
- RPF/archive mode remains read-only.
- Extracted files enter normal workflow.
- Original files and `.rpf` archives unchanged.

## Scan / Index
- Scan project.
- Large files get partial-scan warning.
- Binary-looking text extension is blocked.
- Intelligence search finds paths, extensions, sections, warnings.

## AI / Patches
- Invalid AI JSON shows validation error.
- Patch validation handles no match and duplicate match.
- Applied patch writes only workspace copy.
- Backup exists before patch write.

## Textures / Image AI
- DDS preview conversion writes under workspace.
- ComfyUI generation uses PNG preview only.
- Generated PNG can attach as edited PNG.
- DDS compile writes project-local compiled output.

## Export
- Export package writes only under exports.
- Manifest, install notes, changelog, warnings, summary exist.
- Export validation passes or reports exact failure.

## Recovery / Logs
- Operation Center shows running/completed/failed ops.
- Cancel marks operation stale/cancelled where best-effort.
- Logs do not include API keys.
- Browser fallback does not crash.

## Phase 11 UX
- Onboarding opens on first run and can be skipped/completed.
- New project wizard creates a project.
- Help drawer opens from top bar.
- Tool Setup Center shows optional/missing/configured statuses.
- Guided workflows link to related pages.
- Empty states include actions and safety notes.
- Export page explains manual install clearly.
- Settings can show onboarding again.
- Keyboard tab order reaches modal buttons and top actions.
- Docs files are present and readable.
