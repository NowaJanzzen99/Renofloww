'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function TrialExpiredGate() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't block settings or auth pages
    if (pathname.startsWith('/settings') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
      setShow(false);
      return;
    }

    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (!profile || profile.is_pro) return;

      if (!profile.trial_ends_at || new Date(profile.trial_ends_at) <= new Date()) {
        setShow(true);
      } else {
        setShow(false);
      }
    };
    check();
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 text-center shadow-2xl"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' }}
        >
          ⏰
        </div>

        <h2 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>
          Proefperiode verlopen
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B7280' }}>
          Je gratis proefperiode van 14 dagen is afgelopen. Upgrade naar Renofloww Pro om toegang te behouden tot al je projecten, taken en de AI assistent.
        </p>

        {/* Upgrade buttons */}
        <div className="space-y-3 mb-6">
          <Link
            href="/settings#abonnement"
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1a5140 0%, #288760 100%)', boxShadow: '0 4px 16px rgba(40,135,96,0.35)' }}
          >
            <span>Pro maandelijks</span>
            <span className="text-base">€9,99/mnd →</span>
          </Link>
          <Link
            href="/settings#abonnement"
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-sm font-semibold border-2"
            style={{ borderColor: '#288760', color: '#288760' }}
          >
            <span>Jaarlijks <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>2 mnd gratis</span></span>
            <span className="text-base">€79/jaar →</span>
          </Link>
        </div>

        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Je data blijft 30 dagen bewaard.{' '}
          <Link href="/settings" className="underline">Instellingen</Link>
        </p>
      </div>
    </div>
  );
}
