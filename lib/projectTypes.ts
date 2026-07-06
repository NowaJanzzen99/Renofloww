import type { ProjectType } from '@/types';

// Centrale bron voor alle ruimte/verbouwingstypes — gebruikt bij onboarding,
// project aanmaken en projectinstellingen, zodat deze niet uit elkaar lopen.
export const PROJECT_TYPES: { type: ProjectType; label: string; emoji: string }[] = [
  { type: 'badkamer', label: 'Badkamer', emoji: '🚿' },
  { type: 'keuken', label: 'Keuken', emoji: '🍳' },
  { type: 'woonkamer', label: 'Woonkamer', emoji: '🛋️' },
  { type: 'slaapkamer', label: 'Slaapkamer', emoji: '🛏️' },
  { type: 'zolder', label: 'Zolder', emoji: '🪜' },
  { type: 'kelder', label: 'Kelder', emoji: '🕳️' },
  { type: 'garage', label: 'Garage', emoji: '🚗' },
  { type: 'tuin', label: 'Tuin', emoji: '🌳' },
  { type: 'toilet', label: 'Toilet', emoji: '🚽' },
  { type: 'hal', label: 'Hal/Gang', emoji: '🚪' },
  { type: 'kantoor', label: 'Kantoor/Werkkamer', emoji: '💻' },
  { type: 'dak_gevel', label: 'Dak/Gevel', emoji: '🧱' },
  { type: 'berging', label: 'Berging/Schuur', emoji: '📦' },
  { type: 'gehele_woning', label: 'Gehele woning', emoji: '🏠' },
  { type: 'anders', label: 'Anders', emoji: '✏️' },
];

export const PROJECT_TYPE_EMOJI: Record<string, string> = Object.fromEntries(
  PROJECT_TYPES.map((t) => [t.type, t.emoji])
);

export const PROJECT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PROJECT_TYPES.map((t) => [t.type, t.label])
);
