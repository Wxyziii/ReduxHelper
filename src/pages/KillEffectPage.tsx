import SectionPage from "./SectionPage";
import type { SectionActions } from "./SectionPage";
import type { ReduxProject } from "../types/project";

export default function KillEffectPage({ project, actions }: { project: ReduxProject; actions: SectionActions }) {
  return <SectionPage project={project} sectionId="killEffect" mode="kill" actions={actions} />;
}
