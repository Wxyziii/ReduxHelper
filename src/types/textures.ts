export type TextureRole =
  | "diffuse"
  | "albedo"
  | "color"
  | "normal"
  | "bump"
  | "specular"
  | "roughness"
  | "mask"
  | "alpha"
  | "grass"
  | "tree"
  | "bush"
  | "road"
  | "blood"
  | "decal"
  | "hud"
  | "ui"
  | "unknown";

export type TextureWorkflowStatus =
  | "imported"
  | "metadata_ready"
  | "preview_ready"
  | "edited_png_attached"
  | "compiled_dds_ready"
  | "export_ready"
  | "failed";

export interface TextureMetadata {
  filePath: string;
  filename: string;
  width?: number;
  height?: number;
  format?: string;
  mipmapCount?: number;
  hasAlpha?: "yes" | "no" | "unknown";
  fileSizeBytes: number;
  roleGuess: TextureRole;
  warnings: string[];
}

export interface TextureToolCheck {
  ok: boolean;
  converterPath: string;
  exists: boolean;
  canRun: boolean;
  versionOutput?: string;
  warning?: string;
}

export interface TextureConverterSettings {
  converterPath: string;
  defaultDdsFormat: string;
  generateMipmaps: boolean;
  preserveOriginalFormat: boolean;
  preserveAlpha: boolean;
  backupBeforeReplace: boolean;
  previewFolder: string;
}

export interface TextureConversionResult {
  success: boolean;
  textureId: string;
  sourcePath: string;
  outputPath?: string;
  metadata?: TextureMetadata;
  warnings: string[];
  commandOutput?: string;
  error?: string;
}

export interface TextureAsset {
  textureId: string;
  section: "textures";
  originalPath: string;
  workspacePath: string;
  relativePath: string;
  fileName: string;
  previewPngPath?: string;
  editedPngPath?: string;
  compiledDdsPath?: string;
  metadata?: TextureMetadata;
  roleGuess: TextureRole;
  warnings: string[];
  conversionStatus: TextureWorkflowStatus;
  exportReady: boolean;
  lastConvertedAt?: string;
  converterSettingsUsed?: Partial<TextureConverterSettings>;
  notes?: string;
  backupPath?: string;
  generatedOutputs?: ImageGeneratedOutput[];
  currentEditedPngSource?: "manual_import" | "image_ai";
  currentEditedOutputId?: string;
}
import type { ImageGeneratedOutput } from "./imageAi";
