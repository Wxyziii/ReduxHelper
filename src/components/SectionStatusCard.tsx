import { ArrowRight } from "lucide-react";
import { getSectionStats } from "../lib/sectionStats";
import type { ReduxProject, SectionId } from "../types/project";

interface Props {
  project: ReduxProject;
  sectionId: SectionId;
  onOpen?: (section: SectionId) => void;
}

export default function SectionStatusCard({ project, sectionId, onOpen }: Props) {
  const section = project.sections[sectionId];
  const stats = getSectionStats(project, sectionId);

  return (
    <button className="sectionCard" onClick={() => onOpen?.(sectionId)}>
      <div>
        <div className="sectionCardHead">
          <h3>{section.name}</h3>
          <ArrowRight size={16} />
        </div>
        <p>{section.description}</p>
      </div>
      <div className="metricGrid mini">
        <div><strong>{stats.files}</strong><span>files</span></div>
        <div><strong>{stats.suggestions}</strong><span>AI</span></div>
        <div><strong>{stats.accepted}</strong><span>accepted</span></div>
        <div><strong>{stats.warnings}</strong><span>warnings</span></div>
      </div>
    </button>
  );
}
