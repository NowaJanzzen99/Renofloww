export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Greeting skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 rounded w-64" style={{ backgroundColor: '#E5E7EB' }} />
        <div className="h-4 rounded w-40 mt-2" style={{ backgroundColor: '#E5E7EB' }} />
      </div>

      {/* Stats skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-white border animate-pulse" style={{ borderColor: '#E5E7EB' }}>
            <div className="h-3 rounded w-1/2 mb-4" style={{ backgroundColor: '#F3F4F6' }} />
            <div className="h-8 rounded w-1/3" style={{ backgroundColor: '#F3F4F6' }} />
          </div>
        ))}
      </div>

      {/* Content skeletons */}
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6 bg-white border animate-pulse" style={{ borderColor: '#E5E7EB' }}>
            <div className="h-5 rounded w-1/3 mb-4" style={{ backgroundColor: '#F3F4F6' }} />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-4 rounded" style={{ backgroundColor: '#F3F4F6' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
