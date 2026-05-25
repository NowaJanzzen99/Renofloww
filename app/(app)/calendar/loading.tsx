export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 rounded w-48" style={{ backgroundColor: '#F3F4F6' }} />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-xl" style={{ backgroundColor: '#F3F4F6' }} />
          <div className="h-9 w-20 rounded-xl" style={{ backgroundColor: '#F3F4F6' }} />
          <div className="h-9 w-9 rounded-xl" style={{ backgroundColor: '#F3F4F6' }} />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl" style={{ backgroundColor: '#F3F4F6' }} />
        ))}
      </div>
    </div>
  );
}
