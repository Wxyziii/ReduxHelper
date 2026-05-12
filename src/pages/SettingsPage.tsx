import PageHeader from "../components/PageHeader";
import { ddsFormats } from "../lib/textureTypes";
import { validateSettings } from "../lib/settingsValidation";
import type { ReduxProject } from "../types/project";

interface Props {
  project: ReduxProject;
  actions: {
    setSetting: (path: string, value: string | boolean | number) => void;
  };
}

export default function SettingsPage({ project, actions }: Props) {
  const settings = project.settings;
  const settingsIssues = validateSettings(project);

  return (
    <div className="page settingsPage">
      <PageHeader title="Settings" description="Local app settings for OpenRouter, model, converter paths, export paths, and safety flags." />
      <section className="panel">
        <div className="uppercaseLabel">General</div>
        <div className="buttonRow">
          <button className="smallBtn" onClick={() => actions.setSetting("general.showOnboardingAgain", true)}>Show onboarding again</button>
        </div>
      </section>
      {!!settingsIssues.length && <section className="panel">{settingsIssues.map((issue) => <div key={issue} className="validation bad">{issue}</div>)}</section>}

      <section className="panel">
        <div className="uppercaseLabel">OpenRouter</div>
        <div className="infoStrip">API key is stored in local project settings for now and sent only to the Tauri backend request command. Secure OS credential storage should replace this later.</div>
        <div className="formGrid">
          <Field label="Provider" value={settings.aiProvider} onChange={(value) => actions.setSetting("aiProvider", value)} />
          <Field label="Model string" value={settings.model} onChange={(value) => actions.setSetting("model", value)} />
          <Field label="API key" value={settings.apiKey} onChange={(value) => actions.setSetting("apiKey", value)} placeholder="sk-or-..." type="password" />
          <Field label="Base URL" value={settings.openRouterBaseUrl} onChange={(value) => actions.setSetting("openRouterBaseUrl", value)} />
          <Field label="Site URL header" value={settings.openRouterSiteUrl} onChange={(value) => actions.setSetting("openRouterSiteUrl", value)} />
          <Field label="App name header" value={settings.openRouterAppName} onChange={(value) => actions.setSetting("openRouterAppName", value)} />
          <NumberField label="Max tokens" value={settings.maxTokens} onChange={(value) => actions.setSetting("maxTokens", value)} />
          <NumberField label="Temperature" value={settings.temperature} step={0.1} onChange={(value) => actions.setSetting("temperature", value)} />
          <NumberField label="Timeout seconds" value={settings.timeoutSeconds} onChange={(value) => actions.setSetting("timeoutSeconds", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Image AI</div>
        <div className="infoStrip">Optional PNG-only texture editing. DDS conversion remains separate; manual edited PNG import still works.</div>
        <div className="formGrid">
          <SelectField label="Image AI provider" value={settings.imageAi.provider} options={["manual", "comfyui", "future"]} onChange={(value) => actions.setSetting("imageAi.provider", value)} />
          <Field label="ComfyUI server URL" value={settings.imageAi.comfyuiUrl} onChange={(value) => actions.setSetting("imageAi.comfyuiUrl", value)} />
          <Field label="Workflow preset" value={settings.imageAi.workflowPreset} onChange={(value) => actions.setSetting("imageAi.workflowPreset", value)} />
          <Field label="Output folder" value={settings.imageAi.outputFolder} onChange={(value) => actions.setSetting("imageAi.outputFolder", value)} />
          <SelectField label="Seed mode" value={settings.imageAi.seedMode} options={["random", "fixed"]} onChange={(value) => actions.setSetting("imageAi.seedMode", value)} />
          <NumberField label="Fixed seed" value={settings.imageAi.fixedSeed} onChange={(value) => actions.setSetting("imageAi.fixedSeed", value)} />
          <NumberField label="Steps" value={settings.imageAi.steps} onChange={(value) => actions.setSetting("imageAi.steps", value)} />
          <NumberField label="CFG / guidance" value={settings.imageAi.cfg} step={0.5} onChange={(value) => actions.setSetting("imageAi.cfg", value)} />
          <NumberField label="Denoise strength" value={settings.imageAi.denoise} step={0.05} onChange={(value) => actions.setSetting("imageAi.denoise", value)} />
          <Field label="Sampler" value={settings.imageAi.sampler} onChange={(value) => actions.setSetting("imageAi.sampler", value)} />
          <Field label="Checkpoint/model" value={settings.imageAi.checkpoint} onChange={(value) => actions.setSetting("imageAi.checkpoint", value)} />
          <NumberField label="Timeout seconds" value={settings.imageAi.timeoutSeconds} onChange={(value) => actions.setSetting("imageAi.timeoutSeconds", value)} />
        </div>
        <div className="toggleGrid">
          <Toggle label="Save raw workflow JSON" checked={settings.imageAi.saveRawWorkflowJson} onChange={(value) => actions.setSetting("imageAi.saveRawWorkflowJson", value)} />
          <Toggle label="Save generation metadata" checked={settings.imageAi.saveGenerationMetadata} onChange={(value) => actions.setSetting("imageAi.saveGenerationMetadata", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Texture Tools</div>
        <div className="infoStrip">Real DDS conversion requires a local converter such as Microsoft texconv. Browser mode keeps mock conversion only.</div>
        <div className="formGrid">
          <Field label="Texconv / converter path" value={settings.textureTools.converterPath} onChange={(value) => actions.setSetting("textureTools.converterPath", value)} />
          <SelectField label="Default DDS output format" value={settings.textureTools.defaultDdsFormat} options={ddsFormats} onChange={(value) => actions.setSetting("textureTools.defaultDdsFormat", value)} />
          <Field label="Default texture preview folder" value={settings.textureTools.previewFolder} onChange={(value) => actions.setSetting("textureTools.previewFolder", value)} />
          <button className="actionBtn" type="button" onClick={() => window.alert(settings.textureTools.converterPath ? "Converter path saved. Use a real Tauri run to execute the converter test." : "Set a converter path first.")}>Test converter</button>
        </div>
        <div className="toggleGrid">
          <Toggle label="Generate mipmaps" checked={settings.textureTools.generateMipmaps} onChange={(value) => actions.setSetting("textureTools.generateMipmaps", value)} />
          <Toggle label="Preserve original DDS format" checked={settings.textureTools.preserveOriginalFormat} onChange={(value) => actions.setSetting("textureTools.preserveOriginalFormat", value)} />
          <Toggle label="Preserve alpha" checked={settings.textureTools.preserveAlpha} onChange={(value) => actions.setSetting("textureTools.preserveAlpha", value)} />
          <Toggle label="Backup before workspace replacement" checked={settings.textureTools.backupBeforeReplace} onChange={(value) => actions.setSetting("textureTools.backupBeforeReplace", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Paths</div>
        <div className="formGrid">
          <Field label="Export directory" value={settings.exportDirectory} onChange={(value) => actions.setSetting("exportDirectory", value)} />
          <Field label="Project storage" value={settings.projectStorage} onChange={(value) => actions.setSetting("projectStorage", value)} />
          <Field label="DDS -> Image converter" value={settings.converterPaths.ddsToImage} onChange={(value) => actions.setSetting("converterPaths.ddsToImage", value)} />
          <Field label="Image -> DDS converter" value={settings.converterPaths.imageToDds} onChange={(value) => actions.setSetting("converterPaths.imageToDds", value)} />
          <Field label="Metadata inspector" value={settings.converterPaths.metadataInspector} onChange={(value) => actions.setSetting("converterPaths.metadataInspector", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Safety</div>
        <div className="toggleGrid">
          <Toggle label="Create backups before export" checked={settings.safety.createBackups} onChange={(value) => actions.setSetting("safety.createBackups", value)} />
          <Toggle label="Validate patch targets" checked={settings.safety.validatePatchTargets} onChange={(value) => actions.setSetting("safety.validatePatchTargets", value)} />
          <Toggle label="Block binary patches" checked={settings.safety.blockBinaryPatches} onChange={(value) => actions.setSetting("safety.blockBinaryPatches", value)} />
          <Toggle label="Require manifest" checked={settings.safety.requireManifest} onChange={(value) => actions.setSetting("safety.requireManifest", value)} />
          <Toggle label="Warn on texture metadata gaps" checked={settings.safety.warnTextureMetadata} onChange={(value) => actions.setSetting("safety.warnTextureMetadata", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Experimental</div>
        <div className="toggleGrid">
          <Toggle label="Image workflow integration" checked={settings.experimental.imageWorkflow} onChange={(value) => actions.setSetting("experimental.imageWorkflow", value)} />
          <Toggle label="Batch texture workflow" checked={settings.experimental.batchTextures} onChange={(value) => actions.setSetting("experimental.batchTextures", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="uppercaseLabel">Logging / Limits</div>
        <div className="toggleGrid">
          <Toggle label="Enable debug logging" checked={settings.logging.debugLogging} onChange={(value) => actions.setSetting("logging.debugLogging", value)} />
        </div>
        <div className="formGrid">
          <NumberField label="Log retention limit" value={settings.logging.retentionLimit} onChange={(value) => actions.setSetting("logging.retentionLimit", value)} />
          <NumberField label="Max preview bytes" value={settings.limits.maxPreviewBytes} onChange={(value) => actions.setSetting("limits.maxPreviewBytes", value)} />
          <NumberField label="Max scan bytes" value={settings.limits.maxScanBytes} onChange={(value) => actions.setSetting("limits.maxScanBytes", value)} />
          <NumberField label="Max line preview chars" value={settings.limits.maxLinePreviewChars} onChange={(value) => actions.setSetting("limits.maxLinePreviewChars", value)} />
          <NumberField label="Max scan results" value={settings.limits.maxScanResults} onChange={(value) => actions.setSetting("limits.maxScanResults", value)} />
          <NumberField label="Max prompt chars" value={settings.limits.maxPromptChars} onChange={(value) => actions.setSetting("limits.maxPromptChars", value)} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, placeholder, type = "text", onChange }: { label: string; value: string; placeholder?: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function NumberField({ label, value, step = 1, onChange }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggleRow">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
