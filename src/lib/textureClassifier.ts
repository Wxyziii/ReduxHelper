import { isPowerOfTwo } from "./textureTypes";
import type { TextureMetadata, TextureRole } from "../types/textures";

const roleRules: Array<[TextureRole, RegExp]> = [
  ["normal", /(^|[_\-.\/])(normal|nrm|norm|_n|n)([_\-.]|$)/i],
  ["bump", /(^|[_\-.\/])bump([_\-.]|$)/i],
  ["specular", /(^|[_\-.\/])(spec|specular|_s)([_\-.]|$)/i],
  ["roughness", /(^|[_\-.\/])(rough|roughness)([_\-.]|$)/i],
  ["mask", /(^|[_\-.\/])(mask|masks|_m)([_\-.]|$)/i],
  ["alpha", /(^|[_\-.\/])(alpha|opacity|transparent|_a)([_\-.]|$)/i],
  ["diffuse", /(^|[_\-.\/])(diffuse|diff|_d)([_\-.]|$)/i],
  ["albedo", /(^|[_\-.\/])albedo([_\-.]|$)/i],
  ["color", /(^|[_\-.\/])(color|colour|col)([_\-.]|$)/i],
  ["grass", /grass|vegetation|foliage/i],
  ["tree", /tree|trunk|bark|leaf|leaves/i],
  ["bush", /bush|shrub/i],
  ["road", /road|asphalt|street|pavement/i],
  ["blood", /blood|wound/i],
  ["decal", /decal|graffiti|stain/i],
  ["hud", /(^|[\/_\-.])hud([\/_\-.]|$)/i],
  ["ui", /(^|[\/_\-.])(ui|frontend|menu)([\/_\-.]|$)/i]
];

export function guessTextureRole(path: string): TextureRole {
  return roleRules.find(([, pattern]) => pattern.test(path))?.[0] ?? "unknown";
}

export function textureRoleWarnings(role: TextureRole) {
  const warnings: string[] = [];
  if (role === "normal" || role === "bump") warnings.push("Possible normal map. Direction-encoded colors need manual review.");
  if (role === "mask" || role === "specular" || role === "roughness") warnings.push("Possible mask/specular map. Channel meaning may be non-color data.");
  if (role === "alpha") warnings.push("Alpha texture. Preserve transparency during PNG editing and DDS compile.");
  return warnings;
}

export function metadataWarnings(metadata: TextureMetadata) {
  const warnings = new Set(metadata.warnings);
  if (!metadata.width || !metadata.height || !metadata.format) warnings.add("Missing metadata. Configure texconv or verify the DDS manually.");
  if (metadata.width && metadata.height && metadata.width * metadata.height > 4096 * 4096) warnings.add("Huge texture resolution. Conversion may be slow and memory-heavy.");
  if (!isPowerOfTwo(metadata.width) || !isPowerOfTwo(metadata.height)) warnings.add("Non-power-of-two dimensions. Some DDS/game pipelines expect power-of-two textures.");
  if ((metadata.mipmapCount ?? 0) > 1) warnings.add("Mipmapped texture. Preserve or regenerate mipmaps before export.");
  return Array.from(warnings);
}
