import type { TextureRole } from "../types/textures";

export const textureExtensions = new Set([".dds", ".png", ".tga", ".jpg", ".jpeg", ".webp"]);

export const ddsFormats = [
  "BC1_UNORM",
  "BC1_UNORM_SRGB",
  "BC3_UNORM",
  "BC3_UNORM_SRGB",
  "BC5_UNORM",
  "BC7_UNORM",
  "BC7_UNORM_SRGB",
  "R8G8B8A8_UNORM"
];

export const textureRoleLabels: Record<TextureRole, string> = {
  diffuse: "Diffuse",
  albedo: "Albedo",
  color: "Color",
  normal: "Normal",
  bump: "Bump",
  specular: "Specular",
  roughness: "Roughness",
  mask: "Mask",
  alpha: "Alpha",
  grass: "Grass",
  tree: "Tree",
  bush: "Bush",
  road: "Road",
  blood: "Blood",
  decal: "Decal",
  hud: "HUD",
  ui: "UI",
  unknown: "Unknown"
};

export function isTextureExtension(extension: string) {
  return textureExtensions.has(extension.toLowerCase());
}

export function isPowerOfTwo(value?: number) {
  return !!value && value > 0 && (value & (value - 1)) === 0;
}
