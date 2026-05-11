# Texture AI Prompt Template

Use this when generating an image-editing prompt or texture plan.

```text
Project: {{projectName}}
Section: Textures

Texture file:
{{fileName}}

Known metadata:
{{metadata}}

User goal:
{{userGoal}}

Preview notes:
{{previewNotes}}

Task:
Create a texture editing plan and an image-generation/editing prompt.

Rules:
- Do not claim to edit DDS directly.
- Assume the app converts DDS to PNG and back to DDS.
- Preserve the texture's purpose.
- Warn if this looks like a normal map, mask, alpha texture, or utility map.
- Mention whether dimensions, tiling, alpha, and mipmaps need review.
- Return JSON only.

Required JSON:
{
  "textureFile": "{{fileName}}",
  "guessedTextureType": "diffuse | normal | mask | alpha | unknown",
  "warnings": [],
  "imagePrompt": "Prompt for the image editing model",
  "conversionNotes": [],
  "manualReviewChecklist": []
}
```
