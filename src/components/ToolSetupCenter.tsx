import StatusPill from "./ui/StatusPill";
import type { ReduxProject, SectionId } from "../types/project";

export default function ToolSetupCenter({ project, onOpenSettings }: { project: ReduxProject; onOpenSettings: (page: SectionId) => void }) {
  const cards = [
    { name: "OpenRouter", status: project.settings.apiKey ? "configured" : "optional", tone: project.settings.apiKey ? "success" : "warning", use: "Text AI suggestions", setup: "Add API key and model in Settings." },
    { name: "texconv", status: project.settings.textureTools.converterPath ? "configured" : "missing", tone: project.settings.textureTools.converterPath ? "success" : "warning", use: "DDS to PNG and PNG to DDS", setup: "Install Microsoft texconv and set path." },
    { name: "ComfyUI", status: project.settings.imageAi.provider === "comfyui" ? "configured" : "optional", tone: project.settings.imageAi.provider === "comfyui" ? "success" : "count", use: "Local PNG texture edits", setup: "Run local ComfyUI and set URL/checkpoint." },
    { name: "Export folder", status: project.settings.exportDirectory ? "configured" : "missing", tone: project.settings.exportDirectory ? "success" : "warning", use: "Manual export packages", setup: "Project exports folder is used by default." },
    { name: "Logging", status: project.settings.logging.debugLogging ? "debug on" : "normal", tone: "count", use: "Diagnostics and troubleshooting", setup: "Enable debug logging only when needed." }
  ] as const;
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Tool Setup Center</div>
          <h3>Optional tools, clear status</h3>
        </div>
        <button className="smallBtn" onClick={() => onOpenSettings("settings")}>Open Settings</button>
      </div>
      <div className="toolGrid">
        {cards.map((card) => (
          <article key={card.name} className="toolCard">
            <div className="panelHeader"><strong>{card.name}</strong><StatusPill status={card.status} tone={card.tone as never} /></div>
            <p>{card.use}</p>
            <small>{card.setup}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
