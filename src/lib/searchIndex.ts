import { parseSearchQuery } from "./searchQuery";
import type { ProjectIndexEntry } from "../types/indexing";
import type { ProjectFile } from "../types/project";
import type { ParsedSearchQuery, SearchResult } from "../types/search";

export function searchProjectIndex(index: ProjectIndexEntry[], files: ProjectFile[], query: string): { parsed: ParsedSearchQuery; results: SearchResult[] } {
  const parsed = parseSearchQuery(query);
  const results = index
    .map((entry) => scoreEntry(entry, files.find((file) => file.id === entry.fileId), parsed))
    .filter((result): result is SearchResult => !!result && result.score > 0)
    .sort((a, b) => b.score - a.score);
  return { parsed, results };
}

function scoreEntry(entry: ProjectIndexEntry, file: ProjectFile | undefined, parsed: ParsedSearchQuery): SearchResult | undefined {
  if (!passesFilters(entry, parsed.filters)) return undefined;
  const haystack = `${entry.fileName} ${entry.intendedGameRelativePath} ${entry.extension} ${entry.section} ${entry.keywords.join(" ")} ${entry.warnings.join(" ")}`.toLowerCase();
  const matchedKeywords = parsed.keywords.filter((keyword) => haystack.includes(keyword));
  const phraseMatches = parsed.phrases.filter((phrase) => haystack.includes(phrase));
  const queryTerms = parsed.keywords.length + parsed.phrases.length;
  if (queryTerms && matchedKeywords.length + phraseMatches.length < queryTerms) return undefined;
  const matches = file?.scanMatches.filter((match) => [...parsed.keywords, ...parsed.phrases].some((term) => match.snippet.toLowerCase().includes(term) || match.keyword.toLowerCase().includes(term))) ?? [];
  const filterOnly = queryTerms === 0 && Object.keys(parsed.filters).length > 0;
  return {
    entry,
    score: (matchedKeywords.length * 5) + (phraseMatches.length * 8) + matches.length + (entry.exportEligible ? 2 : 0) + (filterOnly ? 1 : 0),
    matchedKeywords: [...matchedKeywords, ...phraseMatches],
    matches
  };
}

function passesFilters(entry: ProjectIndexEntry, filters: Record<string, string>) {
  return Object.entries(filters).every(([key, value]) => {
    const wanted = value.toLowerCase();
    if (key === "section") return entry.section.toLowerCase() === wanted;
    if (key === "ext") return entry.extension.replace(".", "").toLowerCase() === wanted.replace(".", "");
    if (key === "type") return entry.fileType.toLowerCase().includes(wanted);
    if (key === "source") return entry.sourceType === wanted;
    if (key === "path") return entry.intendedGameRelativePath.toLowerCase().includes(wanted);
    if (key === "file") return entry.fileName.toLowerCase().includes(wanted);
    if (key === "warning") return String(entry.warnings.length > 0) === wanted;
    if (key === "exportready") return String(entry.exportEligible) === wanted;
    return true;
  });
}
