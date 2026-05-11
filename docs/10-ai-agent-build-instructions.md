# AI Coding Agent Instructions

Use these instructions when giving this starter pack to an AI coding agent.

## Main instruction

Build the app in phases. Do not attempt every advanced feature immediately.

Start by building the desktop UI, data model, file import, text scanning, prompt generation, patch review, and export system. Texture conversion and image AI workflows can be added after the text-file workflow works.

## Required behavior

- Keep the project modular.
- Keep business logic outside page components.
- Use TypeScript types for project, file, AI response, patch, and export manifest.
- Use mock data first when needed.
- Do not hardcode one specific AI model.
- Do not hardcode one specific converter tool.
- Keep all file edits copy-based.
- Keep original files untouched.
- Generate tests or at least testable pure functions for scanner, prompt builder, patch applier, and export manifest generation.

## Build order

1. App shell and routes.
2. Section pages with mock data.
3. Project data model.
4. Local project save/load.
5. File import and scanning.
6. Prompt builder.
7. AI client.
8. AI JSON parser.
9. Patch validator.
10. Diff viewer.
11. Export manager.
12. Texture workflow.

## Do not build yet

- Direct `.rpf` editing.
- Direct `.ytd` editing.
- Direct `.ypt` editing.
- Anti-cheat bypasses.
- Memory scanning.
- Gameplay cheat features.
- Automatic mass edits.
- Cloud project sync.

## Testing checklist

For every phase, test:

- Empty state
- Normal state
- Error state
- Large file handling
- Invalid user input
- Export path edge cases
- AI invalid JSON response
- Patch target not found
