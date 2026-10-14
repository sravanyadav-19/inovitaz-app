/**
 * AdminSkeleton — shared loading shape for admin views (loading-states:
 * show the shape of what's coming, never a spine-only spinner).
 * type="stats" -> the 4 metric tiles + recent-orders block
 * type="table" (default) -> a header bar + N table-row blocks
 */
export default function AdminSkeleton({ type = 'table', rows = 6 }) {
  if (type === 'stats') {
    return (
      <div className="space-y-8" aria-hidden="true">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-6 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-6 w-24" />
              </div>
              <div className="skeleton w-12 h-12 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-4">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true">
      <div className="flex justify-between items-center mb-6">
        <div className="skeleton h-6 w-44" />
        <div className="skeleton h-11 w-36 rounded-xl" />
      </div>
      <div className="card p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
            </div>
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
