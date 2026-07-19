import logo from '@img/logo.webp';
import { IconTab } from './IconTab';
import { FEATURES } from './features';

// Горизонтальная шапка сверху окна: бренд (логотип + название) слева,
// рельса icon-табов справа.
export function TabRail({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <header className="tab-rail">
      <div className="tab-rail__brand">
        <img className="tab-rail__logo" src={logo} alt="" aria-hidden />
        <span className="tab-rail__title">Mechs.COP</span>
      </div>
      <nav className="tab-rail__tabs" aria-label="Разделы COP">
        {FEATURES.map((f) => (
          <IconTab key={f.id} feature={f} active={f.id === activeTab} onSelect={onSelect} />
        ))}
      </nav>
    </header>
  );
}
