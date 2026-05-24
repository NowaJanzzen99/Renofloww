type Project = {
  id: number;
  name: string;
  description: string;
  status: "Planning" | "In Progress" | "On Hold" | "Completed";
  progress: number;
  budget: string;
  spent: string;
  due: string;
  contractors: number;
};

const projects: Project[] = [
  {
    id: 1,
    name: "Kitchen Remodel",
    description: "Full gut renovation including new cabinets, countertops, appliances, and flooring.",
    status: "In Progress",
    progress: 62,
    budget: "$32,000",
    spent: "$19,840",
    due: "Jul 15, 2025",
    contractors: 3,
  },
  {
    id: 2,
    name: "Master Bath Renovation",
    description: "Walk-in shower, double vanity, heated floors, and new tile throughout.",
    status: "In Progress",
    progress: 28,
    budget: "$18,500",
    spent: "$5,180",
    due: "Sep 3, 2025",
    contractors: 2,
  },
  {
    id: 3,
    name: "Basement Finishing",
    description: "Convert unfinished basement into a family room, home office, and half bath.",
    status: "Planning",
    progress: 5,
    budget: "$34,000",
    spent: "$1,700",
    due: "Nov 20, 2025",
    contractors: 1,
  },
];

const statusStyle: Record<Project["status"], string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Planning: "bg-stone-100 text-stone-600",
  Completed: "bg-green-100 text-green-700",
  "On Hold": "bg-amber-100 text-amber-700",
};

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Projects</h1>
          <p className="text-stone-500 mt-1">Manage all your renovation projects.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["All", "In Progress", "Planning", "On Hold", "Completed"].map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              f === "All"
                ? "bg-orange-500 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-stone-900 leading-snug">{p.name}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyle[p.status]}`}>
                {p.status}
              </span>
            </div>

            <p className="text-sm text-stone-500 leading-relaxed">{p.description}</p>

            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                <span>Progress</span>
                <span className="font-medium text-stone-700">{p.progress}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div
                  className="bg-orange-400 h-2 rounded-full transition-all"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Budget</p>
                <p className="text-sm font-semibold text-stone-800">{p.budget}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Spent</p>
                <p className="text-sm font-semibold text-stone-800">{p.spent}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Due</p>
                <p className="text-sm font-semibold text-stone-800">{p.due}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {p.contractors} contractor{p.contractors !== 1 ? "s" : ""}
              </div>
              <button className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                View details →
              </button>
            </div>
          </div>
        ))}

        {/* New project placeholder card */}
        <button className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-5 flex flex-col items-center justify-center gap-3 text-stone-400 hover:border-orange-300 hover:text-orange-400 transition-colors min-h-[220px]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Add new project</span>
        </button>
      </div>
    </div>
  );
}
