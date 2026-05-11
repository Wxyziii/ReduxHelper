import SectionPage from "./SectionPage";
import type { SectionActions } from "./SectionPage";
import type { ReduxProject } from "../types/project";

export default function TracersPage({ project, actions }: { project: ReduxProject; actions: SectionActions }) {
  return <SectionPage project={project} sectionId="tracers" actions={actions} />;
}
