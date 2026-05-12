import { keywordGroups } from "../data/mockSections";
import type { PromptBasketItem } from "../types/promptBasket";
import type { ProjectFile, ReduxProject, SectionId } from "../types/project";

export function addMatchesToBasket(existing: PromptBasketItem[], files: ProjectFile[], fileId: string, source: "user" | "suggested" = "user") {
  const file = files.find((item) => item.id === fileId);
  if (!file) return existing;
  const items = file.scanMatches.slice(0, 8).map((match) => makeBasketItem(file, match.line, match.snippet, source));
  return mergeBasket(existing, items);
}

export function suggestSnippetsForSection(project: ReduxProject, section: SectionId): PromptBasketItem[] {
  const goal = project.sections[section]?.goal.toLowerCase() ?? "";
  const keywords = new Set([...(keywordGroups[section] ?? []), ...goal.split(/\W+/).filter((item) => item.length > 3)]);
  return project.files
    .filter((file) => file.section === section && file.status === "text-readable")
    .flatMap((file) =>
      file.scanMatches
        .filter((match) => keywords.has(match.keyword.toLowerCase()) || [...keywords].some((keyword) => match.snippet.toLowerCase().includes(keyword)))
        .slice(0, 6)
        .map((match) => makeBasketItem(file, match.line, match.snippet, "suggested"))
    )
    .slice(0, 30);
}

export function mergeBasket(existing: PromptBasketItem[], incoming: PromptBasketItem[]) {
  const map = new Map(existing.map((item) => [item.snippetId, item]));
  incoming.forEach((item) => map.set(item.snippetId, item));
  return Array.from(map.values());
}

export function basketPrompt(items: PromptBasketItem[]) {
  const grouped = new Map<string, PromptBasketItem[]>();
  items.forEach((item) => grouped.set(item.filePath, [...(grouped.get(item.filePath) ?? []), item]));
  return Array.from(grouped.entries())
    .map(([filePath, snippets]) => [`File: ${filePath}`, ...snippets.map((item) => `L${item.lineNumber}: ${item.linePreview}`)].join("\n"))
    .join("\n\n");
}

export function estimatePromptSize(items: PromptBasketItem[]) {
  return basketPrompt(items).length;
}

function makeBasketItem(file: ProjectFile, line: number, preview: string, source: "user" | "suggested"): PromptBasketItem {
  return {
    snippetId: `${file.id}:${line}:${preview.slice(0, 30)}`,
    fileId: file.id,
    filePath: file.relativePath,
    section: file.section,
    lineNumber: line,
    linePreview: preview,
    contextLines: [preview],
    source
  };
}
