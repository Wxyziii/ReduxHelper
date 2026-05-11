import { aiResponseSchema } from "./aiResponseSchema";
import { extractJsonObject } from "./jsonExtractor";
import type { StructuredAiResponse, ValidatedAiResponse } from "../types/ai";
import type { ProjectFile } from "../types/project";

export function validateAiResponseJson(raw: string, importedFiles: ProjectFile[]): ValidatedAiResponse {
  const extracted = extractJsonObject(raw);
  if (!extracted.ok) {
    return { ok: false, errors: extracted.errors };
  }

  const result = aiResponseSchema.safeParse(extracted.value);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
    };
  }

  const pathWarnings = validateTargetPaths(result.data, importedFiles);
  return {
    ok: pathWarnings.length === 0,
    data: result.data,
    errors: pathWarnings
  };
}

function validateTargetPaths(response: StructuredAiResponse, importedFiles: ProjectFile[]) {
  const knownPaths = new Set(importedFiles.map((file) => file.relativePath));
  return response.suggestions
    .filter((suggestion) => suggestion.targetFilePath && !knownPaths.has(suggestion.targetFilePath))
    .map((suggestion) => `suggestions.${suggestion.id}.targetFilePath: "${suggestion.targetFilePath}" does not match an imported project file.`);
}
