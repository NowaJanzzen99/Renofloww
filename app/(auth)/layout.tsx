import Link from 'next/link';
import RenoflowwLogo from '@/components/RenoflowwLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10"
        style={{ backgroundColor: '#288760' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <RenoflowwLogo variant="icon" size="md" textColor="white" />
          <span className="font-bold text-xl text-white">Renofloww</span>
        </Link>

        {/* Tagline */}
        <div>
          <p className="text-4xl font-bold text-white leading-tight mb-4">
            Verbouw met<br />vertrouwen.
          </p>
          <p className="text-base mb-8" style={{ color: '#B7E5BA' }}>
            Budget, aannemers, offertes en planning — alles op één plek.
          </p>

          {/* Product preview — laat de echte app zien i.p.v. een quote */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ backgroundColor: '#F3F4F6' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
              <span className="ml-2 text-[11px]" style={{ color: '#9CA3AF' }}>renofloww.nl/dashboard</span>
            </div>
            <div className="p-5" style={{ background: 'linear-gradient(135deg, #1A5140 0%, #288760 50%, #5CA87C 100%)' }}>
              <p className="text-xs text-white/70 mb-1">Overzicht</p>
              <p className="text-base font-bold text-white mb-4">Badkamer renovatie</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Budget gebruikt', value: '64%' },
                  { label: 'Taken vandaag', value: '3' },
                  { label: 'Openst. offertes', value: '2' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                    <p className="text-[10px] text-white/70 mt-1 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <p className="text-[10px] text-white/80 mb-2 font-medium">Gantt planning</p>
                {[
                  { label: 'Sloop', pct: 100, done: true },
                  { label: 'Tegels', pct: 65, done: false },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                    <span className="text-white/70 text-[10px] w-10 shrink-0">{row.label}</span>
                    <div className="flex-1 rounded-full h-2.5 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.done ? '#5CA87C' : 'rgba(255,255,255,0.55)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="flex gap-6" style={{ color: '#B7E5BA' }}>
          <span className="text-sm">✓ Budget bijhouden</span>
          <span className="text-sm">✓ Aannemers beheren</span>
          <span className="text-sm">✓ AI assistent</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <RenoflowwLogo variant="icon" size="sm" />
            <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>Renofloww</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
