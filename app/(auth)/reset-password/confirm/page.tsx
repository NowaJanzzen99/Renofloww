'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [wachtwoord, setWachtwoord] = useState('');
  const [bevestiging, setBevestiging] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (wachtwoord.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.');
      return;
    }

    if (wachtwoord !== bevestiging) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: wachtwoord,
      });

      if (updateError) {
        setError('Er is iets misgegaan. Probeer opnieuw een reset link aan te vragen.');
        return;
      }

      router.push('/login?reset=success');
    } catch {
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>
          Nieuw wachtwoord instellen
        </h1>
        <p className="text-base" style={{ color: '#6B7280' }}>
          Kies een sterk nieuw wachtwoord voor je account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="wachtwoord" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Nieuw wachtwoord
          </label>
          <input
            id="wachtwoord"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Minimaal 8 tekens"
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

        <div>
          <label htmlFor="bevestiging" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Wachtwoord bevestigen
          </label>
          <input
            id="bevestiging"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Herhaal je wachtwoord"
            value={bevestiging}
            onChange={(e) => setBevestiging(e.target.value)}
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
          {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        <Link href="/login" className="font-medium" style={{ color: '#288760' }}>
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}
