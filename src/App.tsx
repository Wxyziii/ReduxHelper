import { useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import OperationCenter from "./components/OperationCenter";
import HelpDrawer from "./components/HelpDrawer";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import NewProjectWizard from "./components/onboarding/NewProjectWizard";
import DashboardPage from "./pages/DashboardPage";
import TimecyclePage from "./pages/TimecyclePage";
import TracersPage from "./pages/TracersPage";
import HitEffectsPage from "./pages/HitEffectsPage";
import KillEffectPage from "./pages/KillEffectPage";
import OptimizationPage from "./pages/OptimizationPage";
import TexturesPage from "./pages/TexturesPage";
import IntelligencePage from "./pages/IntelligencePage";
import ExportPage from "./pages/ExportPage";
import SettingsPage from "./pages/SettingsPage";
import { mockAiResponses, mockPatches, mockProject } from "./data/mockProject";
import { applyAcceptedPatches, createProject, importFiles, importFolder, openProject, revealInFileManager, saveProject, savePromptReport, scanProject } from "./lib/tauriApi";
import { createExportPackage } from "./lib/exportApi";
import { sendComfyUiImageToImage, testComfyUiConnection } from "./lib/imageAiApi";
import { applyValidationResults, validatePatchReviews as runPatchValidation } from "./lib/patchValidator";
import { applyTextureResult, convertDdsToPng, convertPngToDds, importEditedTexturePng, inspectTextureMetadata, markTextureReady, saveTextureReport } from "./lib/textureApi";
import type { AiHistoryEntry, StructuredAiResponse } from "./types/ai";
import type { PatchReviewState } from "./types/patches";
import type { PatchStatus, ReduxProject, SectionId } from "./types/project";
import type { PromptBasketItem } from "./types/promptBasket";
import { runProjectDiagnostics } from "./lib/projectDiagnostics";
import { buildProjectIndex } from "./lib/projectIndex";
import { basketPrompt } from "./lib/promptBasket";
import { migrateProject, validateProjectShape } from "./lib/projectSchema";
import { completeOnboarding, shouldShowOnboarding } from "./lib/onboardingState";
import { cancelOperation, completeOperation, createOperation, failOperation } from "./lib/operationManager";
import { logError, logEvent } from "./lib/logger";
import type { OperationTask } from "./types/operations";

export default function App() {
  const [activePage, setActivePage] = useState<SectionId>("dashboard");
  const [project, setProject] = useState<ReduxProject>(mockProject);
  const [message, setMessage] = useState("Prototype ready. Create or open a project to use real local files.");
  const [operations, setOperations] = useState<OperationTask[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => shouldShowOnboarding(Boolean(mockProject.projectRoot)));

  async function track<T>(label: string, work: () => Promise<T>): Promise<T> {
    const op = createOperation(label);
    setOperations((current) => [op, ...current]);
    logEvent("info", "operation.start", label);
    try {
      const result = await work();
      setOperations((current) => current.map((item) => item.id === op.id ? completeOperation(item) : item));
      logEvent("info", "operation.complete", label);
      return result;
    } catch (error) {
      const failed = failOperation(op, error);
      setOperations((current) => current.map((item) => item.id === op.id ? failed : item));
      if (failed.error) logError("operation.failed", failed.error);
      throw error;
    }
  }

  const actions = useMemo(
    () => ({
      async createProject() {
        setWizardOpen(true);
      },
      async createProjectFromWizard(projectName: string, projectType: string) {
        const next = await track("Create project", () => createProject(projectName));
        setProject(enrichProject(next));
        setMessage(`Created ${projectType} project: ${next.projectRoot ?? next.projectName}. Next: import files or configure tools.`);
        setActivePage("dashboard");
        setWizardOpen(false);
        completeOnboarding();
        setOnboardingOpen(false);
      },
      async openProject() {
        const next = await track("Open project", () => openProject());
        if (next) {
          setProject(enrichProject(next));
          setMessage(`Opened project: ${next.projectJsonPath ?? next.projectName}`);
          setActivePage("dashboard");
          completeOnboarding();
          setOnboardingOpen(false);
        }
      },
      openHelp() {
        setHelpOpen(true);
      },
      async importFiles() {
        const next = await track("Import files", () => importFiles(project));
        setProject(enrichProject(next));
        setMessage("Imported selected files into project workspace.");
      },
      async importFolder() {
        const next = await track("Import folder", () => importFolder(project));
        setProject(enrichProject(next));
        setMessage("Imported selected folder into project workspace.");
      },
      async scanProject() {
        setProject((current) => ({ ...current, saveStatus: "Scanning" }));
        const next = await track("Scan project", () => scanProject(project));
        setProject(enrichProject(next));
        setMessage("Scan complete. Results saved to project.json.");
      },
      async exportProject(exportName = "Redux_AI_Export_v1", includeReports = true, includeAllBackups = false, conflictStrategy = "version") {
        const result = await track("Create export package", () => createExportPackage(project, exportName, includeReports, includeAllBackups, conflictStrategy));
        const historyEntry = {
          exportId: result.preview.exportId,
          exportName: result.preview.exportName,
          createdAt: new Date().toISOString(),
          exportPath: result.exportPath ?? result.preview.outputFolder,
          fileCount: result.preview.includedFiles.length,
          sections: result.preview.includedSections,
          warningsCount: result.preview.warnings.length + result.validation.warnings.length,
          manifestPath: result.manifestPath ?? "",
          status: result.ok ? "success" as const : "failed" as const,
          error: result.ok ? undefined : result.message
        };
        const nextProject = { ...project, exportHistory: [historyEntry, ...(project.exportHistory ?? [])] };
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage(result.message);
      },
      async saveProject() {
        const next = await track("Save project", () => saveProject(project));
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
        if (path === "general.showOnboardingAgain" && value === true) {
          setOnboardingOpen(true);
          return;
        }
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
      setPromptBasket(items: PromptBasketItem[]) {
        setProject((current) => ({ ...current, saveStatus: "Unsaved changes", promptBasket: items }));
      },
      async saveIntelligenceReports() {
        const index = buildProjectIndex(project);
        const diagnostics = runProjectDiagnostics(project);
        const content = [
          "# Project Intelligence Report",
          "",
          `Files: ${index.length}`,
          `Warnings: ${index.flatMap((item) => item.warnings).length}`,
          `Diagnostics: ${diagnostics.length}`,
          "",
          "## Prompt Basket",
          basketPrompt(project.promptBasket ?? []),
          "",
          "## Diagnostics",
          ...diagnostics.map((item) => `- ${item.severity}: ${item.reason} (${item.affectedFiles.join(", ")})`)
        ].join("\n");
        await saveProject({ ...project, diagnostics, lastIndexedAt: new Date().toISOString() });
        await savePromptReport(project, "intelligence", content);
        setMessage("Project intelligence reports saved to reports/.");
      },
      async revealInFileManager(path: string) {
        await revealInFileManager(path);
        setMessage("Reveal requested.");
      },
      async rescanProject() {
        const next = await scanProject(project);
        setProject(enrichProject({ ...next, lastIndexedAt: new Date().toISOString(), diagnostics: runProjectDiagnostics(next) }));
        setMessage("Project rescanned and index metadata refreshed.");
      },
      async testImageAiConnection() {
        const result = await testComfyUiConnection(project);
        setMessage(result.message);
      },
      async generateTextureImageAi(textureId: string, prompt: string, negativePrompt: string) {
        const texture = project.textures.find((item) => item.textureId === textureId);
        if (!texture?.previewPngPath) {
          setMessage("Generate PNG preview before image AI edit.");
          return;
        }
        const settings = project.settings.imageAi;
        const seed = settings.seedMode === "fixed" ? settings.fixedSeed : Math.floor(Math.random() * 2147483647);
        const result = await sendComfyUiImageToImage(project, {
          textureId,
          sourcePngPath: texture.previewPngPath,
          prompt,
          negativePrompt,
          strength: settings.denoise,
          steps: settings.steps,
          cfg: settings.cfg,
          seed,
          width: texture.metadata?.width,
          height: texture.metadata?.height,
          workflowPreset: settings.workflowPreset,
          preserveAlpha: texture.metadata?.hasAlpha === "yes"
        });
        const output = result.output;
        if (!output) {
          setMessage(result.error ?? "Image AI generation failed.");
          return;
        }
        const nextProject: ReduxProject = {
          ...project,
          textures: project.textures.map((item) =>
            item.textureId === textureId
              ? { ...item, generatedOutputs: [output, ...(item.generatedOutputs ?? [])], warnings: Array.from(new Set([...item.warnings, ...result.warnings])) }
              : item
          ),
          imageGenerationHistory: [output, ...(project.imageGenerationHistory ?? [])]
        };
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage(result.success ? "Image AI PNG generated. Review gallery before attaching." : result.error ?? "Image AI generation failed.");
      },
      async attachGeneratedTextureOutput(textureId: string, outputId: string) {
        const texture = project.textures.find((item) => item.textureId === textureId);
        const output = texture?.generatedOutputs?.find((item) => item.outputId === outputId);
        if (!texture || !output?.outputPath) return;
        const nextProject: ReduxProject = {
          ...project,
          textures: project.textures.map((item) =>
            item.textureId === textureId
              ? {
                  ...item,
                  editedPngPath: output.outputPath,
                  currentEditedPngSource: "image_ai",
                  currentEditedOutputId: output.outputId,
                  conversionStatus: "edited_png_attached",
                  generatedOutputs: (item.generatedOutputs ?? []).map((entry) => ({ ...entry, status: entry.outputId === outputId ? "attached_as_edited" : entry.status }))
                }
              : item
          ),
          imageGenerationHistory: (project.imageGenerationHistory ?? []).map((entry) => ({ ...entry, status: entry.outputId === outputId ? "attached_as_edited" : entry.status }))
        };
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage("Generated PNG attached as edited texture. Use A/B preview, then compile DDS manually.");
      },
      async saveImageAiReport() {
        const content = (project.imageGenerationHistory ?? []).map((item) => `- ${item.textureId} ${item.status} ${item.outputPath ?? ""}\n  prompt: ${item.prompt}`).join("\n");
        await saveProject(project);
        setMessage(content ? "Image AI history saved in project.json. Export can include metadata later." : "No image AI history yet.");
      },
      async inspectTexture(textureId: string) {
        const metadata = await inspectTextureMetadata(project, textureId);
        const nextProject: ReduxProject = {
          ...project,
          saveStatus: "Unsaved changes",
          textures: project.textures.map((texture) =>
            texture.textureId === textureId
              ? {
                  ...texture,
                  metadata,
                  roleGuess: metadata.roleGuess,
                  warnings: Array.from(new Set([...texture.warnings, ...metadata.warnings])),
                  conversionStatus: "metadata_ready"
              }
              : texture
          )
        };
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage("Texture metadata inspected and saved to project.json.");
      },
      async generateTexturePreview(textureId: string) {
        const result = await convertDdsToPng(project, textureId);
        const nextProject = applyTextureResult(project, result, "preview_ready");
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage(result.success ? "PNG preview generated and saved in project.json." : result.error ?? "Texture preview conversion failed.");
      },
      async importEditedTexture(textureId: string) {
        const result = await importEditedTexturePng(project, textureId);
        const nextProject = applyTextureResult(project, result, "edited_png_attached");
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage(result.success ? "Edited PNG copied into the project texture edits folder and saved." : result.error ?? "Edited PNG import failed.");
      },
      async compileTexture(textureId: string) {
        const texture = project.textures.find((item) => item.textureId === textureId);
        const allowDimensionMismatch = !!texture && window.confirm("Compile edited PNG to DDS? Continue only after reviewing dimension, alpha, normal-map, and mipmap warnings.");
        if (!allowDimensionMismatch) return;
        const result = await convertPngToDds(project, textureId, true);
        const nextProject = applyTextureResult(project, result, "compiled_dds_ready");
        const saved = await saveProject(nextProject);
        setProject(enrichProject(saved));
        setMessage(result.success ? "Compiled DDS written to project-local compiled texture folder. Review before export." : result.error ?? "Texture compile failed.");
      },
      async setTextureExportReady(textureId: string, exportReady: boolean) {
        const nextProject = markTextureReady(project, textureId, exportReady);
        setProject(nextProject);
        void saveProject(nextProject).then((saved) => setProject(enrichProject(saved)));
        setMessage(exportReady ? "Texture marked ready for export preview." : "Texture removed from export-ready set.");
      },
      async saveTextureReport(notes = "") {
        const response = await saveTextureReport(project, notes);
        setMessage(response.message);
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
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      {onboardingOpen && (
        <OnboardingModal
          onFinish={() => {
            completeOnboarding();
            setOnboardingOpen(false);
          }}
          onCreate={() => setWizardOpen(true)}
          onOpen={() => void actions.openProject()}
        />
      )}
      {wizardOpen && <NewProjectWizard onCreate={(name, type) => void actions.createProjectFromWizard(name, type)} onCancel={() => setWizardOpen(false)} />}
      {activePage === "dashboard" && <OperationCenter operations={operations} onCancel={(id) => setOperations((current) => current.map((op) => op.id === id ? cancelOperation(op) : op))} />}
      {activePage === "dashboard" && <DashboardPage project={project} setActivePage={setActivePage} actions={actions} message={message} />}
      {activePage === "timecycle" && <TimecyclePage project={project} actions={actions} />}
      {activePage === "tracers" && <TracersPage project={project} actions={actions} />}
      {activePage === "hitEffects" && <HitEffectsPage project={project} actions={actions} />}
      {activePage === "killEffect" && <KillEffectPage project={project} actions={actions} />}
      {activePage === "optimization" && <OptimizationPage project={project} actions={actions} />}
      {activePage === "textures" && <TexturesPage project={project} actions={actions} />}
      {activePage === "intelligence" && <IntelligencePage project={project} actions={{ ...actions, setActivePage }} />}
      {activePage === "export" && <ExportPage project={project} actions={actions} />}
      {activePage === "settings" && <SettingsPage project={project} actions={actions} />}
    </AppShell>
  );
}

function enrichProject(project: ReduxProject): ReduxProject {
  const validation = validateProjectShape(project);
  const migrated = migrateProject(project);
  return {
    ...migrated,
    notes: validation.ok ? migrated.notes : `${migrated.notes}\nProject validation warnings: ${validation.errors.join("; ")}`,
    settings: {
      ...mockProject.settings,
      ...migrated.settings,
      converterPaths: { ...mockProject.settings.converterPaths, ...migrated.settings?.converterPaths },
      textureTools: { ...mockProject.settings.textureTools, ...migrated.settings?.textureTools },
      imageAi: { ...mockProject.settings.imageAi, ...migrated.settings?.imageAi },
      safety: { ...mockProject.settings.safety, ...migrated.settings?.safety },
      experimental: { ...mockProject.settings.experimental, ...migrated.settings?.experimental },
      logging: { ...mockProject.settings.logging, ...migrated.settings?.logging },
      limits: { ...mockProject.settings.limits, ...migrated.settings?.limits }
    },
    aiResponses: migrated.aiResponses?.length ? migrated.aiResponses : mockAiResponses,
    patches: migrated.patches?.length ? migrated.patches : mockPatches
  };
}
