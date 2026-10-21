import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Never touch the developer's database: tests that need one call useTestDatabase() (tests/db.ts).
process.env.DATABASE_URL = 'file::memory:';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// next/navigation hooks need the App Router context, which isn't present in unit tests.
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/listings',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
