# Phase 6 Prompt: Texture / DDS Workflow

Add first texture workflow.

Requirements:
- Let user add DDS files to the Textures page.
- Store texture metadata placeholders.
- Show unsupported/direct-edit warning.
- Add converter tool path settings.
- Implement external conversion command wrapper.
- Convert DDS to PNG preview if converter is configured.
- Let user import edited PNG manually.
- Convert edited PNG back to DDS if converter is configured.
- Preserve original filename and relative path.
- Export final DDS into export folder.
- Add warnings for normal maps, masks, alpha, and mipmaps.
- Add texture report generation.

Do not claim AI directly edits DDS.
Do not implement direct YTD editing yet.

Deliver:
- Texture list
- Texture preview
- TextureWorkflow component
- `texturePipeline.ts`
- converter settings
- export support for texture outputs
