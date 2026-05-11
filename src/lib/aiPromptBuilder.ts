import type { SelectedSnippet } from "../types/ai";
import { toAiSection } from "../types/ai";
import type { ProjectFile, ProjectSection, ReduxProject, SectionId } from "../types/project";

interface BuildAiPromptInput {
  project: ReduxProject;
  sectionId: SectionId;
  section: ProjectSection;
  files: ProjectFile[];
  selectedSnippets: SelectedSnippet[];
}

export function buildAiPrompt({ project, sectionId, section, files, selectedSnippets }: BuildAiPromptInput) {
  const aiSection = toAiSection(sectionId);
  const includedFiles = files.filter((file) => selectedSnippets.some((snippet) => snippet.filePath === file.relativePath));
  const fileLines = includedFiles.length
    ? includedFiles.map((file) => `- ${file.relativePath} | type=${file.extension || "unknown"} | status=${file.status} | warnings=${file.warnings.join("; ") || "none"}`).join("\n")
    : "- No files selected. Return report_only/manual_instruction suggestions only.";
  const snippetLines = selectedSnippets.length
    ? selectedSnippets.map((snippet) => `- ${snippet.filePath}:${snippet.line} [${snippet.keyword}] ${snippet.snippet}`).join("\n")
    : "- No scan snippets selected.";

  return `You are Redux AI Assistant, a GTA V visual modding helper.

Project:
${project.projectName}

Active section:
${section.name} (${aiSection ?? sectionId})

User goal/instruction:
${section.goal || "No goal provided. Ask for small, reversible, section-specific suggestions only."}

Selected files:
${fileLines}

Selected scan results/snippets:
${snippetLines}

Safety rules:
- Never ask the AI to edit original files directly.
- All edits must target project workspace copies only.
- AI must return JSON only.
- AI must not invent file paths.
- AI must not suggest destructive mass edits without marking high risk.
- AI must prefer small reversible changes.
- AI must explain every suggestion.
- AI must include testing notes.
- For binary or unsupported files, use manual_instruction or report_only only.
- Do not include cheating, memory-reading, wallhack, aim assist, bypass, or anti-cheat evasion logic.

Return strict JSON in this exact shape:
{
  "summary": "string",
  "section": "${aiSection ?? "timecycle"}",
  "suggestions": [
    {
      "id": "string",
      "title": "string",
      "reason": "string",
      "risk": "low | medium | high",
      "targetFilePath": "string",
      "changeType": "find_replace | manual_instruction | report_only",
      "patch": {
        "find": "string",
        "replace": "string"
      },
      "manualSteps": ["string"],
      "testingNotes": ["string"]
    }
  ],
  "warnings": ["string"],
  "testingChecklist": ["string"]
}`;
}

export function estimatePromptSize(prompt: string) {
  return {
    characters: prompt.length,
    estimatedTokens: Math.ceil(prompt.length / 4)
  };
}

export function makeSnippetId(filePath: string, line: number, keyword: string) {
  return `${filePath}:${line}:${keyword}`;
}
