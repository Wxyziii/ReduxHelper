import { mockProject } from "../data/mockProject";
import type { ReduxProject } from "../types/project";

export const CURRENT_PROJECT_SCHEMA_VERSION = "0.10.0";

export function validateProjectShape(value: unknown): { ok: boolean; errors: string[] } {
  if (!value || typeof value !== "object") return { ok: false, errors: ["Project JSON is not an object."] };
  const project = value as Partial<ReduxProject>;
  const errors: string[] = [];
  if (!project.projectId) errors.push("Missing projectId.");
  if (!project.projectName) errors.push("Missing projectName.");
  if (!project.sections) errors.push("Missing sections.");
  if (!Array.isArray(project.files)) errors.push("Missing files array.");
  if (!project.settings) errors.push("Missing settings.");
  return { ok: errors.length === 0, errors };
}

export function migrateProject(project: ReduxProject): ReduxProject {
  return {
    ...project,
    version: project.version || CURRENT_PROJECT_SCHEMA_VERSION,
    aiHistory: project.aiHistory ?? [],
    aiSuggestions: project.aiSuggestions ?? [],
    patchReviews: project.patchReviews ?? [],
    appliedPatches: project.appliedPatches ?? [],
    backups: project.backups ?? [],
    changelogEntries: project.changelogEntries ?? [],
    patchBatches: project.patchBatches ?? [],
    textures: project.textures ?? [],
    exportHistory: project.exportHistory ?? [],
    imageGenerationHistory: project.imageGenerationHistory ?? [],
    promptBasket: project.promptBasket ?? [],
    diagnostics: project.diagnostics ?? [],
    scanCache: project.scanCache ?? {},
    settings: {
      ...mockProject.settings,
      ...project.settings,
      converterPaths: { ...mockProject.settings.converterPaths, ...project.settings?.converterPaths },
      textureTools: { ...mockProject.settings.textureTools, ...project.settings?.textureTools },
      imageAi: { ...mockProject.settings.imageAi, ...project.settings?.imageAi },
      logging: { ...mockProject.settings.logging, ...project.settings?.logging },
      limits: { ...mockProject.settings.limits, ...project.settings?.limits },
      safety: { ...mockProject.settings.safety, ...project.settings?.safety },
      experimental: { ...mockProject.settings.experimental, ...project.settings?.experimental }
    }
  };
}
