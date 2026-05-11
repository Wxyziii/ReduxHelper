import SectionPage from "./SectionPage";
import type { SectionActions } from "./SectionPage";
import type { ReduxProject } from "../types/project";

export default function OptimizationPage({ project, actions }: { project: ReduxProject; actions: SectionActions }) {
  return <SectionPage project={project} sectionId="optimization" mode="optimization" actions={actions} />;
}
