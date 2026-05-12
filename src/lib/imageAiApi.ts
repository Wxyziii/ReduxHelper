import { invoke } from "@tauri-apps/api/core";
import type { ReduxProject } from "../types/project";
import type { ImageAiConnectionResult, ImageEditRequest, ImageEditResult } from "../types/imageAi";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function callTauri<T>(command: string, browserMock: T, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) return browserMock;
  return invoke<T>(command, args);
}

export function testComfyUiConnection(project: ReduxProject) {
  return callTauri<ImageAiConnectionResult>(
    "test_comfyui_connection",
    { ok: false, provider: "comfyui", message: "Browser mock: real ComfyUI connection test requires Tauri." },
    { project }
  );
}

export function listComfyUiModels(project: ReduxProject) {
  return callTauri<string[]>("list_comfyui_models", [], { project });
}

export function sendComfyUiImageToImage(project: ReduxProject, request: ImageEditRequest) {
  const outputPath = `browser-mock/workspace/.redux-ai/image-ai/${request.textureId}_${Date.now()}.png`;
  return callTauri<ImageEditResult>(
    "send_comfyui_image_to_image",
    {
      success: true,
      textureId: request.textureId,
      outputPngPath: outputPath,
      provider: "comfyui",
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      seed: request.seed,
      settingsUsed: project.settings.imageAi,
      warnings: ["Browser mock image AI output. Real ComfyUI generation requires Tauri."],
      output: {
        outputId: `mock-output-${Date.now()}`,
        textureId: request.textureId,
        outputPath,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        seed: request.seed,
        provider: "comfyui",
        createdAt: new Date().toISOString(),
        settingsUsed: project.settings.imageAi,
        warnings: ["Browser mock image AI output."],
        status: "generated"
      }
    },
    { project, request }
  );
}

export function getComfyUiJobStatus(_project: ReduxProject, jobId: string) {
  return callTauri("get_comfyui_job_status", { jobId, status: "unknown", progress: 0 }, { jobId });
}

export function cancelComfyUiJob(jobId: string) {
  return callTauri("cancel_comfyui_job", { ok: true, action: "cancel_comfyui_job", message: "Browser mock: stopped tracking job." }, { jobId });
}
