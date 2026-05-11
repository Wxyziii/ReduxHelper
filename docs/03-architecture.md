# Architecture

## Recommended stack

Recommended desktop stack:

- Tauri + React + TypeScript

Alternative:

- Electron + Vite + React + TypeScript

For the first implementation, the architecture should be simple and modular.

## App layers

```text
UI layer
  React pages and components

Project layer
  Local project state, section state, file references

File layer
  File scanning, reading, writing, metadata, backups

AI layer
  Prompt builder, API client, response parser

Patch layer
  Patch validation, diff generation, patch application

Texture layer
  DDS inspection, conversion, preview generation, image workflow

Export layer
  Output folder creation, manifest, reports, install notes
```

## Suggested frontend folders

```text
src/
  app/
    App.tsx
    routes.tsx
  pages/
    DashboardPage.tsx
    TimecyclePage.tsx
    TracersPage.tsx
    HitEffectsPage.tsx
    KillEffectPage.tsx
    OptimizationPage.tsx
    TexturesPage.tsx
    ExportPage.tsx
    SettingsPage.tsx
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopBar.tsx
      RightPanel.tsx
    files/
      FileDropzone.tsx
      FileTable.tsx
      FilePreview.tsx
      FileMetadataPanel.tsx
    ai/
      GoalBox.tsx
      PromptPreview.tsx
      AiResponsePanel.tsx
      SuggestionCard.tsx
    diff/
      DiffViewer.tsx
      PatchReviewPanel.tsx
    export/
      ExportSummary.tsx
      ExportOptions.tsx
    textures/
      TextureList.tsx
      TexturePreview.tsx
      TextureWorkflow.tsx
  lib/
    projectStore.ts
    sectionConfig.ts
    fileScanner.ts
    promptBuilder.ts
    openrouterClient.ts
    patchApplier.ts
    diffEngine.ts
    exportManager.ts
    texturePipeline.ts
    validators.ts
  types/
    project.ts
    files.ts
    ai.ts
    patches.ts
    export.ts
    textures.ts
```

## Suggested backend/native responsibilities

The backend/native side should handle:

- File system access
- Reading files
- Writing exports
- Creating backups
- Running external conversion tools
- Secure-ish API key storage if possible
- Opening folders/files
- Long-running scans

The frontend should handle:

- Navigation
- UI state
- Reviewing changes
- Displaying file previews
- Displaying diffs
- User confirmation

## Data flow: text file AI edit

```text
User adds file
→ App reads file metadata
→ App scans for keywords
→ User enters section goal
→ Prompt builder creates AI prompt
→ AI returns structured JSON
→ Response parser validates JSON
→ Patch validator checks targets
→ Diff viewer shows changes
→ User accepts changes
→ Export manager writes edited copy
```

## Data flow: DDS texture edit

```text
User adds DDS
→ App stores original metadata
→ App converts DDS to PNG preview
→ User writes texture goal
→ AI/image workflow creates edited PNG
→ App checks dimensions/alpha if possible
→ App converts edited PNG back to DDS
→ App saves final DDS in export folder
```

## State model

A project should contain:

- Project metadata
- Section list
- Files assigned to sections
- AI requests
- AI responses
- Patch suggestions
- Accepted/rejected patch status
- Texture conversions
- Export history

## File safety model

The app should have these file zones:

```text
Original source files:
  Never modified directly.

Workspace cache:
  Temporary copies, previews, scans.

Project data:
  JSON state and history.

Export folder:
  User-approved output only.
```

## Patch safety rules

- Do not apply a patch if the target file does not exist.
- Do not apply a find/replace patch if the find text does not exist.
- Do not apply a patch if it affects multiple locations unexpectedly unless the patch says multiple replacements are allowed.
- Do not apply a patch to binary files.
- Do not overwrite exports without confirmation.
- Always produce backup copies in the export package.

## AI response format

The AI should be asked to return JSON matching the patch schema.

The AI response should include:

- Section
- Summary
- Warnings
- Suggested patches
- Manual notes
- Testing checklist

Never rely only on free-form prose for applying edits.

## Error handling

Handle:

- Invalid API key
- API timeout
- Invalid AI JSON
- Patch target not found
- Unsupported file type
- File read permission error
- Export folder write error
- Converter missing
- Converter failed
- Image dimensions changed unexpectedly
