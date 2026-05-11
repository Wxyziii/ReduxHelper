export const sectionConfig = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Project overview, progress, warnings, and next actions."
  },
  {
    id: "timecycle",
    name: "Timecycle",
    description: "Weather, lighting, atmosphere, exposure, fog, sky, and general look."
  },
  {
    id: "tracers",
    name: "Tracers",
    description: "Bullet trails and related weapon visual effects."
  },
  {
    id: "hitEffects",
    name: "Hit Effects",
    description: "Impacts, sparks, blood effects, decals, and short visual feedback."
  },
  {
    id: "killEffect",
    name: "Kill Effect",
    description: "Scripted or overlay-based effects when supported by the target setup."
  },
  {
    id: "optimization",
    name: "Optimization",
    description: "Scan and plan safe reductions for visual clutter or performance-heavy assets."
  },
  {
    id: "textures",
    name: "Textures",
    description: "DDS-to-image-to-DDS texture replacement workflow."
  },
  {
    id: "export",
    name: "Export",
    description: "Review and export accepted changes into a named output folder."
  },
  {
    id: "settings",
    name: "Settings",
    description: "AI provider, model, export folder, and converter paths."
  }
] as const;

export const keywordGroups = {
  timecycle: [
    "sky",
    "cloud",
    "fog",
    "bloom",
    "exposure",
    "saturation",
    "contrast",
    "shadow",
    "sun",
    "moon",
    "weather"
  ],
  tracers: [
    "tracer",
    "bullet",
    "trail",
    "weapon",
    "muzzle",
    "spark",
    "impact"
  ],
  hitEffects: [
    "hit",
    "impact",
    "blood",
    "decal",
    "wound",
    "spark",
    "dust",
    "particle"
  ],
  optimization: [
    "grass",
    "vegetation",
    "bush",
    "debris",
    "trash",
    "garbage",
    "litter",
    "density",
    "lod",
    "smoke",
    "reflection"
  ],
  textures: [
    "diffuse",
    "albedo",
    "normal",
    "spec",
    "mask",
    "decal",
    "bark",
    "leaf",
    "grass",
    "road"
  ]
};
