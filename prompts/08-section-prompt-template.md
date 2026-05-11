# Section AI Prompt Template

Use this template when the app asks AI to analyze a section.

```text
Project: {{projectName}}
Section: {{sectionName}}

User goal:
{{userGoal}}

Files in this section:
{{fileList}}

Relevant scan results:
{{scanResults}}

Relevant snippets:
{{snippets}}

Constraints:
- Suggest only changes related to this section.
- Prefer small, reversible edits.
- Preserve syntax and file structure.
- Do not rewrite entire files unless necessary.
- If the provided data is not enough, return manual notes instead of guessing.
- Return valid JSON matching the required schema.

Required JSON schema:
{
  "section": "{{sectionId}}",
  "summary": "Short summary",
  "warnings": [],
  "patches": [
    {
      "id": "patch-001",
      "filePath": "relative/path/file.ext",
      "patchType": "find_replace",
      "find": "exact original text",
      "replace": "exact replacement text",
      "reason": "Why this change helps",
      "risk": "low | medium | high",
      "requiresManualReview": true
    }
  ],
  "manualNotes": [],
  "testingChecklist": []
}
```
