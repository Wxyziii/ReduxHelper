import { workflows } from "../../data/workflows";
import type { SectionId } from "../../types/project";

export default function WorkflowGuide({ currentPage, onOpen }: { currentPage?: SectionId; onOpen: (page: SectionId) => void }) {
  const visible = currentPage ? workflows.filter((workflow) => workflow.page === currentPage).slice(0, 2) : workflows.slice(0, 4);
  return (
    <section className="panel">
      <div className="uppercaseLabel">Guided Workflows</div>
      <div className="workflowGrid">
        {visible.map((workflow) => (
          <article key={workflow.id} className="workflowCard">
            <h3>{workflow.title}</h3>
            <ol>{workflow.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            <div className="infoStrip">{workflow.safetyNote}</div>
            <button className="smallBtn" onClick={() => onOpen(workflow.page)}>Open related page</button>
          </article>
        ))}
      </div>
    </section>
  );
}
