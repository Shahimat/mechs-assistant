export type TooltipAlign = 'left' | 'center' | 'right';

export function Tooltip({
  title,
  description,
  visible,
  align = 'center',
}: {
  title: string;
  description: string;
  visible: boolean;
  align?: TooltipAlign;
}) {
  if (!visible) return null;
  return (
    <div className={`cop-tooltip cop-tooltip--${align}`} role="tooltip">
      <div className="cop-tooltip__title">{title}</div>
      <div className="cop-tooltip__desc">{description}</div>
    </div>
  );
}
