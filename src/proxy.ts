import { NextResponse, type NextRequest } from 'next/server';

import { LOCALE_COOKIE, localeFromPath, localizedPath, negotiateLocale } from '@/i18n/config';

/**
 * Sends any URL without a locale prefix ("/", "/listings?type=land") to the visitor's language:
 * a remembered choice (cookie) first, then the browser's Accept-Language, then English.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (localeFromPath(pathname)) return NextResponse.next();

  const locale = negotiateLocale(request.headers.get('accept-language'), request.cookies.get(LOCALE_COOKIE)?.value);
  const url = request.nextUrl.clone();
  url.pathname = localizedPath(locale, pathname);
  url.search = search;
  const response = NextResponse.redirect(url);
  response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}

export const config = {
  // Skip Next internals, static files (anything with an extension) and image optimisation.
  matcher: ['/((?!_next|api|images|favicon.ico|.*\\..*).*)'],
};
