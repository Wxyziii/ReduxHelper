import {
  Activity,
  Bolt,
  Download,
  Gauge,
  Image,
  Search,
  LayoutDashboard,
  Settings,
  Skull,
  Sun,
  Target
} from "lucide-react";
import { sectionOrder } from "../data/mockSections";
import { getSectionStats } from "../lib/sectionStats";
import type { ReduxProject, SectionId } from "../types/project";

const icons: Record<SectionId, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  timecycle: Sun,
  tracers: Activity,
  hitEffects: Target,
  killEffect: Skull,
  optimization: Bolt,
  textures: Image,
  intelligence: Search,
  export: Download,
  settings: Settings
};

interface Props {
  project: ReduxProject;
  activePage: SectionId;
  setActivePage: (page: SectionId) => void;
}

export default function Sidebar({ project, activePage, setActivePage }: Props) {
  return (
    <aside className="sidebar">
      <div className="uppercaseLabel sideLabel">Workspace</div>
      {sectionOrder.map((id) => {
        const section = project.sections[id];
        const Icon = icons[id] ?? Gauge;
        const stats = getSectionStats(project, id);
        const badge = getBadge(stats);
        return (
          <button key={id} className={`navItem ${activePage === id ? "active" : ""}`} onClick={() => setActivePage(id)}>
            <Icon size={18} />
            <span>{section.name}</span>
            {badge && <span className={`badge ${badge.kind}`}>{badge.label}</span>}
          </button>
        );
      })}
    </aside>
  );
}

function getBadge(stats: ReturnType<typeof getSectionStats>) {
  if (stats.warnings > 0) return { kind: "warning", label: String(stats.warnings) };
  if (stats.accepted > 0) return { kind: "success", label: "Ready" };
  if (stats.suggestions > 0) return { kind: "ai", label: String(stats.suggestions) };
  if (stats.files > 0) return { kind: "count", label: String(stats.files) };
  return undefined;
}
