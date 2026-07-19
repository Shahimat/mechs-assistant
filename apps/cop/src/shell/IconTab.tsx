import { useRef, useState } from 'react';
import { Tooltip, type TooltipAlign } from './Tooltip';
import type { FeatureTab } from './features';

const HOVER_DELAY_MS = 350;
const TOOLTIP_HALF = 140;

// Квадратная беведённая icon-кнопка рельсы. Активная — «вдавлена» +
// янтарная подсветка. Disabled-плейсхолдер (enabled=false) не кликается,
// но тултип показывает. Тултип не через disabled-атрибут (он глушит
// hover-события), а через aria-disabled + класс.
export function IconTab({
  feature,
  active,
  onSelect,
}: {
  feature: FeatureTab;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [align, setAlign] = useState<TooltipAlign>('center');
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = feature.icon;

  function updateAlign() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const center = r.left + r.width / 2;
    if (center - TOOLTIP_HALF < 8) setAlign('left');
    else if (center + TOOLTIP_HALF > window.innerWidth - 8) setAlign('right');
    else setAlign('center');
  }

  function show() {
    timerRef.current = setTimeout(() => {
      updateAlign();
      setHovered(true);
    }, HOVER_DELAY_MS);
  }
  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHovered(false);
  }

  const disabled = !feature.enabled;
  const cls = ['icon-tab', active && 'icon-tab--active', disabled && 'icon-tab--disabled']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="icon-tab-wrap" ref={wrapRef} onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className={cls}
        aria-disabled={disabled}
        aria-current={active}
        aria-label={feature.label}
        onClick={() => {
          if (!disabled) onSelect(feature.id);
        }}
        onFocus={() => {
          updateAlign();
          setHovered(true);
        }}
        onBlur={() => setHovered(false)}
      >
        <Icon size={22} strokeWidth={2} aria-hidden />
      </button>
      <Tooltip
        title={feature.label + (disabled ? ' — скоро' : '')}
        description={feature.tooltip}
        visible={hovered}
        align={align}
      />
    </div>
  );
}
