import type { ProjectFile, ProjectSection } from "../types/project";

export function buildSectionPrompt(projectName: string, section: ProjectSection, files: ProjectFile[]) {
  return `Project: ${projectName}
Section: ${section.name}

User goal:
${section.goal}

Files in this section:
${files.map((file) => `- ${file.relativePath} (${file.status})`).join("\n")}

Relevant scan results:
${files.flatMap((file) => file.scanMatches.map((match) => `- ${file.fileName}:${match.line} ${match.keyword}: ${match.snippet}`)).join("\n")}

Constraints:
- Suggest only changes related to this section.
- Prefer small, reversible edits.
- Preserve syntax and file structure.
- Never edit original files directly.
- Return valid JSON with section, summary, warnings, patches, manualNotes, testingChecklist.`;
}
