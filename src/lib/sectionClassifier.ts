import type { SectionId } from "../types/project";

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function classifySection(relativePath: string, extension: string): SectionId {
  const text = relativePath.toLowerCase();
  if (extension === ".dds" || hasAny(text, ["texture", ".ytd", "diffuse", "normal", "spec", "alpha", "mipmap", "road"])) return "textures";
  if (hasAny(text, ["script", "kill", "overlay", "nui"])) return "killEffect";
  if (hasAny(text, ["blood", "decal", "impact", "spark", "particle", "wound"])) return "hitEffects";
  if (hasAny(text, ["tracer", "bullet", "weapon", "muzzle", "core.ypt", "projectile", "beam"])) return "tracers";
  if (hasAny(text, ["timecycle", "weather", "visualsettings", "cloud", "fog", "bloom", "exposure"])) return "timecycle";
  if (hasAny(text, ["grass", "veg", "bush", "tree", "trash", "debris", "lod", "density", "rubbish", "garbage"])) return "optimization";
  return "dashboard";
}
