import PageHeader from "../components/PageHeader";
import type { ReduxProject } from "../types/project";

interface Props {
  project: ReduxProject;
  actions: {
    setSetting: (path: string, value: string | boolean | number) => void;
  };
}

export default function SettingsPage({ project, actions }: Props) {
  const settings = project.settings;

  return (
    <div className="page settingsPage">
      <PageHeader title="Settings" description="Local app settings for OpenRouter, model, converter paths, export paths, and safety flags." />

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
