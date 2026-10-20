'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/ErrorState';

export default function ListingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="We couldn’t load properties."
      message="Something went wrong on our side while fetching listings. Please try again in a moment."
      onRetry={reset}
    />
  );
}
