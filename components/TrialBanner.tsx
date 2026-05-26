'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/types';

interface TrialBannerProps {
  profile: Profile;
}

export default function TrialBanner({ profile }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (profile.is_pro) return null;
  if (!profile.trial_ends_at) return null;

  const trialEnd = new Date(profile.trial_ends_at);
  const now = new Date();
  const isExpired = trialEnd <= now;

  if (isExpired) {
    // Show expired banner — cannot be dismissed, links to upgrade
    return (
      <div
        className="flex items-center justify-between px-4 py-2.5 text-sm border-b"
        style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderColor: '#FCA5A5' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Je proefperiode is <strong>verlopen</strong>. Upgrade om toegang te behouden.</span>
        </div>
        <Link
          href="/settings#abonnement"
          className="font-bold underline underline-offset-2 whitespace-nowrap ml-3"
        >
          Upgrade nu →
        </Link>
      </div>
    );
  }

  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const totalDays = 14;
  const pct = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));

  let bg: string;
  let textColor: string;
  let borderColor: string;
  let barColor: string;

  if (daysRemaining > 7) {
    bg = 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
    textColor = '#065F46';
    borderColor = '#6EE7B7';
    barColor = '#10B981';
  } else if (daysRemaining > 3) {
    bg = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    textColor = '#92400E';
    borderColor = '#FCD34D';
    barColor = '#F59E0B';
  } else {
    bg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
    textColor = '#991B1B';
    borderColor = '#FCA5A5';
    barColor = '#EF4444';
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-sm border-b"
      style={{ background: bg, color: textColor, borderColor }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="font-medium">
            Proefperiode: nog <strong>{daysRemaining} {daysRemaining === 1 ? 'dag' : 'dagen'}</strong>
          </span>
          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.15)', maxWidth: '200px' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <Link
          href="/settings#abonnement"
          className="font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          Upgrade
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Sluiten"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
