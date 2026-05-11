import SectionPage from "./SectionPage";
import type { SectionActions } from "./SectionPage";
import type { ReduxProject } from "../types/project";

export default function HitEffectsPage({ project, actions }: { project: ReduxProject; actions: SectionActions }) {
  return <SectionPage project={project} sectionId="hitEffects" actions={actions} />;
}
