import { IconTab } from './IconTab';
import { FEATURES } from './features';

// Горизонтальная рельса icon-табов сверху окна.
export function TabRail({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="tab-rail" aria-label="Разделы COP">
      {FEATURES.map((f) => (
        <IconTab key={f.id} feature={f} active={f.id === activeTab} onSelect={onSelect} />
      ))}
    </nav>
  );
}
