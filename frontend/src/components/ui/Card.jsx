/**
 * Card — content enclosure (law-of-common-region: grouped by border+padding,
 * not shadows). Set `interactive` for clickable cards — hover becomes
 * border + one-step-lighter fill, nothing else (no glow, no scale).
 */
export default function Card({ interactive = false, padding = 'p-6', className = '', children, ...props }) {
  const base = interactive ? 'card-interactive' : 'card';
  return (
    <div className={`${base} ${padding} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
