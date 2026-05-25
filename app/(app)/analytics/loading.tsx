export default function AnalyticsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-8 rounded w-48" style={{ backgroundColor: '#F3F4F6' }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
      </div>
      <div className="h-64 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
    </div>
  );
}
