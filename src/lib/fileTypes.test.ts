import { describe, expect, it } from "vitest";
import { detectFileStatus } from "./fileTypes";

describe("detectFileStatus", () => {
  it("detects unsupported archive binaries", () => {
    expect(detectFileStatus(".rpf")).toBe("binary-unsupported");
  });

  it("detects textures", () => {
    expect(detectFileStatus(".dds")).toBe("texture-workflow");
  });
});
