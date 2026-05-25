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

  if (trialEnd <= now) return null;

  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let bg: string;
  let textColor: string;
  let borderColor: string;

  if (daysRemaining > 7) {
    bg = 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
    textColor = '#065F46';
    borderColor = '#6EE7B7';
  } else if (daysRemaining > 3) {
    bg = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    textColor = '#92400E';
    borderColor = '#FCD34D';
  } else {
    bg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
    textColor = '#991B1B';
    borderColor = '#FCA5A5';
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-sm border-b"
      style={{ background: bg, color: textColor, borderColor }}
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">
          Je proefperiode loopt over <strong>{daysRemaining} {daysRemaining === 1 ? 'dag' : 'dagen'}</strong> af.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings#abonnement"
          className="font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          Upgrade naar Pro
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
