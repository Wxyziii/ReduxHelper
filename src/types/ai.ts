import type { SectionId } from "./project";

export type AiSectionId = "timecycle" | "tracers" | "hit_effects" | "kill_effect" | "optimization" | "textures";
export type AiRiskLevel = "low" | "medium" | "high";
export type AiChangeType = "find_replace" | "manual_instruction" | "report_only";
export type AiSuggestionStatus = "pending" | "accepted" | "rejected";

export interface SelectedSnippet {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
  line: number;
  keyword: string;
  snippet: string;
  warnings: string[];
}

export interface AiPatchPayload {
  find: string;
  replace: string;
}

export interface AiSuggestion {
  id: string;
  title: string;
  reason: string;
  risk: AiRiskLevel;
  targetFilePath: string;
  changeType: AiChangeType;
  patch?: AiPatchPayload;
  manualSteps?: string[];
  testingNotes?: string[];
}

export interface StructuredAiResponse {
  summary: string;
  section: AiSectionId;
  suggestions: AiSuggestion[];
  warnings: string[];
  testingChecklist: string[];
}

export interface ValidatedAiResponse {
  ok: boolean;
  data?: StructuredAiResponse;
  errors: string[];
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  siteUrl?: string;
  appName?: string;
}

export interface OpenRouterResponse {
  ok: boolean;
  rawResponseText: string;
  assistantContent: string;
  modelUsed: string;
  requestMs: number;
  error?: string;
  statusCode?: number;
}

export interface AiHistoryEntry {
  id: string;
  section: SectionId;
  timestamp: string;
  model: string;
  promptPreview: string;
  selectedFilePaths: string[];
  selectedSnippetCount: number;
  rawResponseText: string;
  validationStatus: "valid" | "invalid" | "api_error" | "not_validated";
  validationErrors: string[];
  suggestionsCount: number;
}

export function toAiSection(sectionId: SectionId): AiSectionId | null {
  const map: Partial<Record<SectionId, AiSectionId>> = {
    timecycle: "timecycle",
    tracers: "tracers",
    hitEffects: "hit_effects",
    killEffect: "kill_effect",
    optimization: "optimization",
    textures: "textures"
  };
  return map[sectionId] ?? null;
}
