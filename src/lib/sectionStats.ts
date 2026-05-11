import type { ReduxProject, SectionId } from "../types/project";

export function getSectionStats(project: ReduxProject, sectionId: SectionId) {
  const files = project.files.filter((file) => file.section === sectionId);
  const patches = project.patches.filter((patch) => patch.section === sectionId);
  const warnings = [
    ...(project.sections[sectionId]?.warnings ?? []),
    ...files.flatMap((file) => file.warnings),
    ...project.aiResponses.filter((item) => item.section === sectionId).flatMap((item) => item.warnings)
  ];

  return {
    files: files.length,
    suggestions: patches.length,
    accepted: patches.filter((patch) => patch.status === "accepted").length,
    rejected: patches.filter((patch) => patch.status === "rejected").length,
    failed: patches.filter((patch) => patch.status === "failed").length,
    warnings: warnings.length,
    exportReady: patches.some((patch) => patch.status === "accepted" && patch.validation.ok)
  };
}
