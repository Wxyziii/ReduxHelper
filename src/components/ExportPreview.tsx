import type { ExportManifest } from "../types/project";

interface Props {
  manifest: ExportManifest;
  tree: string[];
}

export default function ExportPreview({ manifest, tree }: Props) {
  return (
    <div className="exportGrid">
      <div className="panel">
        <div className="uppercaseLabel">File Tree</div>
        <pre className="tree">{tree.join("\n")}</pre>
      </div>
      <div className="panel">
        <div className="uppercaseLabel">manifest.json preview</div>
        <pre className="manifest">{JSON.stringify(manifest, null, 2)}</pre>
      </div>
    </div>
  );
}
