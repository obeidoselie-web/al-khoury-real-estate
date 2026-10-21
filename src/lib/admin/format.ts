import type { LeadKind } from '@/db/schema';

/** Formatting for the (English) admin UI. */

export const KIND_LABELS: Record<LeadKind, string> = {
  enquiry: 'Enquiry',
  viewing: 'Viewing',
  valuation: 'Valuation',
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export function formatUsd(amount: number, deal?: string): string {
  const value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  return deal === 'rent' ? `${value}/mo` : value;
}

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Beirut',
});

/** Absolute time in Beirut (the office's time zone). */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", else the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Beirut' }).format(
    new Date(iso),
  );
}

/**
 * International digits for tel:/wa.me links. Visitors often type local Lebanese numbers
 * ("03 123 456"), so a leading 0 becomes +961; "00" becomes "+".
 */
export function internationalDigits(phone: string, countryCode = '961'): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return countryCode + digits.slice(1);
  return digits;
}
