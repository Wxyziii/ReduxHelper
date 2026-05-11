import { useMemo, useState } from "react";
import { Check, ClipboardCopy, FileCheck, FileText, RotateCcw, X } from "lucide-react";
import AiHistoryPanel from "./AiHistoryPanel";
import { buildAiHistoryEntry } from "../lib/aiHistory";
import { buildAiPrompt, estimatePromptSize, makeSnippetId } from "../lib/aiPromptBuilder";
import { sendPromptToOpenRouter } from "../lib/openRouterClient";
import { validateAiResponseJson } from "../lib/aiResponseValidator";
import { saveAiResponseReport, savePromptReport } from "../lib/tauriApi";
import type { AiSuggestionStatus, SelectedSnippet, StructuredAiResponse } from "../types/ai";
import type { ProjectFile, ProjectSection, ReduxProject, SectionId } from "../types/project";

interface Props {
  project: ReduxProject;
  sectionId: SectionId;
  section: ProjectSection;
  files: ProjectFile[];
  onAiHistory: (entry: import("../types/ai").AiHistoryEntry) => void;
  onAiSuggestions: (sectionId: SectionId, response: StructuredAiResponse) => void;
}

type RequestState =
  | "Ready to send"
  | "Sending to OpenRouter"
  | "Response received"
  | "Validating response"
  | "Valid suggestions ready"
  | "Invalid JSON"
  | "Schema validation failed"
  | "API error"
  | "Saved to reports";

export default function AiWorkbench({ project, sectionId, section, files, onAiHistory, onAiSuggestions }: Props) {
  const snippets = useMemo(() => collectSnippets(files), [files]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(snippets.map((snippet) => snippet.id).slice(0, 6)));
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [validated, setValidated] = useState<StructuredAiResponse | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AiSuggestionStatus>>({});
  const [requestState, setRequestState] = useState<RequestState>("Ready to send");
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastResponseMs, setLastResponseMs] = useState<number | null>(null);
  const selectedSnippets = snippets.filter((snippet) => selectedIds.has(snippet.id));
  const selectedFiles = new Set(selectedSnippets.map((snippet) => snippet.filePath));
  const prompt = buildAiPrompt({ project, sectionId, section, files, selectedSnippets });
  const estimate = estimatePromptSize(prompt);

  function toggleSnippet(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyPrompt() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  }

  async function savePrompt() {
    await savePromptReport(project, sectionId, prompt);
    setRequestState("Saved to reports");
  }

  async function saveResponse() {
    if (responseText.trim()) {
      const report = [
        "# AI Response Report",
        "",
        "## Raw response",
        "```json",
        responseText,
        "```",
        "",
        "## Validation errors",
        errors.length ? errors.map((error) => `- ${error}`).join("\n") : "None",
        "",
        "## Validated response",
        validated ? `\`\`\`json\n${JSON.stringify(validated, null, 2)}\n\`\`\`` : "No valid response."
      ].join("\n");
      await saveAiResponseReport(project, sectionId, report);
      setRequestState("Saved to reports");
    }
  }

  function loadMock() {
    setResponseText(JSON.stringify(buildMockResponse(sectionId, files[0]), null, 2));
    setErrors([]);
  }

  function validate() {
    setRequestState("Validating response");
    const result = validateAiResponseJson(responseText, project.files);
    setErrors(result.errors);
    setValidated(result.ok && result.data ? result.data : null);
    if (result.ok && result.data) {
      setStatuses(Object.fromEntries(result.data.suggestions.map((suggestion) => [suggestion.id, "pending"])));
      setRequestState("Valid suggestions ready");
      onAiSuggestions(sectionId, result.data);
      onAiHistory(
        buildAiHistoryEntry({
          section: sectionId,
          model: project.settings.model,
          prompt,
          selectedFilePaths: Array.from(selectedFiles),
          selectedSnippetCount: selectedSnippets.length,
          rawResponseText: responseText,
          validationStatus: "valid",
          validationErrors: [],
          suggestionsCount: result.data.suggestions.length
        })
      );
    } else {
      setRequestState(responseText.trim().startsWith("{") || responseText.includes("```") ? "Schema validation failed" : "Invalid JSON");
      onAiHistory(
        buildAiHistoryEntry({
          section: sectionId,
          model: project.settings.model,
          prompt,
          selectedFilePaths: Array.from(selectedFiles),
          selectedSnippetCount: selectedSnippets.length,
          rawResponseText: responseText,
          validationStatus: "invalid",
          validationErrors: result.errors,
          suggestionsCount: 0
        })
      );
    }
  }

  async function sendToOpenRouter() {
    if (isSending) return;
    setApiError("");
    setIsSending(true);
    setRequestState("Sending to OpenRouter");
    try {
      const response = await sendPromptToOpenRouter(project.settings, prompt);
      setLastResponseMs(response.requestMs);
      if (!response.ok) {
        const error = response.error ?? "OpenRouter request failed.";
        setApiError(error);
        setRequestState("API error");
        onAiHistory(
          buildAiHistoryEntry({
            section: sectionId,
            model: response.modelUsed || project.settings.model,
            prompt,
            selectedFilePaths: Array.from(selectedFiles),
            selectedSnippetCount: selectedSnippets.length,
            rawResponseText: response.rawResponseText,
            validationStatus: "api_error",
            validationErrors: [error],
            suggestionsCount: 0
          })
        );
        return;
      }
      const text = response.assistantContent || response.rawResponseText;
      setResponseText(text);
      setRequestState("Response received");
      const validation = validateAiResponseJson(text, project.files);
      setErrors(validation.errors);
      setValidated(validation.ok && validation.data ? validation.data : null);
      if (validation.ok && validation.data) {
        setStatuses(Object.fromEntries(validation.data.suggestions.map((suggestion) => [suggestion.id, "pending"])));
        setRequestState("Valid suggestions ready");
        onAiSuggestions(sectionId, validation.data);
      } else {
        setRequestState("Schema validation failed");
      }
      onAiHistory(
        buildAiHistoryEntry({
          section: sectionId,
          model: response.modelUsed || project.settings.model,
          prompt,
          selectedFilePaths: Array.from(selectedFiles),
          selectedSnippetCount: selectedSnippets.length,
          rawResponseText: text,
          validationStatus: validation.ok ? "valid" : "invalid",
          validationErrors: validation.errors,
          suggestionsCount: validation.data?.suggestions.length ?? 0
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OpenRouter request failed.";
      setApiError(message);
      setRequestState("API error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">AI Prompt Builder</div>
          <h3>Snippets, prompt preview, and structured JSON validation</h3>
        </div>
        <div className="buttonRow">
          <button className="smallBtn" onClick={() => setShowPrompt((value) => !value)}><FileText size={14} /> {showPrompt ? "Hide prompt" : "Preview prompt"}</button>
          <button className="smallBtn" onClick={() => setSelectedIds(new Set())}><RotateCcw size={14} /> Clear selection</button>
        </div>
      </div>

      <div className="aiStats">
        <span>{selectedSnippets.length} snippets</span>
        <span>{selectedFiles.size} files</span>
        <span>{estimate.characters} chars</span>
        <span>{estimate.estimatedTokens} est. tokens</span>
        <span>{requestState}</span>
        {lastResponseMs !== null && <span>{lastResponseMs} ms</span>}
      </div>
      {apiError && <div className="validation bad">{apiError}</div>}
      {!project.settings.apiKey.trim() && <div className="validation bad">Missing API key. Add OpenRouter API key in Settings to send real requests. Mock response still works.</div>}

      <div className="snippetList">
        {snippets.map((snippet) => (
          <label key={snippet.id} className="snippetRow">
            <input type="checkbox" checked={selectedIds.has(snippet.id)} onChange={() => toggleSnippet(snippet.id)} />
            <span className="mono">{snippet.fileName}:{snippet.line}</span>
            <strong>{snippet.keyword}</strong>
            <span>{snippet.snippet}</span>
          </label>
        ))}
        {!snippets.length && <div className="emptyState">No scan snippets yet. Import readable files, then run Scan Project.</div>}
      </div>

      {showPrompt && (
        <div className="promptModal">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">Prompt Preview</div>
              <h3>Final prompt sent later to AI</h3>
            </div>
            <div className="buttonRow">
              <button className="smallBtn" onClick={copyPrompt}><ClipboardCopy size={14} /> {copied ? "Copied" : "Copy prompt"}</button>
              <button className="smallBtn" onClick={savePrompt}><FileCheck size={14} /> Save prompt</button>
              <button className="smallBtn success" disabled={isSending || !project.settings.apiKey.trim()} onClick={sendToOpenRouter}>
                {isSending ? "Sending..." : "Send to OpenRouter"}
              </button>
              <button className="smallBtn" onClick={loadMock}>Use mock AI response</button>
              <button className="smallBtn" onClick={() => setShowPrompt(false)}>Close</button>
            </div>
          </div>
          <pre className="promptPreview">{prompt}</pre>
        </div>
      )}

      <div className="split">
        <div className="panel nestedPanel">
          <div className="panelHeader">
            <div>
              <div className="uppercaseLabel">AI JSON Response</div>
              <h3>Paste or load mock response</h3>
            </div>
            <div className="buttonRow">
              <button className="smallBtn" onClick={loadMock}>Load mock response</button>
              <button className="smallBtn success" disabled={isSending || !project.settings.apiKey.trim()} onClick={sendToOpenRouter}>
                {isSending ? "Sending..." : "Send to OpenRouter"}
              </button>
              <button className="smallBtn" onClick={validate}><Check size={14} /> Validate</button>
              <button className="smallBtn" onClick={saveResponse}><FileCheck size={14} /> Save report</button>
            </div>
          </div>
          <textarea className="jsonInput" value={responseText} onChange={(event) => setResponseText(event.target.value)} placeholder="Paste structured AI JSON response here." />
          {!!errors.length && (
            <div className="validation bad">
              {errors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}
          {validated && <div className="validation ok">Valid response. {validated.suggestions.length} suggestions loaded.</div>}
        </div>

        <div className="panel nestedPanel">
          <div className="uppercaseLabel">Validated Suggestions</div>
          <div className="suggestionGrid">
            {validated?.suggestions.map((suggestion) => (
              <article key={suggestion.id} className="suggestionCard">
                <div className="suggestionTop">
                  <span className="mono muted">{suggestion.targetFilePath}</span>
                  <span className={`risk ${suggestion.risk}`}>{suggestion.risk} risk</span>
                </div>
                <h3>{suggestion.title}</h3>
                <p>{suggestion.reason}</p>
                <div className="aiStats compact">
                  <span>{suggestion.changeType}</span>
                  <span>{statuses[suggestion.id] ?? "pending"}</span>
                </div>
                {suggestion.testingNotes?.length ? <p className="muted">Testing: {suggestion.testingNotes.join(" ")}</p> : null}
                <div className="buttonRow">
                  <button className="smallBtn success" onClick={() => setStatuses((current) => ({ ...current, [suggestion.id]: "accepted" }))}><Check size={14} /> Accept</button>
                  <button className="smallBtn danger" onClick={() => setStatuses((current) => ({ ...current, [suggestion.id]: "rejected" }))}><X size={14} /> Reject</button>
                </div>
              </article>
            ))}
            {!validated && <div className="emptyState">Validate a pasted/mock AI response to show suggestion cards.</div>}
          </div>
        </div>
      </div>
      <AiHistoryPanel history={project.aiHistory ?? []} sectionId={sectionId} />
    </section>
  );
}

function collectSnippets(files: ProjectFile[]): SelectedSnippet[] {
  return files.flatMap((file) =>
    file.scanMatches.map((match) => ({
      id: makeSnippetId(file.relativePath, match.line, match.keyword),
      filePath: file.relativePath,
      fileName: file.fileName,
      fileType: file.extension,
      line: match.line,
      keyword: match.keyword,
      snippet: match.snippet,
      warnings: file.warnings
    }))
  );
}

function buildMockResponse(sectionId: SectionId, file?: ProjectFile): StructuredAiResponse {
  const targetFilePath = file?.relativePath ?? "missing-file.xml";
  const section = sectionId === "hitEffects" ? "hit_effects" : sectionId === "killEffect" ? "kill_effect" : sectionId;
  return {
    summary: "Mock structured response for review only. No patch is applied.",
    section: section as StructuredAiResponse["section"],
    suggestions: [
      {
        id: "suggestion-001",
        title: "Small reversible value adjustment",
        reason: "Targets one scanned line and keeps change easy to review.",
        risk: "low",
        targetFilePath,
        changeType: file?.status === "text-readable" ? "find_replace" : "manual_instruction",
        patch: file?.status === "text-readable" ? { find: "value=\"1.000\"", replace: "value=\"0.900\"" } : undefined,
        manualSteps: file?.status === "text-readable" ? [] : ["Review this binary/unsupported file in an external tool."],
        testingNotes: ["Test one file first.", "Compare before/after screenshots."]
      }
    ],
    warnings: ["Mock response only. User must review every suggestion."],
    testingChecklist: ["Launch game after manual import.", "Check section-specific visual behavior."]
  };
}
