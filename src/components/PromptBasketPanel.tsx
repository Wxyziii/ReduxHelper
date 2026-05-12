import { Copy, Trash2 } from "lucide-react";
import { basketPrompt, estimatePromptSize } from "../lib/promptBasket";
import HelpBlock from "./ui/HelpBlock";
import type { PromptBasketItem } from "../types/promptBasket";

export default function PromptBasketPanel({ items, onRemove, onClear }: { items: PromptBasketItem[]; onRemove: (id: string) => void; onClear: () => void }) {
  const size = estimatePromptSize(items);
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="uppercaseLabel">Prompt Basket</div>
          <h3>{items.length} snippets / {size} chars</h3>
        </div>
        <div className="buttonRow">
          <button className="smallBtn" onClick={() => void navigator.clipboard?.writeText(basketPrompt(items))}><Copy size={14} /> Copy prompt</button>
          <button className="smallBtn danger" onClick={onClear}><Trash2 size={14} /> Clear</button>
        </div>
      </div>
      {size > 12000 && <div className="validation bad">Prompt basket large. Trim snippets before sending to AI.</div>}
      <HelpBlock title="Prompt Basket">
        <p>Selected snippets are grouped by file so AI receives focused context instead of whole project files. You control what gets copied into prompts.</p>
      </HelpBlock>
      <div className="snippetList">
        {items.map((item) => (
          <div key={item.snippetId} className="snippetRow basketRow">
            <span>{item.lineNumber}</span>
            <span className="mono">{item.filePath}</span>
            <span>{item.source}</span>
            <span>{item.linePreview}</span>
            <button className="iconBtn" onClick={() => onRemove(item.snippetId)}><Trash2 size={13} /></button>
          </div>
        ))}
        {!items.length && <div className="emptyMini">No snippets selected.</div>}
      </div>
    </section>
  );
}
