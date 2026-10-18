/**
 * StatusStamp — the classic rotated paper-stamp for a paused project.
 *   maintenance -> blue (info)      'UNDER MAINTENANCE'
 *   closed      -> red (danger)     'TEMPORARILY CLOSED'
 * Renders nothing for 'active' (that sneeze is handled by the call site).
 *
 *   <StatusStamp status={project.status} />              — inline stamp only
 *   <StatusStamp status={project.status} size="sm" />    — card-sized stamp
 *   <StatusStamp status={project.status} detail />       — stamp + one honest line
 */
const WORDS = {
  maintenance: 'Under maintenance',
  closed: 'Temporarily closed',
};
const DETAIL = {
  maintenance:
    'The team is refreshing this project\'s package. If you already own it, your downloads keep working — new sales reopen soon.',
  closed:
    'This project is temporarily closed — new purchases and downloads are paused. Check back soon.',
};

export default function StatusStamp({ status, size = 'md', detail = false }) {
  if (status !== 'maintenance' && status !== 'closed') return null;
  const tone = status === 'maintenance' ? 'stamp-maintenance' : 'stamp-closed';
  return (
    <div className={detail ? 'text-center' : 'inline-flex'}>
      <span className={`stamp ${tone} ${size === 'sm' ? 'stamp-sm' : ''}`} role="status">
        {WORDS[status].toUpperCase()}
      </span>
      {detail && (
        <p className="text-xs text-outline mt-4 max-w-sm mx-auto leading-relaxed">
          {DETAIL[status]}
        </p>
      )}
    </div>
  );
}
