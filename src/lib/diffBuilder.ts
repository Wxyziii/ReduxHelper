import type { PatchValidationResult } from "../types/patches";

export interface DiffRow {
  line: number;
  original: string;
  proposed: string;
  kind: "same" | "changed" | "added" | "removed";
}

export function buildDiffRows(validation?: PatchValidationResult): DiffRow[] {
  if (!validation?.originalSnippet && !validation?.proposedSnippet) return [];
  const original = (validation.originalSnippet ?? "").split("\n");
  const proposed = (validation.proposedSnippet ?? "").split("\n");
  const max = Math.max(original.length, proposed.length);

  return Array.from({ length: max }, (_, index) => {
    const before = original[index] ?? "";
    const after = proposed[index] ?? "";
    const kind =
      before === after ? "same" : before && !after ? "removed" : !before && after ? "added" : "changed";
    return { line: index + 1, original: before, proposed: after, kind };
  });
}
