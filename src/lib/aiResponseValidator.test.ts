import { describe, expect, it } from "vitest";
import { validateAiResponseJson } from "./aiResponseValidator";

describe("validateAiResponseJson", () => {
  it("rejects invalid risk level", () => {
    const raw = JSON.stringify({ summary: "x", warnings: [], suggestions: [{ id: "s", title: "bad", reason: "x", risk: "wild", targetFilePath: "a.xml", changeType: "find_replace", patch: { find: "a", replace: "b" } }], manualNotes: [], testingChecklist: [] });
    expect(validateAiResponseJson(raw, []).ok).toBe(false);
  });
});
