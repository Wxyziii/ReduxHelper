import { useMemo, useState } from "react";
import { ClipboardPlus, FileSearch, RefreshCcw, Save, Search } from "lucide-react";
import FileRelationshipsPanel from "../components/FileRelationshipsPanel";
import PageHeader from "../components/PageHeader";
import PromptBasketPanel from "../components/PromptBasketPanel";
import WarningPanel from "../components/WarningPanel";
import { runProjectDiagnostics } from "../lib/projectDiagnostics";
import { buildProjectIndex } from "../lib/projectIndex";
import { addMatchesToBasket, mergeBasket, suggestSnippetsForSection } from "../lib/promptBasket";
import { searchProjectIndex } from "../lib/searchIndex";
import type { PromptBasketItem } from "../types/promptBasket";
import type { ReduxProject, SectionId } from "../types/project";

export default function IntelligencePage({
  project,
  actions
}: {
  project: ReduxProject;
  actions: {
    setActivePage?: (page: SectionId) => void;
    setPromptBasket: (items: PromptBasketItem[]) => void;
    saveIntelligenceReports: () => Promise<void>;
    revealInFileManager: (path: string) => Promise<void>;
    rescanProject: () => Promise<void>;
  };
}) {
  const [query, setQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [sectionSuggest, setSectionSuggest] = useState<SectionId>("timecycle");
  const index = useMemo(() => buildProjectIndex(project), [project]);
  const diagnostics = useMemo(() => runProjectDiagnostics(project), [project]);
  const { parsed, results } = useMemo(() => searchProjectIndex(index, project.files, query), [index, project.files, query]);
  const selected = project.files.find((file) => file.id === selectedFileId);

  const setBasket = (items: PromptBasketItem[]) => actions.setPromptBasket(items);

  return (
    <div className="page">
      <PageHeader
        title="Project Intelligence"
        description="Read-only global search, prompt basket, relationships, diagnostics, and project index reports."
        actions={
          <>
            <button className="actionBtn" onClick={actions.rescanProject}><RefreshCcw size={15} /> Rescan project</button>
            <button className="actionBtn filled" onClick={actions.saveIntelligenceReports}><Save size={15} /> Save intelligence reports</button>
          </>
        }
      />

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Global Search</div>
            <h3>{results.length} results</h3>
          </div>
          <Search size={16} />
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='section:timecycle ext:xml "sky intensity" warning:true' />
        {parsed.errors.length > 0 && <WarningPanel title="Query errors" warnings={parsed.errors} />}
        <div className="aiStats">
          <span>{index.length} indexed files</span>
          <span>{index.filter((item) => item.readable).length} readable</span>
          <span>{index.filter((item) => item.exportEligible).length} export-ready</span>
          <span>{diagnostics.length} diagnostics</span>
        </div>
      </section>

      <div className="intelligenceGrid">
        <section className="panel">
          <div className="uppercaseLabel">Search Results</div>
          <div className="fileTable">
            {results.map((result) => (
              <button key={result.entry.fileId} className={`fileRow ${selectedFileId === result.entry.fileId ? "selected" : ""}`} onClick={() => setSelectedFileId(result.entry.fileId)}>
                <span className="mono">{result.entry.fileName}</span>
                <span>{result.entry.intendedGameRelativePath}</span>
                <span className="chip">{result.entry.extension}</span>
                <span>{result.entry.fileType}</span>
                <span>{result.entry.section}</span>
                <span>{result.entry.warnings.length}</span>
              </button>
            ))}
            {!results.length && <div className="emptyMini">No matches. Try `path:common`, `ext:dds`, `warning:true`, or plain keywords.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="uppercaseLabel">File Details</div>
          {selected ? (
            <>
              <div className="pathGrid">
                <span>Name</span><strong>{selected.fileName}</strong>
                <span>Path</span><strong>{selected.relativePath}</strong>
                <span>Status</span><strong>{selected.status}</strong>
                <span>Warnings</span><strong>{selected.warnings.length}</strong>
              </div>
              <div className="buttonRow">
                <button className="smallBtn" onClick={() => setBasket(addMatchesToBasket(project.promptBasket ?? [], project.files, selected.id))}><ClipboardPlus size={14} /> Add snippets</button>
                <button className="smallBtn" onClick={() => void actions.revealInFileManager(selected.workspacePath ?? selected.relativePath)}><FileSearch size={14} /> Reveal</button>
              </div>
              <div className="snippetList">
                {selected.scanMatches.slice(0, 12).map((match) => (
                  <div key={`${match.line}-${match.keyword}`} className="snippetRow">
                    <span>{match.line}</span><span>{match.keyword}</span><span>{selected.section}</span><span>{match.snippet}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="emptyMini">Select file.</div>}
        </section>
      </div>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="uppercaseLabel">Smart Snippet Suggestions</div>
            <h3>Rules-based, read-only</h3>
          </div>
          <div className="buttonRow">
            <select className="sectionSelect" value={sectionSuggest} onChange={(event) => setSectionSuggest(event.target.value as SectionId)}>
              {Object.values(project.sections).filter((section) => !["dashboard", "export", "settings", "intelligence"].includes(section.id)).map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
            <button className="smallBtn" onClick={() => setBasket(mergeBasket(project.promptBasket ?? [], suggestSnippetsForSection(project, sectionSuggest)))}>Suggest snippets for AI</button>
          </div>
        </div>
      </section>

      <div className="intelligenceGrid">
        <PromptBasketPanel items={project.promptBasket ?? []} onRemove={(id) => setBasket((project.promptBasket ?? []).filter((item) => item.snippetId !== id))} onClear={() => setBasket([])} />
        <FileRelationshipsPanel project={project} fileId={selectedFileId} />
      </div>

      <section className="panel">
        <div className="uppercaseLabel">Diagnostics / Conflicts</div>
        {diagnostics.map((item) => (
          <div key={item.id} className={`validation ${item.severity === "critical" ? "bad" : "ok"}`}>
            {item.severity}: {item.reason} Affected: {item.affectedFiles.join(", ")}. Action: {item.suggestedAction}
          </div>
        ))}
        {!diagnostics.length && <div className="validation ok">No conflicts detected.</div>}
      </section>
    </div>
  );
}
