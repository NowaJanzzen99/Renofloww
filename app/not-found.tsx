import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagina niet gevonden',
  description: 'De pagina die je zoekt bestaat niet.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F8FAF9' }}>
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#288760' }}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xl font-bold" style={{ color: '#288760' }}>Renofloww</span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-black mb-4" style={{ color: '#288760' }}>404</h1>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#1A1A1A' }}>
          Pagina niet gevonden
        </h2>
        <p className="text-base mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
          De pagina die je zoekt bestaat niet of is verplaatst.
          Ga terug naar het dashboard om verder te gaan met je verbouwing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#288760' }}
          >
            Naar dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            Naar startpagina
          </Link>
        </div>
      </div>
    </div>
  );
}
