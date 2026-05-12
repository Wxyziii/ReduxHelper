import { describe, expect, it } from "vitest";
import { validateProjectShape } from "./projectSchema";

describe("validateProjectShape", () => {
  it("rejects corrupt project object", () => {
    expect(validateProjectShape({ projectId: "x" }).ok).toBe(false);
  });
});
