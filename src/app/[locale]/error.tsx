'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/ErrorState';

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState variant="generic" onRetry={reset} />;
}
