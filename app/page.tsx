import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-5">
          Your renovation,{" "}
          <span className="text-orange-500">organized.</span>
        </h1>
        <p className="text-stone-500 text-xl leading-relaxed mb-10">
          Track contractors, budgets, timelines, and tasks — all in one place,
          built for homeowners.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white border border-stone-200 rounded-xl font-semibold hover:bg-stone-100 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
