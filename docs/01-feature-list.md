# Full Feature List

This document lists the features the app should eventually have. Build them in phases.

## 1. Project system

### Must-have

- Create a new Redux project.
- Open an existing Redux project.
- Save project state locally.
- Store project name, created date, last edited date, notes, and selected export folder.
- Store which files belong to each section.
- Store AI suggestions and accepted/rejected changes.

### Nice-to-have

- Duplicate project.
- Archive project.
- Project tags.
- Project changelog.
- Project comparison.

## 2. Section pages

Each section should behave like a focused workspace.

Required sections:

- Dashboard
- Timecycle
- Tracers
- Hit Effects
- Kill Effect
- Optimization
- Textures
- Export
- Settings

Optional future sections:

- Minimap / HUD
- Weather
- Weapons visuals
- Roads / environment
- Particles
- ReShade / post-processing
- Documentation

## 3. File import system

### Must-have

- Add individual files.
- Add folders.
- Drag-and-drop files.
- Assign files to a section.
- Preserve original file paths.
- Detect file extension.
- Mark files as text-readable, image-convertible, binary, unsupported, or unknown.
- Store file metadata.
- Warn when the app cannot safely process a file.

### Supported text-style files

- `.xml`
- `.meta`
- `.dat`
- `.ini`
- `.txt`
- `.json`
- `.cfg`
- `.ymap.xml`
- `.ytyp.xml`

### Supported texture workflow files

- `.dds`
- `.png`
- `.tga`
- `.webp`
- `.jpg`
- `.jpeg`

### Binary files to avoid direct editing at first

- `.rpf`
- `.ytd`
- `.ypt`
- `.ydr`
- `.ydd`
- `.awc`
- `.otd`

The app can list these files, but should not modify them directly in the MVP.

## 4. File scanner

### Must-have

- Scan files for keywords.
- Group matches by section.
- Show matched line numbers for text files.
- Generate a scan report.
- Identify likely timecycle files.
- Identify likely effect files.
- Identify likely texture files.
- Identify likely optimization files.

### Suggested keyword groups

Timecycle:

- sky
- cloud
- fog
- bloom
- exposure
- saturation
- contrast
- shadow
- sun
- moon
- weather

Tracers / hit effects:

- tracer
- bullet
- trail
- impact
- spark
- muzzle
- weapon
- decal
- particle

Optimization:

- grass
- vegetation
- bush
- debris
- trash
- garbage
- litter
- density
- lod
- smoke
- dust
- reflection

Textures:

- diffuse
- albedo
- normal
- spec
- mask
- decal
- bark
- leaf
- grass
- road

## 5. AI prompt generator

### Must-have

- Generate section-specific prompts.
- Include user goal.
- Include file metadata.
- Include only relevant snippets, not entire folders.
- Tell the AI to return structured JSON.
- Tell the AI to avoid unsafe or unrelated changes.
- Tell the AI to explain changes simply.
- Tell the AI to preserve file structure.

### Prompt fields

- Project name
- Section name
- User goal
- File list
- Relevant snippets
- Constraints
- Desired response schema

## 6. AI integration

### Must-have

- Support an OpenRouter-compatible chat completion API.
- Allow user to enter API key locally.
- Store API key securely where possible.
- Allow choosing a model string.
- Show request status.
- Show model response.
- Parse structured JSON from AI response.
- Handle invalid JSON gracefully.
- Save AI responses in the project history.

### Nice-to-have

- Model presets.
- Token estimate.
- Response retry.
- Local model integration.
- Local ComfyUI integration for image workflows.
- AI response comparison from multiple models.

## 7. Patch system

### Must-have

- Accept AI edit suggestions as structured patches.
- Verify that the original text exists before replacing it.
- Apply patches only to copies.
- Show a diff before accepting.
- Allow accepting/rejecting each change separately.
- Allow manual editing before export.
- Prevent changes if file validation fails.

### Patch types

- Find/replace patch
- Line-range replacement
- Full-file replacement
- Insert-before patch
- Insert-after patch
- Delete block patch

MVP should start with only find/replace and full-file replacement.

## 8. Diff viewer

### Must-have

- Show original and edited file side by side or in a unified view.
- Highlight changed lines.
- Show patch reason.
- Show file path.
- Allow accept/reject.
- Allow copy patch.
- Allow restore original.

### Nice-to-have

- Search inside diff.
- Collapse unchanged sections.
- Export diff report.
- Syntax highlighting.

## 9. Export system

### Must-have

- Export accepted edited files into a new named folder.
- Preserve original relative paths.
- Include backups of original files.
- Include a manifest JSON.
- Include install notes.
- Include AI reports.
- Include a changelog.
- Never overwrite previous exports unless user confirms.
- Show export summary.

### Recommended export structure

```text
exports/
  Project_Name_v1/
    edited_files/
    original_backups/
    reports/
    manifest.json
    install_notes.txt
    changelog.md
```

## 10. Texture / DDS workflow

### Must-have for first texture version

- Add DDS files.
- Inspect basic metadata if tool support exists.
- Convert DDS to PNG preview using an external converter.
- Send PNG or generated prompt to an image workflow.
- Accept edited PNG.
- Convert edited PNG back to DDS.
- Preserve original filename.
- Export final DDS to output folder.
- Store conversion notes.

### Required warnings

- Normal maps can break if edited like normal images.
- Alpha transparency must be preserved when needed.
- Mipmaps may need to be regenerated.
- Compression format matters.
- Some textures may need manual checking in OpenIV or another tool.

## 11. Texture manager

### Must-have

- Texture list.
- Original preview.
- Edited preview.
- Metadata panel.
- Conversion status.
- Replacement notes.
- Export status.

### Nice-to-have

- Batch conversion.
- Version history per texture.
- Prompt history per texture.
- Comparison slider.
- Tiling preview.
- Normal map warning.
- Alpha channel preview.

## 12. Optimization assistant

### Must-have

- Scan for optimization-related keywords.
- Generate optimization report.
- Categorize suggestions by risk.
- Show what files may affect performance.
- Warn against deleting unknown objects.
- Suggest safe manual tests.

### Risk levels

- Low risk: config value changes, duplicated backups, documentation.
- Medium risk: reducing density values, reducing particle lifetime, replacing small textures.
- High risk: deleting map entries, deleting props, editing binary archives.

## 13. Kill effect assistant

### Must-have

- Explain whether the target setup supports kill effects.
- Support script/resource prompt generation.
- Generate overlay logic if the user uses a scriptable environment.
- Keep this separate from base visual file edits.

### Supported output types

- Lua concept script
- JavaScript concept script
- HTML/CSS overlay concept
- Sound/asset checklist
- Install notes

## 14. Reports and documentation

### Must-have

- Generate section reports.
- Generate final export report.
- Include warnings.
- Include changed files.
- Include rejected changes.
- Include manual steps.
- Include testing checklist.

## 15. Settings

### Must-have

- API provider settings.
- Model string.
- Export directory.
- Converter tool paths.
- Project storage location.
- Safety settings.
- Enable/disable experimental features.

## 16. Safety and validation

### Must-have

- Never modify original files directly.
- Require a backup before export.
- Validate AI JSON response.
- Validate file exists.
- Validate patch target text exists.
- Show warnings for binary files.
- Show warnings for risky edits.
- Keep logs of changes.

## 17. Future advanced features

- Full project search.
- Built-in file tree.
- Side-by-side screenshot notes.
- Before/after gallery.
- Local ComfyUI image workflow.
- Batch texture generation.
- Built-in prompt library.
- Project templates.
- Extension/plugin system.
- Import from previous export.
- Automatic install notes based on changed files.
