'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: wachtwoord,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Onjuist e-mailadres of wachtwoord. Probeer het opnieuw.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Je e-mailadres is nog niet bevestigd. Controleer je inbox.');
        } else {
          setError('Er is iets misgegaan. Probeer het opnieuw.');
        }
        setLoading(false);
        return;
      }

      // Loading blijft actief tot de navigatie naar /dashboard voltooid is —
      // anders springt de knop terug voordat de pagina daadwerkelijk overgaat.
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>
          Welkom terug
        </h1>
        <p className="text-base" style={{ color: '#6B7280' }}>
          Log in op je Renofloww account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="jan@voorbeeld.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none"
            style={{
              borderColor: '#E5E7EB',
              color: '#1A1A1A',
              backgroundColor: '#FFFFFF',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#288760')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="wachtwoord" className="block text-sm font-medium" style={{ color: '#1A1A1A' }}>
              Wachtwoord
            </label>
            <Link
              href="/reset-password"
              className="text-sm font-medium"
              style={{ color: '#288760' }}
            >
              Wachtwoord vergeten?
            </Link>
          </div>
          <input
            id="wachtwoord"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none"
            style={{
              borderColor: '#E5E7EB',
              color: '#1A1A1A',
              backgroundColor: '#FFFFFF',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#288760')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#288760' }}
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        Nog geen account?{' '}
        <Link href="/register" className="font-medium" style={{ color: '#288760' }}>
          Gratis registreren
        </Link>
      </p>
    </div>
  );
}
