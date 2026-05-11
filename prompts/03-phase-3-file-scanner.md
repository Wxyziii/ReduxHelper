# Phase 3 Prompt: File Import and Scanner

Add file import and scanning.

Requirements:
- Add file picker support.
- Add folder picker support if the desktop shell supports it.
- Add drag-and-drop support.
- Detect file extension.
- Classify file as:
  - text-readable
  - texture-workflow
  - binary-unsupported
  - unknown
- Read text files safely.
- Avoid loading extremely large files fully into the UI.
- Scan text files for section keywords.
- Show matched lines.
- Generate scan report.
- Allow assigning files to sections.
- Show file preview with line numbers for text files.
- Show unsupported-file warning for binary files.

Do not send anything to AI automatically.
Do not modify files.

Deliver:
- `fileScanner.ts`
- `sectionKeywordConfig.ts`
- updated FileTable
- FilePreview
- scan report UI
