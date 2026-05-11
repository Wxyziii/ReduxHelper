import { AlertTriangle, FileText, FolderInput, MoveRight } from "lucide-react";
import { sectionOrder } from "../data/mockSections";
import type { ProjectFile, SectionId } from "../types/project";

interface Props {
  files: ProjectFile[];
  selectedFileId?: string;
  onSelect: (id: string) => void;
  onImportFiles: () => Promise<void>;
  onImportFolder: () => Promise<void>;
  onSectionChange: (fileId: string, section: SectionId) => void;
}

export default function FileList({ files, selectedFileId, onSelect, onImportFiles, onImportFolder, onSectionChange }: Props) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Files</div>
          <h3>Project-local copies</h3>
        </div>
        <div className="buttonRow">
          <button className="smallBtn" onClick={onImportFolder}><FolderInput size={14} /> Import folder</button>
          <button className="smallBtn" onClick={onImportFiles}><FileText size={14} /> Import files</button>
        </div>
      </div>
      <div className="dropzone">Imported files are copied into the project workspace. Original files are never modified.</div>
      <div className="fileTable">
        <div className="fileRow fileHead">
          <span>Name</span><span>Relative path</span><span>Type</span><span>Status</span><span>Section</span><span>Warnings</span>
        </div>
        {!files.length && <div className="emptyState">No files imported for this section yet.</div>}
        {files.map((file) => (
          <button key={file.id} className={`fileRow ${selectedFileId === file.id ? "selected" : ""}`} onClick={() => onSelect(file.id)}>
            <span className="mono">{file.fileName}</span>
            <span>{file.relativePath}</span>
            <span className="chip">{file.extension}</span>
            <span>{file.status}<MoveRight size={12} /></span>
            <span onClick={(event) => event.stopPropagation()}>
              <select className="sectionSelect" value={file.section} onChange={(event) => onSectionChange(file.id, event.target.value as SectionId)}>
                {sectionOrder.filter((id) => !["dashboard", "export", "settings"].includes(id)).map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </span>
            <span>{file.warnings.length ? <><AlertTriangle size={13} /> {file.warnings.length}</> : "0"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
