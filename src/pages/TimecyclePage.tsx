import SectionPage from "./SectionPage";
import type { SectionActions } from "./SectionPage";
import type { ReduxProject } from "../types/project";

export default function TimecyclePage({ project, actions }: { project: ReduxProject; actions: SectionActions }) {
  return <SectionPage project={project} sectionId="timecycle" actions={actions} />;
}
