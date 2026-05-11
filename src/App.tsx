import { useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import DashboardPage from "./pages/DashboardPage";
import TimecyclePage from "./pages/TimecyclePage";
import TracersPage from "./pages/TracersPage";
import HitEffectsPage from "./pages/HitEffectsPage";
import KillEffectPage from "./pages/KillEffectPage";
import OptimizationPage from "./pages/OptimizationPage";
import TexturesPage from "./pages/TexturesPage";
import ExportPage from "./pages/ExportPage";
import SettingsPage from "./pages/SettingsPage";
import { mockAiResponses, mockPatches, mockProject } from "./data/mockProject";
import { applyAcceptedPatches, createProject, exportProject, importFiles, importFolder, openProject, saveProject, scanProject } from "./lib/tauriApi";
import { applyValidationResults, validatePatchReviews as runPatchValidation } from "./lib/patchValidator";
import type { AiHistoryEntry, StructuredAiResponse } from "./types/ai";
import type { PatchReviewState } from "./types/patches";
import type { PatchStatus, ReduxProject, SectionId } from "./types/project";

export default function App() {
  const [activePage, setActivePage] = useState<SectionId>("dashboard");
  const [project, setProject] = useState<ReduxProject>(mockProject);
  const [message, setMessage] = useState("Prototype ready. Create or open a project to use real local files.");

  const actions = useMemo(
    () => ({
      async createProject() {
        const projectName = window.prompt("Project name", "Redux AI Project") ?? "Redux AI Project";
        const next = await createProject(projectName);
        setProject(enrichProject(next));
        setMessage(`Created project: ${next.projectRoot ?? next.projectName}`);
        setActivePage("dashboard");
      },
      async openProject() {
        const next = await openProject();
        if (next) {
          setProject(enrichProject(next));
          setMessage(`Opened project: ${next.projectJsonPath ?? next.projectName}`);
          setActivePage("dashboard");
        }
      },
      async importFiles() {
        const next = await importFiles(project);
        setProject(enrichProject(next));
        setMessage("Imported selected files into project workspace.");
      },
      async importFolder() {
        const next = await importFolder(project);
        setProject(enrichProject(next));
        setMessage("Imported selected folder into project workspace.");
      },
      async scanProject() {
        setProject((current) => ({ ...current, saveStatus: "Scanning" }));
        const next = await scanProject(project);
        setProject(enrichProject(next));
        setMessage("Scan complete. Results saved to project.json.");
      },
      async exportProject() {
        const response = await exportProject(project);
        setMessage(response.message);
      },
      async saveProject() {
        const next = await saveProject(project);
        setProject(enrichProject(next));
        setMessage("Project saved to project.json.");
      },
      setGoal(sectionId: SectionId, goal: string) {
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          sections: {
            ...current.sections,
            [sectionId]: { ...current.sections[sectionId], goal }
          }
        }));
      },
      setPatchStatus(patchId: string, status: PatchStatus) {
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          patches: current.patches.map((patch) =>
            patch.id === patchId && patch.validation.ok && patch.status !== "failed" ? { ...patch, status } : patch
          )
        }));
      },
      setFileSection(fileId: string, section: SectionId) {
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          files: current.files.map((file) => (file.id === fileId ? { ...file, section, scanMatches: [] } : file))
        }));
      },
      setSetting(path: string, value: string | boolean | number) {
        setProject((current) => {
          const settings = structuredClone(current.settings);
          const parts = path.split(".");
          let cursor: Record<string, unknown> = settings as unknown as Record<string, unknown>;
          for (const part of parts.slice(0, -1)) {
            cursor = cursor[part] as Record<string, unknown>;
          }
          cursor[parts.at(-1)!] = value;
          return { ...current, saveStatus: "Unsaved changes", settings };
        });
      },
      addAiHistory(entry: AiHistoryEntry) {
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          aiHistory: [entry, ...(current.aiHistory ?? [])].slice(0, 50)
        }));
      },
      setAiSuggestions(sectionId: SectionId, response: StructuredAiResponse) {
        setProject((current) => {
          const reviewMap = new Map((current.patchReviews ?? []).map((review) => [review.suggestionId, review]));
          const reviews: PatchReviewState[] = response.suggestions.map((suggestion) => {
            const existing = reviewMap.get(suggestion.id);
            return existing ?? {
              id: `review-${sectionId}-${suggestion.id}`,
              suggestionId: suggestion.id,
              section: sectionId,
              suggestion,
              reviewStatus: "pending_review"
            };
          });
          const otherReviews = (current.patchReviews ?? []).filter((review) => review.section !== sectionId);
          const otherSuggestions = (current.aiSuggestions ?? []).filter((suggestion) => !response.suggestions.some((item) => item.id === suggestion.id));
          return {
            ...current,
            saveStatus: "Unsaved changes",
            aiSuggestions: [...otherSuggestions, ...response.suggestions],
            patchReviews: [...otherReviews, ...reviews]
          };
        });
      },
      setPatchReviewStatus(reviewId: string, status: PatchReviewState["reviewStatus"]) {
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          patchReviews: (current.patchReviews ?? []).map((review) =>
            review.id === reviewId ? { ...review, reviewStatus: status, userDecisionAt: new Date().toISOString() } : review
          )
        }));
      },
      async validatePatchReviews(sectionId: SectionId) {
        const reviews = (project.patchReviews ?? []).filter((review) => review.section === sectionId);
        const results = await runPatchValidation(project, reviews);
        setProject((current) => ({
          ...current,
          saveStatus: "Unsaved changes",
          patchReviews: applyValidationResults(current.patchReviews ?? [], results)
        }));
        setMessage(`Validated ${results.length} patch suggestion(s).`);
      },
      async applyAcceptedPatchReviews(sectionId: SectionId) {
        const reviews = (project.patchReviews ?? []).filter((review) => review.section === sectionId);
        const next = await applyAcceptedPatches(project, reviews);
        setProject(enrichProject(next));
        setMessage("Applied accepted patches to workspace copies only. Backups and changelog updated.");
      },
      async markSaved() {
        const next = await saveProject(project);
        setProject(enrichProject(next));
        setMessage("Project saved to project.json.");
      }
    }),
    [project]
  );

  return (
    <AppShell project={project} activePage={activePage} setActivePage={setActivePage} actions={actions} message={message}>
      {activePage === "dashboard" && <DashboardPage project={project} setActivePage={setActivePage} actions={actions} message={message} />}
      {activePage === "timecycle" && <TimecyclePage project={project} actions={actions} />}
      {activePage === "tracers" && <TracersPage project={project} actions={actions} />}
      {activePage === "hitEffects" && <HitEffectsPage project={project} actions={actions} />}
      {activePage === "killEffect" && <KillEffectPage project={project} actions={actions} />}
      {activePage === "optimization" && <OptimizationPage project={project} actions={actions} />}
      {activePage === "textures" && <TexturesPage project={project} actions={actions} />}
      {activePage === "export" && <ExportPage project={project} actions={actions} />}
      {activePage === "settings" && <SettingsPage project={project} actions={actions} />}
    </AppShell>
  );
}

function enrichProject(project: ReduxProject): ReduxProject {
  return {
    ...project,
    settings: {
      ...mockProject.settings,
      ...project.settings,
      converterPaths: { ...mockProject.settings.converterPaths, ...project.settings?.converterPaths },
      safety: { ...mockProject.settings.safety, ...project.settings?.safety },
      experimental: { ...mockProject.settings.experimental, ...project.settings?.experimental }
    },
    aiResponses: project.aiResponses?.length ? project.aiResponses : mockAiResponses,
    aiHistory: project.aiHistory ?? [],
    aiSuggestions: project.aiSuggestions ?? [],
    patchReviews: project.patchReviews ?? [],
    appliedPatches: project.appliedPatches ?? [],
    backups: project.backups ?? [],
    changelogEntries: project.changelogEntries ?? [],
    patchBatches: project.patchBatches ?? [],
    patches: project.patches?.length ? project.patches : mockPatches,
    textures: project.textures ?? []
  };
}
