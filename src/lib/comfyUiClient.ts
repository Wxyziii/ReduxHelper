import type { ImageAiSettings, ImageEditRequest } from "../types/imageAi";

export function buildComfyUiRequest(settings: ImageAiSettings, request: ImageEditRequest) {
  return {
    serverUrl: settings.comfyuiUrl,
    workflowPreset: request.workflowPreset,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    seed: request.seed,
    steps: request.steps,
    cfg: request.cfg,
    denoise: request.strength,
    sampler: settings.sampler,
    checkpoint: settings.checkpoint,
    sourcePngPath: request.sourcePngPath,
    width: request.width,
    height: request.height
  };
}
