import { buildManifest } from "../data/mockProject";
import type { ReduxProject } from "../types/project";
import type { ExportExcludedItem, ExportFileRecord, ExportPreviewModel } from "../types/exports";

export function createExportPreview(project: ReduxProject, exportName: string, options: { includeReports?: boolean; includeAllBackups?: boolean } = {}) {
  const manifest = buildManifest(project, exportName);
  const appliedReviews = (project.patchReviews ?? []).filter((review) => review.reviewStatus === "applied");
  const appliedChangelog = project.changelogEntries ?? [];
  const textFiles: ExportFileRecord[] = appliedChangelog.flatMap((entry) => {
    const file = project.files.find((item) => item.relativePath === entry.filePath);
    if (!file?.workspacePath) return [];
    return [{
      id: `text-${entry.id}`,
      section: entry.section,
      type: "edited_text" as const,
      sourceWorkspacePath: file.workspacePath,
      outputRelativePath: `edited_files/${file.relativePath}`,
      intendedGameRelativePath: file.relativePath,
      originalPath: file.sourcePath,
      sizeBytes: file.sizeBytes,
      riskLevel: entry.risk,
      patchIds: [entry.patchId],
      warnings: file.warnings
    }];
  });
  const readyTextures = (project.textures ?? []).filter((texture) => texture.exportReady && texture.compiledDdsPath);
  const textureFiles: ExportFileRecord[] = readyTextures.map((texture) => ({
    id: `texture-${texture.textureId}`,
    section: "textures",
    type: "compiled_texture",
    sourceWorkspacePath: texture.compiledDdsPath ?? "",
    outputRelativePath: `compiled_textures/${texture.relativePath || `unmapped/${texture.fileName}`}`,
    intendedGameRelativePath: texture.relativePath || `unmapped/${texture.fileName}`,
    originalPath: texture.originalPath,
    sizeBytes: texture.metadata?.fileSizeBytes ?? 0,
    riskLevel: texture.roleGuess === "normal" || texture.roleGuess === "mask" ? "high" : "medium",
    patchIds: [],
    textureId: texture.textureId,
    warnings: texture.warnings
  }));
  const backupFiles: ExportFileRecord[] = appliedChangelog.flatMap((entry) => entry.backupPath ? [{
    id: `backup-${entry.id}`,
    section: entry.section,
    type: "backup" as const,
    sourceWorkspacePath: entry.backupPath,
    outputRelativePath: `original_backups/${entry.filePath}`,
    intendedGameRelativePath: entry.filePath,
    sizeBytes: 0,
    riskLevel: entry.risk,
    patchIds: [entry.patchId],
    warnings: []
  }] : []);
  const imageAiMetadataFiles: ExportFileRecord[] = options.includeReports
    ? (project.imageGenerationHistory ?? []).flatMap((output) => output.metadataPath ? [{
        id: `image-ai-meta-${output.outputId}`,
        section: "reports" as const,
        type: "report" as const,
        sourceWorkspacePath: output.metadataPath,
        outputRelativePath: `reports/image_ai/${output.outputId}.json`,
        intendedGameRelativePath: "reports only",
        sizeBytes: 0,
        riskLevel: "low",
        patchIds: [],
        warnings: ["AI generation metadata only; compiled DDS remains the game-ready output."]
      }] : [])
    : [];
  const includedFiles = [...textFiles, ...textureFiles, ...backupFiles, ...imageAiMetadataFiles];
  const excludedItems: ExportExcludedItem[] = [
    ...(project.patchReviews ?? [])
      .filter((review) => review.reviewStatus !== "applied")
      .map((review) => ({
        id: `patch-${review.id}`,
        label: review.suggestion.title,
        section: review.section,
        reason: review.reviewStatus === "accepted" ? "Accepted but not applied to workspace." : `Patch status is ${review.reviewStatus}.`
      })),
    ...(project.files ?? [])
      .filter((file) => file.status !== "text-readable" && file.status !== "texture-workflow")
      .map((file) => ({ id: `file-${file.id}`, label: file.relativePath, section: file.section, reason: "Unsupported file type has no eligible export output." })),
    ...(project.textures ?? [])
      .filter((texture) => !texture.exportReady)
      .map((texture) => ({ id: `texture-${texture.textureId}`, label: texture.relativePath, section: "textures" as const, reason: "Texture not marked export-ready." }))
  ];
  const warnings = Array.from(new Set([
    ...manifest.warnings,
    ...includedFiles.flatMap((file) => file.warnings),
    ...excludedItems.filter((item) => item.reason.includes("Accepted but not applied")).map((item) => `${item.label}: ${item.reason}`)
  ]));
  if (readyTextures.length) {
    manifest.sectionsIncluded = Array.from(new Set([...manifest.sectionsIncluded, "textures"]));
    manifest.files.push(
      ...readyTextures.map((texture) => ({
        section: "textures" as const,
        sourcePath: texture.compiledDdsPath ?? "",
        relativePath: texture.relativePath,
        exportPath: `edited_files/${texture.relativePath}`,
        backupPath: texture.backupPath ?? `original_backups/${texture.relativePath}`,
        changeCount: 1,
        status: `texture-ready:${texture.roleGuess}:${texture.warnings.length} warning(s)`
      }))
    );
    manifest.warnings.push("Texture DDS files shown here are export-ready previews only until final export writing is implemented.");
  }
  const includedSections = Array.from(new Set(includedFiles.map((file) => file.section.toString())));
  const preview: ExportPreviewModel = {
    exportId: `export-${Date.now()}`,
    projectId: project.projectId,
    projectName: project.projectName,
    exportName,
    outputFolder: `${project.settings.exportDirectory}/${exportName}`,
    includedSections,
    includedFiles,
    excludedItems,
    warnings,
    blockers: exportName.trim() ? (includedFiles.length ? [] : ["No eligible files exist."]) : ["Export name is empty."],
    unappliedAcceptedPatches: (project.patchReviews ?? []).filter((review) => review.reviewStatus === "accepted").length,
    highRiskChanges: includedFiles.filter((file) => file.riskLevel === "high").length,
    estimatedFileCount: includedFiles.length + 5 + (options.includeReports ? 1 : 0),
    estimatedExportSizeBytes: includedFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
    installNotesPreview: buildInstallNotesPreview(exportName, includedFiles, warnings),
    manifestPreview: {
      exportName,
      projectId: project.projectId,
      includedSections,
      fileCount: includedFiles.length,
      files: includedFiles,
      warnings,
      requiredFiles: ["manifest.json", "install_notes.txt", "changelog.md", "warnings.md", "export_summary.json"]
    }
  };
  const tree = [
    `exports/${exportName}/`,
    "  edited_files/",
    ...manifest.files.map((file) => `    ${file.relativePath}`),
    ...(readyTextures.length ? ["  texture_compiled/", ...readyTextures.map((texture) => `    ${texture.relativePath}`)] : []),
    "  original_backups/",
    ...manifest.files.map((file) => `    ${file.relativePath}`),
    "  reports/",
    "    ai_report.md",
    "    scan_report.md",
    "    texture_report.md",
    "  manifest.json",
    "  install_notes.txt",
    "  changelog.md"
  ];

  return { manifest, tree, preview };
}

function buildInstallNotesPreview(exportName: string, files: ExportFileRecord[], warnings: string[]) {
  return [
    `Redux AI Assistant export: ${exportName}`,
    "No automatic install. Original game files untouched.",
    "Manual import required via OpenIV/relevant tools.",
    "",
    "Install order:",
    "1. Review warnings.md.",
    "2. Import edited_files one section at a time.",
    "3. Import compiled_textures after texture review.",
    "4. Test in game before adding next section.",
    "",
    "File mapping:",
    ...files.map((file) => `${file.outputRelativePath}\n-> intended location:\n${file.intendedGameRelativePath}`),
    "",
    "Warnings:",
    ...(warnings.length ? warnings : ["No unresolved warnings."])
  ].join("\n");
}
