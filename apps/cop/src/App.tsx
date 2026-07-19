import { useEffect, useState } from 'react';
import './App.css';
import './shell/shell.css';
import { UpdateBanner } from './components/UpdateBanner';
import { TabRail } from './shell/TabRail';
import { FEATURES } from './shell/features';
import { applyStoredMouseRemap } from './features/home/mouseRemap';

const DEFAULT_TAB = FEATURES.find((f) => f.enabled)?.id ?? FEATURES[0].id;

function App() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  // Вооружаем сохранённый ребинд мыши сразу на старте — иначе биндинги
  // начинали работать только после открытия модалки настроек.
  useEffect(() => {
    void applyStoredMouseRemap().catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <UpdateBanner />
      <TabRail activeTab={activeTab} onSelect={setActiveTab} />
      <div className="tab-content container">
        {/* Keep-mounted: вью с Component монтируются один раз и прячутся
            через hidden — session-state активной фичи не теряется при
            переключении. */}
        {FEATURES.filter((f) => f.Component).map((f) => {
          const View = f.Component!;
          return (
            <div key={f.id} hidden={f.id !== activeTab}>
              <View />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
