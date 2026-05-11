import { keywordGroups } from "../data/mockSections";
import type { ProjectFile, ScanMatch } from "../types/project";

export function scanText(file: ProjectFile, content: string): ScanMatch[] {
  const keywords = keywordGroups[file.section] ?? [];
  return content
    .split("\n")
    .flatMap((line, index) => {
      const lower = line.toLowerCase();
      return keywords
        .filter((keyword) => lower.includes(keyword))
        .map((keyword) => ({
          filePath: file.relativePath,
          line: index + 1,
          keyword,
          snippet: line.trim().slice(0, 180)
        }));
    });
}
