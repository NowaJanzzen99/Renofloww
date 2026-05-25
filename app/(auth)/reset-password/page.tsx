'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (resetError) {
        setError('Er is iets misgegaan. Controleer je e-mailadres en probeer opnieuw.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: '#B7E5BA' }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
          Controleer je e-mail
        </h2>
        <p className="text-base mb-6" style={{ color: '#6B7280' }}>
          We hebben een wachtwoord-reset link gestuurd naar{' '}
          <strong style={{ color: '#1A1A1A' }}>{email}</strong>.
          Klik op de link om je wachtwoord opnieuw in te stellen.
        </p>
        <Link href="/login" className="text-sm font-medium" style={{ color: '#288760' }}>
          Terug naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>
          Wachtwoord vergeten?
        </h1>
        <p className="text-base" style={{ color: '#6B7280' }}>
          Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
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
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#288760' }}
        >
          {loading ? 'Versturen...' : 'Reset link versturen'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        Wachtwoord toch nog weten?{' '}
        <Link href="/login" className="font-medium" style={{ color: '#288760' }}>
          Inloggen
        </Link>
      </p>
    </div>
  );
}
