import type { ParsedSearchQuery } from "../types/search";

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const tokens = tokenize(query);
  const parsed: ParsedSearchQuery = { keywords: [], phrases: [], filters: {}, errors: [] };
  for (const token of tokens) {
    const colon = token.indexOf(":");
    if (colon > 0) {
      const key = token.slice(0, colon).trim();
      const value = token.slice(colon + 1).trim();
      if (!value) parsed.errors.push(`Filter ${key}: is missing a value.`);
      else parsed.filters[key] = value;
    } else if (token.includes(" ")) {
      parsed.phrases.push(token.toLowerCase());
    } else if (token) {
      parsed.keywords.push(token.toLowerCase());
    }
  }
  return parsed;
}

function tokenize(query: string) {
  const tokens: string[] = [];
  const pattern = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(query))) tokens.push(match[1] ?? match[2]);
  return tokens;
}
