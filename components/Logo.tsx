import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  href?: string;
};

const sizes = {
  sm: { icon: "w-7 h-7", text: "text-lg", iconInner: "w-4 h-4" },
  md: { icon: "w-9 h-9", text: "text-xl", iconInner: "w-5 h-5" },
  lg: { icon: "w-12 h-12", text: "text-3xl", iconInner: "w-7 h-7" },
};

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const s = sizes[size];
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <div
        className={`${s.icon} rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-orange-600 transition-colors`}
      >
        <svg
          className={`${s.iconInner} text-white`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>
      <span className={`${s.text} font-bold tracking-tight`}>Renofloww</span>
    </Link>
  );
}
