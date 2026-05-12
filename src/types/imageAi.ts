export type ImageAiProvider = "manual" | "comfyui" | "future";
export type ImageAiSeedMode = "random" | "fixed";
export type ImageAiOutputStatus = "generated" | "attached_as_edited" | "rejected" | "failed";

export interface ImageAiSettings {
  provider: ImageAiProvider;
  comfyuiUrl: string;
  workflowPreset: string;
  outputFolder: string;
  seedMode: ImageAiSeedMode;
  fixedSeed: number;
  steps: number;
  cfg: number;
  denoise: number;
  sampler: string;
  checkpoint: string;
  timeoutSeconds: number;
  saveRawWorkflowJson: boolean;
  saveGenerationMetadata: boolean;
}

export interface ImageEditRequest {
  textureId: string;
  sourcePngPath: string;
  prompt: string;
  negativePrompt: string;
  strength: number;
  steps: number;
  cfg: number;
  seed: number;
  width?: number;
  height?: number;
  workflowPreset: string;
  preserveAlpha: boolean;
  notes?: string;
}

export interface ImageGenerationMetadata {
  provider: ImageAiProvider;
  prompt: string;
  negativePrompt: string;
  seed: number;
  settingsUsed: Partial<ImageAiSettings>;
  sourcePngPath: string;
  outputPngPath?: string;
  warnings: string[];
  createdAt: string;
}

export interface ImageGeneratedOutput {
  outputId: string;
  textureId: string;
  outputPath?: string;
  thumbnailPath?: string;
  prompt: string;
  negativePrompt: string;
  seed: number;
  provider: ImageAiProvider;
  createdAt: string;
  settingsUsed: Partial<ImageAiSettings>;
  warnings: string[];
  status: ImageAiOutputStatus;
  metadataPath?: string;
}

export interface ImageEditResult {
  success: boolean;
  textureId: string;
  output?: ImageGeneratedOutput;
  outputPngPath?: string;
  provider: ImageAiProvider;
  prompt: string;
  negativePrompt: string;
  seed: number;
  settingsUsed: Partial<ImageAiSettings>;
  metadataPath?: string;
  warnings: string[];
  error?: string;
}

export interface ImageAiConnectionResult {
  ok: boolean;
  provider: ImageAiProvider;
  message: string;
  models?: string[];
}
