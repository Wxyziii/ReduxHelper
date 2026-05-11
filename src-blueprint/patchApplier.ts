import type { PatchSuggestion } from "./types";

export interface PatchValidationResult {
  ok: boolean;
  reason?: string;
  matchCount?: number;
}

export function validateFindReplacePatch(fileContent: string, patch: PatchSuggestion): PatchValidationResult {
  if (patch.patchType !== "find_replace") {
    return { ok: false, reason: "Only find_replace is supported by this MVP validator." };
  }

  if (!patch.find || patch.replace === undefined) {
    return { ok: false, reason: "Patch is missing find or replace text." };
  }

  const matchCount = countOccurrences(fileContent, patch.find);

  if (matchCount === 0) {
    return { ok: false, reason: "Target text was not found.", matchCount };
  }

  if (matchCount > 1 && patch.requiresManualReview) {
    return { ok: false, reason: "Target text appears multiple times and needs manual review.", matchCount };
  }

  return { ok: true, matchCount };
}

export function applyFindReplacePatch(fileContent: string, patch: PatchSuggestion): string {
  const validation = validateFindReplacePatch(fileContent, patch);

  if (!validation.ok) {
    throw new Error(validation.reason ?? "Invalid patch.");
  }

  return fileContent.replace(patch.find!, patch.replace ?? "");
}

function countOccurrences(text: string, search: string): number {
  if (!search) return 0;

  let count = 0;
  let index = 0;

  while (true) {
    index = text.indexOf(search, index);
    if (index === -1) break;
    count += 1;
    index += search.length;
  }

  return count;
}
