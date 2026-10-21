'use client';

import { useTransition, type ReactNode } from 'react';

/**
 * A button that asks for confirmation, then runs a Server Action. Used for destructive steps;
 * it is rendered inside other forms, so it calls the action directly instead of submitting.
 */
export function ConfirmButton({
  action,
  message,
  className,
  children,
}: {
  action: () => Promise<void>;
  message: string;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (window.confirm(message)) startTransition(() => action());
      }}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
