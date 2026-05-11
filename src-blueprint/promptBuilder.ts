interface BuildSectionPromptInput {
  projectName: string;
  sectionId: string;
  sectionName: string;
  userGoal: string;
  fileList: string;
  scanResults: string;
  snippets: string;
}

export function buildSectionPrompt(input: BuildSectionPromptInput): string {
  return `
Project: ${input.projectName}
Section: ${input.sectionName}

User goal:
${input.userGoal}

Files in this section:
${input.fileList}

Relevant scan results:
${input.scanResults}

Relevant snippets:
${input.snippets}

Constraints:
- Suggest only changes related to this section.
- Prefer small, reversible edits.
- Preserve syntax and file structure.
- Do not rewrite entire files unless necessary.
- If the provided data is not enough, return manual notes instead of guessing.
- Return valid JSON matching the required schema.

Required JSON schema:
{
  "section": "${input.sectionId}",
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
      "risk": "low",
      "requiresManualReview": true
    }
  ],
  "manualNotes": [],
  "testingChecklist": []
}
`.trim();
}
