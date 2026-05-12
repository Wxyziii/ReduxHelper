import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { guessTextureRole, metadataWarnings, textureRoleWarnings } from "./textureClassifier";
import type { ReduxProject } from "../types/project";
import type { TextureAsset, TextureConversionResult, TextureMetadata, TextureToolCheck } from "../types/textures";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function callTauri<T>(command: string, browserMock: T, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) return browserMock;
  return invoke<T>(command, args);
}

export function textureImageSrc(path?: string) {
  if (!path) return undefined;
  return isTauriRuntime() ? convertFileSrc(path) : path;
}

export function inspectDdsMetadata(project: ReduxProject, textureId: string) {
  const texture = project.textures.find((item) => item.textureId === textureId);
  return callTauri<TextureMetadata>("inspect_dds_metadata", mockMetadata(texture), { project, textureId });
}

export function inspectTextureMetadata(project: ReduxProject, textureId: string) {
  const texture = project.textures.find((item) => item.textureId === textureId);
  return callTauri<TextureMetadata>("inspect_texture_metadata", mockMetadata(texture), { project, textureId });
}

export function checkTextureTools(project: ReduxProject) {
  const converterPath = project.settings.textureTools?.converterPath || project.settings.converterPaths.ddsToImage;
  return callTauri<TextureToolCheck>(
    "check_texture_tools",
    {
      ok: !!converterPath,
      converterPath,
      exists: !!converterPath,
      canRun: false,
      warning: converterPath ? "Browser mock cannot execute converter tools." : "No converter path configured."
    },
    { project }
  );
}

export function convertDdsToPng(project: ReduxProject, textureId: string) {
  const texture = project.textures.find((item) => item.textureId === textureId);
  const outputPath = `browser-mock/workspace/.redux-ai/texture-previews/${texture?.fileName.replace(/\.dds$/i, ".png") ?? "texture.png"}`;
  return callTauri<TextureConversionResult>(
    "convert_dds_to_png",
    {
      success: true,
      textureId,
      sourcePath: texture?.workspacePath ?? "",
      outputPath,
      metadata: mockMetadata(texture),
      warnings: ["Browser mock conversion. Real DDS preview generation requires Tauri and configured texconv."]
    },
    { project, textureId }
  );
}

export function importEditedTexturePng(project: ReduxProject, textureId: string) {
  const texture = project.textures.find((item) => item.textureId === textureId);
  const outputPath = `browser-mock/workspace/.redux-ai/texture-edits/${texture?.fileName.replace(/\.dds$/i, "_edited.png") ?? "texture_edited.png"}`;
  return callTauri<TextureConversionResult>(
    "import_edited_texture_png",
    {
      success: true,
      textureId,
      sourcePath: "browser-selected/edited.png",
      outputPath,
      metadata: mockMetadata(texture),
      warnings: ["Browser mock import. Tauri mode copies the selected PNG into the project workspace."]
    },
    { project, textureId }
  );
}

export function convertPngToDds(project: ReduxProject, textureId: string, allowDimensionMismatch = false) {
  const texture = project.textures.find((item) => item.textureId === textureId);
  const outputPath = `browser-mock/workspace/.redux-ai/texture-compiled/${texture?.fileName ?? "texture.dds"}`;
  return callTauri<TextureConversionResult>(
    "convert_png_to_dds",
    {
      success: true,
      textureId,
      sourcePath: texture?.editedPngPath ?? "",
      outputPath,
      metadata: mockMetadata(texture),
      warnings: ["Browser mock compile. Real PNG to DDS conversion requires Tauri and configured texconv."]
    },
    { project, textureId, allowDimensionMismatch }
  );
}

export function saveTextureReport(project: ReduxProject, notes: string) {
  return callTauri<{ ok: boolean; action: string; message: string }>(
    "save_texture_report",
    { ok: true, action: "save_texture_report", message: "Browser mock: texture report saved." },
    { project, notes }
  );
}

export function applyTextureResult(project: ReduxProject, result: TextureConversionResult, nextStatus?: TextureAsset["conversionStatus"]): ReduxProject {
  const now = new Date().toISOString();
  return {
    ...project,
    saveStatus: "Unsaved changes",
    textures: project.textures.map((texture) => {
      if (texture.textureId !== result.textureId) return texture;
      const warnings = Array.from(new Set([...texture.warnings, ...result.warnings, ...(result.metadata?.warnings ?? [])]));
      return {
        ...texture,
        metadata: result.metadata ?? texture.metadata,
        warnings,
        previewPngPath: nextStatus === "preview_ready" ? result.outputPath : texture.previewPngPath,
        editedPngPath: nextStatus === "edited_png_attached" ? result.outputPath : texture.editedPngPath,
        compiledDdsPath: nextStatus === "compiled_dds_ready" ? result.outputPath : texture.compiledDdsPath,
        conversionStatus: result.success ? nextStatus ?? texture.conversionStatus : "failed",
        lastConvertedAt: now,
        converterSettingsUsed: project.settings.textureTools
      };
    })
  };
}

export function markTextureReady(project: ReduxProject, textureId: string, exportReady: boolean): ReduxProject {
  return {
    ...project,
    saveStatus: "Unsaved changes",
    textures: project.textures.map((texture) =>
      texture.textureId === textureId
        ? { ...texture, exportReady, conversionStatus: exportReady ? "export_ready" : texture.compiledDdsPath ? "compiled_dds_ready" : texture.conversionStatus }
        : texture
    )
  };
}

function mockMetadata(texture?: TextureAsset): TextureMetadata {
  const roleGuess = texture?.roleGuess ?? guessTextureRole(texture?.relativePath ?? "mock_texture.dds");
  const metadata = texture?.metadata ?? {
    filePath: texture?.workspacePath ?? "browser-mock/workspace/mock_texture.dds",
    filename: texture?.fileName ?? "mock_texture.dds",
    width: 1024,
    height: 1024,
    format: "Mock DDS metadata",
    mipmapCount: 1,
    hasAlpha: "unknown" as const,
    fileSizeBytes: 2048,
    roleGuess,
    warnings: textureRoleWarnings(roleGuess)
  };
  return { ...metadata, warnings: metadataWarnings(metadata) };
}
