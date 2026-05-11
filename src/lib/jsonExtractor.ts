export interface JsonExtractionResult {
  ok: boolean;
  jsonText?: string;
  value?: unknown;
  errors: string[];
}

export function extractJsonObject(text: string): JsonExtractionResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, errors: ["AI response was empty."] };

  const attempts = [trimmed, ...extractCodeFenceJson(trimmed), ...extractBalancedObjects(trimmed)];
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const value = JSON.parse(attempt);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return { ok: true, jsonText: attempt, value, errors: [] };
      }
      errors.push("Parsed JSON was not an object.");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown JSON parse error.");
    }
  }

  return { ok: false, errors: [`Could not extract valid JSON object. ${errors[0] ?? ""}`] };
}

function extractCodeFenceJson(text: string) {
  const matches = Array.from(text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi));
  return matches.map((match) => match[1]?.trim()).filter((value): value is string => Boolean(value));
}

function extractBalancedObjects(text: string) {
  const candidates: string[] = [];
  for (let start = text.indexOf("{"); start >= 0; start = text.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        candidates.push(text.slice(start, index + 1));
        break;
      }
    }
  }
  return candidates;
}
