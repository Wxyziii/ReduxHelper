import type { PatchSuggestion } from "../types/project";

export function applyMockPatch(content: string, patch: PatchSuggestion): string {
  if (patch.patchType !== "find_replace" || !patch.find || patch.replace === undefined) {
    return content;
  }

  return content.replace(patch.find, patch.replace);
}

export function getDiffLines(content: string, patch: PatchSuggestion) {
  const edited = applyMockPatch(content, patch);
  const originalLines = content.split("\n");
  const editedLines = edited.split("\n");
  const max = Math.max(originalLines.length, editedLines.length);

  return Array.from({ length: max }, (_, index) => ({
    line: index + 1,
    original: originalLines[index] ?? "",
    edited: editedLines[index] ?? "",
    changed: (originalLines[index] ?? "") !== (editedLines[index] ?? "")
  }));
}
