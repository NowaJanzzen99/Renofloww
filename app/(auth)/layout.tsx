import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-500 flex-col justify-between p-10">
        <Logo size="md" href="/" />
        <div className="text-white">
          <blockquote className="text-2xl font-medium leading-relaxed mb-4">
            "Finally, one place to manage our kitchen reno — budgets, contractors, everything."
          </blockquote>
          <p className="text-orange-200 font-medium">Sarah M., Happy Homeowner</p>
        </div>
        <div className="flex gap-6 text-orange-200 text-sm">
          <span>Track budgets</span>
          <span>Manage contractors</span>
          <span>Hit deadlines</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="lg:hidden mb-8">
          <Logo size="md" href="/" />
        </div>
        {children}
      </div>
    </div>
  );
}
