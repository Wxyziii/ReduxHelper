# UI / UX Specification

This document describes structure, layout, and interaction. It intentionally avoids visual color choices.

## Overall layout

The app should use a three-area desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top bar                                                      │
├───────────────┬───────────────────────────────┬──────────────┤
│ Sidebar       │ Main workspace                │ Right panel  │
│ Navigation    │ Current page content          │ Context info │
└───────────────┴───────────────────────────────┴──────────────┘
```

## Top bar

The top bar should contain:

- App name
- Current project name
- Save status
- Quick action: Scan
- Quick action: Ask AI
- Quick action: Export
- Settings button

The top bar should stay consistent across all pages.

## Sidebar

The sidebar should contain primary navigation:

1. Dashboard
2. Timecycle
3. Tracers
4. Hit Effects
5. Kill Effect
6. Optimization
7. Textures
8. Export
9. Settings

Each sidebar item should show a small status indicator:

- No files
- Files added
- AI suggestions ready
- Accepted changes
- Warning present
- Exported

## Main workspace

The main workspace changes depending on the selected page.

Every section page should use the same general structure:

```text
Page title
Short explanation
Goal input
File area
Scan results
AI actions
Suggestions
Diff/review area
```

This gives the user a predictable workflow on every page.

## Right panel

The right panel should show context for the current page.

Possible content:

- Current section status
- Number of files
- Number of warnings
- Number of AI suggestions
- Accepted changes
- Rejected changes
- Export readiness
- Useful tips
- Current file metadata
- Selected patch reason

The right panel should not contain critical actions only. Critical actions should also exist in the main workspace.

## Dashboard page

The Dashboard should give an overview of the whole project.

Recommended sections:

- Project summary card
- Section progress list
- Recent AI suggestions
- Recent exports
- Warnings summary
- Next recommended action
- Project notes

The Dashboard should help the user answer:

- What have I added?
- What has AI already suggested?
- What is ready to export?
- What still needs review?

## Section page layout

Each section page should follow this structure:

```text
[Section heading]
[Description of what this section is for]

[Goal box]
User writes what they want changed.

[Files panel]
User adds files or folders.

[Scan panel]
App shows matches and likely file roles.

[AI panel]
User chooses prompt type and sends request.

[Suggestions panel]
AI suggestions appear as cards.

[Diff panel]
User reviews before/after.

[Section export action]
User exports only this section if wanted.
```

## File area

The file area should support:

- Drag and drop
- Add file button
- Add folder button
- Remove file
- Reassign file to another section
- Open file preview
- Show file type
- Show processing status
- Show warnings

Files should be displayed in a table or structured list with:

- File name
- Relative path
- Type
- Size
- Status
- Section
- Warning count
- Action menu

## File preview

The file preview should be opened when the user selects a file.

For text files, show:

- File content
- Line numbers
- Search input
- Matched keyword highlights
- Copy snippet button
- Send selected snippet to AI

For images, show:

- Preview
- Metadata
- Original/edited tabs if available

For unsupported binaries, show:

- File metadata
- Explanation that direct editing is not supported
- Suggested external tool or conversion step

## AI suggestions

AI suggestions should appear as cards.

Each suggestion card should show:

- File affected
- Summary
- Risk level
- Reason
- Change count
- Review button
- Accept button
- Reject button

The user should never be forced to accept all suggestions at once.

## Diff review

The diff review should be central to the app.

It should include:

- Original file view
- Edited file view
- Changed lines
- Patch reason
- Validation result
- Accept/reject controls
- Manual edit option
- Restore original option

## Texture page layout

The Textures page should be more visual than text pages.

Recommended layout:

```text
Texture list on the left
Preview and metadata in the center
Conversion and AI workflow on the right or below
```

Texture workflow steps should be shown clearly:

1. Original DDS added
2. Preview generated
3. AI/manual edit generated
4. Edited image received
5. Converted back to DDS
6. Ready for export

Each texture should show a status:

- Imported
- Preview ready
- Needs AI edit
- Edited image ready
- DDS exported
- Warning

## Export page

The Export page should feel like a final review screen.

It should show:

- Export name input
- Output folder selector
- Sections included
- Files to export
- Backups to include
- Reports to include
- Warnings blocking export
- Warnings allowed with confirmation
- Export button
- Export result summary

After export, show:

- Output path
- Files exported
- Manifest created
- Install notes created
- Report created
- Open folder button

## Settings page

The Settings page should include:

- AI provider settings
- API key input
- Model name input
- Export folder setting
- Tool path settings
- Project storage setting
- Safety toggles
- Experimental feature toggles

## Empty states

Every page should have helpful empty states.

Examples:

- No files added yet.
- Add files to start analyzing this section.
- No AI suggestions yet.
- Scan files before asking AI.
- No accepted changes ready to export.

Empty states should guide the next action clearly.

## Warnings

Warnings should be visible but not overwhelming.

Warning examples:

- This file is binary and cannot be edited directly.
- This patch could not be applied because the target text was not found.
- This texture may contain alpha transparency.
- This file looks like a normal map.
- This export has no accepted changes.
- Original file path is missing.

## Interaction principles

- Keep every workflow step visible.
- Avoid hidden destructive actions.
- Use review before export.
- Use small, focused actions instead of one huge automatic action.
- Keep section pages consistent.
- Make it easy to undo or reject AI changes.
- Make it clear what is AI-generated and what is user-approved.
