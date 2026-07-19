import { useRef, useState } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Tooltip, type TooltipAlign } from '@/shell/Tooltip';

const HOVER_DELAY_MS = 350;
const TOOLTIP_HALF = 130;

type Variant = 'default' | 'accent' | 'danger';

// Icon-only кнопка-действие главной (минимализм): иконка или webp-логотип,
// подпись/описание — в тултипе по hover (переиспользуется shell Tooltip).
// Недоступность через aria-disabled, не через disabled-атрибут (он глушит
// hover-события, тултип бы не показывался).
export function HomeIconButton({
  title,
  description,
  onClick,
  disabled = false,
  busy = false,
  variant = 'default',
  icon: Icon,
  imgSrc,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: Variant;
  icon?: LucideIcon;
  imgSrc?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [align, setAlign] = useState<TooltipAlign>('center');
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const cls = ['home-icon-btn', `home-icon-btn--${variant}`, disabled && 'home-icon-btn--disabled']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="home-icon-btn-wrap" ref={wrapRef} onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className={cls}
        aria-label={title}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) onClick();
        }}
        onFocus={() => {
          updateAlign();
          setHovered(true);
        }}
        onBlur={() => setHovered(false)}
      >
        {busy ? (
          <Loader2 className="home-icon-btn__spin" size={22} aria-hidden />
        ) : imgSrc ? (
          <img className="home-icon-btn__img" src={imgSrc} alt="" aria-hidden />
        ) : Icon ? (
          <Icon size={22} strokeWidth={2} aria-hidden />
        ) : null}
      </button>
      <Tooltip title={title} description={description} visible={hovered} align={align} />
    </div>
  );
}
