import { useMemo, useState } from "react";
import AiWorkbench from "../components/AiWorkbench";
import AiSuggestionCard from "../components/AiSuggestionCard";
import DiffViewer from "../components/DiffViewer";
import FileList from "../components/FileList";
import PageHeader from "../components/PageHeader";
import PatchReviewPanel from "../components/PatchReviewPanel";
import WarningPanel from "../components/WarningPanel";
import { buildSectionPrompt } from "../lib/promptBuilder";
import type { AiHistoryEntry, StructuredAiResponse } from "../types/ai";
import type { PatchReviewState } from "../types/patches";
import type { PatchStatus, ReduxProject, SectionId } from "../types/project";

export interface SectionActions {
    importFiles: () => Promise<void>;
    importFolder: () => Promise<void>;
    scanProject: () => Promise<void>;
    setGoal: (sectionId: SectionId, goal: string) => void;
    setPatchStatus: (patchId: string, status: PatchStatus) => void;
    setFileSection: (fileId: string, section: SectionId) => void;
    addAiHistory: (entry: AiHistoryEntry) => void;
    setAiSuggestions: (sectionId: SectionId, response: StructuredAiResponse) => void;
    setPatchReviewStatus: (reviewId: string, status: PatchReviewState["reviewStatus"]) => void;
    validatePatchReviews: (sectionId: SectionId) => Promise<void>;
    applyAcceptedPatchReviews: (sectionId: SectionId) => Promise<void>;
}

interface Props {
  project: ReduxProject;
  sectionId: SectionId;
  mode?: "default" | "kill" | "optimization";
  actions: SectionActions;
}

export default function SectionPage({ project, sectionId, mode = "default", actions }: Props) {
  const section = project.sections[sectionId];
  const files = project.files.filter((file) => file.section === sectionId);
  const patches = project.patches.filter((patch) => patch.section === sectionId);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(files[0]?.id);
  const [selectedPatchId, setSelectedPatchId] = useState<string | undefined>(patches[0]?.id);
  const selectedPatch = patches.find((patch) => patch.id === selectedPatchId);
  const selectedFile = selectedPatch
    ? project.files.find((file) => file.relativePath === selectedPatch.filePath)
    : files.find((file) => file.id === selectedFileId);
  const prompt = useMemo(() => buildSectionPrompt(project.projectName, section, files), [project.projectName, section, files]);
  const warnings = [...section.warnings, ...files.flatMap((file) => file.warnings)];
  const patchReviews = (project.patchReviews ?? []).filter((review) => review.section === sectionId);
  const [selectedReviewId, setSelectedReviewId] = useState<string | undefined>(patchReviews[0]?.id);
  const [isApplying, setIsApplying] = useState(false);

  return (
    <div className="page">
      <PageHeader
        title={section.name}
        description={section.description}
        actions={
          <>
          <button className="actionBtn" onClick={actions.scanProject}>Scan section</button>
          <button className="actionBtn">Generate prompt</button>
          <button className="actionBtn filled">Export section</button>
          </>
        }
      />

      <WarningPanel warnings={warnings} />

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Goal / Instruction</div>
            <h3>Section-specific AI request</h3>
          </div>
          <span className="subtle">Mock only. No API call.</span>
        </div>
        <textarea className="goalBox" value={section.goal} onChange={(event) => actions.setGoal(sectionId, event.target.value)} />
        {mode === "kill" && (
          <div className="infoStrip">Kill Effect stays separate from base file edits. UI generates safe overlay/script concepts only.</div>
        )}
        {mode === "optimization" && (
          <div className="infoStrip">Optimization suggestions are risk-ranked. High-risk deletion stays blocked in MVP.</div>
        )}
      </section>

      <FileList
        files={files}
        selectedFileId={selectedFileId}
        onImportFiles={actions.importFiles}
        onImportFolder={actions.importFolder}
        onSectionChange={actions.setFileSection}
        onSelect={(id) => {
          setSelectedFileId(id);
          const file = files.find((item) => item.id === id);
          const filePatch = patches.find((patch) => patch.filePath === file?.relativePath);
          setSelectedPatchId(filePatch?.id);
        }}
      />

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">File Preview</div>
            <h3>{selectedFile?.fileName ?? "No file selected"}</h3>
          </div>
          <span className="subtle">Selection state</span>
        </div>
        {selectedFile?.preview ? (
          <pre className="filePreview">{selectedFile.preview}</pre>
        ) : (
          <div className="emptyState">No text preview. Unsupported binaries and DDS files stay copy-only/manual workflow in MVP.</div>
        )}
      </section>

      <div className="split">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">Scan Results</div>
              <h3>Keyword matches</h3>
            </div>
          </div>
          <div className="scanList">
            {files.flatMap((file) =>
              file.scanMatches.map((match) => (
                <div key={`${file.id}-${match.line}-${match.keyword}`} className="scanRow">
                  <span className="mono">{file.fileName}:{match.line}</span>
                  <strong>{match.keyword}</strong>
                  <span>{match.snippet}</span>
                </div>
              ))
            )}
            {!files.some((file) => file.scanMatches.length) && <div className="emptyState">No scan matches. Add text-readable files first.</div>}
          </div>
        </section>
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">Legacy Prompt Preview</div>
              <h3>Quick section context</h3>
            </div>
          </div>
          <pre className="promptPreview">{prompt}</pre>
        </section>
      </div>

      <AiWorkbench
        project={project}
        sectionId={sectionId}
        section={section}
        files={files}
        onAiHistory={actions.addAiHistory}
        onAiSuggestions={actions.setAiSuggestions}
      />

      <PatchReviewPanel
        reviews={patchReviews}
        selectedId={selectedReviewId}
        isApplying={isApplying}
        onSelect={setSelectedReviewId}
        onValidate={() => actions.validatePatchReviews(sectionId)}
        onDecision={(id, status) => actions.setPatchReviewStatus(id, status)}
        onApply={async () => {
          setIsApplying(true);
          try {
            await actions.applyAcceptedPatchReviews(sectionId);
          } finally {
            setIsApplying(false);
          }
        }}
      />

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">AI Suggestions</div>
            <h3>Review each patch separately</h3>
          </div>
        </div>
        <div className="suggestionGrid">
          {patches.map((patch) => (
            <AiSuggestionCard
              key={patch.id}
              patch={patch}
              selected={patch.id === selectedPatchId}
              onReview={() => setSelectedPatchId(patch.id)}
              onStatus={(status) => actions.setPatchStatus(patch.id, status)}
            />
          ))}
          {!patches.length && <div className="emptyState">No patchable AI suggestions. Manual notes only for this section.</div>}
        </div>
      </section>

      <DiffViewer file={selectedFile} patch={selectedPatch} />
    </div>
  );
}
