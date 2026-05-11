# Phase 5 Prompt: Patch, Diff, and Export

Implement safe patch review and export.

Requirements:
- Support find/replace patches first.
- Validate that `find` exists exactly once before applying by default.
- If it exists multiple times, require manual review.
- Generate edited copy in memory.
- Show before/after diff.
- Allow accept/reject per patch.
- Allow manual edit before export if possible.
- Export accepted changes only.
- Preserve original relative paths.
- Include original backups.
- Generate manifest.json.
- Generate install_notes.txt.
- Generate changelog.md.
- Generate section AI reports.
- Never modify original files directly.

Deliver:
- `patchApplier.ts`
- `diffEngine.ts`
- `exportManager.ts`
- DiffViewer
- PatchReviewPanel
- ExportPage working with real accepted changes
