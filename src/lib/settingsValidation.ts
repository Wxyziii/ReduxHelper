import type { ReduxProject } from "../types/project";

export function validateSettings(project: ReduxProject) {
  const issues: string[] = [];
  const settings = project.settings;
  if (!settings.model.trim()) issues.push("OpenRouter model is empty.");
  if (settings.timeoutSeconds < 5 || settings.timeoutSeconds > 300) issues.push("AI timeout should be between 5 and 300 seconds.");
  if (settings.imageAi.comfyuiUrl && !/^https?:\/\//.test(settings.imageAi.comfyuiUrl)) issues.push("ComfyUI URL must start with http:// or https://.");
  if (settings.limits.maxPreviewBytes < 1024) issues.push("Max preview size is too small.");
  if (settings.limits.maxScanBytes < 1024) issues.push("Max scan size is too small.");
  return issues;
}
