import type { TextureRole } from "../types/textures";

export const imageAiPresets = [
  "cleaner texture",
  "darker texture",
  "stylized grass",
  "stylized tree bark",
  "cleaner road",
  "blood/decal enhancement",
  "subtle anime look",
  "preserve original structure",
  "reduce noise",
  "make seamless/tileable if possible"
];

export function promptTemplateForRole(role: TextureRole) {
  if (role === "grass") return "Edit this game grass texture while preserving its tileable structure and overall texture layout. Make it cleaner, more stylized, and suitable for a GTA V visual mod. Do not add text, logos, borders, or large objects.";
  if (role === "tree" || role === "bush") return "Edit this tree bark or foliage texture while preserving the pattern and seamless texture behavior. Improve clarity and stylization without changing the overall structure too much.";
  if (role === "road") return "Edit this road/asphalt texture while preserving scale, surface detail, and tileability. Clean up noise and keep it usable as a game texture.";
  if (role === "blood" || role === "decal") return "Edit this decal texture while preserving transparency and decal shape. Increase clarity and stylized impact without adding background.";
  return "Edit this game texture while preserving the original layout, scale, tileability, and structure. Clean up noise and add subtle stylization. Do not add text, logos, borders, or large objects.";
}

export function imageAiRoleWarning(role: TextureRole) {
  if (role === "normal" || role === "bump") return "This looks like a normal map. Image AI may break lighting/vector data. Manual editing is recommended.";
  if (role === "mask" || role === "specular" || role === "roughness") return "This texture may store non-color data. Artistic AI edits may break material behavior.";
  return "";
}
