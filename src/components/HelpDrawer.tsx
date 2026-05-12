import { X } from "lucide-react";

const topics = [
  ["Project workspace", "Imported files are copied into a project workspace. Patches and texture outputs write only there."],
  ["Originals are never edited", "sourcePath and .rpf archives are read-only references. The app writes workspace, backups, reports, and exports only."],
  ["AI patch review", "AI returns JSON suggestions. You validate targets, review diffs, accept, then apply to workspace copies."],
  ["DDS workflow", "DDS converts to PNG preview. Manual or ComfyUI edits PNG. User reviews, then compiles PNG back to DDS."],
  ["RPF import", "Archives are browsed/extracted read-only. Extracted files enter normal workspace workflow."],
  ["Export packages", "Exports are manual packages with manifest, warnings, changelog, install notes, and backups."],
  ["OpenRouter setup", "Add API key/model in Settings only when using text AI."],
  ["texconv setup", "Set texconv path in Settings for DDS preview/compile."],
  ["ComfyUI setup", "Run local ComfyUI at 127.0.0.1:8188 and set checkpoint/sampler before generating PNG edits."],
  ["Troubleshooting", "Use Operation Center, warnings, and logs. Copy error details when reporting failures."]
];

export default function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <aside className="helpDrawer" aria-label="Help center">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Help Center</div>
          <h3>Safe Redux workflow</h3>
        </div>
        <button className="iconBtn" onClick={onClose} aria-label="Close help"><X size={16} /></button>
      </div>
      <div className="smallList">
        {topics.map(([title, body]) => (
          <div key={title} className="helpTopic">
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
