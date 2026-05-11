# DDS Texture Pipeline

## Goal

Allow the app to work with DDS textures without expecting the AI model to edit DDS directly.

## Correct mental model

```text
AI edits images.
The app converts formats.
The user reviews results.
```

## Pipeline

```text
Original DDS
→ Inspect metadata
→ Convert DDS to PNG preview
→ AI/manual edit creates PNG
→ Validate edited PNG
→ Convert PNG back to DDS
→ Export final DDS
```

## App responsibilities

The app should:

- Preserve original filename.
- Preserve original relative path.
- Store original texture metadata if detectable.
- Convert DDS to a preview format.
- Store preview image.
- Store edited image.
- Convert edited image back to DDS.
- Generate mipmaps if appropriate.
- Preserve alpha if required.
- Warn about normal maps and mask maps.
- Export final DDS into the project output folder.

## AI responsibilities

The AI should:

- Help classify the texture.
- Generate image editing prompts.
- Suggest whether the texture should be manually reviewed.
- Suggest conversion settings when possible.
- Warn about normal maps, masks, transparency, and mipmaps.

## User responsibilities

The user should:

- Test in-game.
- Keep backups.
- Check if texture appears correctly.
- Compare before/after.
- Avoid applying large batches before testing one file.

## Texture types

### Diffuse / albedo textures

Usually safer for AI image editing.

Examples:

- grass surface
- road surface
- tree bark
- dirt
- general decals

### Normal maps

Risky for normal image editing.

Reason:

- They encode surface direction, not normal visible color.

App should show a warning if filename contains:

- `_n`
- `normal`
- `nrm`
- `bump`

### Mask/spec/utility maps

Risky unless the user knows what the channels represent.

Filename hints:

- mask
- spec
- rough
- metal
- ao
- mrao

### Alpha textures

Need transparency preservation.

Filename hints:

- leaf
- leaves
- grass
- decal
- fence
- glass

## Metadata to track

For each texture, store:

```json
{
  "fileName": "example.dds",
  "relativePath": "textures/example.dds",
  "width": 1024,
  "height": 1024,
  "format": "unknown",
  "hasAlpha": "unknown",
  "mipmaps": "unknown",
  "guessedType": "diffuse",
  "warnings": []
}
```

## Conversion tool path

The app should allow the user to set paths for converter tools in Settings.

Possible conversion tool categories:

- DDS-to-image converter
- Image-to-DDS converter
- Metadata inspector

The app should not depend on one hardcoded tool only.
