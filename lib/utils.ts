import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format a number as Dutch currency: €1.234,56
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string as Dutch date: 12 januari 2025
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format a date as short Dutch: 12 jan 2025
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Returns relative time in Dutch: "2 uur geleden", "gisteren", etc.
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Zojuist';
  if (diffMins < 60) return `${diffMins} minuten geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return formatDateShort(dateString);
}

/**
 * Returns Dutch greeting based on current hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

/**
 * Calculate days between two dates
 */
export function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate percentage, capped at 100
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}
