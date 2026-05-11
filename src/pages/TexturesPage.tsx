import { useState } from "react";
import { Bot, CheckCircle2, FileImage, RefreshCcw } from "lucide-react";
import AiWorkbench from "../components/AiWorkbench";
import PageHeader from "../components/PageHeader";
import FileList from "../components/FileList";
import PatchReviewPanel from "../components/PatchReviewPanel";
import TextureSlider from "../components/TextureSlider";
import WarningPanel from "../components/WarningPanel";
import type { AiHistoryEntry, StructuredAiResponse } from "../types/ai";
import type { PatchReviewState } from "../types/patches";
import type { ReduxProject, SectionId } from "../types/project";

export default function TexturesPage({
  project,
  actions
}: {
  project: ReduxProject;
  actions: {
    importFiles: () => Promise<void>;
    importFolder: () => Promise<void>;
    setFileSection: (fileId: string, section: SectionId) => void;
    addAiHistory: (entry: AiHistoryEntry) => void;
    setAiSuggestions: (sectionId: SectionId, response: StructuredAiResponse) => void;
    setPatchReviewStatus: (reviewId: string, status: PatchReviewState["reviewStatus"]) => void;
    validatePatchReviews: (sectionId: SectionId) => Promise<void>;
    applyAcceptedPatchReviews: (sectionId: SectionId) => Promise<void>;
  };
}) {
  const textureFiles = project.files.filter((file) => file.section === "textures");
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(textureFiles[0]?.id);
  const [selectedId, setSelectedId] = useState(project.textures[0]?.id);
  const [selectedReviewId, setSelectedReviewId] = useState<string | undefined>();
  const [isApplying, setIsApplying] = useState(false);
  const selected = project.textures.find((texture) => texture.id === selectedId) ?? project.textures[0];
  const reviews = (project.patchReviews ?? []).filter((review) => review.section === "textures");

  if (!selected) {
    return (
      <div className="page">
        <PageHeader
          title="Textures"
          description="DDS files are copied and tracked, but real conversion is still disabled in Phase 2."
          actions={
            <>
              <button className="actionBtn"><FileImage size={15} /> Add DDS</button>
              <button className="actionBtn"><RefreshCcw size={15} /> Mock convert</button>
              <button className="actionBtn filled"><Bot size={15} /> Generate image prompt</button>
            </>
          }
        />
        <FileList
          files={textureFiles}
          selectedFileId={selectedFileId}
          onSelect={setSelectedFileId}
          onImportFiles={actions.importFiles}
          onImportFolder={actions.importFolder}
          onSectionChange={actions.setFileSection}
        />
        <AiWorkbench project={project} sectionId="textures" section={project.sections.textures} files={textureFiles} onAiHistory={actions.addAiHistory} onAiSuggestions={actions.setAiSuggestions} />
        <PatchReviewPanel
          reviews={reviews}
          selectedId={selectedReviewId}
          isApplying={isApplying}
          onSelect={setSelectedReviewId}
          onValidate={() => actions.validatePatchReviews("textures")}
          onDecision={(id, status) => actions.setPatchReviewStatus(id, status)}
          onApply={async () => {
            setIsApplying(true);
            try {
              await actions.applyAcceptedPatchReviews("textures");
            } finally {
              setIsApplying(false);
            }
          }}
        />
        <div className="emptyState">No texture workflow items yet. Import `.dds` files to see binary warnings in file lists; conversion starts in a later phase.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Textures"
        description="DDS to PNG preview to AI/manual edit to DDS export. Mock pipeline, no real conversion."
        actions={
          <>
          <button className="actionBtn"><FileImage size={15} /> Add DDS</button>
          <button className="actionBtn"><RefreshCcw size={15} /> Mock convert</button>
          <button className="actionBtn filled"><Bot size={15} /> Generate image prompt</button>
          </>
        }
      />

      <WarningPanel title="DDS metadata warnings" warnings={selected.warnings} />

      <FileList
        files={textureFiles}
        selectedFileId={selectedFileId}
        onSelect={setSelectedFileId}
        onImportFiles={actions.importFiles}
        onImportFolder={actions.importFolder}
        onSectionChange={actions.setFileSection}
      />

      <AiWorkbench project={project} sectionId="textures" section={project.sections.textures} files={textureFiles} onAiHistory={actions.addAiHistory} onAiSuggestions={actions.setAiSuggestions} />

      <PatchReviewPanel
        reviews={reviews}
        selectedId={selectedReviewId}
        isApplying={isApplying}
        onSelect={setSelectedReviewId}
        onValidate={() => actions.validatePatchReviews("textures")}
        onDecision={(id, status) => actions.setPatchReviewStatus(id, status)}
        onApply={async () => {
          setIsApplying(true);
          try {
            await actions.applyAcceptedPatchReviews("textures");
          } finally {
            setIsApplying(false);
          }
        }}
      />

      <div className="textureLayout">
        <aside className="panel textureList">
          <div className="uppercaseLabel">Texture List</div>
          {project.textures.map((texture) => (
            <button key={texture.id} className={`textureItem ${selected.id === texture.id ? "selected" : ""}`} onClick={() => setSelectedId(texture.id)}>
              <span className="mono">{texture.fileName}</span>
              <small>{texture.guessedType} / {texture.status}</small>
            </button>
          ))}
        </aside>
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">A/B Compare</div>
              <h3>{selected.fileName}</h3>
            </div>
          </div>
          <TextureSlider texture={selected} />
        </section>
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">Workflow</div>
              <h3>DDS pipeline state</h3>
            </div>
          </div>
          <div className="stepList">
            {["Original DDS added", "Preview PNG generated", "AI/manual edit staged", "Edited PNG validated", "PNG converted back to DDS", "Ready for export"].map((step, index) => (
              <div key={step} className={`step ${index <= 3 ? "done" : ""}`}>
                <CheckCircle2 size={15} />
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="infoStrip">{selected.notes}</div>
        </section>
      </div>
    </div>
  );
}
