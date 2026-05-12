import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./jsonExtractor";

describe("extractJsonObject", () => {
  it("parses direct JSON", () => {
    expect(extractJsonObject('{"ok":true}').ok).toBe(true);
  });

  it("parses fenced JSON", () => {
    const result = extractJsonObject("```json\n{\"ok\":true}\n```");
    expect(result.value).toEqual({ ok: true });
  });
});
