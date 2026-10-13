/**
 * Skeletons — content-shaped loading placeholders (loading-states skill:
 * show the shape of what's coming instead of a spinner).
 *
 * <Skeleton className="h-4 w-40" />      — one block
 * <SkeletonCircle className="w-12 h-12" /> — avatar/icon shape
 * <SkeletonText lines={3} />              — paragraph stand-in
 * <SkeletonCard />                        — ProjectCard-shaped stand-in
 */
export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-11/12', 'w-4/5'];
  return (
    <div className={`space-y-2 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3.5 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonCircle({ className = 'w-12 h-12' }) {
  return <div className={`skeleton rounded-full ${className}`.trim()} aria-hidden="true" />;
}

/** Matches the ProjectCard aspect: image 4:3 + title + 2 meta lines + price row. */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-3 ${className}`.trim()} aria-hidden="true">
      <div className="skeleton rounded-lg w-full aspect-[4/3]" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton rounded-full w-11 h-11" />
      </div>
    </div>
  );
}
