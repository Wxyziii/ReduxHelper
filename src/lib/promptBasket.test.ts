import { describe, expect, it } from "vitest";
import { basketPrompt, mergeBasket } from "./promptBasket";
import type { PromptBasketItem } from "../types/promptBasket";

const item: PromptBasketItem = {
  snippetId: "a",
  fileId: "f",
  filePath: "common/data/test.xml",
  section: "timecycle",
  lineNumber: 1,
  linePreview: "<sky value=\"1\" />",
  contextLines: [],
  source: "user"
};

describe("promptBasket", () => {
  it("deduplicates snippets", () => {
    expect(mergeBasket([item], [item])).toHaveLength(1);
  });

  it("builds prompt text", () => {
    expect(basketPrompt([item])).toContain("common/data/test.xml");
  });
});
