import type { SectionId } from "../types/project";

export interface WorkflowDefinition {
  id: string;
  title: string;
  page: SectionId;
  safetyNote: string;
  steps: string[];
}

export const workflows: WorkflowDefinition[] = [
  {
    id: "timecycle-safe",
    title: "Edit timecycle safely",
    page: "timecycle",
    safetyNote: "AI suggestions must be validated and applied only to workspace copies.",
    steps: ["Import timecycle files", "Scan project", "Select relevant snippets", "Ask AI", "Validate patches", "Review diff", "Apply accepted patches", "Create export package"]
  },
  {
    id: "tracers",
    title: "Analyze tracer files",
    page: "tracers",
    safetyNote: "Unsupported binary effect files are tracked only; no direct archive edits.",
    steps: ["Import tracer files", "Scan for weapon/tracer keywords", "Use prompt basket", "Review AI suggestions", "Export manual package"]
  },
  {
    id: "dds-texture",
    title: "Edit DDS texture",
    page: "textures",
    safetyNote: "DDS is converted to PNG first; original DDS stays untouched.",
    steps: ["Import DDS", "Inspect metadata", "Generate PNG preview", "Import or generate edited PNG", "Compare A/B", "Compile DDS", "Mark export-ready", "Export package"]
  },
  {
    id: "texture-ai",
    title: "Generate AI-edited texture",
    page: "textures",
    safetyNote: "ComfyUI edits PNG previews only, never DDS or archives.",
    steps: ["Configure ComfyUI", "Generate PNG preview", "Write prompt", "Generate output", "Attach output", "Review A/B", "Compile DDS manually"]
  },
  {
    id: "export-package",
    title: "Create export package",
    page: "export",
    safetyNote: "Export is a manual package; OpenIV/manual import remains user-controlled.",
    steps: ["Apply accepted patches", "Mark textures export-ready", "Review warnings", "Create export package", "Read install notes", "Import manually"]
  }
];
