import { readFileSync } from 'node:fs';
import path from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark, MARK_LINE_PATH, MARK_SOLID_PATH } from '@/components/BrandMark';
import { Wordmark } from '@/components/Wordmark';
import { getDictionary } from '@/i18n/dictionaries';

const root = path.resolve(__dirname, '..');

describe('brand', () => {
  it('generated icons use the same path data as the BrandMark component', () => {
    // Fails if the mark changes without re-running `npm run brand`.
    for (const file of ['src/app/icon.svg', 'public/brand/mark.svg']) {
      const svg = readFileSync(path.join(root, file), 'utf8');
      expect(svg, file).toContain(MARK_SOLID_PATH);
      expect(svg, file).toContain(MARK_LINE_PATH);
    }
  });

  it('gives each mark instance its own gradient id', () => {
    const { container } = render(
      <>
        <BrandMark id="a" />
        <BrandMark id="b" />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(ids).toEqual(['a-gold', 'b-gold']);
    expect(container.querySelector('path')?.getAttribute('fill')).toBe('url(#a-gold)');
  });

  it('renders the lock-up as decoration in both languages (the surrounding link carries the name)', () => {
    const { container, rerender } = render(<Wordmark id="w" locale="en" t={getDictionary('en')} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveTextContent('Al KhouryReal Estate');

    rerender(<Wordmark id="w" locale="ar" t={getDictionary('ar')} />);
    expect(container).toHaveTextContent('الخوريللعقارات');
  });
});
