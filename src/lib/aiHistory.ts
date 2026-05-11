import type { AiHistoryEntry } from "../types/ai";
import type { SectionId } from "../types/project";

interface BuildHistoryInput {
  section: SectionId;
  model: string;
  prompt: string;
  selectedFilePaths: string[];
  selectedSnippetCount: number;
  rawResponseText: string;
  validationStatus: AiHistoryEntry["validationStatus"];
  validationErrors: string[];
  suggestionsCount: number;
}

export function buildAiHistoryEntry(input: BuildHistoryInput): AiHistoryEntry {
  return {
    id: `ai-${Date.now()}`,
    section: input.section,
    timestamp: new Date().toISOString(),
    model: input.model,
    promptPreview: input.prompt.slice(0, 1200),
    selectedFilePaths: input.selectedFilePaths,
    selectedSnippetCount: input.selectedSnippetCount,
    rawResponseText: input.rawResponseText,
    validationStatus: input.validationStatus,
    validationErrors: input.validationErrors,
    suggestionsCount: input.suggestionsCount
  };
}
