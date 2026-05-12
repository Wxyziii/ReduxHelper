import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "./searchQuery";

describe("parseSearchQuery", () => {
  it("parses filters, keywords, phrases", () => {
    const parsed = parseSearchQuery('section:timecycle ext:xml "sky glow" fog');
    expect(parsed.filters.section).toBe("timecycle");
    expect(parsed.filters.ext).toBe("xml");
    expect(parsed.phrases).toEqual(["sky glow"]);
    expect(parsed.keywords).toEqual(["fog"]);
  });
});
