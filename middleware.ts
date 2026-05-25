import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/calendar',
  '/analytics',
  '/settings',
  '/onboarding',
];

const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hard-skip API routes — they handle auth themselves.
  // This is belt-AND-suspenders on top of the matcher config below.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for a Supabase session cookie without making any network request.
  // Cookie-based checks are instant and never cause edge timeouts.
  // Real JWT validation happens inside server components via lib/supabase/server.ts.
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Explicit string patterns — no complex regex so Vercel edge has no ambiguity.
  // API routes, Next.js internals, and static assets are all excluded.
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/calendar/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
  ],
};
