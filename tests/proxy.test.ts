// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from '@/proxy';

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers });
}

describe('locale proxy', () => {
  it('lets locale-prefixed URLs through', () => {
    const response = proxy(request('/ar/listings'));
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects unprefixed URLs to the browser language, keeping the query string', () => {
    const response = proxy(request('/listings?deal=rent', { 'accept-language': 'ar-LB,ar;q=0.9' }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/ar/listings?deal=rent');
  });

  it('prefers the remembered language cookie over Accept-Language', () => {
    const response = proxy(request('/', { 'accept-language': 'ar', cookie: 'NEXT_LOCALE=en' }));
    expect(response.headers.get('location')).toBe('http://localhost:3000/en');
  });

  it('defaults to English', () => {
    expect(proxy(request('/about')).headers.get('location')).toBe('http://localhost:3000/en/about');
  });
});
