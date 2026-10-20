'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/ErrorState';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong."
      message="This page couldn’t be loaded. Please try again in a moment."
      onRetry={reset}
    />
  );
}
