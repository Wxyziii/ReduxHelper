import type { SectionId } from "./project";

export interface PromptBasketItem {
  snippetId: string;
  fileId: string;
  filePath: string;
  section: SectionId;
  lineNumber: number;
  linePreview: string;
  contextLines: string[];
  source: "user" | "suggested";
}
