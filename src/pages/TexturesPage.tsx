import { useMemo, useState } from "react";
import { Bot, CheckCircle2, FileImage, FileInput, RefreshCcw, Save, ShieldCheck, WandSparkles, XCircle } from "lucide-react";
import AiWorkbench from "../components/AiWorkbench";
import PageHeader from "../components/PageHeader";
import FileList from "../components/FileList";
import PatchReviewPanel from "../components/PatchReviewPanel";
import TextureSlider from "../components/TextureSlider";
import WarningPanel from "../components/WarningPanel";
import HelpBlock from "../components/ui/HelpBlock";
import { imageAiPresets, imageAiRoleWarning, promptTemplateForRole } from "../lib/imageAiProvider";
import { textureImageSrc } from "../lib/textureApi";
import type { AiHistoryEntry, StructuredAiResponse } from "../types/ai";
import type { PatchReviewState } from "../types/patches";
import type { ReduxProject, SectionId } from "../types/project";
import type { TextureAsset } from "../types/textures";

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
    inspectTexture: (textureId: string) => Promise<void>;
    generateTexturePreview: (textureId: string) => Promise<void>;
    importEditedTexture: (textureId: string) => Promise<void>;
    compileTexture: (textureId: string) => Promise<void>;
    setTextureExportReady: (textureId: string, exportReady: boolean) => void;
    saveTextureReport: (notes?: string) => Promise<void>;
    generateTextureImageAi: (textureId: string, prompt: string, negativePrompt: string) => Promise<void>;
    attachGeneratedTextureOutput: (textureId: string, outputId: string) => Promise<void>;
    saveImageAiReport: () => Promise<void>;
  };
}) {
  const textureFiles = project.files.filter((file) => file.section === "textures");
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(textureFiles[0]?.id);
  const [selectedId, setSelectedId] = useState(project.textures[0]?.textureId);
  const [selectedReviewId, setSelectedReviewId] = useState<string | undefined>();
  const [isApplying, setIsApplying] = useState(false);
  const selected = project.textures.find((texture) => texture.textureId === selectedId) ?? project.textures[0];
  const reviews = (project.patchReviews ?? []).filter((review) => review.section === "textures");
  const warnings = useMemo(() => Array.from(new Set(project.textures.flatMap((texture) => texture.warnings))).slice(0, 8), [project.textures]);

  return (
    <div className="page">
      <PageHeader
        title="Textures"
        description="Local DDS workflow: inspect metadata, generate PNG previews, attach edited PNGs, compile DDS copies, and review export readiness."
        actions={
          <>
            <button className="actionBtn" onClick={actions.importFiles}><FileImage size={15} /> Import texture</button>
            <button className="actionBtn" onClick={actions.importFolder}><FileInput size={15} /> Import folder</button>
            <button className="actionBtn" disabled><Bot size={15} /> Send to Image AI later</button>
            <button className="actionBtn filled" onClick={() => actions.saveTextureReport()}><Save size={15} /> Save texture report</button>
          </>
        }
      />

      <WarningPanel title="Texture safety" warnings={warnings.length ? warnings : ["Original DDS files are copied into the workspace and never modified directly."]} />
      <HelpBlock title="DDS texture workflow">
        <p>DDS files are copied into the workspace, converted to PNG previews, edited manually or with local ComfyUI, reviewed with the A/B slider, then compiled back to DDS only after you choose to do it.</p>
      </HelpBlock>

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

      {!selected ? (
        <div className="emptyState">No DDS texture records yet. Import `.dds` files to create project-local texture workflow entries.</div>
      ) : (
        <TextureWorkflow project={project} texture={selected} actions={actions} onSelect={setSelectedId} />
      )}
    </div>
  );
}

function TextureWorkflow({
  project,
  texture,
  actions,
  onSelect
}: {
  project: ReduxProject;
  texture: TextureAsset;
  actions: {
    inspectTexture: (textureId: string) => Promise<void>;
    generateTexturePreview: (textureId: string) => Promise<void>;
    importEditedTexture: (textureId: string) => Promise<void>;
    compileTexture: (textureId: string) => Promise<void>;
    setTextureExportReady: (textureId: string, exportReady: boolean) => void;
    generateTextureImageAi: (textureId: string, prompt: string, negativePrompt: string) => Promise<void>;
    attachGeneratedTextureOutput: (textureId: string, outputId: string) => Promise<void>;
  };
  onSelect: (id: string) => void;
}) {
  const steps = [
    ["Imported", "imported"],
    ["Metadata", "metadata_ready"],
    ["Preview", "preview_ready"],
    ["Edited PNG", "edited_png_attached"],
    ["Compiled DDS", "compiled_dds_ready"],
    ["Export ready", "export_ready"]
  ] as const;
  const currentIndex = steps.findIndex(([, status]) => status === texture.conversionStatus);
  const metadata = texture.metadata;

  return (
    <div className="textureLayout">
      <aside className="panel textureList">
        <div className="uppercaseLabel">Texture List</div>
        {project.textures.map((item) => (
          <button key={item.textureId} className={`textureItem ${texture.textureId === item.textureId ? "selected" : ""}`} onClick={() => onSelect(item.textureId)}>
            <span className="mono">{item.fileName}</span>
            <small>{item.roleGuess} / {item.conversionStatus.replaceAll("_", " ")}</small>
            <span className={`badge ${item.exportReady ? "success" : item.warnings.length ? "warning" : "count"}`}>
              {item.exportReady ? "export" : `${item.warnings.length} warn`}
            </span>
          </button>
        ))}
      </aside>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">A/B Compare</div>
            <h3>{texture.fileName}</h3>
          </div>
          <div className="buttonRow">
            <button className="smallBtn" onClick={() => actions.inspectTexture(texture.textureId)}><RefreshCcw size={14} /> Inspect</button>
            <button className="smallBtn" onClick={() => actions.generateTexturePreview(texture.textureId)}><FileImage size={14} /> Generate preview</button>
            <button className="smallBtn" onClick={() => actions.importEditedTexture(texture.textureId)}><FileInput size={14} /> Import edited PNG</button>
            <button className="smallBtn" onClick={() => actions.compileTexture(texture.textureId)} disabled={!texture.editedPngPath}><WandSparkles size={14} /> Compile DDS</button>
          </div>
        </div>
        <TextureSlider texture={texture} />
        <ImageAiPanel texture={texture} actions={actions} />
        {!texture.previewPngPath && <div className="emptyMini">No preview PNG yet. Generate a preview from the workspace DDS before A/B review.</div>}
        {!texture.editedPngPath && <div className="emptyMini">No edited PNG attached. Import one after editing the preview externally.</div>}
        <div className="stepList">
          {steps.map(([label], index) => (
            <div key={label} className={`step ${index <= currentIndex ? "done" : ""}`}>
              <CheckCircle2 size={15} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Review</div>
            <h3>DDS replacement state</h3>
          </div>
        </div>
        <div className="statGroup">
          <Stat label="Role" value={texture.roleGuess} />
          <Stat label="Format" value={metadata?.format ?? "unknown"} />
          <Stat label="Size" value={metadata?.width && metadata.height ? `${metadata.width} x ${metadata.height}` : "unknown"} />
          <Stat label="Mipmaps" value={String(metadata?.mipmapCount ?? "unknown")} />
          <Stat label="Alpha" value={metadata?.hasAlpha ?? "unknown"} />
          <Stat label="File size" value={metadata?.fileSizeBytes ? `${Math.round(metadata.fileSizeBytes / 1024)} KB` : "unknown"} />
        </div>
        <div className="pathGrid">
          <span>Original</span><strong title={texture.originalPath}>{texture.originalPath}</strong>
          <span>Workspace</span><strong title={texture.workspacePath}>{texture.workspacePath}</strong>
          <span>Preview</span><strong title={texture.previewPngPath}>{texture.previewPngPath ?? "not generated"}</strong>
          <span>Edited PNG</span><strong title={texture.editedPngPath}>{texture.editedPngPath ?? "not attached"}</strong>
          <span>Compiled DDS</span><strong title={texture.compiledDdsPath}>{texture.compiledDdsPath ?? "not compiled"}</strong>
        </div>
        <WarningPanel title="Texture warnings" warnings={texture.warnings.length ? texture.warnings : ["No texture warnings yet."]} />
        <div className="buttonRow">
          <button className="smallBtn success" disabled={!texture.compiledDdsPath} onClick={() => actions.setTextureExportReady(texture.textureId, true)}>
            <ShieldCheck size={14} /> Mark as ready for export
          </button>
          <button className="smallBtn danger" onClick={() => actions.setTextureExportReady(texture.textureId, false)}>
            <XCircle size={14} /> Reject compiled texture
          </button>
        </div>
        <div className="infoStrip">Compiled DDS files stay separate until you explicitly mark them ready. No archive or original source path is written.</div>
      </section>
    </div>
  );
}

function ImageAiPanel({
  texture,
  actions
}: {
  texture: TextureAsset;
  actions: {
    generateTextureImageAi: (textureId: string, prompt: string, negativePrompt: string) => Promise<void>;
    attachGeneratedTextureOutput: (textureId: string, outputId: string) => Promise<void>;
  };
}) {
  const [prompt, setPrompt] = useState(promptTemplateForRole(texture.roleGuess));
  const [negativePrompt, setNegativePrompt] = useState("text, logo, watermark, border, large object, broken tile, distorted pattern");
  const [preset, setPreset] = useState("preserve original structure");
  const [isGenerating, setGenerating] = useState(false);
  const roleWarning = imageAiRoleWarning(texture.roleGuess);

  return (
    <div className="panel nestedPanel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Image AI PNG Edit</div>
          <h3>ComfyUI / manual-safe generation</h3>
        </div>
        <button
          className="smallBtn filled"
          disabled={!texture.previewPngPath || isGenerating}
          onClick={async () => {
            setGenerating(true);
            try {
              await actions.generateTextureImageAi(texture.textureId, `${prompt}\nPreset: ${preset}`, negativePrompt);
            } finally {
              setGenerating(false);
            }
          }}
        >
          {isGenerating ? "Generating..." : "Generate PNG"}
        </button>
      </div>
      {roleWarning && <div className="validation bad">{roleWarning}</div>}
      {texture.metadata?.hasAlpha === "yes" && <div className="validation bad">Original texture has alpha. Reject outputs that lose transparency.</div>}
      <div className="formGrid">
        <label>
          <span className="uppercaseLabel">Preset</span>
          <select value={preset} onChange={(event) => setPreset(event.target.value)}>
            {imageAiPresets.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="uppercaseLabel">Source PNG</span>
          <input value={texture.previewPngPath ?? "Generate preview first"} readOnly />
        </label>
      </div>
      <textarea className="goalBox" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <textarea className="goalBox" value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} />
      <div className="textureGallery">
        {(texture.generatedOutputs ?? []).map((output) => (
          <div key={output.outputId} className="textureOutputCard">
            {output.outputPath ? <img src={textureImageSrc(output.outputPath)} alt="Generated texture output" /> : <div className="emptyMini">No image</div>}
            <span className="mono">{output.status}</span>
            <small>seed {output.seed}</small>
            <button className="smallBtn" onClick={() => actions.attachGeneratedTextureOutput(texture.textureId, output.outputId)}>Attach as edited PNG</button>
          </div>
        ))}
        {!texture.generatedOutputs?.length && <div className="emptyMini">No generated outputs yet.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="statRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
