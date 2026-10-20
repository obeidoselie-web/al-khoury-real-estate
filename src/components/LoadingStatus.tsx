'use client';

import { useI18n } from '@/i18n/I18nProvider';

/** Localised status text for loading.tsx files (which don't receive route params). */
export function LoadingStatus({ what, className }: { what: 'listings' | 'property'; className?: string }) {
  const { t } = useI18n();
  return (
    <p className={className ?? 'sr-only'} role="status">
      {what === 'listings' ? t.listings.loading : t.property.loading}
    </p>
  );
}

export function LoadingTitle({ className }: { className?: string }) {
  const { t } = useI18n();
  return <h1 className={className}>{t.listings.title}</h1>;
}
