import Link from 'next/link';

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base bg-white/20">
            R
          </div>
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

          {/* Testimonial */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <blockquote className="text-base font-medium text-white leading-relaxed mb-3">
              "Eindelijk heb ik overzicht over mijn verbouwing. De budget tracker heeft me al twee keer behoed voor overschrijdingen."
            </blockquote>
            <p className="text-sm" style={{ color: '#B7E5BA' }}>— Marieke de Vries, Amsterdam · Badkamer renovatie</p>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#288760' }}>
              R
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>Renofloww</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
