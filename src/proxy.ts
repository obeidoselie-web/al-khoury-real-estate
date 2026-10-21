import { NextResponse, type NextRequest } from 'next/server';

import { LOCALE_COOKIE, localeFromPath, localizedPath, negotiateLocale } from '@/i18n/config';

/** Cookie name, duplicated from lib/auth/session (that module is server-only and touches the DB). */
const ADMIN_SESSION_COOKIE = 'ak_admin_session';

/**
 * /admin: never indexed or cached, and a request without a session cookie goes straight to the login
 * page (pages still verify the session against the database; this is only the fast path).
 */
function adminProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  if (!isLogin && !request.cookies.has(ADMIN_SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

/**
 * Sends any URL without a locale prefix ("/", "/listings?type=land") to the visitor's language:
 * a remembered choice (cookie) first, then the browser's Accept-Language, then English.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminProxy(request);
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
