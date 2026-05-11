# Export System

## Goal

The app should export all accepted changes into a clean folder that the user can manually add to their game/modding tools.

## Important rule

Never directly overwrite original source files.

## Export structure

Recommended:

```text
exports/
  Project_Name_v1/
    edited_files/
      original/relative/path/file.ext
    original_backups/
      original/relative/path/file.ext
    reports/
      ai_report.md
      scan_report.md
      texture_report.md
    manifest.json
    install_notes.txt
    changelog.md
```

## Manifest

The manifest should describe exactly what changed.

Example:

```json
{
  "projectName": "Redux_Project",
  "exportName": "Redux_Project_v1",
  "createdAt": "2026-01-01T12:00:00Z",
  "sectionsIncluded": ["timecycle", "textures"],
  "files": [
    {
      "section": "timecycle",
      "sourcePath": "C:/source/timecycle.xml",
      "relativePath": "common/data/timecycle/timecycle.xml",
      "exportPath": "edited_files/common/data/timecycle/timecycle.xml",
      "backupPath": "original_backups/common/data/timecycle/timecycle.xml",
      "changeCount": 3,
      "status": "exported"
    }
  ],
  "warnings": []
}
```

## Install notes

The install notes should be generated automatically.

They should include:

- Export name
- Included sections
- Changed files
- Original relative paths
- Manual import reminder
- Testing checklist
- Warnings

## Changelog

The changelog should include:

- Date
- Section
- File
- Summary of accepted changes
- AI-generated notes
- User notes

## Export validation

Before export, check:

- At least one accepted change exists.
- Output folder exists or can be created.
- Export name is valid.
- No patch validation errors remain.
- Backups can be written.
- All edited files can be written.
- Manifest can be written.

## Export modes

### Full project export

Exports all accepted changes from all sections.

### Section export

Exports accepted changes only from the current section.

### Texture export

Exports edited DDS files and related texture reports.

## Avoid

- Do not overwrite old exports automatically.
- Do not export rejected patches.
- Do not hide warnings.
- Do not modify original files.
