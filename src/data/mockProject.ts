import { sections } from "./mockSections";
import type { AiResponse, ExportManifest, PatchSuggestion, ProjectFile, ReduxProject } from "../types/project";
import type { TextureAsset } from "../types/textures";

const filePreviews: Record<string, string> = {
  "common/data/timecycle/timecycle_modifiers.xml":
    `<timecycle>\n  <weather name="EXTRASUNNY">\n    <sky_intensity value="1.000" />\n    <fog_density value="0.350" />\n    <bloom_intensity value="0.650" />\n    <exposure_min value="0.900" />\n  </weather>\n</timecycle>`,
  "common/data/visualsettings.dat":
    `# visualsettings\nmisc.Bloom.Intensity 0.650\nmisc.SunGlare.Intensity 1.000\nmisc.Corona.Intensity 0.850\nmisc.Reflection.Global 1.000`,
  "effects/weapons/tracer_config.xml":
    `<tracers>\n  <bullet_trail lifetime="0.24" alpha="0.85" width="0.12" />\n  <muzzle_spark lifetime="0.18" scale="1.25" />\n</tracers>`,
  "effects/particles/impact_effects.xml":
    `<impacts>\n  <spark count="18" lifetime="0.45" />\n  <dust density="0.75" lifetime="0.80" />\n</impacts>`,
  "scripts/kill_effect_overlay.lua":
    `-- Concept only: no memory reading, no anti-cheat bypass.\nRegisterNetEvent("redux:killEffect")\nAddEventHandler("redux:killEffect", function()\n  SendNUIMessage({ type = "kill_effect", style = "subtle_flash" })\nend)`,
  "common/data/procedural/vegetation.meta":
    `<vegetation>\n  <grass density="1.00" lodDistance="160" />\n  <bush density="0.80" lodDistance="140" />\n  <debris density="0.65" />\n</vegetation>`
};

export const mockFiles: ProjectFile[] = [
  {
    id: "file-timecycle-1",
    sourcePath: "C:/redux/source/common/data/timecycle/timecycle_modifiers.xml",
    relativePath: "common/data/timecycle/timecycle_modifiers.xml",
    fileName: "timecycle_modifiers.xml",
    extension: ".xml",
    sizeBytes: 18422,
    status: "text-readable",
    section: "timecycle",
    warnings: [],
    scanMatches: [
      { line: 3, keyword: "sky", snippet: `<sky_intensity value="1.000" />` },
      { line: 4, keyword: "fog", snippet: `<fog_density value="0.350" />` },
      { line: 5, keyword: "bloom", snippet: `<bloom_intensity value="0.650" />` }
    ],
    preview: filePreviews["common/data/timecycle/timecycle_modifiers.xml"]
  },
  {
    id: "file-timecycle-2",
    sourcePath: "C:/redux/source/common/data/visualsettings.dat",
    relativePath: "common/data/visualsettings.dat",
    fileName: "visualsettings.dat",
    extension: ".dat",
    sizeBytes: 6740,
    status: "text-readable",
    section: "timecycle",
    warnings: ["High glare values can affect night readability."],
    scanMatches: [
      { line: 2, keyword: "bloom", snippet: "misc.Bloom.Intensity 0.650" },
      { line: 4, keyword: "reflection", snippet: "misc.Reflection.Global 1.000" }
    ],
    preview: filePreviews["common/data/visualsettings.dat"]
  },
  {
    id: "file-tracers-1",
    sourcePath: "C:/redux/source/effects/weapons/tracer_config.xml",
    relativePath: "effects/weapons/tracer_config.xml",
    fileName: "tracer_config.xml",
    extension: ".xml",
    sizeBytes: 4211,
    status: "text-readable",
    section: "tracers",
    warnings: [],
    scanMatches: [
      { line: 2, keyword: "trail", snippet: `<bullet_trail lifetime="0.24" alpha="0.85" width="0.12" />` },
      { line: 3, keyword: "spark", snippet: `<muzzle_spark lifetime="0.18" scale="1.25" />` }
    ],
    preview: filePreviews["effects/weapons/tracer_config.xml"]
  },
  {
    id: "file-tracers-2",
    sourcePath: "C:/redux/source/update/update.rpf",
    relativePath: "update/update.rpf",
    fileName: "update.rpf",
    extension: ".rpf",
    sizeBytes: 1288490188,
    status: "binary-unsupported",
    section: "tracers",
    warnings: ["Binary archive listed only. MVP will not edit .rpf directly."],
    scanMatches: []
  },
  {
    id: "file-hit-1",
    sourcePath: "C:/redux/source/effects/particles/impact_effects.xml",
    relativePath: "effects/particles/impact_effects.xml",
    fileName: "impact_effects.xml",
    extension: ".xml",
    sizeBytes: 9320,
    status: "text-readable",
    section: "hitEffects",
    warnings: [],
    scanMatches: [
      { line: 2, keyword: "spark", snippet: `<spark count="18" lifetime="0.45" />` },
      { line: 3, keyword: "dust", snippet: `<dust density="0.75" lifetime="0.80" />` }
    ],
    preview: filePreviews["effects/particles/impact_effects.xml"]
  },
  {
    id: "file-kill-1",
    sourcePath: "C:/redux/source/scripts/kill_effect_overlay.lua",
    relativePath: "scripts/kill_effect_overlay.lua",
    fileName: "kill_effect_overlay.lua",
    extension: ".lua",
    sizeBytes: 1884,
    status: "text-readable",
    section: "killEffect",
    warnings: ["Concept script only. No direct game memory access allowed."],
    scanMatches: [{ line: 1, keyword: "overlay", snippet: "-- Concept only: no memory reading, no anti-cheat bypass." }],
    preview: filePreviews["scripts/kill_effect_overlay.lua"]
  },
  {
    id: "file-opt-1",
    sourcePath: "C:/redux/source/common/data/procedural/vegetation.meta",
    relativePath: "common/data/procedural/vegetation.meta",
    fileName: "vegetation.meta",
    extension: ".meta",
    sizeBytes: 12420,
    status: "text-readable",
    section: "optimization",
    warnings: ["Density changes are medium risk; deleting entries is blocked."],
    scanMatches: [
      { line: 2, keyword: "grass", snippet: `<grass density="1.00" lodDistance="160" />` },
      { line: 4, keyword: "debris", snippet: `<debris density="0.65" />` }
    ],
    preview: filePreviews["common/data/procedural/vegetation.meta"]
  },
  {
    id: "file-texture-1",
    sourcePath: "C:/redux/source/textures/road_asphalt_d.dds",
    relativePath: "textures/road_asphalt_d.dds",
    fileName: "road_asphalt_d.dds",
    extension: ".dds",
    sizeBytes: 5592405,
    status: "texture-workflow",
    section: "textures",
    warnings: ["DDS metadata placeholder: compression and mipmaps require converter check."],
    scanMatches: [{ line: 0, keyword: "road", snippet: "Filename suggests diffuse road texture." }]
  },
  {
    id: "file-texture-2",
    sourcePath: "C:/redux/source/textures/grass_normal_n.dds",
    relativePath: "textures/grass_normal_n.dds",
    fileName: "grass_normal_n.dds",
    extension: ".dds",
    sizeBytes: 4194304,
    status: "texture-workflow",
    section: "textures",
    warnings: ["Normal map: AI photo editing can break encoded surface direction."],
    scanMatches: [{ line: 0, keyword: "normal", snippet: "Filename indicates normal map." }]
  }
];

export const mockPatches: PatchSuggestion[] = [
  {
    id: "patch-timecycle-fog",
    section: "timecycle",
    filePath: "common/data/timecycle/timecycle_modifiers.xml",
    patchType: "find_replace",
    find: `<fog_density value="0.350" />`,
    replace: `<fog_density value="0.240" />`,
    summary: "Reduce sunny fog density",
    reason: "Lower haze improves scene readability while keeping weather identity.",
    risk: "low",
    requiresManualReview: true,
    status: "pending",
    validation: { ok: true, reason: "Target text found once. Patch applies to project-local copy only.", matchCount: 1 }
  },
  {
    id: "patch-timecycle-bloom",
    section: "timecycle",
    filePath: "common/data/timecycle/timecycle_modifiers.xml",
    patchType: "find_replace",
    find: `<bloom_intensity value="0.650" />`,
    replace: `<bloom_intensity value="0.520" />`,
    summary: "Lower bloom intensity",
    reason: "Small reduction prevents bright surfaces from washing out midday scenes.",
    risk: "low",
    requiresManualReview: true,
    status: "accepted",
    validation: { ok: true, reason: "Target text found once. Backup required before export.", matchCount: 1 }
  },
  {
    id: "patch-tracer-alpha",
    section: "tracers",
    filePath: "effects/weapons/tracer_config.xml",
    patchType: "find_replace",
    find: `<bullet_trail lifetime="0.24" alpha="0.85" width="0.12" />`,
    replace: `<bullet_trail lifetime="0.18" alpha="0.62" width="0.08" />`,
    summary: "Subtle tracer lifetime and alpha",
    reason: "Shorter, thinner trails keep feedback visible without arcade glow.",
    risk: "medium",
    requiresManualReview: true,
    status: "pending",
    validation: { ok: true, reason: "Target text found once. External particle behavior still needs in-game test.", matchCount: 1 }
  },
  {
    id: "patch-hit-spark",
    section: "hitEffects",
    filePath: "effects/particles/impact_effects.xml",
    patchType: "find_replace",
    find: `<spark count="18" lifetime="0.45" />`,
    replace: `<spark count="12" lifetime="0.32" />`,
    summary: "Reduce spark clutter",
    reason: "Lower count and lifetime improves consistency with subtle tracer style.",
    risk: "medium",
    requiresManualReview: true,
    status: "rejected",
    validation: { ok: true, reason: "Target text found once. User rejected for now.", matchCount: 1 }
  },
  {
    id: "patch-opt-density",
    section: "optimization",
    filePath: "common/data/procedural/vegetation.meta",
    patchType: "find_replace",
    find: `<grass density="1.00" lodDistance="160" />`,
    replace: `<grass density="0.86" lodDistance="145" />`,
    summary: "Conservative grass density reduction",
    reason: "Lowers likely visual load before any high-risk object deletion.",
    risk: "medium",
    requiresManualReview: true,
    status: "pending",
    validation: { ok: true, reason: "Target text found once. Manual test checklist required.", matchCount: 1 }
  },
  {
    id: "patch-missing-target",
    section: "timecycle",
    filePath: "common/data/visualsettings.dat",
    patchType: "find_replace",
    find: "misc.SunGlare.Intensity 9.999",
    replace: "misc.SunGlare.Intensity 0.750",
    summary: "Invalid glare target example",
    reason: "Shows failed validation behavior for missing target text.",
    risk: "high",
    requiresManualReview: true,
    status: "failed",
    validation: { ok: false, reason: "Target text was not found. Patch cannot be accepted.", matchCount: 0 }
  }
];

export const mockAiResponses: AiResponse[] = [
  {
    id: "ai-timecycle-1",
    section: "timecycle",
    summary: "Small weather readability changes for sunny timecycle values.",
    warnings: ["Test noon, sunset, night, and rainy weather before copying values to other files."],
    patches: mockPatches.filter((patch) => patch.section === "timecycle"),
    manualNotes: ["Apply similar edits gradually. Do not rewrite every timecycle file at once."],
    testingChecklist: ["Compare screenshots before and after.", "Check exposure indoors and outdoors.", "Reject patches that fail target validation."]
  },
  {
    id: "ai-textures-1",
    section: "textures",
    summary: "No direct DDS edit. Convert preview first, preserve alpha/mipmaps, review normal maps manually.",
    warnings: ["Normal maps and masks require manual review.", "Compression format must be preserved by converter settings."],
    patches: [],
    manualNotes: ["Use converter path from Settings.", "Keep original DDS filename for export."],
    testingChecklist: ["Check dimensions unchanged.", "Check alpha channel if texture is foliage/decal.", "Preview one texture in-game before batch work."]
  }
];

export const mockTextures: TextureAsset[] = [
  {
    textureId: "tex-road",
    section: "textures",
    originalPath: "C:/redux/source/textures/road_asphalt_d.dds",
    workspacePath: "C:/redux/project/workspace/textures/road_asphalt_d.dds",
    fileName: "road_asphalt_d.dds",
    relativePath: "textures/road_asphalt_d.dds",
    previewPngPath: "",
    editedPngPath: "C:/redux/project/workspace/.redux-ai/texture-edits/road_asphalt_d_edited.png",
    compiledDdsPath: "",
    metadata: {
      filePath: "C:/redux/project/workspace/textures/road_asphalt_d.dds",
      filename: "road_asphalt_d.dds",
      width: 2048,
      height: 2048,
      format: "BC3/DXT5 placeholder",
      mipmapCount: 8,
      hasAlpha: "unknown",
      fileSizeBytes: 5592405,
      roleGuess: "diffuse",
      warnings: ["Mipmapped texture. Preserve or regenerate mipmaps before export."]
    },
    roleGuess: "diffuse",
    conversionStatus: "edited_png_attached",
    exportReady: false,
    warnings: ["Mipmaps and compression need converter confirmation."],
    notes: "DDS -> PNG preview mocked. Edited PNG queued for PNG -> DDS conversion."
  },
  {
    textureId: "tex-grass-normal",
    section: "textures",
    originalPath: "C:/redux/source/textures/grass_normal_n.dds",
    workspacePath: "C:/redux/project/workspace/textures/grass_normal_n.dds",
    fileName: "grass_normal_n.dds",
    relativePath: "textures/grass_normal_n.dds",
    metadata: {
      filePath: "C:/redux/project/workspace/textures/grass_normal_n.dds",
      filename: "grass_normal_n.dds",
      width: 1024,
      height: 1024,
      format: "BC5 placeholder",
      mipmapCount: 1,
      hasAlpha: "no",
      fileSizeBytes: 4194304,
      roleGuess: "normal",
      warnings: ["Possible normal map. Direction-encoded colors need manual review."]
    },
    roleGuess: "normal",
    conversionStatus: "metadata_ready",
    exportReady: false,
    warnings: ["Normal map. Do not use normal photo enhancement prompts."],
    notes: "Manual review needed before any image workflow."
  },
  {
    textureId: "tex-leaf",
    section: "textures",
    originalPath: "C:/redux/source/textures/foliage/leaf_atlas_a.dds",
    workspacePath: "C:/redux/project/workspace/textures/foliage/leaf_atlas_a.dds",
    fileName: "leaf_atlas_a.dds",
    relativePath: "textures/foliage/leaf_atlas_a.dds",
    previewPngPath: "C:/redux/project/workspace/.redux-ai/texture-previews/leaf_atlas_a.png",
    metadata: {
      filePath: "C:/redux/project/workspace/textures/foliage/leaf_atlas_a.dds",
      filename: "leaf_atlas_a.dds",
      width: 1024,
      height: 1024,
      format: "BC3/DXT5 placeholder",
      mipmapCount: 6,
      hasAlpha: "yes",
      fileSizeBytes: 3145728,
      roleGuess: "alpha",
      warnings: ["Alpha texture. Preserve transparency during PNG editing and DDS compile."]
    },
    roleGuess: "alpha",
    conversionStatus: "preview_ready",
    exportReady: false,
    warnings: ["Alpha transparency must be preserved."],
    notes: "Preview ready. Edited image not imported."
  }
];

export function buildManifest(project: ReduxProject, exportName: string): ExportManifest {
  const accepted = project.patches.filter((patch) => patch.status === "accepted" && patch.validation.ok);
  const sectionsIncluded = Array.from(new Set(accepted.map((patch) => patch.section)));
  return {
    projectName: project.projectName,
    exportName,
    createdAt: "2026-05-11T12:00:00Z",
    sectionsIncluded,
    files: accepted.map((patch) => {
      const file = project.files.find((item) => item.relativePath === patch.filePath);
      return {
        section: patch.section,
        sourcePath: file?.sourcePath ?? "missing-source-path",
        relativePath: patch.filePath,
        exportPath: `edited_files/${patch.filePath}`,
        backupPath: `original_backups/${patch.filePath}`,
        changeCount: 1,
        status: "ready"
      };
    }),
    warnings: [
      "Original files remain untouched.",
      "Backups and manifest are required.",
      "Manual import through modding tools is still required."
    ]
  };
}

export const mockProject: ReduxProject = {
  version: "0.1.0",
  projectId: "redux-ai-prototype",
  projectName: "GTA V Redux Project",
  createdAt: "2026-05-11T08:55:00Z",
  updatedAt: "2026-05-11T12:00:00Z",
  saveStatus: "Saved",
  notes: "Mock project for safe copy-based Redux visual edits.",
  sections,
  files: mockFiles,
  aiResponses: mockAiResponses,
  aiHistory: [],
  aiSuggestions: [],
  patchReviews: [],
  appliedPatches: [],
  backups: [],
  changelogEntries: [],
  patchBatches: [],
  patches: mockPatches,
  textures: mockTextures,
  exportHistory: [],
  imageGenerationHistory: [],
  promptBasket: [],
  diagnostics: [],
  lastIndexedAt: "2026-05-11T12:00:00Z",
  scanCache: {},
  operationHistory: [],
  settings: {
    aiProvider: "OpenRouter-compatible",
    apiKey: "",
    model: "openai/gpt-oss-120b:free",
    openRouterBaseUrl: "https://openrouter.ai/api/v1/chat/completions",
    openRouterSiteUrl: "http://localhost",
    openRouterAppName: "Redux AI Assistant",
    maxTokens: 1800,
    temperature: 0.2,
    timeoutSeconds: 60,
    exportDirectory: "exports",
    projectStorage: "project-data/redux-ai-prototype.json",
    converterPaths: {
      ddsToImage: "C:/tools/texconv/texconv.exe",
      imageToDds: "C:/tools/texconv/texconv.exe",
      metadataInspector: "C:/tools/ddsinfo/ddsinfo.exe"
    },
    textureTools: {
      converterPath: "C:/tools/texconv/texconv.exe",
      defaultDdsFormat: "BC7_UNORM",
      generateMipmaps: true,
      preserveOriginalFormat: true,
      preserveAlpha: true,
      backupBeforeReplace: true,
      previewFolder: ".redux-ai/texture-previews"
    },
    imageAi: {
      provider: "manual",
      comfyuiUrl: "http://127.0.0.1:8188",
      workflowPreset: "img2img_basic",
      outputFolder: ".redux-ai/image-ai",
      seedMode: "random",
      fixedSeed: 123456,
      steps: 24,
      cfg: 6,
      denoise: 0.45,
      sampler: "euler",
      checkpoint: "",
      timeoutSeconds: 180,
      saveRawWorkflowJson: true,
      saveGenerationMetadata: true
    },
    safety: {
      createBackups: true,
      validatePatchTargets: true,
      blockBinaryPatches: true,
      requireManifest: true,
      warnTextureMetadata: true
    },
    experimental: {
      imageWorkflow: false,
      batchTextures: false
    },
    logging: {
      debugLogging: false,
      retentionLimit: 250
    },
    limits: {
      maxPreviewBytes: 262144,
      maxScanBytes: 2097152,
      maxLinePreviewChars: 240,
      maxScanResults: 500,
      maxPromptChars: 12000
    }
  }
};
