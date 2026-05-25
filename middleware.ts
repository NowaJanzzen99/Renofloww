import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/calendar',
  '/analytics',
  '/settings',
  '/onboarding',
];

export async function middleware(request: NextRequest) {
  // Graceful fallback: if anything throws (missing env vars, Supabase timeout, etc.)
  // just let the request through — pages handle their own auth checks too.
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // getUser() validates the JWT with Supabase — use try/catch so a slow
    // response never crashes the middleware invocation on Vercel edge.
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Network error or timeout — treat as unauthenticated, let the page handle it.
    }

    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

    if (isProtected && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && (pathname === '/login' || pathname === '/register')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch {
    // Last-resort fallback — never let middleware crash Vercel's edge runtime.
    return NextResponse.next();
  }
}

export const config = {
  // Exclude API routes, static files, and media — they don't need auth redirects.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
