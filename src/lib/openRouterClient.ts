import { sendOpenRouterChatRequest } from "./tauriApi";
import type { OpenRouterMessage, OpenRouterResponse } from "../types/ai";
import type { AppSettings } from "../types/project";

export const OPENROUTER_SYSTEM_MESSAGE = `The AI is a GTA V Redux file analysis assistant.
It must return JSON only.
It must not invent file paths.
It must not suggest direct edits to original files.
It must prefer safe reversible changes.
It must explain each suggestion.
It must include risk levels and testing notes.
It must not include cheating, memory-reading, wallhack, aim assist, bypass, or anti-cheat evasion logic.`;

export async function sendPromptToOpenRouter(settings: AppSettings, prompt: string): Promise<OpenRouterResponse> {
  const messages: OpenRouterMessage[] = [
    { role: "system", content: OPENROUTER_SYSTEM_MESSAGE },
    { role: "user", content: prompt }
  ];

  return sendOpenRouterChatRequest({
    apiKey: settings.apiKey,
    baseUrl: settings.openRouterBaseUrl,
    model: settings.model,
    messages,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    timeoutSeconds: settings.timeoutSeconds,
    siteUrl: settings.openRouterSiteUrl,
    appName: settings.openRouterAppName
  });
}
