import { describe, expect, it } from "vitest";
import { classifySection } from "./sectionClassifier";

describe("classifySection", () => {
  it("assigns timecycle files", () => {
    expect(classifySection("common/data/timecycle/timecycle_mods_1.xml", ".xml")).toBe("timecycle");
  });
});
