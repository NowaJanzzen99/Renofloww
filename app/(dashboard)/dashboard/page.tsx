type StatCard = {
  label: string;
  value: string;
  sub: string;
  color: string;
};

const stats: StatCard[] = [
  { label: "Active Projects", value: "3", sub: "2 on schedule", color: "bg-orange-50 text-orange-600" },
  { label: "Total Budget", value: "$84,500", sub: "$61,200 spent", color: "bg-blue-50 text-blue-600" },
  { label: "Open Tasks", value: "17", sub: "5 due this week", color: "bg-amber-50 text-amber-600" },
  { label: "Contractors", value: "6", sub: "4 active now", color: "bg-green-50 text-green-600" },
];

const recentProjects = [
  { name: "Kitchen Remodel", status: "In Progress", progress: 62, budget: "$32,000", due: "Jul 15, 2025" },
  { name: "Master Bath Renovation", status: "In Progress", progress: 28, budget: "$18,500", due: "Sep 3, 2025" },
  { name: "Basement Finishing", status: "Planning", progress: 5, budget: "$34,000", due: "Nov 20, 2025" },
];

const statusColor: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Planning: "bg-stone-100 text-stone-600",
  Completed: "bg-green-100 text-green-700",
  "On Hold": "bg-amber-100 text-amber-700",
};

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Good morning, Jane</h1>
        <p className="text-stone-500 mt-1">Here&apos;s an overview of your renovation projects.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${s.color}`}>
              <span className="text-lg font-bold">{s.value[0]}</span>
            </div>
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-sm font-medium text-stone-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-stone-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Recent Projects</h2>
          <a href="/projects" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            View all
          </a>
        </div>
        <div className="divide-y divide-stone-100">
          {recentProjects.map((p) => (
            <div key={p.name} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <p className="font-medium text-stone-900 truncate">{p.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5">
                  <div
                    className="bg-orange-400 h-1.5 rounded-full"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-sm font-semibold text-stone-800">{p.budget}</p>
                <p className="text-xs text-stone-400">Due {p.due}</p>
              </div>
              <div className="text-sm font-medium text-stone-500 flex-shrink-0 w-10 text-right">
                {p.progress}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
