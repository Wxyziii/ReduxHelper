import { RotateCcw } from "lucide-react";
import { getDiffLines } from "../lib/patchApplier";
import type { PatchSuggestion, ProjectFile } from "../types/project";

interface Props {
  file?: ProjectFile;
  patch?: PatchSuggestion;
}

export default function DiffViewer({ file, patch }: Props) {
  if (!file || !patch) {
    return <div className="emptyState">Select AI suggestion to review diff.</div>;
  }

  if (!file.preview) {
    return <div className="emptyState">Selected file has no text preview. Binary and DDS files need manual/external workflow.</div>;
  }

  const lines = getDiffLines(file.preview ?? "", patch);

  return (
    <div className="panel diffPanel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Diff Review</div>
          <h3>{patch.summary}</h3>
        </div>
        <button className="smallBtn"><RotateCcw size={14} /> Restore original</button>
      </div>
      <div className="diffMeta">
        <span>{patch.filePath}</span>
        <span>{patch.validation.ok ? "Validation passed" : "Validation failed"}</span>
        <span>Patch type: {patch.patchType}</span>
      </div>
      <div className="diffGrid">
        <div className="diffCol">
          <div className="uppercaseLabel">Original copy</div>
          {lines.map((line) => <pre key={`o-${line.line}`} className={line.changed ? "removed" : ""}><span>{line.line}</span>{line.original}</pre>)}
        </div>
        <div className="diffCol">
          <div className="uppercaseLabel">Edited copy</div>
          {lines.map((line) => <pre key={`e-${line.line}`} className={line.changed ? "added" : ""}><span>{line.line}</span>{line.edited}</pre>)}
        </div>
      </div>
    </div>
  );
}
