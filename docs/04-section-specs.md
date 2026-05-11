# Section Specifications

## Dashboard

Purpose:

- Give a high-level overview of the current project.

Features:

- Project summary
- Section status cards
- Recent files
- Recent AI responses
- Recent accepted changes
- Warnings
- Export readiness
- Next recommended action

## Timecycle

Purpose:

- Work on weather, lighting, atmosphere, exposure, contrast, fog, sky, clouds, and general visual feel.

Typical files:

- Timecycle XML files
- Weather files
- Visual settings files
- Post-processing config files

AI tasks:

- Explain values.
- Suggest safer edits.
- Identify values connected to sky, fog, bloom, exposure, saturation, shadows, and reflections.
- Generate structured patches.
- Generate a testing checklist.

Risk level:

- Usually low to medium if editing text files with backups.

## Tracers

Purpose:

- Work on bullet trails and related weapon visual effects.

Typical files:

- Exported particle files
- Weapon-related config snippets
- Effect references
- Texture references

AI tasks:

- Identify likely tracer values.
- Suggest style changes.
- Explain particle lifetime, size, alpha, glow, trail behavior, and impact relation.
- Generate patches when the file is text-readable.
- Generate manual instructions when the file is binary.

Risk level:

- Medium because many tracer systems are stored in formats that may need external tools.

## Hit Effects

Purpose:

- Work on bullet impact, blood impact, sparks, dust, decals, and short visual feedback effects.

Typical files:

- Particle exports
- Decal configs
- Blood effect configs
- Weapon impact references

AI tasks:

- Identify hit-related sections.
- Suggest effect adjustments.
- Keep effects consistent with tracer style.
- Avoid excessive visibility or performance-heavy effects.
- Generate patches or manual notes.

Risk level:

- Medium.

## Kill Effect

Purpose:

- Help design or generate logic for a kill-triggered visual/sound/UI effect when the target environment supports scripting.

Typical files:

- Script files
- UI overlay files
- Sound references
- Image references

AI tasks:

- Explain whether a kill effect is possible in the user's setup.
- Generate script/resource plans.
- Generate overlay concepts.
- Generate install notes.

Risk level:

- Medium to high depending on platform.
- The app should not create cheating systems or memory-reading features.

## Optimization

Purpose:

- Help reduce visual clutter or performance-heavy elements through careful analysis.

Typical files:

- Procedural vegetation configs
- Visual settings
- Particle configs
- Texture references
- Map/object lists when exported to readable form

AI tasks:

- Scan for likely performance-related values.
- Generate a risk-ranked optimization report.
- Suggest low-risk edits first.
- Warn against deleting unknown world objects.
- Generate testing checklist.

Risk level:

- Medium to high.

## Textures

Purpose:

- Manage image/texture replacement workflows, especially DDS conversion.

Typical files:

- DDS files
- PNG/TGA source images
- Texture metadata
- External generated image files

AI tasks:

- Classify texture role from filename and preview.
- Generate prompts for image editing.
- Warn about normal maps, alpha, mipmaps, and compression.
- Generate conversion notes.
- Generate export notes.

Risk level:

- Medium.

## Export

Purpose:

- Prepare final output folder.

Features:

- Export name input
- Include/exclude sections
- File list
- Warnings
- Backup inclusion
- Manifest creation
- Install notes
- Changelog
- Open output folder

Risk level:

- Low if originals are never modified.
