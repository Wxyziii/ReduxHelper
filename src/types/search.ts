import type { ProjectIndexEntry } from "./indexing";
import type { ScanMatch } from "./project";

export interface ParsedSearchQuery {
  keywords: string[];
  phrases: string[];
  filters: Record<string, string>;
  errors: string[];
}

export interface SearchResult {
  entry: ProjectIndexEntry;
  score: number;
  matchedKeywords: string[];
  matches: ScanMatch[];
}
