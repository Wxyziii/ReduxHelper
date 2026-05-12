import type { ProjectSection, SectionId } from "../types/project";

export const sectionOrder: SectionId[] = [
  "dashboard",
  "timecycle",
  "tracers",
  "hitEffects",
  "killEffect",
  "optimization",
  "textures",
  "intelligence",
  "export",
  "settings"
];

export const sections: Record<SectionId, ProjectSection> = {
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    description: "Project overview, progress, warnings, and next actions.",
    goal: "",
    warnings: []
  },
  timecycle: {
    id: "timecycle",
    name: "Timecycle",
    description: "Weather, lighting, atmosphere, exposure, fog, sky, clouds, and visual feel.",
    goal: "Make sunny weather cleaner, lower haze, keep nights readable.",
    warnings: []
  },
  tracers: {
    id: "tracers",
    name: "Tracers",
    description: "Bullet trails, muzzle glow, particle lifetime, alpha, and weapon visual effects.",
    goal: "Create subtle warm tracer lines without arcade glow.",
    warnings: ["Some tracer assets are binary exports and need external tools."]
  },
  hitEffects: {
    id: "hitEffects",
    name: "Hit Effects",
    description: "Bullet impacts, sparks, dust, blood effects, decals, and short feedback.",
    goal: "Reduce sparks and keep impacts consistent with realistic tracers.",
    warnings: []
  },
  killEffect: {
    id: "killEffect",
    name: "Kill Effect",
    description: "Script or overlay concepts only when supported by a safe scriptable setup.",
    goal: "Draft a non-cheat overlay flash and sound checklist for supported servers.",
    warnings: ["No memory reading, anti-cheat bypass, or competitive automation allowed."]
  },
  optimization: {
    id: "optimization",
    name: "Optimization",
    description: "Risk-ranked scans for clutter and performance-heavy visual assets.",
    goal: "Find low-risk density and particle changes before deleting anything.",
    warnings: ["Deleting unknown world objects is high risk and blocked in MVP."]
  },
  textures: {
    id: "textures",
    name: "Textures",
    description: "DDS -> PNG preview -> AI/manual edit -> DDS export workflow.",
    goal: "Sharpen road and grass diffuse textures while preserving alpha and mipmaps.",
    warnings: ["DDS is never edited directly; converter output must be reviewed."]
  },
  intelligence: {
    id: "intelligence",
    name: "Intelligence",
    description: "Global search, indexing, prompt basket, relationships, diagnostics, and project health.",
    goal: "Find relevant files and snippets before asking AI for targeted changes.",
    warnings: []
  },
  export: {
    id: "export",
    name: "Export",
    description: "Review accepted changes and create a safe output folder with backups and manifest.",
    goal: "",
    warnings: []
  },
  settings: {
    id: "settings",
    name: "Settings",
    description: "AI provider, model, export folder, converter paths, and safety controls.",
    goal: "",
    warnings: []
  }
};

export const keywordGroups: Partial<Record<SectionId, string[]>> = {
  timecycle: ["sky", "cloud", "fog", "bloom", "exposure", "saturation", "contrast", "shadow", "sun", "moon", "weather"],
  tracers: ["tracer", "bullet", "trail", "impact", "spark", "muzzle", "weapon", "decal", "particle"],
  hitEffects: ["hit", "impact", "blood", "decal", "spark", "dust", "particle"],
  optimization: ["grass", "vegetation", "bush", "debris", "trash", "density", "lod", "smoke", "reflection"],
  textures: ["diffuse", "albedo", "normal", "spec", "mask", "decal", "bark", "leaf", "grass", "road"]
};
