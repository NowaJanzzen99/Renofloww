'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Metadata } from 'next';

export default function RegisterPage() {
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (wachtwoord.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: wachtwoord,
        options: {
          data: { name: naam },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Dit e-mailadres is al in gebruik. Probeer in te loggen.');
        } else {
          setError('Er is iets misgegaan. Probeer het opnieuw.');
        }
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
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Controleer je e-mail</h2>
        <p className="text-base mb-6" style={{ color: '#6B7280' }}>
          We hebben een bevestigingslink gestuurd naar <strong style={{ color: '#1A1A1A' }}>{email}</strong>.
          Klik op de link om je account te activeren.
        </p>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Geen e-mail ontvangen?{' '}
          <button
            onClick={() => setSuccess(false)}
            className="font-medium underline"
            style={{ color: '#288760' }}
          >
            Probeer opnieuw
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>
          Account aanmaken
        </h1>
        <p className="text-base" style={{ color: '#6B7280' }}>
          14 dagen gratis alle functies gebruiken. Geen creditcard vereist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="naam" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Volledige naam
          </label>
          <input
            id="naam"
            type="text"
            autoComplete="name"
            required
            placeholder="Jan Janssen"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
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
          <label htmlFor="wachtwoord" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Wachtwoord
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
          <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>Minimaal 8 tekens</p>
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
          {loading ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        Al een account?{' '}
        <Link href="/login" className="font-medium" style={{ color: '#288760' }}>
          Inloggen
        </Link>
      </p>
    </div>
  );
}
