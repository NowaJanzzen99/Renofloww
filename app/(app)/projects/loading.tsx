export default function ProjectsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 rounded w-40" style={{ backgroundColor: '#F3F4F6' }} />
        <div className="h-10 rounded-xl w-36" style={{ backgroundColor: '#F3F4F6' }} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
        ))}
      </div>
    </div>
  );
}
